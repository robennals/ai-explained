"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Number of dimension pairs — enough for clean, realistic curves */
const NUM_PAIRS = 16;
const WINDOW_SIZE = 100;

/** Geometric series from 30°/pos (fastest) to 1°/pos (slowest) */
const SPEEDS = Array.from({ length: NUM_PAIRS }, (_, i) => {
  const fastest = 30;
  const slowest = 1;
  const ratio = Math.pow(slowest / fastest, 1 / (NUM_PAIRS - 1));
  return fastest * Math.pow(ratio, i);
});

/** Colors interpolated from red (fast) to blue (slow) */
function pairColor(i: number): string {
  const t = i / (NUM_PAIRS - 1);
  // Red → orange → blue
  const r = Math.round(239 * (1 - t) + 59 * t);
  const g = Math.round(68 * (1 - t) + 130 * t);
  const b = Math.round(68 * (1 - t) + 246 * t);
  return `rgb(${r},${g},${b})`;
}

/* ------------------------------------------------------------------ */
/*  Presets (all verified by simulation to be smooth / wiggle-free)    */
/* ------------------------------------------------------------------ */

interface Preset {
  id: string;
  label: string;
  description: string;
  weights: number[];
}


const PRESETS: Preset[] = [
  // --- First three: same shape, different distances ---
  {
    id: "close",
    label: "Close focus",
    description:
      "All 16 pairs at equal weight. The many overlapping frequencies cancel each other's oscillations, leaving a sharp spike that drops to zero within 3–4 positions. Zeroing the fastest pairs (next tabs) widens this window.",
    weights: SPEEDS.map(() => 1.0),
  },
  {
    id: "medium",
    label: "Medium focus",
    description:
      "The eight fastest pairs are zeroed out. Without their rapid oscillation, the combined peak is wider — attention stays significant for about 20 positions. Same shape as \"Close focus,\" just stretched out. The model controls its attention range simply by choosing which speed pairs to use.",
    weights: SPEEDS.map((_, i) => (i >= 8 ? 1.0 : 0.0)),
  },
  {
    id: "wide",
    label: "Wide focus",
    description:
      "Only the two slowest pairs are active. These rotate so slowly that attention is spread nearly evenly across 40+ positions. Compare all three tabs: same idea, but zeroing out more fast pairs widens the window from 4 to 15 to 40+ positions.",
    weights: SPEEDS.map((_, i) => (i >= 14 ? 1.0 : 0.0)),
  },
  // --- Different shapes at similar range ---
  {
    id: "fast-medium",
    label: "Sharper medium",
    description:
      "Roughly the same attention window as \"Medium focus,\" but with a steeper dropoff. A fast pair and a couple of medium pairs are mixed in with the slow ones, adding a sharper initial peak without changing where attention fades to zero. Compare the two: same range, different shape.",
    weights: SPEEDS.map((_, i) => {
      if (i === 0) return 0.5;
      if (i === 5 || i === 7) return 0.5;
      if (i >= 8) return 1.0;
      return 0;
    }),
  },
  {
    id: "two-stage",
    label: "Two-stage dropoff",
    description:
      "A mix of medium-speed and very slow pairs. The medium pairs create an initial fast drop over the first 10 positions, then the two slowest pairs hold attention at a steady floor for the next 30+ positions before it finally fades. This \"fast then flat then slow\" shape lets a token pay close attention nearby while still keeping a broad awareness of the wider context — useful for words that need both local grammar and long-range meaning.",
    weights: SPEEDS.map((_, i) => {
      if (i === 4) return 0.3;
      if (i === 5) return 0.3;
      if (i === 6) return 0.2;
      if (i === 7) return 0.55;
      if (i >= 14) return 1.0;
      return 0;
    }),
  },
];

const TABS = PRESETS.map((p) => ({ id: p.id, label: p.label }));

/* ------------------------------------------------------------------ */
/*  Math                                                               */
/* ------------------------------------------------------------------ */

