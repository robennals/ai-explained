"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

/**
 * Log-scale bar chart comparing connection counts:
 * - Biological brains: synapses (each one is like a weight)
 * - AI models: parameters (weights + biases)
 */

interface Entry {
  label: string;
  count: number;
  type: "bio" | "ai";
}

// All values are in "connections" — synapses for biology, parameters for AI
// Exact parameter counts for GPT-5, Gemini, and Claude are not disclosed,
// so we show estimated ranges based on public reporting.
const DATA: Entry[] = [
  { label: "C. elegans (worm)", count: 7_600, type: "bio" },
  { label: "Fruit fly", count: 50_000_000, type: "bio" },
  { label: "Honeybee", count: 1_000_000_000, type: "bio" },
  { label: "Mouse", count: 1_000_000_000_000, type: "bio" },
  { label: "GPT-3 (2020)", count: 175_000_000_000, type: "ai" },
  { label: "GPT-5 (2025, est.)", count: 2_000_000_000_000, type: "ai" },
  { label: "Human brain", count: 100_000_000_000_000, type: "bio" },
  { label: "Elephant", count: 300_000_000_000_000, type: "bio" },
  { label: "Sperm whale", count: 500_000_000_000_000, type: "bio" },
];

function formatCount(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(n >= 10_000_000_000_000 ? 0 : 1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const BAR_H = 26;
const GAP = 6;
const LABEL_W = 160;
const COUNT_W = 60;
const BAR_MAX_W = 280;

export function NeuronScaleComparison() {
  const maxLog = Math.log10(Math.max(...DATA.map((d) => d.count)));
  const minLog = Math.log10(Math.min(...DATA.map((d) => d.count)));
  const totalH = DATA.length * (BAR_H + GAP) - GAP + 24;
  const svgW = LABEL_W + BAR_MAX_W + COUNT_W + 10;

  return (
    <WidgetContainer
      title="How Big Are Neural Networks?"
      description="Comparing brains and AI models by number of connections"
    >
      <svg viewBox={`0 0 ${svgW} ${totalH}`} className="w-full max-w-[600px]">
        {DATA.map((entry, i) => {
          const y = i * (BAR_H + GAP);
          const logVal = Math.log10(entry.count);
          const barW = ((logVal - minLog) / (maxLog - minLog)) * BAR_MAX_W;
          const color = entry.type === "bio" ? "#3b82f6" : "#f59e0b";
          const bgColor = entry.type === "bio" ? "#3b82f620" : "#f59e0b20";

          return (
            <g key={i}>
              {/* Label */}
              <text
                x={LABEL_W - 8}
                y={y + BAR_H / 2 + 1}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-foreground text-[10px]"
              >
                {entry.label}
              </text>
              {/* Bar background */}
              <rect
                x={LABEL_W}
                y={y + 2}
                width={BAR_MAX_W}
                height={BAR_H - 4}
                rx={4}
                fill={bgColor}
              />
              {/* Bar */}
              <rect
                x={LABEL_W}
                y={y + 2}
                width={Math.max(4, barW)}
                height={BAR_H - 4}
                rx={4}
                fill={color}
                opacity={0.8}
              />
              {/* Count label */}
              <text
                x={LABEL_W + BAR_MAX_W + 6}
                y={y + BAR_H / 2 + 1}
                dominantBaseline="middle"
                className="fill-muted text-[9px] font-mono"
              >
                {formatCount(entry.count)}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <g transform={`translate(${LABEL_W}, ${totalH - 16})`}>
          <rect x={0} y={0} width={10} height={10} rx={2} fill="#3b82f6" opacity={0.8} />
          <text x={14} y={8} className="fill-muted text-[8px]">Biological synapses</text>
          <rect x={120} y={0} width={10} height={10} rx={2} fill="#f59e0b" opacity={0.8} />
          <text x={134} y={8} className="fill-muted text-[8px]">AI parameters (weights)</text>
        </g>
      </svg>
      <div className="mt-2 text-[10px] text-muted leading-relaxed">
        Connections: synapses for brains, parameters for AI. Scale is logarithmic — each step is 10× larger.
      </div>
    </WidgetContainer>
  );
}
