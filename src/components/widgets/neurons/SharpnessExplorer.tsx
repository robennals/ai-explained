"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

const CURVE_W = 420;
const CURVE_H = 220;

export function SharpnessExplorer() {
  const [sharpness, setSharpness] = useState(10.0);

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
  const padBot = 30;
  const plotW = CURVE_W - padX - 10;
  const plotH = CURVE_H - padTop - padBot;
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
          <div>
            <div className="text-[10px] font-medium text-muted mb-1">
              sigmoid(input) &mdash; weight={w1d.toFixed(1)}, bias={b1d.toFixed(1)}
            </div>
            <svg width={CURVE_W} height={CURVE_H} className="bg-foreground/[0.03] rounded-lg border border-border">
              {/* Grid lines */}
              <line x1={padX} y1={padTop} x2={padX} y2={padTop + plotH} stroke="#e5e7eb" strokeWidth="1" />
              <line x1={padX} y1={padTop + plotH} x2={padX + plotW} y2={padTop + plotH} stroke="#e5e7eb" strokeWidth="1" />
              {/* 0.5 horizontal line */}
              <line x1={padX} y1={padTop + plotH * 0.5} x2={padX + plotW} y2={padTop + plotH * 0.5} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />
              {/* Boundary vertical at x=0.5 */}
              <line x1={padX + plotW * 0.5} y1={padTop} x2={padX + plotW * 0.5} y2={padTop + plotH} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" opacity={0.4} />
              {/* Axis labels */}
              <text x={padX - 4} y={padTop + 4} textAnchor="end" className="fill-muted text-[9px]">1</text>
              <text x={padX - 4} y={padTop + plotH * 0.5 + 3} textAnchor="end" className="fill-muted text-[9px]">0.5</text>
              <text x={padX - 4} y={padTop + plotH + 4} textAnchor="end" className="fill-muted text-[9px]">0</text>
              <text x={padX} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted text-[9px]">0</text>
              <text x={padX + plotW * 0.5} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted text-[9px]">0.5</text>
              <text x={padX + plotW} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted text-[9px]">1</text>
              <text x={padX + plotW / 2} y={CURVE_H - 2} textAnchor="middle" className="fill-muted text-[9px]">input</text>
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
    </WidgetContainer>
  );
}
