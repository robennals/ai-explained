"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

// --- Viewport: show the 0–1 range with a small margin ---
const VIEW_MIN = -0.15;
const VIEW_MAX = 1.15;
const VIEW_SPAN = VIEW_MAX - VIEW_MIN; // 1.3

const SVG_SIZE = 400;
const SVG_SCALE = SVG_SIZE / VIEW_SPAN;

const CANVAS_PX = 500;
const CANVAS_SCALE = CANVAS_PX / VIEW_SPAN;

function mathToSVG(x: number, y: number): [number, number] {
  return [(x - VIEW_MIN) * SVG_SCALE, (VIEW_MAX - y) * SVG_SCALE];
}

function mathToCanvas(x: number, y: number): [number, number] {
  return [(x - VIEW_MIN) * CANVAS_SCALE, (VIEW_MAX - y) * CANVAS_SCALE];
}

// Arrow points in the 0–1 range
const ARROW_POINTS = [
  { x: 0.1, y: 0.65, label: "A", color: "#ef4444" },
  { x: 0.55, y: 0.65, label: "B", color: "#f97316" },
  { x: 0.55, y: 0.9, label: "C", color: "#eab308" },
  { x: 0.9, y: 0.5, label: "D", color: "#22c55e" },
  { x: 0.55, y: 0.1, label: "E", color: "#3b82f6" },
  { x: 0.55, y: 0.35, label: "F", color: "#8b5cf6" },
  { x: 0.1, y: 0.35, label: "G", color: "#a855f7" },
];

type ShapeId = "arrow" | "cat" | "mona-lisa";

const SHAPE_OPTIONS: { id: ShapeId; label: string }[] = [
  { id: "arrow", label: "Arrow" },
  { id: "cat", label: "Cat" },
  { id: "mona-lisa", label: "Mona Lisa" },
];

const IMAGE_SHAPES: Record<string, string> = {
  cat: "/images/cat.jpg",
  "mona-lisa": "/images/mona-lisa.jpg",
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function logit(p: number): number {
  const clamped = Math.max(1e-6, Math.min(1 - 1e-6, p));
  return Math.log(clamped / (1 - clamped));
}

// sigmoid(matrix * logit(input) + bias)
// For identity + zero bias: sigmoid(logit(x)) = x
function transformPointWithActivation(
  x: number,
  y: number,
  a: number,
  b: number,
  c: number,
  d: number,
  b1: number,
  b2: number
): [number, number] {
  const lx = logit(x);
  const ly = logit(y);
  return [sigmoid(a * lx + b * ly + b1), sigmoid(c * lx + d * ly + b2)];
}

function interpolatePolygon(
  points: { x: number; y: number }[],
  stepsPerEdge: number
): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    for (let s = 0; s < stepsPerEdge; s++) {
      const t = s / stepsPerEdge;
      result.push({
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t,
      });
    }
  }
  return result;
}

const PRESETS = [
  { label: "Identity", w: [1, 0, 0, 1] as const, bias: [0, 0] as const },
  {
    label: "Stretch 3\u00d7",
    w: [3, 0, 0, 3] as const,
    bias: [0, 0] as const,
  },
  {
    label: "Spin & grow",
    w: [0, -3, 3, 0] as const,
    bias: [0, 0] as const,
  },
  { label: "Shift up", w: [1, 0, 0, 1] as const, bias: [0, 2] as const },
  {
    label: "Funhouse",
    w: [4, 1, -1, 2] as const,
    bias: [-1, 0.5] as const,
  },
  {
    label: "Squish flat",
    w: [4, 0, 0, 0.3] as const,
    bias: [0, 0] as const,
  },
  { label: "Swirl", w: [2, -3, 3, 2] as const, bias: [0, 0] as const },
];

// --- Sigmoid curve diagram ---

const SIG_W = 180;
const SIG_H = 120;
const SIG_PAD = { top: 10, right: 10, bottom: 22, left: 28 };
const SIG_PLOT_W = SIG_W - SIG_PAD.left - SIG_PAD.right;
const SIG_PLOT_H = SIG_H - SIG_PAD.top - SIG_PAD.bottom;
const SIG_X_MIN = -6;
const SIG_X_MAX = 6;

