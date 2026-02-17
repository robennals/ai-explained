"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const GRID_SIZE = 280;
const GRID_CX = GRID_SIZE / 2;
const GRID_CY = GRID_SIZE / 2;
const GRID_SCALE = 50;
const GRID_RANGE = 3;

// Arrow points — same as DimensionProjection for continuity
const ARROW_POINTS = [
  { x: -1.0, y: 0.3, label: "A", color: "#ef4444" },
  { x: 0.3, y: 0.3, label: "B", color: "#f97316" },
  { x: 0.3, y: 0.8, label: "C", color: "#eab308" },
  { x: 1.2, y: 0.0, label: "D", color: "#22c55e" },
  { x: 0.3, y: -0.8, label: "E", color: "#3b82f6" },
  { x: 0.3, y: -0.3, label: "F", color: "#8b5cf6" },
  { x: -1.0, y: -0.3, label: "G", color: "#a855f7" },
];

// Weight colors matching the neuron diagram and matrix
const W_COLORS = {
  a: "#ef4444",
  b: "#22c55e",
  c: "#3b82f6",
  d: "#a855f7",
};

function gridToSVG(x: number, y: number): [number, number] {
  return [GRID_CX + x * GRID_SCALE, GRID_CY - y * GRID_SCALE];
}

function transformPoint(
  x: number,
  y: number,
  a: number,
  b: number,
  c: number,
  d: number
): [number, number] {
  return [a * x + b * y, c * x + d * y];
}

const NEURON_W = 340;
const NEURON_H = 150;

