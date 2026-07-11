"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { softmax } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Realistic examples. Each token carries a made-up match score for   */
/*  the asker's query; softmax turns those into attention percentages. */
/* ------------------------------------------------------------------ */

interface Example {
  id: string;
  label: string;
  words: string[];
  /** Index of the token doing the looking. */
  asker: number;
  /** The query the asker is looking for, in words. */
  query: string;
  /** Match score of the asker's query against each token (asker's own = 0). */
  scores: number[];
  /** What the reader should take away. */
  note: string;
}

const EXAMPLES: Example[] = [
  {
    id: "split",
    label: "A split",
    words: ["Sam", "told", "Alex", "that", "he", "had", "won", "."],
    asker: 4,
    query: "a person who was just mentioned",
    scores: [5, 1, 5, 1, 0, 1, 2, 1],
    note: '"he" could be Sam or Alex. Both are people just mentioned, so they score the same, and attention splits evenly between them.',
  },
  {
    id: "winner",
    label: "A clear winner",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", "."],
    asker: 5,
    query: "the thing being talked about",
    scores: [1, 2, 1, 6, 1, 0, 2, 1],
    note: '"glass" is the one clear answer, so it takes almost all of the attention. The rest is spread thinly across the others.',
  },
];

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(0)}%`;
}

export function AttentionSoftmax() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [magnitude, setMagnitude] = useState(1);

  const example = EXAMPLES[exampleIdx];

  const handleReset = useCallback(() => {
    setExampleIdx(0);
    setMagnitude(1);
  }, []);

  const handleTab = useCallback((id: string) => {
    setExampleIdx(EXAMPLES.findIndex((e) => e.id === id));
    setMagnitude(1);
  }, []);

  // Softmax over every token except the asker, using scores scaled by magnitude.
  const others = example.words.map((_, i) => i).filter((i) => i !== example.asker);
  const scaled = others.map((i) => example.scores[i] * magnitude);
  const weights = softmax(scaled);
  const weightByIndex = new Map<number, number>();
  others.forEach((i, k) => weightByIndex.set(i, weights[k]));
  const maxWeight = Math.max(...weights);

  const tabs = EXAMPLES.map((e) => ({ id: e.id, label: e.label }));

  return (
    <WidgetContainer
      title="Softmax: Dividing Attention"
      description="Turn each token's match score into a share of the asker's attention. The shares always add up to 100%."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        <WidgetTabs tabs={tabs} activeTab={example.id} onTabChange={handleTab} />

        <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-accent">
            &ldquo;{example.words[example.asker]}&rdquo; is looking for
          </div>
          <div className="text-foreground">{example.query}</div>
        </div>

        {/* Magnitude control */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Query strength
          </span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={magnitude}
            onChange={(e) => setMagnitude(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Query strength"
          />
          <span className="w-10 text-right font-mono text-sm font-bold text-accent">{magnitude}×</span>
        </div>

        {/* Tokens with attention bars */}
        <div className="flex flex-col gap-1.5">
          {example.words.map((word, i) => {
            if (i === example.asker) {
              return (
                <div key={i} className="flex items-center gap-3 rounded-md bg-accent/5 px-3 py-1.5">
                  <span className="w-24 shrink-0 truncate font-semibold text-accent">{word}</span>
                  <span className="text-xs text-muted">is doing the looking</span>
                </div>
              );
            }
            const w = weightByIndex.get(i) ?? 0;
            const isTop = w >= maxWeight - 0.001 && w > 0.02;
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-1">
                <span className="w-24 shrink-0 truncate text-foreground">{word}</span>
                <span className="w-14 shrink-0 text-right font-mono text-xs text-muted">
                  score {example.scores[i]}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-foreground/5">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${isTop ? "bg-accent" : "bg-foreground/25"}`}
                    style={{ width: `${Math.max(w * 100, 0)}%` }}
                  />
                </div>
                <span
                  className={`w-12 shrink-0 text-right font-mono text-sm font-bold ${isTop ? "text-accent" : "text-muted"}`}
                >
                  {pct(w)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {example.note} Raise the query strength and watch the leftover attention on the weaker tokens shrink away.
        </div>
      </div>
    </WidgetContainer>
  );
}
