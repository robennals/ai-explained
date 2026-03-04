"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];
  query: number[];
  value: number[];
  valueLabel: string;
  color: string;
  hexColor: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const S = 3;

const CAT: Token = {
  label: "cat", key: [S], query: [0], value: [1, 0], valueLabel: "cat",
  color: "text-amber-600 dark:text-amber-400", hexColor: "#d97706",
};
const DOG: Token = {
  label: "dog", key: [S], query: [0], value: [0, 1], valueLabel: "dog",
  color: "text-blue-600 dark:text-blue-400", hexColor: "#2563eb",
};
const BLA: Token = {
  label: "bla", key: [0], query: [0], value: [0, 0], valueLabel: "–",
  color: "text-foreground/40", hexColor: "#9ca3af",
};
const IT: Token = {
  label: "it", key: [0], query: [S], value: [0, 0], valueLabel: "–",
  color: "text-purple-600 dark:text-purple-400", hexColor: "#9333ea",
};

const VALUE_PROPS = ["cat", "dog"];

const SENTENCES: Sentence[] = [
  { label: "cat bla bla it", tokens: [CAT, BLA, BLA, IT] },
  { label: "bla dog bla it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat bla dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "bla bla bla it", tokens: [BLA, BLA, BLA, IT] },
  { label: "cat it dog it", tokens: [CAT, IT, DOG, IT] },
];

/* ------------------------------------------------------------------ */
/*  Math                                                              */
/* ------------------------------------------------------------------ */

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function weightedSum(weights: number[], values: number[][]): number[] {
  const dim = values[0].length;
  const result = new Array(dim).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let d = 0; d < dim; d++) {
      result[d] += weights[i] * values[i][d];
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                        */
/* ------------------------------------------------------------------ */

function vecF(v: number[]): string {
  return `[${v.map((n) => n.toFixed(2)).join(", ")}]`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

function outputLabel(v: number[]): string {
  if (v[0] >= 0.7 && v[1] < 0.3) return "cat";
  if (v[1] >= 0.7 && v[0] < 0.3) return "dog";
  if (v[0] < 0.1 && v[1] < 0.1) return "nothing";
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

export function ToyAttentionValues() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    const newTokens = SENTENCES[0].tokens;
    const newItIndices = newTokens.map((t, i) => t.label === "it" ? i : -1).filter((i) => i >= 0);
    setSelected(newItIndices.length === 1 ? newItIndices[0] : null);
  }, []);

  // Auto-select "it" when there's exactly one
  const itIndices = tokens.map((t, i) => t.label === "it" ? i : -1).filter((i) => i >= 0);
  const autoSelect = itIndices.length === 1 ? itIndices[0] : null;

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    const newTokens = SENTENCES[idx].tokens;
    const newItIndices = newTokens.map((t, i) => t.label === "it" ? i : -1).filter((i) => i >= 0);
    setSelected(newItIndices.length === 1 ? newItIndices[0] : null);
  };

  // Auto-select on first render
  useEffect(() => {
    if (selected === null && autoSelect !== null) {
      setSelected(autoSelect);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const raf = requestAnimationFrame(() => setArrows([]));
      return () => cancelAnimationFrame(raf);
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
      title="Attention + Values"
      description={'See how attention weights blend token values into a result.'}
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

          {/* Token cards */}
          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const weight = weights?.[i];
              const isTarget = weight != null && weight > 0.01 && !isSelected;
              const isIt = tok.label === "it";

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 130 }}>
                  {/* Token label — only "it" tokens are clickable */}
                  {isIt ? (
                    <button
                      ref={(el) => {
                        if (el) cardRefs.current.set(i, el);
                        else cardRefs.current.delete(i);
                      }}
                      onClick={() => setSelected(isSelected ? null : i)}
                      className={`rounded-lg border-2 px-4 py-2 transition-all cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                          : "border-border bg-surface hover:border-foreground/20"
                      }`}
                    >
                      <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                    </button>
                  ) : (
                    <div
                      ref={(el) => {
                        if (el) cardRefs.current.set(i, el as unknown as HTMLButtonElement);
                        else cardRefs.current.delete(i);
                      }}
                      className="rounded-lg border-2 border-border bg-surface px-4 py-2"
                    >
                      <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                    </div>
                  )}

                  {/* Attention weight pill */}
                  {hasSelection && weight != null && (
                    <span className="mt-1.5 flex h-5 items-center">
                      {isTarget ? (
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
                      )}
                    </span>
                  )}

                  {/* Value card — highlighted if attended to */}
                  {hasSelection && (
                    <div className={`mt-1.5 w-full transition-opacity duration-200 ${
                      isTarget ? "opacity-100" : isSelected ? "opacity-100" : "opacity-40"
                    }`}>
                      <VectorCard
                        name=""
                        emoji=""
                        properties={VALUE_PROPS}
                        values={tok.value}
                        barColor={tok.hexColor}
                        barMax={1}
                        animate={false}
                        labelWidth="w-10"
                        barWidth="w-10"
                        className="text-xs w-full"
                        label="VALUE"
                        footer={tok.valueLabel}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        {hasSelection && output && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <span className="text-xs font-semibold uppercase text-muted">Result for &ldquo;it&rdquo;:</span>
            <VectorCard
              name=""
              emoji=""
              properties={VALUE_PROPS}
              values={output}
              barColor="#059669"
              barMax={1}
              animate={false}
              labelWidth="w-10"
              barWidth="w-12"
              className="text-xs"
              label="NEW VALUE"
              labelColor="#059669"
              footer={outputLabel(output)}
            />
          </div>
        )}

        {/* Prompt when nothing selected */}
        {!hasSelection && (
          <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center text-sm text-muted">
            Click &ldquo;it&rdquo; to see how attention weights blend values.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