export function NeuronVsMatrix() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(1);

  const handleReset = useCallback(() => {
    setA(1);
    setB(0);
    setC(0);
    setD(1);
  }, []);

  const transformedPoints = useMemo(
    () =>
      ARROW_POINTS.map((p) => {
        const [tx, ty] = transformPoint(p.x, p.y, a, b, c, d);
        return { ...p, tx, ty };
      }),
    [a, b, c, d]
  );

  const gridLines = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isAxis: boolean;
    }[] = [];
    for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
      const [vx1, vy1] = transformPoint(i, -GRID_RANGE, a, b, c, d);
      const [vx2, vy2] = transformPoint(i, GRID_RANGE, a, b, c, d);
      const [sx1, sy1] = gridToSVG(vx1, vy1);
      const [sx2, sy2] = gridToSVG(vx2, vy2);
      lines.push({ x1: sx1, y1: sy1, x2: sx2, y2: sy2, isAxis: i === 0 });

      const [hx1, hy1] = transformPoint(-GRID_RANGE, i, a, b, c, d);
      const [hx2, hy2] = transformPoint(GRID_RANGE, i, a, b, c, d);
      const [shx1, shy1] = gridToSVG(hx1, hy1);
      const [shx2, shy2] = gridToSVG(hx2, hy2);
      lines.push({
        x1: shx1,
        y1: shy1,
        x2: shx2,
        y2: shy2,
        isAxis: i === 0,
      });
    }
    return lines;
  }, [a, b, c, d]);

  const weightLineStyle = (w: number, color: string) => ({
    strokeWidth: Math.max(1, Math.min(4, Math.abs(w) * 2.5)),
    stroke: color,
    opacity: Math.max(0.3, Math.min(0.9, Math.abs(w) * 0.6 + 0.2)),
  });

  const sliderConfigs = [
    { label: "a", value: a, set: setA, color: W_COLORS.a },
    { label: "b", value: b, set: setB, color: W_COLORS.b },
    { label: "c", value: c, set: setC, color: W_COLORS.c },
    { label: "d", value: d, set: setD, color: W_COLORS.d },
  ];

  return (
    <WidgetContainer
      title="Neurons = Matrix Multiplication"
      description="The same four numbers, two views: neural network and geometric transformation"
      onReset={handleReset}
    >
      {/* Top row: neuron diagram and matrix side by side */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
        {/* Neuron diagram */}
        <div className="flex-shrink-0">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            Neuron View
          </div>
          <svg
            viewBox={`0 0 ${NEURON_W} ${NEURON_H}`}
            className="w-full"
            style={{ maxWidth: 340 }}
          >
            {/* Input neurons */}
            <circle
              cx={60}
              cy={45}
              r={22}
              fill="white"
              stroke="#6b7280"
              strokeWidth={1.5}
            />
            <text
              x={60}
              y={41}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              input
            </text>
            <text
              x={60}
              y={53}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              1
            </text>

            <circle
              cx={60}
              cy={110}
              r={22}
              fill="white"
              stroke="#6b7280"
              strokeWidth={1.5}
            />
            <text
              x={60}
              y={106}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              input
            </text>
            <text
              x={60}
              y={118}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              2
            </text>

            {/* Output neurons */}
            <circle
              cx={280}
              cy={45}
              r={22}
              fill="white"
              stroke="#6b7280"
              strokeWidth={1.5}
            />
            <text
              x={280}
              y={41}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              output
            </text>
            <text
              x={280}
              y={53}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              1
            </text>

            <circle
              cx={280}
              cy={110}
              r={22}
              fill="white"
              stroke="#6b7280"
              strokeWidth={1.5}
            />
            <text
              x={280}
              y={106}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              output
            </text>
            <text
              x={280}
              y={118}
              textAnchor="middle"
              fontSize={10}
              fill="#1a1a2e"
            >
              2
            </text>

            {/* a: input 1 → output 1 */}
            <line
              x1={82}
              y1={40}
              x2={258}
              y2={40}
              {...weightLineStyle(a, W_COLORS.a)}
            />
            <text
              x={170}
              y={33}
              textAnchor="middle"
              fontSize={13}
              fill={W_COLORS.a}
              fontWeight="bold"
            >
              a={a.toFixed(1)}
            </text>

            {/* b: input 2 → output 1 */}
            <line
              x1={82}
              y1={105}
              x2={258}
              y2={50}
              {...weightLineStyle(b, W_COLORS.b)}
            />
            <text
              x={138}
              y={73}
              textAnchor="middle"
              fontSize={13}
              fill={W_COLORS.b}
              fontWeight="bold"
            >
              b={b.toFixed(1)}
            </text>

            {/* c: input 1 → output 2 */}
            <line
              x1={82}
              y1={50}
              x2={258}
              y2={105}
              {...weightLineStyle(c, W_COLORS.c)}
            />
            <text
              x={202}
              y={87}
              textAnchor="middle"
              fontSize={13}
              fill={W_COLORS.c}
              fontWeight="bold"
            >
              c={c.toFixed(1)}
            </text>

            {/* d: input 2 → output 2 */}
            <line
              x1={82}
              y1={115}
              x2={258}
              y2={115}
              {...weightLineStyle(d, W_COLORS.d)}
            />
            <text
              x={170}
              y={137}
              textAnchor="middle"
              fontSize={13}
              fill={W_COLORS.d}
              fontWeight="bold"
            >
              d={d.toFixed(1)}
            </text>
          </svg>
        </div>

        {/* Matrix display with matching colors */}
        <div className="flex flex-col items-center justify-center self-center">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            Matrix View
          </div>
          <div className="rounded-lg border border-border bg-surface px-5 py-3 font-mono text-lg">
            <div className="flex items-center gap-1">
              <span className="text-xl text-muted">[</span>
              <span
                className="w-10 text-center font-bold"
                style={{ color: W_COLORS.a }}
              >
                {a.toFixed(1)}
              </span>
              <span
                className="w-10 text-center font-bold"
                style={{ color: W_COLORS.b }}
              >
                {b.toFixed(1)}
              </span>
              <span className="text-xl text-muted">]</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl text-muted">[</span>
              <span
                className="w-10 text-center font-bold"
                style={{ color: W_COLORS.c }}
              >
                {c.toFixed(1)}
              </span>
              <span
                className="w-10 text-center font-bold"
                style={{ color: W_COLORS.d }}
              >
                {d.toFixed(1)}
              </span>
              <span className="text-xl text-muted">]</span>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-muted">
            Same numbers!
          </div>
        </div>
      </div>

      {/* Bottom row: sliders (left) and geometric view (right) */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        {/* Sliders — vertically stacked */}
        <div className="flex flex-col gap-2 sm:w-48 sm:shrink-0 sm:self-center">
          {sliderConfigs.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span
                className="w-4 shrink-0 text-sm font-bold"
                style={{ color: s.color }}
              >
                {s.label}
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.1}
                value={s.value}
                onChange={(e) => s.set(parseFloat(e.target.value))}
                className="h-1.5 flex-1"
                style={{ accentColor: s.color }}
              />
              <span
                className="w-8 shrink-0 text-right font-mono text-xs font-bold"
                style={{ color: s.color }}
              >
                {s.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Geometric view with arrow */}
        <div className="flex-1">
          <svg
            viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
            className="w-full"
          >
            <defs>
              <clipPath id="nvm-clip">
                <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} />
              </clipPath>
            </defs>

            {/* Original grid (faint) */}
            <g opacity={0.08}>
              {Array.from(
                { length: GRID_RANGE * 2 + 1 },
                (_, i) => i - GRID_RANGE
              ).map((i) => {
                const [hx1, hy1] = gridToSVG(-GRID_RANGE, i);
                const [hx2, hy2] = gridToSVG(GRID_RANGE, i);
                const [vx1, vy1] = gridToSVG(i, -GRID_RANGE);
                const [vx2, vy2] = gridToSVG(i, GRID_RANGE);
                return (
                  <g key={i}>
                    <line
                      x1={hx1}
                      y1={hy1}
                      x2={hx2}
                      y2={hy2}
                      stroke="#6b7280"
                      strokeWidth={i === 0 ? 1.5 : 0.5}
                    />
                    <line
                      x1={vx1}
                      y1={vy1}
                      x2={vx2}
                      y2={vy2}
                      stroke="#6b7280"
                      strokeWidth={i === 0 ? 1.5 : 0.5}
                    />
                  </g>
                );
              })}
            </g>

            {/* Transformed grid */}
            <g clipPath="url(#nvm-clip)">
              {gridLines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#3b82f6"
                  strokeWidth={line.isAxis ? 1.2 : 0.6}
                  opacity={line.isAxis ? 0.4 : 0.15}
                />
              ))}
            </g>

            {/* Original arrow (faint) */}
            <polygon
              points={ARROW_POINTS.map((p) =>
                gridToSVG(p.x, p.y).join(",")
              ).join(" ")}
              fill="rgba(107, 114, 128, 0.08)"
              stroke="#6b7280"
              strokeWidth={1}
              opacity={0.4}
            />

            {/* Transformed arrow */}
            <polygon
              points={transformedPoints
                .map((p) => gridToSVG(p.tx, p.ty).join(","))
                .join(" ")}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="#3b82f6"
              strokeWidth={1.5}
            />

            {/* Original points (faint) */}
            {ARROW_POINTS.map((p) => {
              const [sx, sy] = gridToSVG(p.x, p.y);
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

            {/* Transformed points with labels */}
            {transformedPoints.map((p) => {
              const [sx, sy] = gridToSVG(p.tx, p.ty);
              return (
                <g key={`trans-${p.label}`}>
                  <circle cx={sx} cy={sy} r={6} fill={p.color} />
                  <text
                    x={sx}
                    y={sy + 1}
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
          </svg>
        </div>
      </div>

      {/* Preset configurations */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-muted">
          Try:
        </span>
        {[
          { label: "Identity", w: [1, 0, 0, 1] as const },
          { label: "Rotate 90\u00b0", w: [0, -1, 1, 0] as const },
          { label: "Scale 2\u00d7", w: [2, 0, 0, 2] as const },
          { label: "Swap axes", w: [0, 1, 1, 0] as const },
          { label: "Collapse to line", w: [1, 0, 0, 0] as const },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setA(preset.w[0]);
              setB(preset.w[1]);
              setC(preset.w[2]);
              setD(preset.w[3]);
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