function rawScore(distance: number, weights: number[]): number {
  return weights.reduce(
    (sum, w, i) =>
      sum + w * w * Math.cos((distance * SPEEDS[i] * Math.PI) / 180),
    0
  );
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RoPEMultiSpeed() {
  const [activeTab, setActiveTab] = useState(PRESETS[0].id);
  const [weights, setWeights] = useState<number[]>([...PRESETS[0].weights]);
  const [isCustom, setIsCustom] = useState(false);

  const handleReset = useCallback(() => {
    setActiveTab(PRESETS[0].id);
    setWeights([...PRESETS[0].weights]);
    setIsCustom(false);
  }, []);

  const handleTabChange = useCallback((id: string) => {
    const p = PRESETS.find((pr) => pr.id === id);
    if (!p) return;
    setActiveTab(id);
    setWeights([...p.weights]);
    setIsCustom(false);
  }, []);

  const setWeight = useCallback((index: number, value: number) => {
    setWeights((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setIsCustom(true);
  }, []);

  // Continuous curve (every 0.5 positions)
  const curvePoints = useMemo(() => {
    const pts: { d: number; score: number }[] = [];
    for (let d = 0; d <= WINDOW_SIZE; d += 0.5) {
      pts.push({ d, score: rawScore(d, weights) });
    }
    return pts;
  }, [weights]);

  // Discrete bar scores (integer positions)
  const barScores = useMemo(
    () => Array.from({ length: WINDOW_SIZE + 1 }, (_, d) => rawScore(d, weights)),
    [weights]
  );
  const barWeights = useMemo(() => softmax(barScores), [barScores]);

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 260;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;

  // Curve scale
  const curveMin = useMemo(() => Math.min(...curvePoints.map((p) => p.score)), [curvePoints]);
  const curveMax = useMemo(() => Math.max(...curvePoints.map((p) => p.score)), [curvePoints]);
  const curveRange = Math.max(curveMax - curveMin, 0.01);

  const curvePath = useMemo(() => {
    return curvePoints
      .map((p, i) => {
        const x = pad.left + (p.d / WINDOW_SIZE) * plotW;
        const y = pad.top + plotH - ((p.score - curveMin) / curveRange) * plotH;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [curvePoints, plotW, plotH, curveMin, curveRange, pad.left, pad.top]);

  // Per-pair contribution curves (faint)
  const pairCurves = useMemo(() => {
    return SPEEDS.map((spd, i) => {
      const w = weights[i];
      if (w < 0.01) return null; // skip invisible pairs
      const pts: string[] = [];
      for (let d = 0; d <= WINDOW_SIZE; d += 0.5) {
        const score = w * w * Math.cos((d * spd * Math.PI) / 180);
        const x = pad.left + (d / WINDOW_SIZE) * plotW;
        const y = pad.top + plotH - ((score - curveMin) / curveRange) * plotH;
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x} ${y}`);
      }
      return pts.join(" ");
    });
  }, [weights, plotW, plotH, curveMin, curveRange, pad.left, pad.top]);

  // Bar chart
  const barChartH = 100;
  const barTotalH = barChartH + 30;
  const maxBarWeight = useMemo(() => Math.max(...barWeights), [barWeights]);

  // Description
  const activePreset = PRESETS.find((p) => p.id === activeTab);
  const description = isCustom
    ? "Custom configuration — adjust the sliders to explore different attention shapes."
    : activePreset?.description ?? "";

  return (
    <WidgetContainer
      title="Mixing Rotation Speeds"
      description="Combine fast and slow rotation pairs to shape how attention falls off with distance"
      onReset={handleReset}
    >
      <WidgetTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex flex-col gap-5">
        {/* Pair weight sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {SPEEDS.map((spd, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: pairColor(i) }}
              />
              <div className="flex-1">
                <SliderControl
                  label={
                    <span className="text-[10px]">
                      Pair {i + 1}{" "}
                      <span className="text-muted">
                        ({spd.toFixed(1)}°/pos)
                      </span>
                    </span>
                  }
                  value={weights[i]}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setWeight(i, v)}
                  formatValue={(v) => v.toFixed(2)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Continuous curve */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Raw dot-product score vs distance
          </div>
          <div className="flex justify-center">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full max-w-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Zero line */}
              {curveMin < 0 && curveMax > 0 && (
                <line
                  x1={pad.left}
                  y1={pad.top + plotH - ((0 - curveMin) / curveRange) * plotH}
                  x2={pad.left + plotW}
                  y2={pad.top + plotH - ((0 - curveMin) / curveRange) * plotH}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  opacity={0.2}
                  strokeDasharray="4 3"
                />
              )}

              {/* Y gridlines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                const val = curveMin + frac * curveRange;
                const y = pad.top + plotH - frac * plotH;
                return (
                  <g key={frac}>
                    <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="currentColor" strokeWidth={0.5} opacity={0.08} />
                    <text x={pad.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="currentColor" opacity={0.35}>
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Per-pair curves (faint) */}
              {pairCurves.map((path, i) =>
                path ? (
                  <path key={i} d={path} fill="none" stroke={pairColor(i)} strokeWidth={1} opacity={0.25} />
                ) : null
              )}

              {/* Combined curve */}
              <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} />

              {/* X-axis */}
              <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="currentColor" strokeWidth={1} opacity={0.15} />
              <text x={pad.left + plotW / 2} y={chartHeight - 4} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.4}>
                Distance (positions apart)
              </text>
              {Array.from({ length: 6 }, (_, i) => {
                const d = Math.round((WINDOW_SIZE / 5) * i);
                const x = pad.left + (d / WINDOW_SIZE) * plotW;
                return (
                  <text key={d} x={x} y={pad.top + plotH + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>{d}</text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Discrete attention bars */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Attention weight after softmax (per position)
          </div>
          <div className="flex justify-center">
            <svg
              viewBox={`0 0 ${chartWidth} ${barTotalH}`}
              className="w-full max-w-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              {Array.from({ length: WINDOW_SIZE + 1 }, (_, d) => {
                const x = pad.left + (d / WINDOW_SIZE) * plotW;
                const bw = Math.max(plotW / (WINDOW_SIZE + 1) - 0.5, 0.8);
                const h = maxBarWeight > 0 ? (barWeights[d] / maxBarWeight) * barChartH : 0;
                const y = barChartH - h;
                return (
                  <rect key={d} x={x - bw / 2} y={y} width={bw} height={h} rx={Math.min(bw / 2, 1.5)} fill="#3b82f6" opacity={0.7} />
                );
              })}
              <line x1={pad.left} y1={barChartH} x2={pad.left + plotW} y2={barChartH} stroke="currentColor" strokeWidth={1} opacity={0.15} />
              {Array.from({ length: 6 }, (_, i) => {
                const d = Math.round((WINDOW_SIZE / 5) * i);
                const x = pad.left + (d / WINDOW_SIZE) * plotW;
                return (
                  <text key={d} x={x} y={barChartH + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>{d}</text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {description}
        </div>
      </div>
    </WidgetContainer>
  );
}