function SigmoidCurve() {
  const pts: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = SIG_X_MIN + (i / steps) * (SIG_X_MAX - SIG_X_MIN);
    const y = sigmoid(x);
    const px = SIG_PAD.left + ((x - SIG_X_MIN) / (SIG_X_MAX - SIG_X_MIN)) * SIG_PLOT_W;
    const py = SIG_PAD.top + (1 - y) * SIG_PLOT_H;
    pts.push(`${px},${py}`);
  }

  const xAxis = SIG_PAD.top + SIG_PLOT_H; // y=0 line
  const yMid = SIG_PAD.left + (0.5) * SIG_PLOT_W; // x=0 line (center)

  return (
    <svg
      viewBox={`0 0 ${SIG_W} ${SIG_H}`}
      className="w-full"
      style={{ maxWidth: SIG_W }}
    >
      {/* Axes */}
      <line
        x1={SIG_PAD.left}
        y1={xAxis}
        x2={SIG_PAD.left + SIG_PLOT_W}
        y2={xAxis}
        stroke="#9ca3af"
        strokeWidth={0.75}
      />
      <line
        x1={yMid}
        y1={SIG_PAD.top}
        x2={yMid}
        y2={xAxis}
        stroke="#9ca3af"
        strokeWidth={0.75}
        strokeDasharray="3 2"
      />
      {/* y=0.5 dashed line */}
      <line
        x1={SIG_PAD.left}
        y1={SIG_PAD.top + SIG_PLOT_H * 0.5}
        x2={SIG_PAD.left + SIG_PLOT_W}
        y2={SIG_PAD.top + SIG_PLOT_H * 0.5}
        stroke="#9ca3af"
        strokeWidth={0.5}
        strokeDasharray="3 2"
      />
      {/* y=1 line */}
      <line
        x1={SIG_PAD.left}
        y1={SIG_PAD.top}
        x2={SIG_PAD.left + SIG_PLOT_W}
        y2={SIG_PAD.top}
        stroke="#9ca3af"
        strokeWidth={0.5}
        strokeDasharray="3 2"
      />
      {/* Curve */}
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
      />
      {/* X-axis labels */}
      <text x={SIG_PAD.left} y={xAxis + 14} fontSize={9} fill="#9ca3af" textAnchor="middle">
        {SIG_X_MIN}
      </text>
      <text x={yMid} y={xAxis + 14} fontSize={9} fill="#9ca3af" textAnchor="middle">
        0
      </text>
      <text x={SIG_PAD.left + SIG_PLOT_W} y={xAxis + 14} fontSize={9} fill="#9ca3af" textAnchor="middle">
        {SIG_X_MAX}
      </text>
      {/* Y-axis labels */}
      <text x={SIG_PAD.left - 4} y={xAxis + 3} fontSize={9} fill="#9ca3af" textAnchor="end">
        0
      </text>
      <text x={SIG_PAD.left - 4} y={SIG_PAD.top + SIG_PLOT_H * 0.5 + 3} fontSize={9} fill="#9ca3af" textAnchor="end">
        0.5
      </text>
      <text x={SIG_PAD.left - 4} y={SIG_PAD.top + 3} fontSize={9} fill="#9ca3af" textAnchor="end">
        1
      </text>
      {/* Title */}
      <text x={SIG_W / 2} y={SIG_H - 1} fontSize={10} fill="#6b7280" textAnchor="middle">
        sigmoid(x)
      </text>
    </svg>
  );
}

// --- Unit box for the 0–1 panel ---

function UnitBox() {
  const [x0, y0] = mathToSVG(0, 1);
  const [x1, y1] = mathToSVG(1, 0);
  return (
    <g>
      <rect
        x={x0}
        y={y0}
        width={x1 - x0}
        height={y1 - y0}
        fill="rgba(107, 114, 128, 0.04)"
        stroke="#9ca3af"
        strokeWidth={1}
        opacity={0.5}
      />
      <text x={mathToSVG(0, 0)[0]} y={mathToSVG(0, 0)[1] + 12} fontSize={10} fill="#9ca3af" textAnchor="middle">0</text>
      <text x={mathToSVG(1, 0)[0]} y={mathToSVG(1, 0)[1] + 12} fontSize={10} fill="#9ca3af" textAnchor="middle">1</text>
      <text x={mathToSVG(0, 0)[0] - 6} y={mathToSVG(0, 0)[1] + 4} fontSize={10} fill="#9ca3af" textAnchor="end">0</text>
      <text x={mathToSVG(0, 1)[0] - 6} y={mathToSVG(0, 1)[1] + 4} fontSize={10} fill="#9ca3af" textAnchor="end">1</text>
    </g>
  );
}

function drawCanvasUnitBox(ctx: CanvasRenderingContext2D) {
  const [x0, y0] = mathToCanvas(0, 1);
  const [x1, y1] = mathToCanvas(1, 0);
  ctx.save();
  ctx.fillStyle = "rgba(107, 114, 128, 0.04)";
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#9ca3af";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("0", mathToCanvas(0, 0)[0], mathToCanvas(0, 0)[1] + 16);
  ctx.fillText("1", mathToCanvas(1, 0)[0], mathToCanvas(1, 0)[1] + 16);
  ctx.textAlign = "right";
  ctx.fillText("0", mathToCanvas(0, 0)[0] - 6, mathToCanvas(0, 0)[1] + 5);
  ctx.fillText("1", mathToCanvas(0, 1)[0] - 6, mathToCanvas(0, 1)[1] + 5);
  ctx.restore();
}

