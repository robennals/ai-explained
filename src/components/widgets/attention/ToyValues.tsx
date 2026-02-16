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
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const S = 3;

const CAT: Token = {
  label: "cat", key: [S, 0], query: [S, 0], value: [1, 0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [S, 0], query: [S, 0], value: [0, 1],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "bla", key: [0, S], query: [0, S], value: [0, 0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0, 0], query: [S, 0], value: [0, 0],
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

/** Pre-compute all attention outputs for a sentence */
function computeAllOutputs(tokens: Token[]) {
  return tokens.map((tok) => {
    const scores = tokens.map((t) => dot(tok.query, t.key));
    const weights = softmax(scores);
    const output = weightedSum(weights, tokens.map((t) => t.value));
    return { weights, output };
  });
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

/** Human-readable label for a value vector: [1,0]→"cat", [0,1]→"dog", [0,0]→"–" */
function valueLabel(v: [number, number]): string {
  if (v[0] >= 0.7 && v[1] < 0.3) return "cat";
  if (v[1] >= 0.7 && v[0] < 0.3) return "dog";
  if (v[0] < 0.1 && v[1] < 0.1) return "–";
  // mixed
  const catPct = Math.round(v[0] * 100);
  const dogPct = Math.round(v[1] * 100);
  return `${catPct}% cat, ${dogPct}% dog`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/*  Arrow drawing                                                     */
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
/*  Describe output for a token                                       */
/* ------------------------------------------------------------------ */

function describeOutput(tok: Token, output: [number, number]): string {
  if (tok.label === "it") {
    if (output[0] > 0.7) return "\"it\" absorbed cat's identity — it now represents the noun it found.";
    if (output[1] > 0.7) return "\"it\" absorbed dog's identity — it now represents the noun it found.";
    return "\"it\" got a mix of values.";
  }
  if (tok.label === "cat" || tok.label === "dog") {
    return `"${tok.label}" mostly attended to itself, so its output is close to its own value.`;
  }
  return `"${tok.label}" attended to other filler, contributing nothing useful.`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ToyValues() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;
  const allResults = computeAllOutputs(tokens);

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(null);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    setSelected(null);
  };

  const hasSelection = selected !== null;
  const selWeights = hasSelection ? allResults[selected].weights : null;

  // Compute arrows for selected token
  useEffect(() => {
    if (!hasSelection || !selWeights || !rowRef.current) {
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
        const w = selWeights![i];
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
  }, [hasSelection, selected, selWeights, sentIdx, tokens]);

  const arcPad = 50;

  return (
    <WidgetContainer
      title="Values: What Each Token Receives"
      description="Each token's output is a weighted blend of all the values. Click a token to see why it got its output."
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

        {/* Token cards with arrows */}
        <div className="relative" ref={rowRef}>
          {/* SVG arrows */}
          {arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker
                  id="val-arrowhead"
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
                    markerEnd="url(#val-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          {/* Cards showing input value → output */}
          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const result = allResults[i];
              const attnWeight = selWeights?.[i];
              const isTarget = hasSelection && !isSelected && attnWeight != null && attnWeight > 0.01;

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center">
                  <div
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(isSelected ? null : i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(isSelected ? null : i);
                      }
                    }}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    {/* Token name */}
                    <span className={`text-lg font-bold ${tok.color}`}>
                      {tok.label}
                    </span>

                    {/* Input value with label */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted">V</span>
                        <span className="font-mono text-[11px] text-muted">
                          {vec(tok.value)}
                        </span>
                      </div>
                      <span className="text-[10px] italic text-muted">
                        {valueLabel(tok.value)}
                      </span>
                    </div>

                    {/* Arrow down */}
                    <span className="text-muted">↓</span>

                    {/* Output value with label */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">out</span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {vecF(result.output)}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold italic text-emerald-600 dark:text-emerald-400">
                        {valueLabel(result.output)}
                      </span>
                    </div>
                  </div>

                  {/* Attention weight pill (when another token is selected) */}
                  <span className="mt-1.5 flex h-6 items-center">
                    {isTarget && attnWeight != null ? (
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-xs font-bold text-white transition-all duration-200"
                        style={{ backgroundColor: weightToPill(attnWeight) }}
                      >
                        {pct(attnWeight)}
                      </span>
                    ) : isSelected && selWeights ? (
                      <span className="font-mono text-xs font-bold text-accent">
                        {pct(selWeights[i])}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation for selected token */}
        {selected !== null ? (
          <div className="rounded-lg border border-border bg-surface">
            {/* Weighted sum breakdown */}
            <div className="border-b border-border px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                How <span className={tokens[selected].color}>{tokens[selected].label}</span>&apos;s output is computed
              </div>
              <div className="flex flex-col gap-1">
                {tokens.map((tok, i) => {
                  const w = allResults[selected].weights[i];
                  return (
                    <div key={i} className={`font-mono text-sm ${w < 0.01 ? "text-muted/40" : ""}`}>
                      <span className={w > 0.3 ? "font-bold" : "text-muted"}>
                        {pct(w)}
                      </span>
                      {" × "}
                      <span className={tok.color}>{tok.label}</span>
                      &apos;s value{" "}
                      <span className="text-muted">{vec(tok.value)}</span>
                      {w > 0.3 && (
                        <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                          → contributes [{(w * tok.value[0]).toFixed(2)}, {(w * tok.value[1]).toFixed(2)}]
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result + explanation */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Output:</span>
                <span className="rounded bg-emerald-100 px-2.5 py-1 font-mono text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {vecF(allResults[selected].output)}
                </span>
              </div>
              <div className="mt-2 text-sm text-foreground/80">
                {describeOutput(tokens[selected], allResults[selected].output)}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center text-sm text-muted">
            Every token now has an output — the result of blending all values using attention weights.
            Click any token to see why it got its output.
            Try <span className="font-bold text-purple-600 dark:text-purple-400">it</span> — watch it absorb the noun&apos;s identity.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
