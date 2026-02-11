"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_W = 280;
const SVG_H = 280;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const SCALE = 45;
const GRID_RANGE = 3;

function toSVG(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

// Transform using row-based matrix: new = M * old
// Row 1 = (r1x, r1y), Row 2 = (r2x, r2y)
function applyRows(
  x: number,
  y: number,
  r1x: number,
  r1y: number,
  r2x: number,
  r2y: number,
): [number, number] {
  return [r1x * x + r1y * y, r2x * x + r2y * y];
}

// Image configs
const IMG_SIZE = 4;
const IMG_HALF = IMG_SIZE / 2;
const IMAGE_SHAPES: Record<
  string,
  { src: string; mathX: number; mathY: number; mathW: number; mathH: number }
> = {
  cat: {
    src: "/images/cat.jpg",
    mathX: -IMG_HALF,
    mathY: -IMG_HALF,
    mathW: IMG_SIZE,
    mathH: IMG_SIZE,
  },
  "mona-lisa": {
    src: "/images/mona-lisa.jpg",
    mathX: -IMG_HALF,
    mathY: -IMG_HALF,
    mathW: IMG_SIZE,
    mathH: IMG_SIZE,
  },
};

type ShapeId = "cat" | "mona-lisa";

const SHAPE_OPTIONS: { id: ShapeId; label: string }[] = [
  { id: "cat", label: "Cat" },
  { id: "mona-lisa", label: "Mona Lisa" },
];

// Presets expressed as rows: r1 = new x-axis, r2 = new y-axis
interface Preset {
  label: string;
  r1: [number, number];
  r2: [number, number];
}

const PRESETS: Preset[] = [
  { label: "Identity", r1: [1, 0], r2: [0, 1] },
  { label: "Rotate 90\u00b0", r1: [0, -1], r2: [1, 0] },
  { label: "Scale 2\u00d7", r1: [2, 0], r2: [0, 2] },
  { label: "Stretch X", r1: [2, 0], r2: [0, 1] },
  { label: "Shear", r1: [1, 0.5], r2: [0, 1] },
  { label: "Reflect", r1: [-1, 0], r2: [0, 1] },
  { label: "Collapse", r1: [1, 0], r2: [0, 0] },
];

export function BasisVectorView() {
  // Row-based state: each row defines a new basis vector direction
  // Row 1 (r1x, r1y) = new x-axis direction in old space
  // Row 2 (r2x, r2y) = new y-axis direction in old space
  const [r1x, setR1x] = useState(1);
  const [r1y, setR1y] = useState(0);
  const [r2x, setR2x] = useState(0);
  const [r2y, setR2y] = useState(1);
  const [shape, setShape] = useState<ShapeId>("cat");

  const handleReset = useCallback(() => {
    setR1x(1);
    setR1y(0);
    setR2x(0);
    setR2y(1);
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setR1x(preset.r1[0]);
    setR1y(preset.r1[1]);
    setR2x(preset.r2[0]);
    setR2y(preset.r2[1]);
  }, []);

  const imageConfig = IMAGE_SHAPES[shape];

  // SVG transform for right panel
  // Matrix [[r1x, r1y], [r2x, r2y]] has columns (r1x,r2x) and (r1y,r2y)
  // SVG formula: matrix(e1x, -e1y, -e2x, e2y, ...)
  // where e1x=r1x, e1y=r2x, e2x=r1y, e2y=r2y
  const svgTransform = useMemo(() => {
    const A = r1x;
    const B = -r2x;
    const C = -r1y;
    const D = r2y;
    const E = CX * (1 - r1x) + r1y * CY;
    const F = r2x * CX + CY * (1 - r2y);
    return `matrix(${A}, ${B}, ${C}, ${D}, ${E}, ${F})`;
  }, [r1x, r1y, r2x, r2y]);

  // Image SVG position
  const imgSvg = useMemo(() => {
    if (!imageConfig) return null;
    return {
      x: CX + imageConfig.mathX * SCALE,
      y: CY - (imageConfig.mathY + imageConfig.mathH) * SCALE,
      width: imageConfig.mathW * SCALE,
      height: imageConfig.mathH * SCALE,
    };
  }, [imageConfig]);

  // Iso-line grid for the left panel
  // For row vector (rx, ry), iso-line at value k: rx*x + ry*y = k
  // This is a line perpendicular to (rx, ry), passing through (rx*k/len², ry*k/len²)
  const isoLines = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      row: number;
      isAxis: boolean;
    }[] = [];
    const extent = 6;

    for (const { rx, ry, rowIdx } of [
      { rx: r1x, ry: r1y, rowIdx: 0 },
      { rx: r2x, ry: r2y, rowIdx: 1 },
    ]) {
      const len2 = rx * rx + ry * ry;
      if (len2 < 0.0001) continue;

      // Direction along the iso-line (perpendicular to the row vector)
      const invLen = 1 / Math.sqrt(len2);
      const dx = -ry * invLen;
      const dy = rx * invLen;

      for (let k = -GRID_RANGE; k <= GRID_RANGE; k++) {
        // Point on line closest to origin
        const px = (rx * k) / len2;
        const py = (ry * k) / len2;

        const [x1, y1] = toSVG(px - dx * extent, py - dy * extent);
        const [x2, y2] = toSVG(px + dx * extent, py + dy * extent);
        lines.push({ x1, y1, x2, y2, row: rowIdx, isAxis: k === 0 });
      }
    }

    return lines;
  }, [r1x, r1y, r2x, r2y]);

  // Transformed grid for the right panel
  const rightGridLines = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      type: string;
    }[] = [];
    for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
      // Vertical line x=i: transform endpoints
      const [vx1, vy1] = applyRows(i, -GRID_RANGE, r1x, r1y, r2x, r2y);
      const [vx2, vy2] = applyRows(i, GRID_RANGE, r1x, r1y, r2x, r2y);
      const [sx1, sy1] = toSVG(vx1, vy1);
      const [sx2, sy2] = toSVG(vx2, vy2);
      lines.push({ x1: sx1, y1: sy1, x2: sx2, y2: sy2, type: `v${i}` });

      // Horizontal line y=i: transform endpoints
      const [hx1, hy1] = applyRows(-GRID_RANGE, i, r1x, r1y, r2x, r2y);
      const [hx2, hy2] = applyRows(GRID_RANGE, i, r1x, r1y, r2x, r2y);
      const [shx1, shy1] = toSVG(hx1, hy1);
      const [shx2, shy2] = toSVG(hx2, hy2);
      lines.push({
        x1: shx1,
        y1: shy1,
        x2: shx2,
        y2: shy2,
        type: `h${i}`,
      });
    }
    return lines;
  }, [r1x, r1y, r2x, r2y]);

  // Row vector arrow endpoints in SVG (left panel)
  const [ox, oy] = toSVG(0, 0);
  const [row1EndX, row1EndY] = toSVG(r1x, r1y);
  const [row2EndX, row2EndY] = toSVG(r2x, r2y);

  // Original basis vector endpoints (faint reference)
  const [origE1x, origE1y] = toSVG(1, 0);
  const [origE2x, origE2y] = toSVG(0, 1);

  const renderOriginalGrid = (opacity: number) => (
    <g opacity={opacity}>
      {Array.from(
        { length: GRID_RANGE * 2 + 1 },
        (_, i) => i - GRID_RANGE,
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
  );

  return (
    <WidgetContainer
      title="The Row View: New Measurement Axes"
      description="Each row of the matrix defines a new axis — a direction to measure along"
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
        {/* Left: Original space with new measurement axes overlaid */}
        <div className="flex-1">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            New axes in original space
          </div>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full rounded border border-border"
          >
            <defs>
              <clipPath id="bv-left-clip">
                <rect x="0" y="0" width={SVG_W} height={SVG_H} />
              </clipPath>
              <marker
                id="bv-arr-red"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0,0 8,3 0,6" fill="#ef4444" />
              </marker>
              <marker
                id="bv-arr-green"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0,0 8,3 0,6" fill="#22c55e" />
              </marker>
              <marker
                id="bv-arr-gray"
                markerWidth="7"
                markerHeight="5"
                refX="6"
                refY="2.5"
                orient="auto"
              >
                <polygon points="0,0 7,2.5 0,5" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Original grid */}
            {renderOriginalGrid(0.15)}

            {/* Image at original position */}
            <g clipPath="url(#bv-left-clip)">
              {imgSvg && (
                <image
                  x={imgSvg.x}
                  y={imgSvg.y}
                  width={imgSvg.width}
                  height={imgSvg.height}
                  href={imageConfig.src}
                  preserveAspectRatio="none"
                  opacity={0.6}
                />
              )}
            </g>

            {/* Iso-line grid: lines where new_x=k and new_y=k */}
            <g clipPath="url(#bv-left-clip)" opacity={0.25}>
              {isoLines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.row === 0 ? "#ef4444" : "#22c55e"}
                  strokeWidth={line.isAxis ? 1.5 : 0.6}
                  opacity={line.isAxis ? 0.8 : 0.5}
                />
              ))}
            </g>

            {/* Original basis vectors (faint gray dashed) */}
            <line
              x1={ox}
              y1={oy}
              x2={origE1x}
              y2={origE1y}
              stroke="#9ca3af"
              strokeWidth={1.5}
              opacity={0.4}
              markerEnd="url(#bv-arr-gray)"
              strokeDasharray="4 3"
            />
            <line
              x1={ox}
              y1={oy}
              x2={origE2x}
              y2={origE2y}
              stroke="#9ca3af"
              strokeWidth={1.5}
              opacity={0.4}
              markerEnd="url(#bv-arr-gray)"
              strokeDasharray="4 3"
            />

            {/* New basis vectors: rows as directions in old space */}
            <line
              x1={ox}
              y1={oy}
              x2={row1EndX}
              y2={row1EndY}
              stroke="#ef4444"
              strokeWidth={3}
              markerEnd="url(#bv-arr-red)"
            />
            <text
              x={row1EndX + (row1EndX > ox ? 8 : -22)}
              y={row1EndY + (row1EndY < oy ? -6 : 14)}
              fill="#ef4444"
              fontSize={12}
              fontWeight="bold"
              style={{ fontFamily: "serif" }}
            >
              {"\u00ea\u2081\u2032"}
            </text>

            <line
              x1={ox}
              y1={oy}
              x2={row2EndX}
              y2={row2EndY}
              stroke="#22c55e"
              strokeWidth={3}
              markerEnd="url(#bv-arr-green)"
            />
            <text
              x={row2EndX + (row2EndX > ox ? 8 : -22)}
              y={row2EndY + (row2EndY < oy ? -6 : 14)}
              fill="#22c55e"
              fontSize={12}
              fontWeight="bold"
              style={{ fontFamily: "serif" }}
            >
              {"\u00ea\u2082\u2032"}
            </text>

            {/* Origin dot */}
            <circle cx={ox} cy={oy} r={3} fill="#1a1a2e" />
          </svg>
        </div>

        {/* Right: Transformed space */}
        <div className="flex-1">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            Transformed result
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

            {/* Original grid (very faint) */}
            {renderOriginalGrid(0.08)}

            {/* Transformed grid */}
            <g clipPath="url(#bv-right-clip)">
              {rightGridLines.map((line) => {
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

            {/* Transformed image */}
            <g clipPath="url(#bv-right-clip)">
              {imgSvg && (
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
              )}
            </g>

            {/* Origin dot */}
            <circle cx={CX} cy={CY} r={3} fill="#1a1a2e" />
          </svg>
        </div>
      </div>

      {/* Matrix display — rows colored */}
      <div className="my-4 flex items-center justify-center gap-6">
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
              {"\u2190 \u00ea\u2081\u2032"}
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
              {"\u2190 \u00ea\u2082\u2032"}
            </span>
          </div>
        </div>
      </div>

      {/* Basis vector slider boxes — organized by rows */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Row 1 (red) — new x-axis */}
        <div className="rounded-lg border-2 border-red-400 bg-red-500/5 p-2.5">
          <div className="mb-1.5 text-xs font-semibold text-red-500">
            {"\u00ea\u2081\u2032"} &mdash; new x-axis
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-medium text-red-400">
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
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-red-500">
                {r1x.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-medium text-red-400">
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
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-red-500">
                {r1y.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 (green) — new y-axis */}
        <div className="rounded-lg border-2 border-green-500 bg-green-500/5 p-2.5">
          <div className="mb-1.5 text-xs font-semibold text-green-600">
            {"\u00ea\u2082\u2032"} &mdash; new y-axis
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-medium text-green-500">
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
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-green-600">
                {r2x.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-medium text-green-500">
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
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-green-600">
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
