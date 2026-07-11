"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { softmax } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  The sink: a token whose only job is to absorb attention when       */
/*  nothing in the sentence is a good match. It has a fixed, modest     */
/*  score, enough to beat weak matches but lose to a real one.          */
/* ------------------------------------------------------------------ */

const SINK_SCORE = 3;

interface Example {
  id: string;
  label: string;
  words: string[];
  asker: number;
  query: string;
  scores: number[];
  note: string;
}

const EXAMPLES: Example[] = [
  {
    id: "nomatch",
    label: "Nothing matches",
    words: ["It", "was", "raining", "outside", "."],
    asker: 0,
    query: "the thing being referred to",
    scores: [0, 1, 2, 2, 1],
    note: 'This "it" doesn\'t refer to anything, it\'s just how English starts a sentence about the weather. No token is a real answer, so without the sink the attention would smear meaninglessly across the sentence. Instead it lands on the sink.',
  },
  {
    id: "match",
    label: "Something matches",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", "."],
    asker: 5,
    query: "the thing being referred to",
    scores: [1, 2, 1, 6, 1, 0, 2, 1],
    note: 'Here "glass" is a strong answer. It scores well above the sink, so it wins almost all the attention and the sink is barely touched.',
  },
];

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(0)}%`;
}

export function AttentionSink() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [sinkOn, setSinkOn] = useState(true);

  const example = EXAMPLES[exampleIdx];

  const handleReset = useCallback(() => {
    setExampleIdx(0);
    setSinkOn(true);
  }, []);

  const handleTab = useCallback((id: string) => {
    setExampleIdx(EXAMPLES.findIndex((e) => e.id === id));
  }, []);

  const others = example.words.map((_, i) => i).filter((i) => i !== example.asker);
  // Row list: the sentence tokens, plus the sink at the end when it's on.
  const rawScores = [...others.map((i) => example.scores[i]), ...(sinkOn ? [SINK_SCORE] : [])];
  const weights = softmax(rawScores);
  const tokenWeights = new Map<number, number>();
  others.forEach((i, k) => tokenWeights.set(i, weights[k]));
  const sinkWeight = sinkOn ? weights[weights.length - 1] : 0;
  const maxWeight = Math.max(...weights);

  const tabs = EXAMPLES.map((e) => ({ id: e.id, label: e.label }));

  const bar = (word: string, scoreLabel: string, w: number, isTop: boolean, key: string, accentName?: boolean) => (
    <div key={key} className="flex items-center gap-3 px-3 py-1">
      <span className={`w-24 shrink-0 truncate ${accentName ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {word}
      </span>
      <span className="w-14 shrink-0 text-right font-mono text-xs text-muted">{scoreLabel}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-foreground/5">
        <div
          className={`h-4 rounded-full transition-all duration-300 ${
            accentName ? "bg-emerald-500" : isTop ? "bg-accent" : "bg-foreground/25"
          }`}
          style={{ width: `${Math.max(w * 100, 0)}%` }}
        />
      </div>
      <span className={`w-12 shrink-0 text-right font-mono text-sm font-bold ${isTop ? "text-foreground" : "text-muted"}`}>
        {pct(w)}
      </span>
    </div>
  );

  return (
    <WidgetContainer
      title="The Attention Sink"
      description="When nothing in the sentence is a good match, a sink token gives the leftover attention somewhere harmless to go."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        <WidgetTabs tabs={tabs} activeTab={example.id} onTabChange={handleTab} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              &ldquo;{example.words[example.asker]}&rdquo; is looking for
            </div>
            <div className="text-foreground">{example.query}</div>
          </div>
          <button
            onClick={() => setSinkOn((s) => !s)}
            aria-pressed={sinkOn}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              sinkOn
                ? "bg-emerald-500 text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
            }`}
          >
            Sink {sinkOn ? "on" : "off"}
          </button>
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
            const w = tokenWeights.get(i) ?? 0;
            return bar(word, `score ${example.scores[i]}`, w, w >= maxWeight - 0.001 && w > 0.02, `t-${i}`);
          })}
          {sinkOn && bar("sink", `score ${SINK_SCORE}`, sinkWeight, sinkWeight >= maxWeight - 0.001, "sink", true)}
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {example.note} Toggle the sink off to see the attention with nowhere safe to go.
        </div>
      </div>
    </WidgetContainer>
  );
}
