"use client";

import { useState } from "react";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const W = 360;
const H = 160;
const PAD_L = 36;
const PAD_R = 50;
const PAD_T = 14;
const PAD_B = 24;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const X_MIN = -8;
const X_MAX = 8;

function toSvgX(x: number): number {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function toSvgY(y: number): number {
  return PAD_T + (1 - y) * PLOT_H;
}

// Pre-compute the curve path
const CURVE_PTS: string[] = [];
for (let i = 0; i <= 120; i++) {
  const x = X_MIN + (X_MAX - X_MIN) * (i / 120);
  const y = sigmoid(x);
  CURVE_PTS.push(`${i === 0 ? "M" : "L"}${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
}
const CURVE_PATH = CURVE_PTS.join(" ");

export function SigmoidExplorer() {
  const [input, setInput] = useState(0);
  const output = sigmoid(input);

  const dotX = toSvgX(input);
  const dotY = toSvgY(output);

  return (
    <div className="not-prose my-6 rounded-xl border border-border bg-surface p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px]">
        {/* Grid lines */}
        <line x1={PAD_L} y1={toSvgY(0.5)} x2={PAD_L + PLOT_W} y2={toSvgY(0.5)} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1={toSvgX(0)} y1={PAD_T} x2={toSvgX(0)} y2={PAD_T + PLOT_H} stroke="#e5e7eb" strokeWidth="0.5" />
        {/* Axes */}
        <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={PAD_L + PLOT_W} y2={PAD_T + PLOT_H} stroke="#d1d5db" strokeWidth="1" />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + PLOT_H} stroke="#d1d5db" strokeWidth="1" />
        {/* Y labels */}
        <text x={PAD_L - 4} y={toSvgY(1) + 4} textAnchor="end" className="fill-muted text-[9px]">1</text>
        <text x={PAD_L - 4} y={toSvgY(0.5) + 3} textAnchor="end" className="fill-muted text-[9px]">0.5</text>
        <text x={PAD_L - 4} y={toSvgY(0) + 3} textAnchor="end" className="fill-muted text-[9px]">0</text>
        {/* X label */}
        <text x={PAD_L + PLOT_W / 2} y={H - 2} textAnchor="middle" className="fill-muted text-[9px]">input</text>
        {/* Sigmoid curve */}
        <path d={CURVE_PATH} fill="none" stroke="#10b981" strokeWidth="2.5" />
        {/* Crosshairs to operating point */}
        <line x1={dotX} y1={PAD_T + PLOT_H} x2={dotX} y2={dotY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
        <line x1={PAD_L} y1={dotY} x2={dotX} y2={dotY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
        {/* Dot */}
        <circle cx={dotX} cy={dotY} r={6} fill="#f59e0b" stroke="white" strokeWidth="2" />
        {/* Output value label */}
        <text x={PAD_L + PLOT_W + 8} y={dotY + 4} className="fill-foreground text-[12px] font-bold font-mono">
          {output.toFixed(2)}
        </text>
        <text x={PAD_L + PLOT_W + 8} y={dotY + 16} className="fill-muted text-[8px]">output</text>
      </svg>
      <div className="mt-1 flex items-center gap-3 max-w-[420px]">
        <span className="text-xs text-muted w-16 text-right shrink-0">input: <span className="font-mono font-bold text-foreground">{input.toFixed(1)}</span></span>
        <input
          type="range"
          min={X_MIN}
          max={X_MAX}
          step={0.1}
          value={input}
          onChange={(e) => setInput(parseFloat(e.target.value))}
          className="flex-1 h-2 accent-success"
        />
      </div>
    </div>
  );
}
