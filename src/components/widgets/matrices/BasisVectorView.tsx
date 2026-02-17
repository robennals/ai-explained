"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_W = 280;
const SVG_H = 280;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const SCALE = 35;
const GRID_RANGE = 4;

function toSVG(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

// --- Shape definitions ---
interface ShapeDef {
  points: { x: number; y: number; label: string }[];
  edges: [number, number][];
}

const SHAPES: Record<string, ShapeDef> = {
  arrow: {
    points: [
      { x: 1.5, y: 0, label: "A" },
      { x: 0.5, y: 1, label: "B" },
      { x: 0.5, y: 0.35, label: "C" },
      { x: -1.5, y: 0.35, label: "D" },
      { x: -1.5, y: -0.35, label: "E" },
      { x: 0.5, y: -0.35, label: "F" },
      { x: 0.5, y: -1, label: "G" },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
    ],
  },
  house: {
    points: [
      { x: -1, y: -1, label: "A" },
      { x: 1, y: -1, label: "B" },
      { x: 1, y: 0.5, label: "C" },
      { x: 0, y: 1.5, label: "D" },
      { x: -1, y: 0.5, label: "E" },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
  square: {
    points: [
      { x: -1, y: -1, label: "A" },
      { x: 1, y: -1, label: "B" },
      { x: 1, y: 1, label: "C" },
      { x: -1, y: 1, label: "D" },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
};

const POINT_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

type ShapeId = keyof typeof SHAPES;

const SHAPE_OPTIONS: { id: ShapeId; label: string }[] = [
  { id: "arrow", label: "Arrow" },
  { id: "house", label: "House" },
  { id: "square", label: "Square" },
];

// --- Presets ---
interface Preset {
  label: string;
  r1: [number, number];
  r2: [number, number];
}

const PRESETS: Preset[] = [
  { label: "Identity", r1: [1, 0], r2: [0, 1] },
  { label: "Rotate 90\u00b0", r1: [0, -1], r2: [1, 0] },
  { label: "Shear", r1: [1, 0.5], r2: [0, 1] },
  { label: "Scale 2\u00d7", r1: [2, 0], r2: [0, 1] },
  { label: "Reflect X", r1: [-1, 0], r2: [0, 1] },
  { label: "Collapse", r1: [1, 0], r2: [1, 0] },
];

// --- Iso-line computation ---
// For row vector (rx, ry), iso-lines are where rx*x + ry*y = k (integer k)
function computeIsoLines(
  rx: number,
  ry: number,
): { x1: number; y1: number; x2: number; y2: number; k: number }[] {
  const len2 = rx * rx + ry * ry;
  if (len2 < 0.0001) return [];
  const invLen = 1 / Math.sqrt(len2);
  const perpX = -ry * invLen;
  const perpY = rx * invLen;
  const extent = 12;
  const result: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    k: number;
  }[] = [];

  for (let k = -GRID_RANGE; k <= GRID_RANGE; k++) {
    // Center of iso-line: project k back onto the row direction
    const cx = (rx * k) / len2;
    const cy = (ry * k) / len2;
    const [x1, y1] = toSVG(cx - perpX * extent, cy - perpY * extent);
    const [x2, y2] = toSVG(cx + perpX * extent, cy + perpY * extent);
    result.push({ x1, y1, x2, y2, k });
  }
  return result;
}

export function BasisVectorView() {
  const [r1x, setR1x] = useState(1);
  const [r1y, setR1y] = useState(0);
  const [r2x, setR2x] = useState(0);
  const [r2y, setR2y] = useState(1);
  const [shape, setShape] = useState<ShapeId>("arrow");

  const handleReset = useCallback(() => {
    setR1x(1);
    setR1y(0);
    setR2x(0);
    setR2y(1);
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    setR1x(p.r1[0]);
    setR1y(p.r1[1]);
    setR2x(p.r2[0]);
    setR2y(p.r2[1]);
  }, []);

  const currentShape = SHAPES[shape];

  // Transform each point: new_x = dot(row1, point), new_y = dot(row2, point)
  const transformedPoints = useMemo(
    () =>
      currentShape.points.map((p) => ({
        label: p.label,
        x: r1x * p.x + r1y * p.y,
        y: r2x * p.x + r2y * p.y,
      })),
    [currentShape, r1x, r1y, r2x, r2y],
  );

  // Iso-lines for left panel
  const r1Iso = useMemo(() => computeIsoLines(r1x, r1y), [r1x, r1y]);
  const r2Iso = useMemo(() => computeIsoLines(r2x, r2y), [r2x, r2y]);

  // Render a shape (points + edges)
  const renderShape = (
    points: { x: number; y: number; label: string }[],
    edges: [number, number][],
  ) => (
    <g>
      {edges.map(([i, j], idx) => {
        const [x1, y1] = toSVG(points[i].x, points[i].y);
        const [x2, y2] = toSVG(points[j].x, points[j].y);
        return (
          <line
            key={`e-${idx}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#64748b"
            strokeWidth={1.5}
            opacity={0.5}
          />
        );
      })}
      {points.map((p, i) => {
        const [px, py] = toSVG(p.x, p.y);
        const color = POINT_COLORS[i % POINT_COLORS.length];
        return (
          <g key={`p-${i}`}>
            <circle
              cx={px}
              cy={py}
              r={7}
              fill={color}
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={px}
              y={py + 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={9}
              fontWeight="bold"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </g>
  );

  // Render iso-lines for one row
  const renderIsoLines = (
    lines: { x1: number; y1: number; x2: number; y2: number; k: number }[],
    color: string,
  ) =>
    lines.map((l, i) => (
      <line
        key={i}
        x1={l.x1}
        y1={l.y1}
        x2={l.x2}
        y2={l.y2}
        stroke={color}
        strokeWidth={l.k === 0 ? 1.5 : 0.8}
        opacity={l.k === 0 ? 0.6 : 0.25}
      />
    ));

  // Standard grid for right panel — colored by axis
  const renderRightGrid = () =>
    Array.from({ length: GRID_RANGE * 2 + 1 }, (_, i) => i - GRID_RANGE).map(
      (k) => {
        const [vx1, vy1] = toSVG(k, -GRID_RANGE);
        const [vx2, vy2] = toSVG(k, GRID_RANGE);
        const [hx1, hy1] = toSVG(-GRID_RANGE, k);
        const [hx2, hy2] = toSVG(GRID_RANGE, k);
        return (
          <g key={`rg-${k}`}>
            {/* Vertical = constant new-x → red */}
            <line
              x1={vx1}
              y1={vy1}
              x2={vx2}
              y2={vy2}
              stroke="#ef4444"
              strokeWidth={k === 0 ? 1.5 : 0.8}
              opacity={k === 0 ? 0.6 : 0.25}
            />
            {/* Horizontal = constant new-y → green */}
            <line
              x1={hx1}
              y1={hy1}
              x2={hx2}
              y2={hy2}
              stroke="#22c55e"
              strokeWidth={k === 0 ? 1.5 : 0.8}
              opacity={k === 0 ? 0.6 : 0.25}
            />
          </g>
        );
      },
    );

  // Faint gray standard grid for left panel
  const renderGrayGrid = () =>
    Array.from({ length: GRID_RANGE * 2 + 1 }, (_, i) => i - GRID_RANGE).map(
      (k) => {
        const [vx1, vy1] = toSVG(k, -GRID_RANGE);
        const [vx2, vy2] = toSVG(k, GRID_RANGE);
        const [hx1, hy1] = toSVG(-GRID_RANGE, k);
        const [hx2, hy2] = toSVG(GRID_RANGE, k);
        return (
          <g key={`gg-${k}`} opacity={0.1}>
            <line
              x1={vx1}
              y1={vy1}
              x2={vx2}
              y2={vy2}
              stroke="#6b7280"
              strokeWidth={k === 0 ? 1.5 : 0.5}
            />
            <line
              x1={hx1}
              y1={hy1}
              x2={hx2}
              y2={hy2}
              stroke="#6b7280"
              strokeWidth={k === 0 ? 1.5 : 0.5}
            />
          </g>
        );
      },
    );

  return (
    <WidgetContainer
      title="The Row View: New Measurement Directions"
      description="Each row defines a direction to measure along — colored lines show where measurements are equal"
      onReset={handleReset}
    >
      {/* Shape selector */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
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

      {/* Side-by-side panels */}
      <div className="flex gap-3">
        {/* Left: Original space with new-coordinate iso-lines */}
        <div className="flex-1">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            Original space
          </div>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full rounded border border-border"
          >
            <defs>
              <clipPath id="bv-left-clip">
                <rect x="0" y="0" width={SVG_W} height={SVG_H} />
              </clipPath>
            </defs>

            <g clipPath="url(#bv-left-clip)">
              {renderGrayGrid()}
              {renderIsoLines(r1Iso, "#ef4444")}
              {renderIsoLines(r2Iso, "#22c55e")}
            </g>

            {renderShape(currentShape.points, currentShape.edges)}
            <circle cx={CX} cy={CY} r={2.5} fill="#1a1a2e" />
          </svg>
        </div>

        {/* Right: New coordinate space */}
        <div className="flex-1">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            New coordinate space
          </div>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full rounded border border-border"
          >
            <defs>
              <clipPath id="bv-right-clip">
                <rect x="0" y="0" width={SVG_W} height={SVG_H} />
              </clipPath>
            </defs>

            <g clipPath="url(#bv-right-clip)">{renderRightGrid()}</g>

            {renderShape(transformedPoints, currentShape.edges)}
            <circle cx={CX} cy={CY} r={2.5} fill="#1a1a2e" />
          </svg>
        </div>
      </div>

      {/* Matrix display — rows colored */}
      <div className="my-4 flex items-center justify-center">
        <div className="rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none text-muted">[</span>
            <span className="w-14 text-center font-semibold text-red-500">
              {r1x.toFixed(2)}
            </span>
            <span className="w-14 text-center font-semibold text-red-500">
              {r1y.toFixed(2)}
            </span>
            <span className="text-lg leading-none text-muted">]</span>
            <span className="ml-1 text-[10px] text-red-400">
              {"\u2190 new x"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none text-muted">[</span>
            <span className="w-14 text-center font-semibold text-green-600">
              {r2x.toFixed(2)}
            </span>
            <span className="w-14 text-center font-semibold text-green-600">
              {r2y.toFixed(2)}
            </span>
            <span className="text-lg leading-none text-muted">]</span>
            <span className="ml-1 text-[10px] text-green-500">
              {"\u2190 new y"}
            </span>
          </div>
        </div>
      </div>

      {/* Slider rows — horizontal layout matching matrix rows */}
      <div className="space-y-3">
        {/* Row 1 (red) — new x measurement direction */}
        <div className="rounded-lg border-2 border-red-400 bg-red-500/5 p-2.5">
          <div className="mb-1.5 text-xs font-semibold text-red-500">
            Row 1 &mdash; new x measurement direction
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] font-medium text-red-400">
                old x
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.01}
                value={r1x}
                onChange={(e) => setR1x(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#ef4444" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-[10px] font-bold text-red-500">
                {r1x.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] font-medium text-red-400">
                old y
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.01}
                value={r1y}
                onChange={(e) => setR1y(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#ef4444" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-[10px] font-bold text-red-500">
                {r1y.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 (green) — new y measurement direction */}
        <div className="rounded-lg border-2 border-green-500 bg-green-500/5 p-2.5">
          <div className="mb-1.5 text-xs font-semibold text-green-600">
            Row 2 &mdash; new y measurement direction
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] font-medium text-green-500">
                old x
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.01}
                value={r2x}
                onChange={(e) => setR2x(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#22c55e" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-[10px] font-bold text-green-600">
                {r2x.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] font-medium text-green-500">
                old y
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.01}
                value={r2y}
                onChange={(e) => setR2y(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#22c55e" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-[10px] font-bold text-green-600">
                {r2y.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset)}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </WidgetContainer>
  );
}
