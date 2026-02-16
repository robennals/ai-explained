"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: [number, number];
  query: [number, number];
  color: string; // tailwind text color class
}

interface Sentence {
  label: string;
  tokens: Token[];
}

// Scaled one-hot vectors: dimension 0 = "noun", dimension 1 = "filler"
const S = 3; // scale factor — makes softmax decisive

const CAT: Token = {
  label: "cat",
  key: [S, 0],
  query: [S, 0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog",
  key: [S, 0],
  query: [S, 0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "bla",
  key: [0, S],
  query: [0, S],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it",
  key: [0, 0],
  query: [S, 0],
  color: "text-purple-600 dark:text-purple-400",
};

const SENTENCES: Sentence[] = [
  { label: "cat bla bla it", tokens: [CAT, BLA, BLA, IT] },
  { label: "bla dog bla it", tokens: [BLA, DOG, BLA, IT] },
  { label: "bla bla cat it", tokens: [BLA, BLA, CAT, IT] },
];

/* ------------------------------------------------------------------ */
/*  Math helpers                                                      */
/* ------------------------------------------------------------------ */

function dot(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

function vec(v: [number, number]): string {
  return `[${v[0]}, ${v[1]}]`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ToyAttention() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(null);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    setSelected(null);
  };

  // Compute attention for selected token
  const scores = selected !== null
    ? tokens.map((t) => dot(tokens[selected].query, t.key))
    : null;
  const weights = scores ? softmax(scores) : null;

  return (
    <WidgetContainer
      title="Toy Attention"
      description="Click a token to see what it attends to — every number is visible."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Token row */}
        <div className="flex justify-center gap-3">
          {tokens.map((tok, i) => {
            const isSelected = selected === i;
            const weight = weights?.[i];
            const isTarget = weight != null && weight > 0.01;

            return (
              <div key={`${sentIdx}-${i}`} className="flex flex-col items-center">
                <button
                  onClick={() => setSelected(isSelected ? null : i)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-4 py-3 transition-all ${
                    isSelected
                      ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                      : isTarget
                        ? `border-indigo-400/60 ${weight! > 0.5 ? "bg-indigo-100 dark:bg-indigo-950/50" : "bg-indigo-50 dark:bg-indigo-950/30"}`
                        : "border-border bg-surface hover:border-foreground/20"
                  }`}
                >
                  <span className={`text-lg font-bold ${tok.color}`}>
                    {tok.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    K={vec(tok.key)}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    Q={vec(tok.query)}
                  </span>
                </button>
                {weight != null ? (
                  <span
                    className={`mt-1.5 font-mono text-xs font-bold ${
                      weight > 0.5 ? "text-indigo-600 dark:text-indigo-400" : "text-muted"
                    }`}
                  >
                    {pct(weight)}
                  </span>
                ) : (
                  <span className="mt-1.5 h-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Computation detail */}
        {selected !== null && scores && weights ? (
          <div className="rounded-lg border border-border bg-surface">
            {/* Step 1: Dot products */}
            <div className="border-b border-border px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Step 1: Dot products — <span className={tokens[selected].color}>{tokens[selected].label}</span>&apos;s query vs each key
              </div>
              <div className="flex flex-col gap-1.5">
                {tokens.map((tok, i) => {
                  const q = tokens[selected].query;
                  const k = tok.key;
                  return (
                    <div key={i} className="font-mono text-sm">
                      <span className={tokens[selected].color}>
                        {vec(q)}
                      </span>
                      {" · "}
                      <span className={tok.color}>{vec(k)}</span>
                      {" = "}
                      <span className="text-muted">
                        {q[0]}×{k[0]} + {q[1]}×{k[1]}
                      </span>
                      {" = "}
                      <span className="font-bold">{scores[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Softmax */}
            <div className="px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Step 2: Softmax — turn scores into percentages
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  softmax([{scores.join(", ")}])
                </span>
                <span className="text-muted">=</span>
                <div className="flex gap-2">
                  {weights.map((w, i) => (
                    <span
                      key={i}
                      className={`rounded px-2 py-0.5 font-mono text-sm font-bold ${
                        w > 0.5
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                          : "text-muted"
                      }`}
                    >
                      {pct(w)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center text-sm text-muted">
            Click a token to see how attention is computed step by step.
          </div>
        )}

        {/* Explanation for "it" */}
        {selected !== null && tokens[selected].label === "it" && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            Notice: <strong className="text-purple-600 dark:text-purple-400">it</strong> has
            Q={vec(IT.query)} but K={vec(IT.key)}. Its query says
            &ldquo;I&apos;m looking for a noun&rdquo; while its key advertises nothing — it
            doesn&apos;t want other tokens to attend to it. This is why Q and K need to be
            separate — <em>what you&apos;re looking for</em> isn&apos;t always <em>what you are</em>.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
