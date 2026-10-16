"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useSvgFontSize } from "../shared/useSvgScale";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

const CURVE_W = 420;
const CURVE_H = 220;

export function SharpnessExplorer() {
  const [sharpness, setSharpness] = useState(10.0);
  const svgRef = useRef<SVGSVGElement>(null);
  const fontSize = useSvgFontSize(svgRef, CURVE_W);

  // Base weight and bias for 1D: boundary at x=0.5
  const baseW = 1;
  const baseBias = -0.5;
  const w1d = baseW * sharpness;
  const b1d = baseBias * sharpness;

  const reset = useCallback(() => setSharpness(10.0), []);

  // 1D curve points
  const curvePoints: string[] = [];
  const padX = 40;
  const padTop = 10;
  // Grows with the text on phones so the tick labels and "input" both fit.
  const padBot = 30 + 2 * (fontSize(9) - 9);
  const plotW = CURVE_W - padX - 10;
  const plotH = CURVE_H - padTop - padBot;
  // Baseline of the x-axis tick labels, kept clear of the axis as text grows.
  const xTickY = padTop + plotH + 7 + fontSize(9);
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const y = sigmoid(w1d * x + b1d);
    const px = padX + x * plotW;
    const py = padTop + (1 - y) * plotH;
    curvePoints.push(`${px},${py}`);
  }

  return (
    <WidgetContainer
      title="Sharp vs. Smooth"
      description="Scaling all weights and bias together controls how sharp the transition is."
      onReset={reset}
    >
      <div className="flex flex-col gap-4">
        {/* Sharpness slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-foreground shrink-0">Sharpness</span>
          <input
            type="range"
            min={0.2}
            max={100}
            step={0.1}
            value={sharpness}
            onChange={(e) => setSharpness(parseFloat(e.target.value))}
            className="flex-1 h-1.5 accent-accent"
          />
          <span className="text-[12px] font-mono font-bold text-foreground w-10 text-right">{sharpness.toFixed(1)}</span>
        </div>

        {/* 1D sigmoid curve */}
        <div className="flex justify-center">
          <div className="w-full" style={{ maxWidth: CURVE_W + 2 }}>
            <div className="text-[11px] font-medium text-muted mb-1">
              sigmoid(input) &mdash; weight={w1d.toFixed(1)}, bias={b1d.toFixed(1)}
            </div>
            {/* Border on a wrapper (2px wider, above), so the SVG's own width is
                exactly its drawing width and its text-size scaling comes out right. */}
            <div className="overflow-hidden rounded-lg border border-border bg-foreground/[0.03]">
              <svg ref={svgRef} viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} className="block w-full">
                {/* Grid lines */}
                <line x1={padX} y1={padTop} x2={padX} y2={padTop + plotH} stroke="#e5e7eb" strokeWidth="1" />
                <line x1={padX} y1={padTop + plotH} x2={padX + plotW} y2={padTop + plotH} stroke="#e5e7eb" strokeWidth="1" />
                {/* 0.5 horizontal line */}
                <line x1={padX} y1={padTop + plotH * 0.5} x2={padX + plotW} y2={padTop + plotH * 0.5} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />
                {/* Boundary vertical at x=0.5 */}
                <line x1={padX + plotW * 0.5} y1={padTop} x2={padX + plotW * 0.5} y2={padTop + plotH} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" opacity={0.4} />
                {/* Axis labels */}
                <text x={padX - 4} y={padTop + 4} textAnchor="end" fontSize={fontSize(9)} className="fill-muted">1</text>
                <text x={padX - 4} y={padTop + plotH * 0.5 + 3} textAnchor="end" fontSize={fontSize(9)} className="fill-muted">0.5</text>
                <text x={padX - 4} y={padTop + plotH + 4} textAnchor="end" fontSize={fontSize(9)} className="fill-muted">0</text>
                <text x={padX} y={xTickY} textAnchor="middle" fontSize={fontSize(9)} className="fill-muted">0</text>
                <text x={padX + plotW * 0.5} y={xTickY} textAnchor="middle" fontSize={fontSize(9)} className="fill-muted">0.5</text>
                <text x={padX + plotW} y={xTickY} textAnchor="middle" fontSize={fontSize(9)} className="fill-muted">1</text>
                <text x={padX + plotW / 2} y={CURVE_H - 2} textAnchor="middle" fontSize={fontSize(9)} className="fill-muted">input</text>
                {/* Curve */}
                <polyline
                  points={curvePoints.join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
