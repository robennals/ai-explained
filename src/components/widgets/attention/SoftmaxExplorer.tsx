"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Math                                                              */
/* ------------------------------------------------------------------ */

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Presets                                                           */
/* ------------------------------------------------------------------ */

interface Preset {
  label: string;
  scores: number[];
  description: string;
}

const LABELS = ["A", "B", "C", "D"];
const COLORS = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-purple-500",
];
const COLORS_LIGHT = [
  "bg-blue-200 dark:bg-blue-800",
  "bg-amber-200 dark:bg-amber-800",
  "bg-emerald-200 dark:bg-emerald-800",
  "bg-purple-200 dark:bg-purple-800",
];

const PRESETS: Preset[] = [
  {
    label: "All equal",
    scores: [2, 2, 2, 2],
    description:
      "When all scores are the same, softmax splits weight evenly — 25% each. Nobody is shouting louder than anyone else.",
  },
  {
    label: "Moderate, rest silent",
    scores: [3, 0, 0, 0],
    description:
      "A is only moderately confident, but nobody else is saying anything. A wins by default — it gets most of the weight even though its score isn't huge.",
  },
  {
    label: "Moderate meets loud",
    scores: [3, 8, 0, 0],
    description:
      "A was winning comfortably — but now B is shouting much louder. B drowns out A and takes nearly all the weight. The moderate voice barely registers.",
  },
  {
    label: "Close race",
    scores: [3, 2.5, 2, 0],
    description:
      "A is slightly ahead, but B and C aren't far behind. Softmax spreads weight across all three — no single winner.",
  },
  {
    label: "Two competitors",
    scores: [5, 5, 0, 0],
    description:
      "A and B are tied and both much higher than C and D. Softmax gives them roughly 50% each — a tie at the top.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SoftmaxExplorer() {
  const [scores, setScores] = useState<number[]>([3, 1, 1, 0]);

  const weights = softmax(scores);

  const handleReset = useCallback(() => {
    setScores([3, 1, 1, 0]);
  }, []);

  const handleSlider = (idx: number, val: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const maxWeight = Math.max(...weights);

  return (
    <WidgetContainer
      title="Softmax Explorer"
      description="Drag the sliders to change raw scores and see how softmax converts them into weights."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setScores([...p.scores])}
              className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders + bars */}
        <div className="grid gap-4">
          {scores.map((score, i) => {
            const w = weights[i];
            const barPct = Math.max(w / maxWeight * 100, 2);
            return (
              <div key={i} className="grid grid-cols-[2rem_1fr_4rem_1fr] items-center gap-3">
                {/* Label */}
                <span className="text-center font-mono text-sm font-bold text-foreground">
                  {LABELS[i]}
                </span>

                {/* Slider */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-2}
                    max={10}
                    step={0.5}
                    value={score}
                    onChange={(e) => handleSlider(i, parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <span className="w-8 text-right font-mono text-xs text-muted">
                    {score.toFixed(1)}
                  </span>
                </div>

                {/* Weight */}
                <span className="text-right font-mono text-sm font-bold">
                  {(w * 100).toFixed(1)}%
                </span>

                {/* Bar */}
                <div className={`h-6 rounded ${COLORS_LIGHT[i]}`}>
                  <div
                    className={`h-full rounded ${COLORS[i]} transition-all duration-150`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Formula — shown but not emphasized */}
        <div className="rounded border border-border bg-foreground/[0.02] px-4 py-2.5 text-center">
          <span className="text-xs text-muted">The formula, if you&apos;re curious: </span>
          <span className="font-mono text-xs text-foreground/70">
            weight(i) = e<sup>score(i)</sup> / Σ e<sup>score(j)</sup>
          </span>
        </div>

        {/* Contextual description */}
        {(() => {
          const preset = PRESETS.find(
            (p) => p.scores.every((s, i) => Math.abs(s - scores[i]) < 0.01)
          );
          if (preset) {
            return (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
                {preset.description}
              </div>
            );
          }
          return null;
        })()}
      </div>
    </WidgetContainer>
  );
}
