"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { dot } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data: keys that answer several questions at once                   */
/* ------------------------------------------------------------------ */

const DIMS = ["noun", "river", "money", "flow", "geography", "action"];

interface Word {
  id: string;
  label: string;
  /** Multi-hot key: this word advertises several things at once. */
  key: number[];
  caption: string;
}

const WORDS: Word[] = [
  {
    id: "bank",
    label: "bank",
    key: [1, 1, 1, 0, 0, 0],
    caption: '"bank" advertises three things at once, so it can answer a question about a river or a question about money.',
  },
  {
    id: "river",
    label: "river",
    key: [1, 1, 0, 1, 1, 0],
    caption: '"river" advertises four things, so it answers questions about rivers, flow, and geography all at the same time.',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PartialMatches() {
  const [wordIdx, setWordIdx] = useState(0);
  // The query starts out asking a single thing: "about a river?"
  const [query, setQuery] = useState<boolean[]>(() =>
    DIMS.map((d) => d === "river")
  );

  const word = WORDS[wordIdx];
  const queryVec = query.map((on) => (on ? 1 : 0));
  const score = dot(queryVec, word.key);
  const anyAsked = queryVec.some((q) => q === 1);

  const handleReset = useCallback(() => {
    setWordIdx(0);
    setQuery(DIMS.map((d) => d === "river"));
  }, []);

  const toggle = useCallback((i: number) => {
    setQuery((prev) => prev.map((on, j) => (j === i ? !on : on)));
  }, []);

  const tabs = WORDS.map((w) => ({ id: w.id, label: `Key: "${w.label}"` }));

  const matched = DIMS.filter((_, i) => queryVec[i] === 1 && word.key[i] === 1);

  return (
    <WidgetContainer
      title="Partial Matches"
      description="A query can ask about several things, and a key can answer several. They match on whatever they share — no exact match required."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        <WidgetTabs tabs={tabs} activeTab={word.id} onTabChange={(id) => setWordIdx(WORDS.findIndex((w) => w.id === id))} />

        {/* What the key advertises */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted">
            The word <span className="font-bold text-foreground">&ldquo;{word.label}&rdquo;</span> advertises (its key):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DIMS.map((d, i) =>
              word.key[i] === 1 ? (
                <span
                  key={d}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    queryVec[i] === 1
                      ? "bg-success/15 text-success ring-1 ring-success/40"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  }`}
                >
                  {d}
                </span>
              ) : null
            )}
          </div>
        </div>

        {/* Build your query */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted">
            Your question (the query) — click to ask about each thing:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DIMS.map((d, i) => {
              const on = query[i];
              const isMatch = on && word.key[i] === 1;
              return (
                <button
                  key={d}
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    on
                      ? isMatch
                        ? "bg-success text-white"
                        : "bg-accent text-white"
                      : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
                  }`}
                >
                  {d}?
                </button>
              );
            })}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-foreground/[0.02] px-4 py-3">
          <span className="text-sm text-muted">Match score</span>
          <span className="font-mono text-3xl font-bold text-accent">{score}</span>
          <span className="text-sm text-muted">
            {anyAsked
              ? matched.length > 0
                ? `(shares ${matched.join(", ")})`
                : "(nothing in common)"
              : "(ask something to start)"}
          </span>
        </div>

        {/* Readout */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {word.caption} The score counts how many of the things you asked about it actually offers.
        </div>
      </div>
    </WidgetContainer>
  );
}