// --- SVG panel for arrow shape ---

function ArrowPanel({
  points,
  outlinePoints,
}: {
  points: {
    x: number;
    y: number;
    tx: number;
    ty: number;
    label: string;
    color: string;
  }[];
  outlinePoints: { x: number; y: number }[];
}) {
  return (
    <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full">
      <defs>
        <clipPath id="ae-clip">
          <rect x={0} y={0} width={SVG_SIZE} height={SVG_SIZE} />
        </clipPath>
      </defs>

      <UnitBox />

      {/* Original arrow (faint) */}
      <polygon
        points={ARROW_POINTS.map((p) =>
          mathToSVG(p.x, p.y).join(",")
        ).join(" ")}
        fill="rgba(107, 114, 128, 0.08)"
        stroke="#6b7280"
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Transformed shape */}
      <g clipPath="url(#ae-clip)">
        <polygon
          points={outlinePoints
            .map((p) => mathToSVG(p.x, p.y).join(","))
            .join(" ")}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#3b82f6"
          strokeWidth={1.5}
        />
      </g>

      {/* Original vertex dots (faint) */}
      {ARROW_POINTS.map((p) => {
        const [sx, sy] = mathToSVG(p.x, p.y);
        return (
          <circle
            key={`orig-${p.label}`}
            cx={sx}
            cy={sy}
            r={4}
            fill={p.color}
            opacity={0.25}
          />
        );
      })}

      {/* Transformed vertex dots with labels */}
      {points.map((p) => {
        const [sx, sy] = mathToSVG(p.tx, p.ty);
        return (
          <g key={`trans-${p.label}`}>
            <circle cx={sx} cy={sy} r={6} fill={p.color} />
            <text
              x={sx}
              y={sy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontWeight="bold"
              fill="white"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --- Canvas panel for image warping ---

function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s0: [number, number],
  s1: [number, number],
  s2: [number, number],
  d0: [number, number],
  d1: [number, number],
  d2: [number, number]
) {
  const denom =
    s0[0] * (s1[1] - s2[1]) +
    s1[0] * (s2[1] - s0[1]) +
    s2[0] * (s0[1] - s1[1]);
  if (Math.abs(denom) < 1e-10) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0[0], d0[1]);
  ctx.lineTo(d1[0], d1[1]);
  ctx.lineTo(d2[0], d2[1]);
  ctx.closePath();
  ctx.clip();

  const inv = 1 / denom;
  const ta = (d0[0] * (s1[1] - s2[1]) + d1[0] * (s2[1] - s0[1]) + d2[0] * (s0[1] - s1[1])) * inv;
  const tc = -(d0[0] * (s1[0] - s2[0]) + d1[0] * (s2[0] - s0[0]) + d2[0] * (s0[0] - s1[0])) * inv;
  const te = d0[0] - ta * s0[0] - tc * s0[1];
  const tb = (d0[1] * (s1[1] - s2[1]) + d1[1] * (s2[1] - s0[1]) + d2[1] * (s0[1] - s1[1])) * inv;
  const td = -(d0[1] * (s1[0] - s2[0]) + d1[1] * (s2[0] - s0[0]) + d2[1] * (s0[0] - s1[0])) * inv;
  const tf = d0[1] - tb * s0[0] - td * s0[1];

  ctx.setTransform(ta, tb, tc, td, te, tf);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function ImagePanel({
  src,
  a,
  b,
  c,
  d,
  b1,
  b2,
}: {
  src: string;
  a: number;
  b: number;
  c: number;
  d: number;
  b1: number;
  b2: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    imgRef.current = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    return () => {
      img.onload = null;
    };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

    drawCanvasUnitBox(ctx);

    // Ghost of original image (faint)
    ctx.save();
    ctx.globalAlpha = 0.15;
    const [imgX, imgY] = mathToCanvas(0, 1);
    const imgPx = 1 * CANVAS_SCALE;
    ctx.drawImage(img, imgX, imgY, imgPx, imgPx);
    ctx.restore();

    // Mesh warp
    const MESH_N = 20;
    const EPS = 0.001;

    for (let i = 0; i < MESH_N; i++) {
      for (let j = 0; j < MESH_N; j++) {
        const mx0 = Math.max(EPS, i / MESH_N);
        const my0 = Math.max(EPS, j / MESH_N);
        const mx1 = Math.min(1 - EPS, (i + 1) / MESH_N);
        const my1 = Math.min(1 - EPS, (j + 1) / MESH_N);

        const spx0 = (i / MESH_N) * img.width;
        const spy0 = ((MESH_N - j) / MESH_N) * img.height;
        const spx1 = ((i + 1) / MESH_N) * img.width;
        const spy1 = ((MESH_N - j - 1) / MESH_N) * img.height;

        const [tx00, ty00] = transformPointWithActivation(mx0, my0, a, b, c, d, b1, b2);
        const [tx10, ty10] = transformPointWithActivation(mx1, my0, a, b, c, d, b1, b2);
        const [tx11, ty11] = transformPointWithActivation(mx1, my1, a, b, c, d, b1, b2);
        const [tx01, ty01] = transformPointWithActivation(mx0, my1, a, b, c, d, b1, b2);

        const d00 = mathToCanvas(tx00, ty00);
        const d10 = mathToCanvas(tx10, ty10);
        const d11 = mathToCanvas(tx11, ty11);
        const d01 = mathToCanvas(tx01, ty01);

        const s00: [number, number] = [spx0, spy0];
        const s10: [number, number] = [spx1, spy0];
        const s11: [number, number] = [spx1, spy1];
        const s01: [number, number] = [spx0, spy1];

        drawTexturedTriangle(ctx, img, s00, s10, s11, d00, d10, d11);
        drawTexturedTriangle(ctx, img, s00, s11, s01, d00, d11, d01);
      }
    }
  }, [a, b, c, d, b1, b2, imgLoaded, src]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      className="w-full"
      style={{ imageRendering: "auto" }}
    />
  );
}

// --- Slider row helper ---

function SliderRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 text-sm font-bold" style={{ color }}>
        {label}
      </span>
      <input
        type="range"
        min={-10}
        max={10}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1"
        style={{ accentColor: color }}
      />
      <span
        className="w-8 shrink-0 text-right font-mono text-xs font-bold"
        style={{ color }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// --- Main component ---

export function ActivationEffect() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(3);
  const [b1, setB1] = useState(0);
  const [b2, setB2] = useState(0);
  const [shape, setShape] = useState<ShapeId>("arrow");

  const handleReset = useCallback(() => {
    setA(3);
    setB(0);
    setC(0);
    setD(3);
    setB1(0);
    setB2(0);
  }, []);

  const isImage = shape !== "arrow";
  const imageSrc = IMAGE_SHAPES[shape] ?? "";

  const activationPoints = useMemo(
    () =>
      ARROW_POINTS.map((p) => {
        const [tx, ty] = transformPointWithActivation(
          p.x,
          p.y,
          a,
          b,
          c,
          d,
          b1,
          b2
        );
        return { ...p, tx, ty };
      }),
    [a, b, c, d, b1, b2]
  );

  const activationOutline = useMemo(() => {
    const fine = interpolatePolygon(ARROW_POINTS, 12);
    return fine.map((p) => {
      const [tx, ty] = transformPointWithActivation(
        p.x,
        p.y,
        a,
        b,
        c,
        d,
        b1,
        b2
      );
      return { x: tx, y: ty };
    });
  }, [a, b, c, d, b1, b2]);

  return (
    <WidgetContainer
      title="The Effect of Activation Functions"
      description="Applies sigmoid(matrix * input + bias) to every point. The 0-1 box shows the sigmoid's output range."
      onReset={handleReset}
    >
      {/* Top row: shape selector + sigmoid curve */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">Shape:</span>
          {SHAPE_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setShape(s.id)}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                shape === s.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="shrink-0">
          <SigmoidCurve />
        </div>
      </div>

      {/* Visualization */}
      <div className="mx-auto" style={{ maxWidth: 420 }}>
        {isImage ? (
          <ImagePanel
            src={imageSrc}
            a={a}
            b={b}
            c={c}
            d={d}
            b1={b1}
            b2={b2}
          />
        ) : (
          <ArrowPanel
            points={activationPoints}
            outlinePoints={activationOutline}
          />
        )}
      </div>

      {/* Sliders */}
      <div className="mx-auto mt-4 grid max-w-md grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-muted">Weights</div>
          <SliderRow label="a" value={a} onChange={setA} color="#ef4444" />
          <SliderRow label="b" value={b} onChange={setB} color="#22c55e" />
          <SliderRow label="c" value={c} onChange={setC} color="#3b82f6" />
          <SliderRow label="d" value={d} onChange={setD} color="#a855f7" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-muted">Biases</div>
          <SliderRow
            label="b&#x2081;"
            value={b1}
            onChange={setB1}
            color="#f97316"
          />
          <SliderRow
            label="b&#x2082;"
            value={b2}
            onChange={setB2}
            color="#06b6d4"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-muted">
          Try:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setA(preset.w[0]);
              setB(preset.w[1]);
              setC(preset.w[2]);
              setD(preset.w[3]);
              setB1(preset.bias[0]);
              setB2(preset.bias[1]);
            }}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </WidgetContainer>
  );
}
