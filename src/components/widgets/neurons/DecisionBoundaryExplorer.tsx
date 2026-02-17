"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function outputColor(v: number): string {
  // Blue (low) → Orange (high)
  const r = Math.round(59 + (251 - 59) * v);
  const g = Math.round(130 + (146 - 130) * v);
  const b = Math.round(246 + (20 - 246) * v);
  return `rgb(${r},${g},${b})`;
}

const POINTS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

type GateName = "AND" | "OR" | "NOT" | "NAND" | "XOR";

const GATE_TARGETS: Record<GateName, number[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  NOT: [1, 1, 0, 0],
  NAND: [1, 1, 1, 0],
  XOR: [0, 1, 1, 0],
};

const SVG_SIZE = 300;
const PAD = 40;
const PLOT_SIZE = SVG_SIZE - 2 * PAD;
const GRID_RES = 30;
const CX = PAD;
const CY = SVG_SIZE - PAD;
const SCALE = PLOT_SIZE;

function toSvgX(v: number): number { return CX + v * SCALE; }
function toSvgY(v: number): number { return CY - v * SCALE; }

function fromSvgCoords(clientX: number, clientY: number, rect: DOMRect): [number, number] {
  const svgX = ((clientX - rect.left) / rect.width) * SVG_SIZE;
  const svgY = ((clientY - rect.top) / rect.height) * SVG_SIZE;
  return [(svgX - CX) / SCALE, -(svgY - CY) / SCALE];
}

