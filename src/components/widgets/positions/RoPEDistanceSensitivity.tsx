"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface Pair {
  label: string;
  speed: number;
  color: string;
}

const PAIRS: Pair[] = [
  { label: "Fast pair", speed: 30, color: "#ef4444" },   // red
  { label: "Medium pair", speed: 10, color: "#f59e0b" }, // amber
  { label: "Slow pair", speed: 2, color: "#3b82f6" },    // blue
];

const DISTANCES = [1, 2, 3, 5, 10, 20];

type PairWeights = [number, number, number];

const PRESET_SENSITIVE: PairWeights = [1.0, 0.1, 0.1];
const PRESET_INSENSITIVE: PairWeights = [0.1, 0.1, 1.0];

/* ------------------------------------------------------------------ */
/*  Math                                                               */
/* ------------------------------------------------------------------ */

function computeScores(weights: PairWeights): number[] {
  return DISTANCES.map((d) =>
    PAIRS.reduce(
      (sum, pair, i) =>
        sum + weights[i] * weights[i] * Math.cos((d * pair.speed * Math.PI) / 180),
      0
    )
  );
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Mini circle SVG — shows query vs key angle for one pair            */
/* ------------------------------------------------------------------ */

function MiniCircleSVG({
  pair,
  distance,
}: {
  pair: Pair;
  distance: number;
}) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;

  // Query at angle 0
  const qx = cx + r;
  const qy = cy;

  // Key at angle = distance * speed (counterclockwise in math, clockwise in SVG y-down)
  const keyAngleRad = (distance * pair.speed * Math.PI) / 180;
  const kx = cx + Math.cos(-keyAngleRad) * r;
  const ky = cy + Math.sin(-keyAngleRad) * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Unit circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.5}
        opacity={0.15}
      />
      {/* Query vector (blue) at angle 0 */}
      <line
        x1={cx}
        y1={cy}
        x2={qx}
        y2={qy}
        stroke="#3b82f6"
        strokeWidth={2}
      />
      <circle cx={qx} cy={qy} r={3} fill="#3b82f6" />
      {/* Key vector (green) at rotated angle */}
      <line
        x1={cx}
        y1={cy}
        x2={kx}
        y2={ky}
        stroke="#10b981"
        strokeWidth={2}
      />
      <circle cx={kx} cy={ky} r={3} fill="#10b981" />
      {/* Origin dot */}
      <circle cx={cx} cy={cy} r={2} fill="currentColor" opacity={0.3} />
      {/* Angle label */}
      <text
        x={cx}
        y={size - 4}
        textAnchor="middle"
        fontSize={9}
        fill={pair.color}
        fontWeight="bold"
      >
        {distance * pair.speed}°
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export function RoPEDistanceSensitivity() {
  const [pairWeights, setPairWeights] = useState<PairWeights>([...PRESET_SENSITIVE]);
  const [preset, setPreset] = useState<"sensitive" | "insensitive" | "custom">("sensitive");

  const handleReset = useCallback(() => {
    setPairWeights([...PRESET_SENSITIVE]);
    setPreset("sensitive");
  }, []);

  const setWeight = useCallback(
    (index: number, value: number) => {
      setPairWeights((prev) => {
        const next: PairWeights = [prev[0], prev[1], prev[2]];
        next[index] = value;
        return next;
      });
      setPreset("custom");
    },
    []
  );

  const handlePreset = useCallback((p: "sensitive" | "insensitive") => {
    const weights = p === "sensitive" ? PRESET_SENSITIVE : PRESET_INSENSITIVE;
    setPairWeights([...weights]);
    setPreset(p);
  }, []);

  // Computed values
  const weights = useMemo(() => {
    return softmax(computeScores(pairWeights));
  }, [pairWeights]);

  const maxWeight = useMemo(() => Math.max(...weights), [weights]);

  // Bar chart dimensions
  const chartWidth = 480;
  const chartHeight = 200;
  const chartPadding = { top: 24, right: 20, bottom: 28, left: 40 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const barWidth = plotWidth / DISTANCES.length - 8;

  // Determine dominant pair for custom insight
  const dominantIdx = useMemo(() => {
    let maxIdx = 0;
    for (let i = 1; i < pairWeights.length; i++) {
      if (pairWeights[i] > pairWeights[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }, [pairWeights]);

  return (
    <WidgetContainer
      title="Per-Query Distance Sensitivity"
      description="Different query vectors can have different attention-vs-distance curves depending on which dimension pairs carry the signal"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handlePreset("sensitive")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              preset === "sensitive"
                ? "bg-accent text-white"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Distance-sensitive
          </button>
          <button
            onClick={() => handlePreset("insensitive")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              preset === "insensitive"
                ? "bg-accent text-white"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Distance-insensitive
          </button>
        </div>

        {/* Sliders — one per pair */}
        <div className="flex flex-col gap-3">
          {PAIRS.map((pair, i) => (
            <div key={pair.label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: pair.color }}
              />
              <div className="flex-1">
                <SliderControl
                  label={
                    <span>
                      {pair.label}{" "}
                      <span className="text-[10px] text-muted">
                        ({pair.speed}°/pos)
                      </span>
                    </span>
                  }
                  value={pairWeights[i]}
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

        {/* Mini SVG circles — one per pair showing angle gap at distance=5 */}
        <div className="flex justify-center gap-6">
          {PAIRS.map((pair) => (
            <div key={pair.label} className="flex flex-col items-center gap-1">
              <MiniCircleSVG pair={pair} distance={5} />
              <span className="text-[10px] text-muted">
                <span style={{ color: pair.color }}>{pair.label}</span>
                {" at d=5"}
              </span>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="flex justify-center">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full max-w-lg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Y-axis gridlines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
              const pctLabel = (frac * maxWeight * 100).toFixed(0);
              const yPos =
                chartPadding.top + plotHeight * (1 - frac);
              return (
                <g key={frac}>
                  <line
                    x1={chartPadding.left}
                    y1={yPos}
                    x2={chartPadding.left + plotWidth}
                    y2={yPos}
                    stroke="currentColor"
                    strokeWidth={0.5}
                    opacity={0.1}
                  />
                  <text
                    x={chartPadding.left - 4}
                    y={yPos}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill="currentColor"
                    opacity={0.4}
                  >
                    {pctLabel}%
                  </text>
                </g>
              );
            })}

            {/* X-axis baseline */}
            <line
              x1={chartPadding.left}
              y1={chartPadding.top + plotHeight}
              x2={chartPadding.left + plotWidth}
              y2={chartPadding.top + plotHeight}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.15}
            />

            {/* Bars */}
            {DISTANCES.map((d, i) => {
              const barX =
                chartPadding.left +
                (i * plotWidth) / DISTANCES.length +
                (plotWidth / DISTANCES.length - barWidth) / 2;
              const barH =
                maxWeight > 0
                  ? (weights[i] / maxWeight) * plotHeight
                  : 0;
              const barY = chartPadding.top + plotHeight - barH;
              const pct = (weights[i] * 100).toFixed(1);

              return (
                <g key={d}>
                  {/* Bar */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    rx={3}
                    fill="#3b82f6"
                    opacity={0.75}
                  />
                  {/* Percentage label above bar */}
                  <text
                    x={barX + barWidth / 2}
                    y={barY - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="bold"
                    fill="#3b82f6"
                  >
                    {pct}%
                  </text>
                  {/* Distance label on X-axis */}
                  <text
                    x={barX + barWidth / 2}
                    y={chartPadding.top + plotHeight + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.5}
                  >
                    {d}
                  </text>
                </g>
              );
            })}

            {/* X-axis label */}
            <text
              x={chartPadding.left + plotWidth / 2}
              y={chartHeight - 2}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              opacity={0.4}
            >
              Distance (positions apart)
            </text>
          </svg>
        </div>

        {/* Dynamic insight text */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {preset === "sensitive" ? (
            <>
              Signal concentrated in the <strong style={{ color: PAIRS[0].color }}>fast-rotating pair</strong> — attention drops off sharply with distance. This query strongly prefers nearby tokens.
            </>
          ) : preset === "insensitive" ? (
            <>
              Signal concentrated in the <strong style={{ color: PAIRS[2].color }}>slow-rotating pair</strong> — attention barely changes with distance. This query attends broadly across the whole context.
            </>
          ) : (
            <>
              {pairWeights[dominantIdx] > 0.3 ? (
                <>
                  Signal is strongest in the{" "}
                  <strong style={{ color: PAIRS[dominantIdx].color }}>
                    {PAIRS[dominantIdx].label.toLowerCase()}
                  </strong>{" "}
                  ({PAIRS[dominantIdx].speed}°/pos).{" "}
                  {dominantIdx === 0
                    ? "Faster rotation means attention drops off more quickly with distance — this query prefers nearby tokens."
                    : dominantIdx === 2
                      ? "Slower rotation means the angle difference grows slowly — this query attends more uniformly across positions."
                      : "A moderate rotation speed gives a balanced falloff — this query has a mild preference for nearby tokens."}
                </>
              ) : (
                <>
                  All pair weights are low — the overall signal is weak, so attention is spread relatively evenly across distances.
                </>
              )}
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
