"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const NEURON_W = 300;
const NEURON_H = 180;
const GRID_SIZE = 280;
const GRID_CX = GRID_SIZE / 2;
const GRID_CY = GRID_SIZE / 2;
const GRID_SCALE = 35;
const GRID_RANGE = 3;

// Input test points — an L-shape arrangement for visual clarity
const INPUT_POINTS: [number, number, string][] = [
  [0.3, 0.3, "#ef4444"],
  [0.6, 0.3, "#f97316"],
  [0.9, 0.3, "#eab308"],
  [1.2, 0.3, "#84cc16"],
  [0.3, 0.6, "#22c55e"],
  [0.3, 0.9, "#06b6d4"],
  [0.3, 1.2, "#3b82f6"],
  [0.3, 1.5, "#8b5cf6"],
  [0.6, 0.6, "#a855f7"],
];

function gridToSVG(x: number, y: number): [number, number] {
  return [GRID_CX + x * GRID_SCALE, GRID_CY - y * GRID_SCALE];
}

function transformPoint(
  x: number,
  y: number,
  w11: number,
  w12: number,
  w21: number,
  w22: number
): [number, number] {
  return [w11 * x + w12 * y, w21 * x + w22 * y];
}

export function NeuronVsMatrix() {
  const [w11, setW11] = useState(1);
  const [w12, setW12] = useState(0);
  const [w21, setW21] = useState(0);
  const [w22, setW22] = useState(1);

  const handleReset = useCallback(() => {
    setW11(1);
    setW12(0);
    setW21(0);
    setW22(1);
  }, []);

  // Transformed input points
  const transformedPoints = useMemo(
    () =>
      INPUT_POINTS.map(([x, y, color]) => {
        const [tx, ty] = transformPoint(x, y, w11, w12, w21, w22);
        return { x, y, tx, ty, color };
      }),
    [w11, w12, w21, w22]
  );

  // Grid lines for geometric view
  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; isAxis: boolean }[] = [];
    for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
      // Vertical
      const [vx1, vy1] = transformPoint(i, -GRID_RANGE, w11, w12, w21, w22);
      const [vx2, vy2] = transformPoint(i, GRID_RANGE, w11, w12, w21, w22);
      const [sx1, sy1] = gridToSVG(vx1, vy1);
      const [sx2, sy2] = gridToSVG(vx2, vy2);
      lines.push({ x1: sx1, y1: sy1, x2: sx2, y2: sy2, isAxis: i === 0 });

      // Horizontal
      const [hx1, hy1] = transformPoint(-GRID_RANGE, i, w11, w12, w21, w22);
      const [hx2, hy2] = transformPoint(GRID_RANGE, i, w11, w12, w21, w22);
      const [shx1, shy1] = gridToSVG(hx1, hy1);
      const [shx2, shy2] = gridToSVG(hx2, hy2);
      lines.push({ x1: shx1, y1: shy1, x2: shx2, y2: shy2, isAxis: i === 0 });
    }
    return lines;
  }, [w11, w12, w21, w22]);

  // Weight line styling
  const weightStyle = (w: number) => ({
    strokeWidth: Math.max(0.5, Math.min(4, Math.abs(w) * 2)),
    stroke: w >= 0 ? "#3b82f6" : "#ef4444",
    opacity: Math.max(0.15, Math.min(0.9, Math.abs(w) * 0.6)),
  });

  return (
    <WidgetContainer
      title="Neurons = Matrix Multiplication"
      description="The same weights, two views: neural network and geometric transformation"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Left: Neuron diagram */}
        <div className="flex-1">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            Neuron View
          </div>
          <svg viewBox={`0 0 ${NEURON_W} ${NEURON_H}`} className="w-full">
            {/* Input neurons */}
            <circle cx={55} cy={55} r={20} fill="white" stroke="#6b7280" strokeWidth={1.5} />
            <text x={55} y={59} textAnchor="middle" fontSize={13} fill="#1a1a2e" fontWeight="600">
              x&#x2081;
            </text>
            <circle cx={55} cy={125} r={20} fill="white" stroke="#6b7280" strokeWidth={1.5} />
            <text x={55} y={129} textAnchor="middle" fontSize={13} fill="#1a1a2e" fontWeight="600">
              x&#x2082;
            </text>

            {/* Output neurons */}
            <circle cx={245} cy={55} r={20} fill="white" stroke="#6b7280" strokeWidth={1.5} />
            <text x={245} y={59} textAnchor="middle" fontSize={13} fill="#1a1a2e" fontWeight="600">
              y&#x2081;
            </text>
            <circle cx={245} cy={125} r={20} fill="white" stroke="#6b7280" strokeWidth={1.5} />
            <text x={245} y={129} textAnchor="middle" fontSize={13} fill="#1a1a2e" fontWeight="600">
              y&#x2082;
            </text>

            {/* Weight connections */}
            {/* w11: x1 → y1 */}
            <line x1={75} y1={50} x2={225} y2={50} {...weightStyle(w11)} />
            <text x={150} y={42} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="var(--font-mono)">
              w&#x2081;&#x2081;={w11.toFixed(1)}
            </text>

            {/* w12: x2 → y1 */}
            <line x1={75} y1={120} x2={225} y2={60} {...weightStyle(w12)} />
            <text x={130} y={82} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="var(--font-mono)">
              w&#x2081;&#x2082;={w12.toFixed(1)}
            </text>

            {/* w21: x1 → y2 */}
            <line x1={75} y1={60} x2={225} y2={120} {...weightStyle(w21)} />
            <text x={170} y={100} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="var(--font-mono)">
              w&#x2082;&#x2081;={w21.toFixed(1)}
            </text>

            {/* w22: x2 → y2 */}
            <line x1={75} y1={130} x2={225} y2={130} {...weightStyle(w22)} />
            <text x={150} y={145} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="var(--font-mono)">
              w&#x2082;&#x2082;={w22.toFixed(1)}
            </text>

            {/* Equations */}
            <text x={150} y={170} textAnchor="middle" fontSize={9} fill="#9ca3af" fontFamily="var(--font-mono)">
              y&#x2081; = w&#x2081;&#x2081;x&#x2081; + w&#x2081;&#x2082;x&#x2082;
              &nbsp;&nbsp;|&nbsp;&nbsp;
              y&#x2082; = w&#x2082;&#x2081;x&#x2081; + w&#x2082;&#x2082;x&#x2082;
            </text>
          </svg>
        </div>

        {/* Right: Geometric view */}
        <div className="flex-1">
          <div className="mb-1 text-center text-xs font-medium text-muted">
            Geometric View
          </div>
          <svg viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="w-full">
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
                    <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} stroke="#6b7280" strokeWidth={i === 0 ? 1.5 : 0.5} />
                    <line x1={vx1} y1={vy1} x2={vx2} y2={vy2} stroke="#6b7280" strokeWidth={i === 0 ? 1.5 : 0.5} />
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

            {/* Original points (faint) */}
            {INPUT_POINTS.map(([x, y, color], i) => {
              const [sx, sy] = gridToSVG(x, y);
              return (
                <circle
                  key={`orig-${i}`}
                  cx={sx}
                  cy={sy}
                  r={3.5}
                  fill={color}
                  opacity={0.2}
                />
              );
            })}

            {/* Transformed points */}
            {transformedPoints.map((p, i) => {
              const [sx, sy] = gridToSVG(p.tx, p.ty);
              return (
                <g key={`trans-${i}`}>
                  {/* Connection line */}
                  <line
                    x1={gridToSVG(p.x, p.y)[0]}
                    y1={gridToSVG(p.x, p.y)[1]}
                    x2={sx}
                    y2={sy}
                    stroke={p.color}
                    strokeWidth={0.8}
                    opacity={0.25}
                  />
                  <circle cx={sx} cy={sy} r={4.5} fill={p.color} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Matrix display */}
      <div className="my-3 flex justify-center">
        <div className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex gap-2">
                <span className="text-muted">[</span>
                <span className="w-10 text-center font-semibold">{w11.toFixed(1)}</span>
                <span className="w-10 text-center font-semibold">{w12.toFixed(1)}</span>
                <span className="text-muted">]</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted">[</span>
                <span className="w-10 text-center font-semibold">{w21.toFixed(1)}</span>
                <span className="w-10 text-center font-semibold">{w22.toFixed(1)}</span>
                <span className="text-muted">]</span>
              </div>
            </div>
            <span className="text-muted">=</span>
            <div className="text-xs text-muted">Weight matrix</div>
          </div>
        </div>
      </div>

      {/* Weight sliders */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <SliderControl
          label="w\u2081\u2081 (x\u2081\u2192y\u2081)"
          value={w11}
          min={-2}
          max={2}
          step={0.1}
          onChange={setW11}
          formatValue={(v) => v.toFixed(1)}
        />
        <SliderControl
          label="w\u2081\u2082 (x\u2082\u2192y\u2081)"
          value={w12}
          min={-2}
          max={2}
          step={0.1}
          onChange={setW12}
          formatValue={(v) => v.toFixed(1)}
        />
        <SliderControl
          label="w\u2082\u2081 (x\u2081\u2192y\u2082)"
          value={w21}
          min={-2}
          max={2}
          step={0.1}
          onChange={setW21}
          formatValue={(v) => v.toFixed(1)}
        />
        <SliderControl
          label="w\u2082\u2082 (x\u2082\u2192y\u2082)"
          value={w22}
          min={-2}
          max={2}
          step={0.1}
          onChange={setW22}
          formatValue={(v) => v.toFixed(1)}
        />
      </div>

      {/* Preset configurations */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-muted">Try:</span>
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
              setW11(preset.w[0]);
              setW12(preset.w[1]);
              setW21(preset.w[2]);
              setW22(preset.w[3]);
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
