"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const INPUT_COMBOS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const XOR_TARGETS = [0, 1, 1, 0];

// XOR solution: OR + NAND → AND (using sigmoid-appropriate weights)
const XOR_NETWORK = {
  hidden: {
    A: { w1: 10, w2: 10, bias: -5 }, // OR
    B: { w1: -10, w2: -10, bias: 15 }, // NAND
  },
  output: { wA: 10, wB: 10, bias: -15 }, // AND
};

const SVG_W = 220;
const SVG_H = 220;
const PAD = 30;
const PLOT = SVG_W - 2 * PAD;
const GRID_RES = 25;

export function XORBreakthrough() {
  const [useTwoLayers, setUseTwoLayers] = useState(false);

  const reset = useCallback(() => {
    setUseTwoLayers(false);
  }, []);

  const computeOutputs = useCallback(
    (x1: number, x2: number) => {
      if (!useTwoLayers) {
        // Single layer can't do XOR — default to 0.5 (no solution)
        return {
          hiddenA: 0,
          hiddenB: 0,
          output: sigmoid(0),
        };
      }
      const { hidden, output } = XOR_NETWORK;
      const hA = sigmoid(hidden.A.w1 * x1 + hidden.A.w2 * x2 + hidden.A.bias);
      const hB = sigmoid(hidden.B.w1 * x1 + hidden.B.w2 * x2 + hidden.B.bias);
      const out = sigmoid(output.wA * hA + output.wB * hB + output.bias);
      return { hiddenA: hA, hiddenB: hB, output: out };
    },
    [useTwoLayers]
  );

  const pointResults = useMemo(
    () => INPUT_COMBOS.map(([x1, x2]) => computeOutputs(x1, x2)),
    [computeOutputs]
  );

  // Heatmap for input space
  const inputHeatmap = useMemo(() => {
    const cells: { x: number; y: number; w: number; h: number; color: string }[] = [];
    const cellSize = PLOT / GRID_RES;
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const dataX = (i + 0.5) / GRID_RES;
        const dataY = 1 - (j + 0.5) / GRID_RES;
        const { output } = computeOutputs(dataX, dataY);
        const r = Math.round(59 + (251 - 59) * output);
        const g = Math.round(130 + (146 - 130) * output);
        const b = Math.round(246 + (20 - 246) * output);
        cells.push({
          x: PAD + i * cellSize,
          y: PAD + j * cellSize,
          w: cellSize + 0.5,
          h: cellSize + 0.5,
          color: `rgb(${r},${g},${b})`,
        });
      }
    }
    return cells;
  }, [computeOutputs]);

  // Heatmap for hidden space (only when 2 layers)
  const hiddenHeatmap = useMemo(() => {
    if (!useTwoLayers) return [];
    const cells: { x: number; y: number; w: number; h: number; color: string }[] = [];
    const cellSize = PLOT / GRID_RES;
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const hA = (i + 0.5) / GRID_RES;
        const hB = 1 - (j + 0.5) / GRID_RES;
        const { output: outWeights } = XOR_NETWORK;
        const out = sigmoid(outWeights.wA * hA + outWeights.wB * hB + outWeights.bias);
        const r = Math.round(59 + (251 - 59) * out);
        const g = Math.round(130 + (146 - 130) * out);
        const b = Math.round(246 + (20 - 246) * out);
        cells.push({
          x: PAD + i * cellSize,
          y: PAD + j * cellSize,
          w: cellSize + 0.5,
          h: cellSize + 0.5,
          color: `rgb(${r},${g},${b})`,
        });
      }
    }
    return cells;
  }, [useTwoLayers]);

  function toSvg(v: number): number {
    return PAD + v * PLOT;
  }

  const correct = pointResults.every((r, i) =>
    XOR_TARGETS[i] === 1 ? r.output > 0.8 : r.output < 0.2
  );

  return (
    <WidgetContainer
      title="XOR Breakthrough"
      description="Toggle between 1 and 2 layers to see how hidden layers solve XOR"
      onReset={reset}
    >
      {/* Layer toggle */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setUseTwoLayers(false)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            !useTwoLayers
              ? "bg-accent text-white"
              : "bg-foreground/5 text-muted hover:bg-foreground/10"
          }`}
        >
          1 Layer
        </button>
        <button
          onClick={() => setUseTwoLayers(true)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            useTwoLayers
              ? "bg-accent text-white"
              : "bg-foreground/5 text-muted hover:bg-foreground/10"
          }`}
        >
          2 Layers
        </button>
        <span className={`ml-2 text-xs font-medium ${correct ? "text-success" : "text-error/60"}`}>
          {correct ? "✓ XOR solved!" : "✗ XOR not solved"}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Input space */}
        <div className="flex-1">
          <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">Input Space</div>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-[260px] rounded-lg border border-border">
            {inputHeatmap.map((c, i) => (
              <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.color} />
            ))}
            <text x={PAD + PLOT / 2} y={SVG_H - 6} textAnchor="middle" className="fill-muted text-[9px]">A</text>
            <text x={8} y={PAD + PLOT / 2} textAnchor="middle" className="fill-muted text-[9px]" transform={`rotate(-90, 8, ${PAD + PLOT / 2})`}>B</text>

            {INPUT_COMBOS.map(([x1, x2], i) => {
              const result = pointResults[i];
              const isTarget1 = XOR_TARGETS[i] === 1;
              return (
                <g key={i}>
                  <circle
                    cx={toSvg(x1)}
                    cy={toSvg(1 - x2)}
                    r={14}
                    fill={isTarget1 ? "#fb923c" : "#3b82f6"}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={toSvg(x1)}
                    y={toSvg(1 - x2) + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] font-bold fill-white pointer-events-none"
                  >
                    {result.output.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hidden space (only shown for 2 layers) */}
        {useTwoLayers && (
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">Hidden Layer Space</div>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-[260px] rounded-lg border border-border">
              {hiddenHeatmap.map((c, i) => (
                <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.color} />
              ))}
              <text x={PAD + PLOT / 2} y={SVG_H - 6} textAnchor="middle" className="fill-muted text-[9px]">Neuron A (OR)</text>
              <text x={8} y={PAD + PLOT / 2} textAnchor="middle" className="fill-muted text-[9px]" transform={`rotate(-90, 8, ${PAD + PLOT / 2})`}>Neuron B (NAND)</text>

              {/* Decision boundary in hidden space */}
              {(() => {
                const { output } = XOR_NETWORK;
                // sigmoid = 0.5 when wA*hA + wB*hB + bias = 0
                // hB = -(wA*hA + bias) / wB
                const hB0 = -(output.wA * 0 + output.bias) / output.wB;
                const hB1 = -(output.wA * 1 + output.bias) / output.wB;
                return (
                  <line
                    x1={toSvg(0)}
                    y1={toSvg(1 - hB0)}
                    x2={toSvg(1)}
                    y2={toSvg(1 - hB1)}
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                    opacity={0.9}
                  />
                );
              })()}

              {INPUT_COMBOS.map(([x1, x2], i) => {
                const result = pointResults[i];
                const isTarget1 = XOR_TARGETS[i] === 1;
                return (
                  <g key={i}>
                    <circle
                      cx={toSvg(result.hiddenA)}
                      cy={toSvg(1 - result.hiddenB)}
                      r={14}
                      fill={isTarget1 ? "#fb923c" : "#3b82f6"}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={toSvg(result.hiddenA)}
                      y={toSvg(1 - result.hiddenB) + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-bold fill-white pointer-events-none"
                    >
                      ({x1},{x2})
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-1 text-[10px] text-muted text-center">
              The hidden layer <strong>moved the points</strong> — XOR is now separable with one line!
            </div>
          </div>
        )}

        {!useTwoLayers && (
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted">
              Switch to <strong>2 Layers</strong> to see the hidden layer&apos;s transformed space
            </div>
          </div>
        )}
      </div>

      {/* Network diagram */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Network Architecture</div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted">
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center text-[9px]">A</div>
              <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center text-[9px]">B</div>
            </div>
            <span className="text-[9px]">Input</span>
          </div>
          <span className="text-muted/40">→</span>
          {useTwoLayers && (
            <>
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-1">
                  <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[9px] text-accent">H1</div>
                  <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[9px] text-accent">H2</div>
                </div>
                <span className="text-[9px]">Hidden</span>
              </div>
              <span className="text-muted/40">→</span>
            </>
          )}
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center text-[9px] text-success">y</div>
            <span className="text-[9px]">Output</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
