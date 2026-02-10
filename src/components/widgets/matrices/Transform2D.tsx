"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_SIZE = 500;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 60;
const GRID_RANGE = 3;

function toSVG(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

function applyTx(
  x: number,
  y: number,
  e1x: number,
  e1y: number,
  e2x: number,
  e2y: number
): [number, number] {
  return [e1x * x + e2x * y, e1y * x + e2y * y];
}

// --- Shape definitions ---

type ShapeId = "arrow" | "cat" | "rocket" | "mona-lisa";

interface ImageShapeConfig {
  src: string;
  mathX: number;
  mathY: number;
  mathW: number;
  mathH: number;
}

// Arrow polygon
const ARROW_VERTS: [number, number][] = [
  [0.15, 0.35],
  [0.7, 0.35],
  [0.7, 0.15],
  [1.15, 0.5],
  [0.7, 0.85],
  [0.7, 0.65],
  [0.15, 0.65],
];

// Image shapes — all square, centered on origin, filling 2/3 of the grid
// Cat: CC BY-SA 3.0, Hisashi, Wikimedia Commons
// Rocket: Apache 2.0, Google Noto Emoji, Wikimedia Commons
// Mona Lisa: Public domain, Leonardo da Vinci
const IMG_SIZE = 4; // 2/3 of 6-unit grid range
const IMG_HALF = IMG_SIZE / 2;
const IMAGE_SHAPES: Record<string, ImageShapeConfig> = {
  cat: { src: "/images/cat.jpg", mathX: -IMG_HALF, mathY: -IMG_HALF, mathW: IMG_SIZE, mathH: IMG_SIZE },
  rocket: { src: "/images/rocket.png", mathX: -IMG_HALF, mathY: -IMG_HALF, mathW: IMG_SIZE, mathH: IMG_SIZE },
  "mona-lisa": { src: "/images/mona-lisa.jpg", mathX: -IMG_HALF, mathY: -IMG_HALF, mathW: IMG_SIZE, mathH: IMG_SIZE },
};

const SHAPE_OPTIONS: { id: ShapeId; label: string }[] = [
  { id: "arrow", label: "Arrow" },
  { id: "cat", label: "Cat" },
  { id: "rocket", label: "Rocket" },
  { id: "mona-lisa", label: "Mona Lisa" },
];

// --- Presets (expressed as basis vectors) ---

interface Preset {
  label: string;
  e1: [number, number];
  e2: [number, number];
}

const PRESETS: Preset[] = [
  { label: "Identity", e1: [1, 0], e2: [0, 1] },
  { label: "Rotate 90\u00b0", e1: [0, 1], e2: [-1, 0] },
  { label: "Rotate 45\u00b0", e1: [0.707, 0.707], e2: [-0.707, 0.707] },
  { label: "Scale 2\u00d7", e1: [2, 0], e2: [0, 2] },
  { label: "Stretch X", e1: [2, 0], e2: [0, 1] },
  { label: "Shear", e1: [1, 0], e2: [0.5, 1] },
  { label: "Reflect", e1: [-1, 0], e2: [0, 1] },
  { label: "Collapse", e1: [1, 0], e2: [0, 0] },
];

export function Transform2D() {
  // Basis vector components: ê₁ = (e1x, e1y), ê₂ = (e2x, e2y)
  // Matrix columns: col1 = ê₁ = where x-axis goes, col2 = ê₂ = where y-axis goes
  const [e1x, setE1x] = useState(1);
  const [e1y, setE1y] = useState(0);
  const [e2x, setE2x] = useState(0);
  const [e2y, setE2y] = useState(1);
  const [shape, setShape] = useState<ShapeId>("cat");

  const handleReset = useCallback(() => {
    setE1x(1);
    setE1y(0);
    setE2x(0);
    setE2y(1);
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setE1x(preset.e1[0]);
    setE1y(preset.e1[1]);
    setE2x(preset.e2[0]);
    setE2y(preset.e2[1]);
  }, []);

  const det = e1x * e2y - e2x * e1y;

  const imageConfig = IMAGE_SHAPES[shape];

  // SVG transform that applies the 2×2 math matrix centered at the origin (CX, CY)
  const svgTransform = useMemo(() => {
    const A = e1x;
    const B = -e1y;
    const C = -e2x;
    const D = e2y;
    const E = CX * (1 - e1x) + e2x * CY;
    const F = e1y * CX + CY * (1 - e2y);
    return `matrix(${A}, ${B}, ${C}, ${D}, ${E}, ${F})`;
  }, [e1x, e1y, e2x, e2y]);

  // Image SVG position (before transform)
  const imgSvg = useMemo(() => {
    if (!imageConfig) return null;
    return {
      x: CX + imageConfig.mathX * SCALE,
      y: CY - (imageConfig.mathY + imageConfig.mathH) * SCALE,
      width: imageConfig.mathW * SCALE,
      height: imageConfig.mathH * SCALE,
    };
  }, [imageConfig]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      type: string;
    }[] = [];
    for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
      const [vx1, vy1] = applyTx(i, -GRID_RANGE, e1x, e1y, e2x, e2y);
      const [vx2, vy2] = applyTx(i, GRID_RANGE, e1x, e1y, e2x, e2y);
      const [sx1, sy1] = toSVG(vx1, vy1);
      const [sx2, sy2] = toSVG(vx2, vy2);
      lines.push({ x1: sx1, y1: sy1, x2: sx2, y2: sy2, type: `v${i}` });

      const [hx1, hy1] = applyTx(-GRID_RANGE, i, e1x, e1y, e2x, e2y);
      const [hx2, hy2] = applyTx(GRID_RANGE, i, e1x, e1y, e2x, e2y);
      const [shx1, shy1] = toSVG(hx1, hy1);
      const [shx2, shy2] = toSVG(hx2, hy2);
      lines.push({ x1: shx1, y1: shy1, x2: shx2, y2: shy2, type: `h${i}` });
    }
    return lines;
  }, [e1x, e1y, e2x, e2y]);

  // Arrow polygon (transformed)
  const arrowTransPts = useMemo(() => {
    if (shape !== "arrow") return null;
    return ARROW_VERTS.map(([sx, sy]) => {
      const [ox, oy] = applyTx(sx, sy, e1x, e1y, e2x, e2y);
      return toSVG(ox, oy);
    });
  }, [shape, e1x, e1y, e2x, e2y]);

  // Unit vectors (projected)
  const [ue1x, ue1y] = applyTx(1, 0, e1x, e1y, e2x, e2y);
  const [ue2x, ue2y] = applyTx(0, 1, e1x, e1y, e2x, e2y);
  const [ox, oy] = toSVG(0, 0);
  const [se1x, se1y] = toSVG(ue1x, ue1y);
  const [se2x, se2y] = toSVG(ue2x, ue2y);

  return (
    <WidgetContainer
      title="2D Matrix Transformation"
      description="Four numbers control where two basis vectors land — and all of 2D space follows"
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

      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full"
        style={{ maxHeight: 440 }}
      >
        <defs>
          <clipPath id="t2d-clip">
            <rect x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} />
          </clipPath>
          <marker
            id="arrow-red"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0,0 8,3 0,6" fill="#ef4444" />
          </marker>
          <marker
            id="arrow-green"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0,0 8,3 0,6" fill="#22c55e" />
          </marker>
        </defs>

        {/* Original grid (very faint) */}
        <g opacity={0.12}>
          {Array.from(
            { length: GRID_RANGE * 2 + 1 },
            (_, i) => i - GRID_RANGE
          ).map((i) => {
            const [hx1, hy1] = toSVG(-GRID_RANGE, i);
            const [hx2, hy2] = toSVG(GRID_RANGE, i);
            const [vx1, vy1] = toSVG(i, -GRID_RANGE);
            const [vx2, vy2] = toSVG(i, GRID_RANGE);
            return (
              <g key={`orig-${i}`}>
                <line
                  x1={hx1}
                  y1={hy1}
                  x2={hx2}
                  y2={hy2}
                  stroke="#6b7280"
                  strokeWidth={i === 0 ? 2 : 0.5}
                />
                <line
                  x1={vx1}
                  y1={vy1}
                  x2={vx2}
                  y2={vy2}
                  stroke="#6b7280"
                  strokeWidth={i === 0 ? 2 : 0.5}
                />
              </g>
            );
          })}
        </g>

        {/* Transformed grid */}
        <g clipPath="url(#t2d-clip)">
          {gridLines.map((line) => {
            const isAxis = line.type === "v0" || line.type === "h0";
            const isVertical = line.type.startsWith("v");
            return (
              <line
                key={line.type}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={isVertical ? "#3b82f6" : "#8b5cf6"}
                strokeWidth={isAxis ? 1.5 : 0.8}
                opacity={isAxis ? 0.6 : 0.25}
              />
            );
          })}
        </g>

        {/* Arrow polygon shape */}
        {shape === "arrow" && (
          <>
            <polygon
              points={ARROW_VERTS.map(([sx, sy]) =>
                toSVG(sx, sy).join(",")
              ).join(" ")}
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth={1}
              opacity={0.5}
            />
            {arrowTransPts && (
              <polygon
                points={arrowTransPts.map((p) => p.join(",")).join(" ")}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            )}
          </>
        )}

        {/* Bitmap image shapes */}
        {imageConfig && imgSvg && (
          <g clipPath="url(#t2d-clip)">
            {/* Original (ghost) */}
            <g opacity={0.2}>
              <image
                x={imgSvg.x}
                y={imgSvg.y}
                width={imgSvg.width}
                height={imgSvg.height}
                href={imageConfig.src}
                preserveAspectRatio="none"
              />
              <rect
                x={imgSvg.x}
                y={imgSvg.y}
                width={imgSvg.width}
                height={imgSvg.height}
                fill="none"
                stroke="#999"
                strokeWidth={1}
              />
            </g>
            {/* Transformed */}
            <g transform={svgTransform}>
              <image
                x={imgSvg.x}
                y={imgSvg.y}
                width={imgSvg.width}
                height={imgSvg.height}
                href={imageConfig.src}
                preserveAspectRatio="none"
              />
              <rect
                x={imgSvg.x}
                y={imgSvg.y}
                width={imgSvg.width}
                height={imgSvg.height}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1.5}
              />
            </g>
          </g>
        )}

        {/* Unit vector ê₁ (red) */}
        <line
          x1={ox}
          y1={oy}
          x2={se1x}
          y2={se1y}
          stroke="#ef4444"
          strokeWidth={2.5}
          markerEnd="url(#arrow-red)"
        />
        <text
          x={se1x + (se1x > ox ? 10 : -18)}
          y={se1y + (se1y < oy ? -8 : 14)}
          fill="#ef4444"
          fontSize={13}
          fontWeight="bold"
          style={{ fontFamily: "serif" }}
        >
          ê&#x2081;
        </text>

        {/* Unit vector ê₂ (green) */}
        <line
          x1={ox}
          y1={oy}
          x2={se2x}
          y2={se2y}
          stroke="#22c55e"
          strokeWidth={2.5}
          markerEnd="url(#arrow-green)"
        />
        <text
          x={se2x + (se2x > ox ? 10 : -18)}
          y={se2y + (se2y < oy ? -8 : 14)}
          fill="#22c55e"
          fontSize={13}
          fontWeight="bold"
          style={{ fontFamily: "serif" }}
        >
          ê&#x2082;
        </text>

        {/* Origin */}
        <circle cx={ox} cy={oy} r={3} fill="#1a1a2e" />
      </svg>

      {/* Matrix display with colored columns */}
      <div className="my-4 flex items-center justify-center gap-6">
        <div className="rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none text-muted">[</span>
            <span className="w-14 text-center font-semibold text-red-500">
              {e1x.toFixed(2)}
            </span>
            <span className="w-14 text-center font-semibold text-green-600">
              {e2x.toFixed(2)}
            </span>
            <span className="text-lg leading-none text-muted">]</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none text-muted">[</span>
            <span className="w-14 text-center font-semibold text-red-500">
              {e1y.toFixed(2)}
            </span>
            <span className="w-14 text-center font-semibold text-green-600">
              {e2y.toFixed(2)}
            </span>
            <span className="text-lg leading-none text-muted">]</span>
          </div>
        </div>
        <div className="text-sm">
          <div className="text-muted">
            det ={" "}
            <span
              className={`font-mono font-bold ${
                Math.abs(det) < 0.01 ? "text-red-500" : "text-foreground"
              }`}
            >
              {det.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {Math.abs(det) < 0.01
              ? "Singular \u2014 a dimension collapses!"
              : det < 0
                ? "Orientation flipped"
                : `Area \u00d7 ${Math.abs(det).toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Basis vector slider boxes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ê₁ (red) — where x-axis lands */}
        <div className="rounded-lg border-2 border-red-400 bg-red-500/5 p-2.5">
          <div className="mb-1.5 text-xs font-semibold text-red-500">
            ê&#x2081; &mdash; where x-axis lands
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-medium text-red-400">x</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={e1x}
                onChange={(e) => setE1x(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#ef4444" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-red-500">
                {e1x.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-medium text-red-400">y</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={e1y}
                onChange={(e) => setE1y(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#ef4444" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-red-500">
                {e1y.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ê₂ (green) — where y-axis lands */}
        <div className="rounded-lg border-2 border-green-500 bg-green-500/5 p-2.5">
          <div className="mb-1.5 text-xs font-semibold text-green-600">
            ê&#x2082; &mdash; where y-axis lands
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-medium text-green-500">x</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={e2x}
                onChange={(e) => setE2x(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#22c55e" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-green-600">
                {e2x.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-medium text-green-500">y</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={e2y}
                onChange={(e) => setE2y(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: "#22c55e" }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-green-600">
                {e2y.toFixed(2)}
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
