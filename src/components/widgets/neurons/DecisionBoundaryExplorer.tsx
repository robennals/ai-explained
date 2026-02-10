"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
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

export function DecisionBoundaryExplorer() {
  const [w1, setW1] = useState(5);
  const [w2, setW2] = useState(5);
  const [bias, setBias] = useState(-8);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const reset = useCallback(() => {
    setW1(5);
    setW2(5);
    setBias(-8);
  }, []);

  function toSvg(v: number): number {
    return PAD + v * PLOT_SIZE;
  }

  function fromSvg(sv: number): number {
    return (sv - PAD) / PLOT_SIZE;
  }

  // Decision boundary: the line where sigmoid(w1*x + w2*y + bias) = 0.5
  // i.e. where w1*x + w2*y + bias = 0
  const boundaryLine = useMemo(() => {
    if (Math.abs(w2) < 0.01 && Math.abs(w1) < 0.01) return null;

    const linePoints: { x: number; y: number }[] = [];
    if (Math.abs(w2) > 0.01) {
      const y0 = -(w1 * -0.2 + bias) / w2;
      const y1 = -(w1 * 1.2 + bias) / w2;
      linePoints.push({ x: -0.2, y: y0 });
      linePoints.push({ x: 1.2, y: y1 });
    } else {
      const x = -bias / w1;
      linePoints.push({ x, y: -0.2 });
      linePoints.push({ x, y: 1.2 });
    }
    return linePoints;
  }, [w1, w2, bias]);

  // Heatmap grid
  const heatmap = useMemo(() => {
    const cells: { x: number; y: number; w: number; h: number; color: string }[] = [];
    const cellSize = PLOT_SIZE / GRID_RES;
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const dataX = (i + 0.5) / GRID_RES;
        const dataY = 1 - (j + 0.5) / GRID_RES;
        const z = w1 * dataX + w2 * dataY + bias;
        const out = sigmoid(z);
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
  }, [w1, w2, bias]);

  // Point outputs
  const pointOutputs = useMemo(() => {
    return POINTS.map(([x, y]) => sigmoid(w1 * x + w2 * y + bias));
  }, [w1, w2, bias]);

  // Gate check
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

  const handlePointerDown = useCallback(() => setDragging(true), []);
  const handlePointerUp = useCallback(() => setDragging(false), []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = SVG_SIZE / rect.width;
      const scaleY = SVG_SIZE / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      const dataX = fromSvg(sx);
      const dataY = 1 - fromSvg(sy);

      // Move the boundary so its midpoint passes through the dragged point
      // sigmoid = 0.5 when w1*x + w2*y + bias = 0
      const newBias = -(w1 * dataX + w2 * dataY);
      setBias(Math.max(-30, Math.min(30, newBias)));
    },
    [dragging, w1, w2]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const angle = Math.atan2(w2, w1);
      const mag = Math.sqrt(w1 * w1 + w2 * w2);
      const newAngle = angle + e.deltaY * 0.005;
      setW1(Math.max(-30, Math.min(30, mag * Math.cos(newAngle))));
      setW2(Math.max(-30, Math.min(30, mag * Math.sin(newAngle))));
    },
    [w1, w2]
  );

  return (
    <WidgetContainer
      title="Decision Boundary Explorer"
      description="Drag to move the line, scroll to rotate it. Try to solve each operation."
      onReset={reset}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full max-w-[350px] cursor-move rounded-lg border border-border"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            onWheel={handleWheel}
          >
            {/* Heatmap */}
            {heatmap.map((cell, i) => (
              <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill={cell.color} />
            ))}

            {/* Axis labels */}
            <text x={PAD + PLOT_SIZE / 2} y={SVG_SIZE - 8} textAnchor="middle" className="fill-muted text-[10px]">
              A
            </text>
            <text x={10} y={PAD + PLOT_SIZE / 2} textAnchor="middle" className="fill-muted text-[10px]" transform={`rotate(-90, 10, ${PAD + PLOT_SIZE / 2})`}>
              B
            </text>

            {/* Decision boundary line */}
            {boundaryLine && (
              <line
                x1={toSvg(boundaryLine[0].x)}
                y1={toSvg(1 - boundaryLine[0].y)}
                x2={toSvg(boundaryLine[1].x)}
                y2={toSvg(1 - boundaryLine[1].y)}
                stroke="white"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                opacity={0.9}
              />
            )}

            {/* Data points */}
            {POINTS.map(([x, y], i) => {
              const out = pointOutputs[i];
              return (
                <g key={i}>
                  <circle
                    cx={toSvg(x)}
                    cy={toSvg(1 - y)}
                    r={14}
                    fill={out > 0.5 ? "#fb923c" : "#3b82f6"}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={toSvg(x)}
                    y={toSvg(1 - y) + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-bold fill-white pointer-events-none"
                  >
                    {out.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Corner labels */}
            {POINTS.map(([x, y], i) => (
              <text
                key={`label-${i}`}
                x={toSvg(x) + (x === 0 ? -18 : 18)}
                y={toSvg(1 - y) + (y === 0 ? 16 : -12)}
                textAnchor="middle"
                className="fill-foreground/40 text-[9px] font-mono pointer-events-none"
              >
                ({x},{y})
              </text>
            ))}
          </svg>
        </div>

        {/* Challenge panel */}
        <div className="lg:w-44">
          <div className="text-xs font-semibold text-foreground mb-3">Challenges</div>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(GATE_TARGETS) as GateName[]).map((gate) => {
              const status = gatesSolved[gate];
              return (
                <div
                  key={gate}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
                    status === "impossible"
                      ? "bg-error/10 text-error/70"
                      : status
                        ? "bg-success/10 text-success"
                        : "bg-foreground/5 text-muted"
                  }`}
                >
                  {status === "impossible" ? "✗" : status ? "✓" : "○"} {gate}
                  {status === "impossible" && (
                    <span className="ml-auto text-[10px]">impossible</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-[10px] text-muted leading-relaxed">
            The dashed white line is the <strong>decision boundary</strong> — the 50/50 point. On the orange side, the neuron outputs near 1 (true). On the blue side, near 0 (false).
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
