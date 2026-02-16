"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: [number, number];
  query: [number, number];
  value: [number, number];
  valueLabel: string;
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const S = 3;

const CAT: Token = {
  label: "cat", key: [S, 0], query: [S, 0], value: [1, 0], valueLabel: "cat",
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [S, 0], query: [S, 0], value: [0, 1], valueLabel: "dog",
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "bla", key: [0, S], query: [0, S], value: [0, 0], valueLabel: "–",
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0, 0], query: [S, 0], value: [0, 0], valueLabel: "–",
  color: "text-purple-600 dark:text-purple-400",
};

const SENTENCES: Sentence[] = [
  { label: "cat bla bla it", tokens: [CAT, BLA, BLA, IT] },
  { label: "bla dog bla it", tokens: [BLA, DOG, BLA, IT] },
  { label: "bla bla cat it", tokens: [BLA, BLA, CAT, IT] },
];

/* ------------------------------------------------------------------ */
/*  Math                                                              */
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

function weightedSum(weights: number[], values: [number, number][]): [number, number] {
  let x = 0, y = 0;
  for (let i = 0; i < weights.length; i++) {
    x += weights[i] * values[i][0];
    y += weights[i] * values[i][1];
  }
  return [x, y];
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                        */
/* ------------------------------------------------------------------ */

function vec(v: [number, number]): string {
  return `[${v[0]}, ${v[1]}]`;
}

function vecF(v: [number, number]): string {
  return `[${v[0].toFixed(2)}, ${v[1].toFixed(2)}]`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

function outputLabel(v: [number, number]): string {
  if (v[0] >= 0.7 && v[1] < 0.3) return "cat";
  if (v[1] >= 0.7 && v[0] < 0.3) return "dog";
  if (v[0] < 0.1 && v[1] < 0.1) return "–";
  return `${Math.round(v[0] * 100)}% cat, ${Math.round(v[1] * 100)}% dog`;
}

/* ------------------------------------------------------------------ */
/*  Arrow helpers                                                     */
/* ------------------------------------------------------------------ */

const HIGHLIGHT_HUE = 240;

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HIGHLIGHT_HUE}, 75%, 55%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HIGHLIGHT_HUE}, 80%, 50%, ${alpha})`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ToyAttention() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

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
  const output = weights
    ? weightedSum(weights, tokens.map((t) => t.value))
    : null;
  const hasSelection = selected !== null;

  // Measure card positions and compute arrows
  useEffect(() => {
    if (!hasSelection || !weights || !rowRef.current) {
      setArrows([]);
      return;
    }

    const raf = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fromEl = cardRefs.current.get(selected!);
      if (!fromEl) { setArrows([]); return; }

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
      const fromY = fromRect.top - rowRect.top;

      const newArrows: Arrow[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (i === selected) continue;
        const w = weights![i];
        if (w < 0.01) continue;
        const toEl = cardRefs.current.get(i);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX, fromY,
          toX: toRect.left + toRect.width / 2 - rowRect.left,
          toY: toRect.top - rowRect.top,
          weight: w,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [hasSelection, selected, weights, sentIdx, tokens]);

  const arcPad = 50;

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

        {/* Token row with arrow overlay */}
        <div className="relative" ref={rowRef}>
          {/* SVG overlay for curved arrows */}
          {arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker
                  id="toy-arrowhead"
                  markerWidth="6"
                  markerHeight="5"
                  refX="5"
                  refY="2.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 6 2.5, 0 5"
                    fill={`hsla(${HIGHLIGHT_HUE}, 75%, 55%, 0.7)`}
                  />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.1, 80);
                const midX = (a.fromX + a.toX) / 2;
                const midY = Math.min(a.fromY, a.toY) - arcHeight;
                const strokeWidth = 1.5 + a.weight * 1.5;
                return (
                  <path
                    key={i}
                    d={`M ${a.fromX} ${a.fromY} Q ${midX} ${midY} ${a.toX} ${a.toY}`}
                    fill="none"
                    stroke={weightToStroke(a.weight)}
                    strokeWidth={strokeWidth}
                    markerEnd="url(#toy-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          {/* Token cards with labelled rows */}
          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const weight = weights?.[i];
              const isTarget = weight != null && weight > 0.01 && !isSelected;

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center">
                  <button
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    onClick={() => setSelected(isSelected ? null : i)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-4 py-3 transition-all ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    {/* Token name */}
                    <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                    {/* Row: Key & Query */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px] text-muted">K={vec(tok.key)}</span>
                      <span className="font-mono text-[10px] text-muted">Q={vec(tok.query)}</span>
                    </div>
                    {/* Row: Value */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted">V={vec(tok.value)}</span>
                      <span className="text-[10px] italic text-muted">{tok.valueLabel}</span>
                    </div>
                  </button>

                  {/* Attention weight pill */}
                  <span className="mt-1 flex h-5 items-center">
                    {weight != null ? (
                      isTarget ? (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white transition-all duration-200"
                          style={{ backgroundColor: weightToPill(weight) }}
                        >
                          {pct(weight)}
                        </span>
                      ) : (
                        <span className={`font-mono text-[10px] font-bold ${isSelected ? "text-accent" : "text-muted"}`}>
                          {pct(weight)}
                        </span>
                      )
                    ) : null}
                  </span>

                  {/* New value label (only for selected token) */}
                  {isSelected && output && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] uppercase text-muted">new value</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {vecF(output)}
                      </span>
                      <span className="text-[10px] font-semibold italic text-emerald-600 dark:text-emerald-400">
                        {outputLabel(output)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Computation detail */}
        {selected !== null && scores && weights && output ? (
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
                      <span className={tokens[selected].color}>{vec(q)}</span>
                      {" · "}
                      <span className={tok.color}>{vec(k)}</span>
                      {" = "}
                      <span className="text-muted">{q[0]}×{k[0]} + {q[1]}×{k[1]}</span>
                      {" = "}
                      <span className="font-bold">{scores[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Softmax */}
            <div className="border-b border-border px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Step 2: Softmax — turn scores into weights
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

            {/* Step 3: Weighted sum of values */}
            <div className="px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Step 3: Blend values — weighted sum
              </div>
              <div className="flex flex-col gap-1">
                {tokens.map((tok, i) => {
                  const w = weights[i];
                  return (
                    <div key={i} className={`font-mono text-sm ${w < 0.01 ? "text-muted/40" : ""}`}>
                      <span className={w > 0.3 ? "font-bold" : "text-muted"}>
                        {pct(w)}
                      </span>
                      {" × "}
                      <span className={tok.color}>{tok.label}</span>
                      {" "}
                      <span className="text-muted">{vec(tok.value)}</span>
                      {w > 0.01 && (
                        <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                          → [{(w * tok.value[0]).toFixed(2)}, {(w * tok.value[1]).toFixed(2)}]
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="mt-1 flex items-center gap-2 border-t border-border pt-2">
                  <span className="text-xs font-semibold uppercase text-muted">New value:</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {vecF(output)}
                  </span>
                  <span className="text-sm font-semibold italic text-emerald-600 dark:text-emerald-400">
                    = {outputLabel(output)}
                  </span>
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
            <strong className="text-purple-600 dark:text-purple-400">it</strong> started
            with V={vec(IT.value)} — it didn&apos;t know what it referred to. But after attention, its new
            value is {output ? vecF(output) : "?"} — it absorbed the noun&apos;s identity.
            Also notice: Q={vec(IT.query)} but K={vec(IT.key)}. Its query says
            &ldquo;I&apos;m looking for a noun&rdquo; while its key advertises nothing.{" "}
            <em>What you&apos;re looking for</em> isn&apos;t always <em>what you are</em>.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
