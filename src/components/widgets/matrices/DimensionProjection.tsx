"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_SIZE = 400;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 70;

function toSVG(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

// Shape definitions with labeled colored points
interface LabeledPoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

const ARROW_POINTS: LabeledPoint[] = [
  { x: -1.0, y: 0.3, label: "A", color: "#ef4444" },
  { x: 0.3, y: 0.3, label: "B", color: "#f97316" },
  { x: 0.3, y: 0.8, label: "C", color: "#eab308" },
  { x: 1.2, y: 0.0, label: "D", color: "#22c55e" },
  { x: 0.3, y: -0.8, label: "E", color: "#3b82f6" },
  { x: 0.3, y: -0.3, label: "F", color: "#8b5cf6" },
  { x: -1.0, y: -0.3, label: "G", color: "#a855f7" },
];

const SQUARE_POINTS: LabeledPoint[] = [
  { x: -0.8, y: -0.8, label: "A", color: "#ef4444" },
  { x: 0.8, y: -0.8, label: "B", color: "#f97316" },
  { x: 0.8, y: 0.8, label: "C", color: "#22c55e" },
  { x: -0.8, y: 0.8, label: "D", color: "#3b82f6" },
];

type ShapeType = "arrow" | "square";

const SHAPES: Record<ShapeType, LabeledPoint[]> = {
  arrow: ARROW_POINTS,
  square: SQUARE_POINTS,
};

export function DimensionProjection() {
  const [angle, setAngle] = useState(0);
  const [shapeType, setShapeType] = useState<ShapeType>("arrow");

  const handleReset = useCallback(() => {
    setAngle(0);
  }, []);

  const rad = (angle * Math.PI) / 180;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  const points = SHAPES[shapeType];

  const projectedPoints = useMemo(() => {
    return points.map((p) => {
      const dot = p.x * dirX + p.y * dirY;
      return {
        ...p,
        projX: dot * dirX,
        projY: dot * dirY,
        scalar: dot,
      };
    });
  }, [points, dirX, dirY]);

  // Line endpoints across the canvas
  const lineLen = 3.5;
  const [lx1, ly1] = toSVG(-dirX * lineLen, -dirY * lineLen);
  const [lx2, ly2] = toSVG(dirX * lineLen, dirY * lineLen);

  // 1D number line at the bottom
  const NL_Y = SVG_SIZE - 35;
  const NL_X1 = 50;
  const NL_X2 = SVG_SIZE - 50;
  const NL_CX = (NL_X1 + NL_X2) / 2;
  const NL_SCALE = (NL_X2 - NL_X1) / 2 / 2; // maps -2..2 across the line

  return (
    <WidgetContainer
      title="Changing Dimensions"
      description="A 1\u00d72 matrix projects 2D points onto a 1D line \u2014 reducing a dimension"
      onReset={handleReset}
    >
      {/* Shape selector */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">Shape:</span>
        {(
          [
            { id: "arrow" as ShapeType, label: "Arrow" },
            { id: "square" as ShapeType, label: "Square" },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => setShapeType(s.id)}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              shapeType === s.id
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
        style={{ maxHeight: 420 }}
      >
        {/* Faint grid */}
        <g opacity={0.1}>
          {Array.from({ length: 7 }, (_, i) => i - 3).map((i) => {
            const [hx1, hy1] = toSVG(-3, i);
            const [hx2, hy2] = toSVG(3, i);
            const [vx1, vy1] = toSVG(i, -3);
            const [vx2, vy2] = toSVG(i, 3);
            return (
              <g key={i}>
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

        {/* Projection line */}
        <line
          x1={lx1}
          y1={ly1}
          x2={lx2}
          y2={ly2}
          stroke="#6b7280"
          strokeWidth={2.5}
          opacity={0.4}
        />

        {/* Direction arrow on the projection line */}
        <defs>
          <marker
            id="dp-dir-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0,0 8,3 0,6" fill="#6b7280" />
          </marker>
        </defs>
        {(() => {
          const [ax, ay] = toSVG(dirX * 2.5, dirY * 2.5);
          const [bx, by] = toSVG(dirX * 3.2, dirY * 3.2);
          return (
            <line
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              stroke="#6b7280"
              strokeWidth={2}
              opacity={0.5}
              markerEnd="url(#dp-dir-arrow)"
            />
          );
        })()}

        {/* Shape outline (faint polygon) */}
        <polygon
          points={points.map((p) => toSVG(p.x, p.y).join(",")).join(" ")}
          fill="rgba(107, 114, 128, 0.08)"
          stroke="#6b7280"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* Projection lines and dots */}
        {projectedPoints.map((p) => {
          const [sx, sy] = toSVG(p.x, p.y);
          const [px, py] = toSVG(p.projX, p.projY);
          return (
            <g key={p.label}>
              {/* Projection line (dotted) */}
              <line
                x1={sx}
                y1={sy}
                x2={px}
                y2={py}
                stroke={p.color}
                strokeWidth={1}
                opacity={0.4}
                strokeDasharray="3 2"
              />
              {/* Projected point on line */}
              <circle cx={px} cy={py} r={5} fill={p.color} opacity={0.6} />
              {/* Original point */}
              <circle cx={sx} cy={sy} r={7} fill={p.color} />
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

        {/* Separator line */}
        <line
          x1={NL_X1 - 10}
          y1={NL_Y - 18}
          x2={NL_X2 + 10}
          y2={NL_Y - 18}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />

        {/* 1D number line */}
        <line
          x1={NL_X1}
          y1={NL_Y}
          x2={NL_X2}
          y2={NL_Y}
          stroke="#6b7280"
          strokeWidth={1.5}
        />
        {/* Tick marks */}
        {[-2, -1, 0, 1, 2].map((v) => {
          const tx = NL_CX + v * NL_SCALE;
          return (
            <g key={v}>
              <line
                x1={tx}
                y1={NL_Y - 4}
                x2={tx}
                y2={NL_Y + 4}
                stroke="#6b7280"
                strokeWidth={1}
              />
              <text
                x={tx}
                y={NL_Y + 14}
                textAnchor="middle"
                fontSize={9}
                fill="#6b7280"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Projected points on number line */}
        {projectedPoints.map((p) => {
          const nlX = Math.max(
            NL_X1 - 5,
            Math.min(NL_X2 + 5, NL_CX + p.scalar * NL_SCALE),
          );
          return (
            <g key={`nl-${p.label}`}>
              <circle cx={nlX} cy={NL_Y} r={6} fill={p.color} />
              <text
                x={nlX}
                y={NL_Y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fontWeight="bold"
                fill="white"
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Label */}
        <text
          x={NL_CX}
          y={NL_Y + 26}
          textAnchor="middle"
          fontSize={10}
          fill="#9ca3af"
        >
          1D output
        </text>
      </svg>

      {/* Matrix display */}
      <div className="my-3 flex items-center justify-center gap-4">
        <div className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted">[</span>
            <span className="w-12 text-center font-semibold">
              {dirX.toFixed(2)}
            </span>
            <span className="w-12 text-center font-semibold">
              {dirY.toFixed(2)}
            </span>
            <span className="text-muted">]</span>
          </div>
        </div>
        <div className="text-xs text-muted">1&times;2 matrix</div>
      </div>

      {/* Angle slider */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-medium text-muted">
          Line direction
        </span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={angle}
          onChange={(e) => setAngle(parseFloat(e.target.value))}
          className="h-1.5 flex-1"
        />
        <span className="w-10 text-right font-mono text-xs font-bold text-muted">
          {angle}&deg;
        </span>
      </div>

      {/* Preset angles */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { label: "Horizontal (0\u00b0)", angle: 0 },
          { label: "Vertical (90\u00b0)", angle: 90 },
          { label: "Diagonal (45\u00b0)", angle: 45 },
          { label: "Diagonal (-45\u00b0)", angle: -45 },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => setAngle(preset.angle)}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </WidgetContainer>
  );
}
