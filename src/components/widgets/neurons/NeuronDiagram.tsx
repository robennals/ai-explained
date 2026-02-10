"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

/**
 * Static diagram showing the general structure of a neuron:
 * many inputs → weights → sum + bias → activation function → output
 */

const W = 580;
const H = 220;

// Sigmoid curve points for the activation function shape
function sigmoidPts(cx: number, cy: number, w: number, h: number, n: number = 60): string {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = cx - w / 2 + t * w;
    const xNorm = (t - 0.5) * 8; // range -4 to 4
    const sig = 1 / (1 + Math.exp(-xNorm));
    const y = cy + h / 2 - sig * h;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

export function NeuronDiagram() {
  const inputCount = 5;
  const inputSpacing = 32;
  const inputStartY = H / 2 - ((inputCount - 1) * inputSpacing) / 2;

  const sumCx = 200;
  const sumCy = H / 2;
  const actCx = 370;
  const actCy = H / 2;
  const outCx = 510;

  return (
    <WidgetContainer title="The Artificial Neuron" description="Every neuron in every neural network follows this pattern">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Diagram of an artificial neuron">
        <defs>
          <marker id="nd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Input nodes */}
        {Array.from({ length: inputCount }, (_, i) => {
          const y = inputStartY + i * inputSpacing;
          const isEllipsis = i === 3;
          if (isEllipsis) {
            return (
              <g key={i}>
                <text x={40} y={y + 2} textAnchor="middle" className="fill-muted text-[14px]">...</text>
              </g>
            );
          }
          const label = i === 0 ? "A" : i === 1 ? "B" : i === 2 ? "C" : "N";
          const wLabel = i === 0 ? "wA" : i === 1 ? "wB" : i === 2 ? "wC" : "wN";
          return (
            <g key={i}>
              <circle cx={40} cy={y} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="1.5" />
              <text x={40} y={y + 4} textAnchor="middle" className="fill-foreground text-[11px] font-medium">{label}</text>
              {/* Weight arrow */}
              <line x1={56} y1={y} x2={sumCx - 26} y2={sumCy} stroke="#9ca3af" strokeWidth="1.2" markerEnd="url(#nd-arrow)" />
              {/* Weight label */}
              <text
                x={56 + (sumCx - 26 - 56) * 0.4}
                y={y + (sumCy - y) * 0.4 - 5}
                textAnchor="middle"
                className="fill-muted text-[8px] font-mono"
              >
                {wLabel}
              </text>
            </g>
          );
        })}

        {/* Sum node */}
        <circle cx={sumCx} cy={sumCy} r={24} fill="#fef9ee" stroke="#f59e0b" strokeWidth="1.5" />
        <text x={sumCx} y={sumCy - 4} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">weighted</text>
        <text x={sumCx} y={sumCy + 8} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">sum</text>

        {/* Bias */}
        <line x1={sumCx} y1={sumCy + 38} x2={sumCx} y2={sumCy + 26} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#nd-arrow)" />
        <text x={sumCx} y={sumCy + 52} textAnchor="middle" className="fill-muted text-[9px]">+ bias</text>

        {/* Arrow to activation */}
        <line x1={sumCx + 26} y1={sumCy} x2={actCx - 52} y2={sumCy} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#nd-arrow)" />

        {/* Activation function box with sigmoid curve inside */}
        <rect x={actCx - 48} y={actCy - 32} width={96} height={64} rx={8} fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
        <text x={actCx} y={actCy - 38} textAnchor="middle" className="fill-success text-[8px] font-semibold uppercase tracking-wider">Activation</text>
        {/* Sigmoid curve inside the box */}
        <path d={sigmoidPts(actCx, actCy, 72, 44)} fill="none" stroke="#10b981" strokeWidth="2" />
        {/* Axis lines inside box */}
        <line x1={actCx - 36} y1={actCy} x2={actCx + 36} y2={actCy} stroke="#10b981" strokeWidth="0.5" opacity={0.3} />

        {/* Arrow to output */}
        <line x1={actCx + 50} y1={actCy} x2={outCx - 20} y2={actCy} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#nd-arrow)" />

        {/* Output node */}
        <circle cx={outCx} cy={actCy} r={18} fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
        <text x={outCx} y={actCy + 4} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">out</text>

        {/* Label below */}
        <text x={40} y={H - 6} textAnchor="middle" className="fill-muted text-[9px]">Inputs</text>
        <text x={sumCx} y={H - 6} textAnchor="middle" className="fill-muted text-[9px]">Sum</text>
        <text x={actCx} y={H - 6} textAnchor="middle" className="fill-muted text-[9px]">Activation</text>
        <text x={outCx} y={H - 6} textAnchor="middle" className="fill-muted text-[9px]">Output</text>
      </svg>
    </WidgetContainer>
  );
}
