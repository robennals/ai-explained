"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { softmax } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Values: once attention is divided up, each token hands over its    */
/*  value, weighted by how much attention it got. The asker ends up    */
/*  with a blend, sharp when one token wins, mixed when the split ties. */
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
    id: "split",
    label: "A blended value",
    words: ["Sam", "told", "Alex", "that", "he", "had", "won", "."],
    asker: 4,
    query: "a person who was just mentioned",
    scores: [5, 1, 5, 1, 0, 1, 2, 1],
    values: { 0: "Sam", 2: "Alex" },
    result: "an equal blend of Sam and Alex. The model keeps both, because nothing in the sentence tells it which one won.",
  },
  {
    id: "winner",
    label: "A clear value",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", "."],
    asker: 5,
    query: "the thing being talked about",
    scores: [1, 2, 1, 6, 1, 0, 2, 1],
    values: { 3: "the glass" },
    result: 'almost purely "the glass". So "it" now carries the meaning of the glass.',
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
  const weights = softmax(others.map((i) => example.scores[i] * 4));
  const weightByIndex = new Map<number, number>();
  others.forEach((i, k) => weightByIndex.set(i, weights[k]));

  const tabs = EXAMPLES.map((e) => ({ id: e.id, label: e.label }));

  return (
    <WidgetContainer
      title="Gathering the Value"
      description="Each token hands over its value, weighted by how much attention it got. The asker ends up with the blend."
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
            const hasValue = example.values[i] !== undefined;
            const strong = w > 0.05;
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-1">
                <span className="w-24 shrink-0 truncate text-foreground">{word}</span>
                <span className={`w-14 shrink-0 text-right font-mono text-sm font-bold ${strong ? "text-accent" : "text-muted"}`}>
                  {pct(w)}
                </span>
                <span className="text-muted">×</span>
                <span
                  className={`flex-1 rounded px-2 py-0.5 text-sm ${
                    hasValue ? "bg-indigo-500/10 text-foreground" : "text-muted/50"
                  }`}
                >
                  {hasValue ? (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                        value:{" "}
                      </span>
                      {example.values[i]}
                    </>
                  ) : (
                    "no value to give"
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border-2 border-accent bg-accent/10 px-4 py-3 text-center">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">What &ldquo;{example.words[example.asker]}&rdquo; gathered</div>
          <div className="text-base font-medium text-foreground">{example.result}</div>
        </div>
      </div>
    </WidgetContainer>
  );
}