function Arrowhead({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const size = 7;
  const h1x = x - size * Math.cos(angle - 0.35);
  const h1y = y - size * Math.sin(angle - 0.35);
  const h2x = x - size * Math.cos(angle + 0.35);
  const h2y = y - size * Math.sin(angle + 0.35);
  return <polygon points={`${x},${y} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />;
}

export function DecisionBoundaryExplorer() {
  const [w1, setW1] = useState(0.7);
  const [w2, setW2] = useState(0.7);
  const [x1, setX1] = useState(0.8);
  const [x2, setX2] = useState(0.3);
  const [bias, setBias] = useState(-0.8);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTarget = useRef<"w" | "x" | null>(null);

  const reset = useCallback(() => {
    setW1(0.7); setW2(0.7);
    setX1(0.8); setX2(0.3);
    setBias(-0.8);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const [px, py] = fromSvgCoords(e.clientX, e.clientY, rect);
    const dW = Math.hypot(px - w1, py - w2);
    const dX = Math.hypot(px - x1, py - x2);
    dragTarget.current = dW < dX ? "w" : "x";
    (e.target as Element).setPointerCapture(e.pointerId);
    const clamp = (v: number) => Math.max(-1.5, Math.min(1.5, v));
    if (dragTarget.current === "w") {
      setW1(clamp(px)); setW2(clamp(py));
    } else {
      setX1(clamp(px)); setX2(clamp(py));
    }
  }, [w1, w2, x1, x2]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const [px, py] = fromSvgCoords(e.clientX, e.clientY, rect);
    const clamp = (v: number) => Math.max(-1.5, Math.min(1.5, v));
    if (dragTarget.current === "w") {
      setW1(clamp(px)); setW2(clamp(py));
    } else {
      setX1(clamp(px)); setX2(clamp(py));
    }
  }, []);

  const handlePointerUp = useCallback(() => { dragTarget.current = null; }, []);

  const dot = w1 * x1 + w2 * x2;
  const preActivation = dot + bias;
  const output = sigmoid(preActivation);
  const outColor = outputColor(output);

  // Heatmap grid
  const heatmap = useMemo(() => {
    const cells: { x: number; y: number; w: number; h: number; color: string }[] = [];
    const cellSize = PLOT_SIZE / GRID_RES;
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const dataX = (i + 0.5) / GRID_RES * 1.4 - 0.2;
        const dataY = 1.2 - (j + 0.5) / GRID_RES * 1.4;
        const z = w1 * dataX + w2 * dataY + bias;
        const out = sigmoid(z);
        cells.push({
          x: PAD + i * cellSize,
          y: PAD + j * cellSize,
          w: cellSize + 0.5,
          h: cellSize + 0.5,
          color: outputColor(out),
        });
      }
    }
    return cells;
  }, [w1, w2, bias]);

  // Decision boundary line: w1*x + w2*y + bias = 0
  const boundaryLine = useMemo(() => {
    if (Math.abs(w2) < 0.001 && Math.abs(w1) < 0.001) return null;
    if (Math.abs(w2) > 0.001) {
      const y0 = -(w1 * -0.2 + bias) / w2;
      const y1 = -(w1 * 1.2 + bias) / w2;
      return [{ x: -0.2, y: y0 }, { x: 1.2, y: y1 }];
    }
    const x = -bias / w1;
    return [{ x, y: -0.2 }, { x, y: 1.2 }];
  }, [w1, w2, bias]);

  // Gate point outputs
  const pointOutputs = useMemo(() => {
    return POINTS.map(([x, y]) => sigmoid(w1 * x + w2 * y + bias));
  }, [w1, w2, bias]);

  const gatesSolved = useMemo(() => {
    const solved: Record<string, boolean | "impossible"> = {};
    for (const [name, targets] of Object.entries(GATE_TARGETS)) {
      if (name === "XOR") {
        solved[name] = "impossible";
      } else {
        solved[name] = targets.every((t, i) =>
          t === 1 ? pointOutputs[i] > 0.8 : pointOutputs[i] < 0.2
        );
      }
    }
    return solved;
  }, [pointOutputs]);

  // Gate presets: weights and bias that solve each gate
  const GATE_PRESETS: Record<string, { w1: number; w2: number; bias: number }> = {
    AND:  { w1: 0.7, w2: 0.7, bias: -0.9 },
    OR:   { w1: 0.7, w2: 0.7, bias: -0.3 },
    NOT:  { w1: -0.7, w2: 0.0, bias: 0.35 },
    NAND: { w1: -0.7, w2: -0.7, bias: 0.9 },
  };

  const applyGatePreset = useCallback((gate: string) => {
    const p = GATE_PRESETS[gate];
    if (p) { setW1(p.w1); setW2(p.w2); setBias(p.bias); }
  }, []);

  // Vector SVG positions
  const wsx = toSvgX(w1), wsy = toSvgY(w2);
  const xsx = toSvgX(x1), xsy = toSvgY(x2);

  return (
    <WidgetContainer
      title="A Neuron Draws a Line"
      description="Drag the weight and input vectors. The heatmap shows the neuron's output for every possible input."
      onReset={reset}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full max-w-[350px] cursor-crosshair touch-none rounded-lg border border-border"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Heatmap */}
            {heatmap.map((cell, i) => (
              <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill={cell.color} />
            ))}

            {/* Axes */}
            <line x1={toSvgX(-0.2)} y1={toSvgY(0)} x2={toSvgX(1.2)} y2={toSvgY(0)} stroke="white" strokeOpacity={0.3} strokeWidth={1} />
            <line x1={toSvgX(0)} y1={toSvgY(-0.2)} x2={toSvgX(0)} y2={toSvgY(1.2)} stroke="white" strokeOpacity={0.3} strokeWidth={1} />
            <text x={toSvgX(1.15)} y={toSvgY(0) + 12} textAnchor="end" fontSize={10} fill="white" fillOpacity={0.5} fontWeight={600}>x₁</text>
            <text x={toSvgX(0) + 8} y={toSvgY(1.15)} fontSize={10} fill="white" fillOpacity={0.5} fontWeight={600}>x₂</text>

            {/* Decision boundary line */}
            {boundaryLine && (
              <line
                x1={toSvgX(boundaryLine[0].x)}
                y1={toSvgY(boundaryLine[0].y)}
                x2={toSvgX(boundaryLine[1].x)}
                y2={toSvgY(boundaryLine[1].y)}
                stroke="white"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                opacity={0.9}
              />
            )}

            {/* Weight vector */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={wsx} y2={wsy} stroke="#f59e0b" strokeWidth={2.5} />
            {(() => {
              const angle = Math.atan2(wsy - toSvgY(0), wsx - toSvgX(0));
              return <Arrowhead x={wsx} y={wsy} angle={angle} color="#f59e0b" />;
            })()}
            <text x={wsx + 8} y={wsy - 5} fontSize={12} fill="#f59e0b" fontWeight={700}>w</text>

            {/* Input vector */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={xsx} y2={xsy} stroke="#3b82f6" strokeWidth={2.5} />
            {(() => {
              const angle = Math.atan2(xsy - toSvgY(0), xsx - toSvgX(0));
              return <Arrowhead x={xsx} y={xsy} angle={angle} color="#3b82f6" />;
            })()}
            <text x={xsx + 8} y={xsy - 5} fontSize={12} fill="#3b82f6" fontWeight={700}>x</text>

            {/* Output indicator at input position */}
            <circle cx={xsx} cy={xsy} r={12} fill={outColor} stroke="white" strokeWidth={2} />
            <text x={xsx} y={xsy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="white" fontWeight={700}>
              {output.toFixed(2)}
            </text>

            {/* Drag handles */}
            <circle cx={wsx} cy={wsy} r={8} fill="#f59e0b" fillOpacity={0.2} className="cursor-grab" />
            <circle cx={xsx} cy={xsy} r={14} fill="transparent" className="cursor-grab" />

            {/* Gate data points (corners) */}
            {POINTS.map(([x, y], i) => {
              const out = pointOutputs[i];
              return (
                <g key={`pt-${i}`}>
                  <circle
                    cx={toSvgX(x)}
                    cy={toSvgY(y)}
                    r={10}
                    fill={outputColor(out)}
                    stroke="white"
                    strokeWidth="1.5"
                    opacity={0.8}
                  />
                  <text
                    x={toSvgX(x)}
                    y={toSvgY(y) + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={7}
                    fill="white"
                    fontWeight={700}
                    className="pointer-events-none"
                  >
                    {out.toFixed(1)}
                  </text>
                  <text
                    x={toSvgX(x) + (x === 0 ? -14 : 14)}
                    y={toSvgY(y) + (y === 0 ? 14 : -10)}
                    textAnchor="middle"
                    fontSize={8}
                    fill="white"
                    fillOpacity={0.5}
                    className="pointer-events-none font-mono"
                  >
                    ({x},{y})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bias slider below viz */}
          <div className="mt-2 max-w-[350px]">
            <SliderControl label="bias" value={bias} min={-3} max={3} step={0.1} onChange={setBias} />
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-52 space-y-4">
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Output</div>
            <div className="font-mono text-xs">
              <span className="text-amber-500">w</span> · <span className="text-blue-500">x</span> + bias = {dot.toFixed(2)} + ({bias.toFixed(1)}) = {preActivation.toFixed(2)}
            </div>
            <div className="font-mono text-xs">
              sigmoid({preActivation.toFixed(2)}) = <span className="font-bold" style={{ color: outColor }}>{output.toFixed(3)}</span>
            </div>
          </div>

          {/* Gate presets */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Logic Gates</div>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(GATE_TARGETS) as GateName[]).map((gate) => {
                const status = gatesSolved[gate];
                const isXor = gate === "XOR";
                return (
                  <button
                    key={gate}
                    onClick={() => !isXor && applyGatePreset(gate)}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      isXor
                        ? "bg-error/10 text-error/70 cursor-not-allowed"
                        : status
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-foreground/5 text-muted hover:bg-foreground/10"
                    }`}
                  >
                    {isXor ? "✗" : status ? "✓" : "○"} {gate}
                    {isXor && (
                      <span className="ml-auto text-[10px]">impossible</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-[10px] text-muted leading-relaxed">
              Click a gate to set the weights. The dashed white line is the <strong>decision boundary</strong> — where the output is exactly 0.5. Drag <strong className="text-amber-500">w</strong> and adjust the bias to explore.
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
