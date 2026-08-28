"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  The sink as a softmax playground: the same softmax as before, plus  */
/*  one extra row — a "sink" fixed at a modest score. Drag the real     */
/*  tokens' scores. When they are all low, the sink wins; a genuine     */
/*  match easily beats it.                                              */
/* ------------------------------------------------------------------ */

const SINK_SCORE = 3;

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

const LABELS = ["A", "B", "C"];
const COLORS = ["bg-blue-500", "bg-amber-500", "bg-emerald-500"];
const COLORS_LIGHT = [
  "bg-blue-200 dark:bg-blue-800",
  "bg-amber-200 dark:bg-amber-800",
  "bg-emerald-200 dark:bg-emerald-800",
];
const SINK_COLOR = "bg-slate-500";
const SINK_COLOR_LIGHT = "bg-slate-200 dark:bg-slate-700";

interface Preset {
  label: string;
  scores: number[];
  description: string;
}

const PRESETS: Preset[] = [
  {
    label: "Nothing matches",
    scores: [1, 0, 1],
    description:
      "None of the real tokens score above 1, so the sink (fixed at 3) wins most of the attention. Nothing useful gets much weight, which is exactly right when there was nothing to find.",
  },
  {
    label: "Something matches",
    scores: [8, 0, 1],
    description:
      "Token A scores 8, far above the sink's 3. A takes almost all the attention and the sink barely registers.",
  },
];

export function AttentionSink() {
  const [scores, setScores] = useState<number[]>([1, 0, 1]);

  const all = [...scores, SINK_SCORE];
  const weights = softmax(all);
  const maxWeight = Math.max(...weights);
  const sinkWeight = weights[weights.length - 1];

  const handleReset = useCallback(() => setScores([1, 0, 1]), []);

  const handleSlider = (idx: number, val: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const preset = PRESETS.find((p) => p.scores.every((s, i) => Math.abs(s - scores[i]) < 0.01));

  return (
    <WidgetContainer
      title="The Attention Sink"
      description="The same softmax, plus one extra row: a sink with a fixed score. Drag the real tokens' scores. When they are all low the sink wins, but a genuine match easily beats it."
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
            const barPct = Math.max((w / maxWeight) * 100, 2);
            return (
              <div key={i} className="grid grid-cols-[3.5rem_1fr_4rem_1fr] items-center gap-3">
                <span className="text-center font-mono text-sm font-bold text-foreground">{LABELS[i]}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={score}
                    onChange={(e) => handleSlider(i, parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <span className="w-8 text-right font-mono text-xs text-muted">{score.toFixed(1)}</span>
                </div>
                <span className="text-right font-mono text-sm font-bold">{(w * 100).toFixed(1)}%</span>
                <div className={`h-6 rounded ${COLORS_LIGHT[i]}`}>
                  <div
                    className={`h-full rounded ${COLORS[i]} transition-all duration-150`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Fixed sink row */}
          <div className="grid grid-cols-[3.5rem_1fr_4rem_1fr] items-center gap-3 border-t border-border pt-4">
            <span className="text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sink
            </span>
            <div className="flex items-center gap-2 text-xs italic text-muted">fixed at {SINK_SCORE}</div>
            <span className="text-right font-mono text-sm font-bold">{(sinkWeight * 100).toFixed(1)}%</span>
            <div className={`h-6 rounded ${SINK_COLOR_LIGHT}`}>
              <div
                className={`h-full rounded ${SINK_COLOR} transition-all duration-150`}
                style={{ width: `${Math.max((sinkWeight / maxWeight) * 100, 2)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contextual description */}
        {preset && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            {preset.description}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
