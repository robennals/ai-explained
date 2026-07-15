"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { softmax } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Values: softmax turns match scores into attention percentages,     */
/*  then each token hands over its value weighted by that percentage.  */
/*  The asker ends up with a blend, sharp or mixed depending on the     */
/*  split.                                                             */
/* ------------------------------------------------------------------ */

interface Example {
  id: string;
  label: string;
  words: string[];
  asker: number;
  query: string;
  scores: number[];
  /** Token index → the value that token hands over. */
  values: Record<number, string>;
  result: string;
}

const EXAMPLES: Example[] = [
  {
    id: "winner",
    label: "A clear value",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", "."],
    asker: 5,
    query: "the thing being talked about",
    scores: [1, 2, 1, 8, 1, 0, 2, 1],
    values: { 3: "the glass" },
    result: "the glass",
  },
  {
    id: "split",
    label: "An even split",
    words: ["The", "cat", "and", "the", "dog", "were", "napping", "when", "it", "woke", "up", "."],
    asker: 8,
    query: "the animal being referred to",
    scores: [1, 6, 1, 1, 6, 1, 2, 1, 0, 2, 1, 1],
    values: { 1: "the cat", 4: "the dog" },
    result: "either the cat or the dog",
  },
  {
    id: "lean",
    label: "A leaning blend",
    words: ["The", "cat", "watched", "the", "dog", ",", "and", "then", "it", "pounced", "."],
    asker: 8,
    query: "the animal doing the action",
    scores: [1, 5, 2, 1, 4, 1, 1, 1, 0, 2, 1],
    values: { 1: "the cat", 4: "the dog" },
    result: "probably the cat, maybe the dog",
  },
];

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(0)}%`;
}

export function AttentionValues() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const example = EXAMPLES[exampleIdx];

  const handleReset = useCallback(() => setExampleIdx(0), []);
  const handleTab = useCallback((id: string) => {
    setExampleIdx(EXAMPLES.findIndex((e) => e.id === id));
  }, []);

  const others = example.words.map((_, i) => i).filter((i) => i !== example.asker);
  const weights = softmax(others.map((i) => example.scores[i]));
  const weightByIndex = new Map<number, number>();
  others.forEach((i, k) => weightByIndex.set(i, weights[k]));

  // Tokens whose value makes a real contribution to the blend.
  const contributors = example.words
    .map((_, i) => i)
    .filter((i) => example.values[i] !== undefined && (weightByIndex.get(i) ?? 0) > 0.03)
    .sort((a, b) => (weightByIndex.get(b) ?? 0) - (weightByIndex.get(a) ?? 0));

  const tabs = EXAMPLES.map((e) => ({ id: e.id, label: e.label }));

  return (
    <WidgetContainer
      title="Gathering the Value"
      description="Softmax turns the match scores into attention percentages. Each token then hands over its value, weighted by that percentage."
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

        {/* token / match score / softmax grid */}
        <div className="overflow-x-auto rounded-md border border-border">
          <div className="flex w-max items-stretch">
            <div className="flex shrink-0 flex-col bg-foreground/[0.02]">
              <div className="flex h-9 items-center justify-end border-b border-border px-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                token
              </div>
              <div className="flex h-10 items-center justify-end border-b border-border px-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                match&nbsp;score
              </div>
              <div className="flex h-10 items-center justify-end px-3 text-[10px] font-semibold uppercase tracking-wide text-accent">
                softmax
              </div>
            </div>
            {example.words.map((word, i) => {
              const isAsker = i === example.asker;
              const w = weightByIndex.get(i) ?? 0;
              const hasValue = example.values[i] !== undefined;
              const strong = w > 0.05;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-stretch border-l border-border ${
                    hasValue ? "bg-indigo-50/60 dark:bg-indigo-950/30" : ""
                  }`}
                >
                  <div
                    className={`flex h-9 items-center justify-center whitespace-nowrap border-b border-border px-3 text-lg ${
                      isAsker ? "font-bold text-accent" : hasValue ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-foreground"
                    }`}
                  >
                    {word}
                  </div>
                  <div className="flex h-10 items-center justify-center border-b border-border px-3 font-mono text-lg font-bold text-muted/70">
                    {isAsker ? "–" : example.scores[i]}
                  </div>
                  <div
                    className={`flex h-10 items-center justify-center px-3 font-mono text-lg font-bold ${
                      isAsker ? "text-muted/40" : strong ? "text-accent" : "text-muted/50"
                    }`}
                  >
                    {isAsker ? "–" : pct(w)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contributing values */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Values that make it in</div>
          <div className="flex flex-wrap gap-2">
            {contributors.map((i) => (
              <div key={i} className="flex-1 rounded-lg border border-indigo-400/50 bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">&ldquo;{example.words[i]}&rdquo;</span>
                  <span className="font-mono text-sm font-bold text-accent">{pct(weightByIndex.get(i) ?? 0)}</span>
                </div>
                <div className="mt-0.5 text-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">value: </span>
                  {example.values[i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Combined value */}
        <div className="rounded-lg border-2 border-accent bg-accent/10 px-4 py-3 text-center">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
            What &ldquo;{example.words[example.asker]}&rdquo; gathered
          </div>
          <div className="text-lg font-medium text-foreground">{example.result}</div>
        </div>
      </div>
    </WidgetContainer>
  );
}
