"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

/* ------------------------------------------------------------------ */
/*  Data — same toy tokens as ToyAttention                            */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];
  query: number[];
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const S = 3;

const CAT: Token = {
  label: "cat", key: [S], query: [0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [S], query: [0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], query: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], query: [S],
  color: "text-purple-600 dark:text-purple-400",
};

const SENTENCES: Sentence[] = [
  { label: "dog blahblahblahcat blahit", tokens: [DOG, BLA, BLA, BLA, CAT, BLA, IT] },
  { label: "cat blahblahblahdog blahit", tokens: [CAT, BLA, BLA, BLA, DOG, BLA, IT] },
  { label: "dog blahcat blahit", tokens: [DOG, BLA, CAT, BLA, IT] },
  { label: "cat blahblahblahblahdog blahblahit", tokens: [CAT, BLA, BLA, BLA, BLA, DOG, BLA, BLA, IT] },
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

/* ------------------------------------------------------------------ */
/*  Formatting                                                        */
/* ------------------------------------------------------------------ */

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
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

export function ALiBiToyTokens() {
  const [sentIdx, setSentIdx] = useState(0);
  const [slope, setSlope] = useState(1);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;
  const itIdx = tokens.length - 1; // "it" is always last
  const selected = itIdx; // always show attention from "it"

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSlope(1);
  }, []);

  // Compute attention scores for "it"
  const rawScores = tokens.map((t) => dot(tokens[selected].query, t.key));
  const penalizedScores = tokens.map((t, i) => {
    const distance = itIdx - i;
    return dot(tokens[selected].query, t.key) - slope * distance;
  });
  const weights = softmax(penalizedScores);

  // Measure card positions and compute arrows
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fromEl = cardRefs.current.get(selected);
      if (!fromEl) { setArrows([]); return; }

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
      const fromY = fromRect.top - rowRect.top;

      const newArrows: Arrow[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (i === selected) continue;
        const w = weights[i];
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
  }, [selected, weights, sentIdx, tokens]);

  const arcPad = 50;

  return (
    <WidgetContainer
      title="ALiBi: Distance Penalties"
      description="Drag the slope to see how a linear distance penalty shifts attention toward closer tokens"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => setSentIdx(i)}
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

        {/* Slope slider */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Distance penalty slope (m)
          </div>
          <SliderControl
            label=""
            value={slope}
            min={0}
            max={3}
            step={0.1}
            onChange={setSlope}
            formatValue={(v) => v.toFixed(1)}
          />
          <div className="mt-1 text-[11px] text-blue-700/70 dark:text-blue-400/70">
            {slope === 0
              ? "No penalty — attention is position-blind. Both nouns get equal scores."
              : `score = q · k − ${slope.toFixed(1)} × distance`}
          </div>
        </div>

        {/* Token row with arrow overlay */}
        <div className="overflow-x-auto">
          <div className="relative inline-flex min-w-full justify-center" ref={rowRef}>
            {/* SVG overlay for curved arrows */}
            {arrows.length > 0 && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                style={{ zIndex: 10 }}
              >
                <defs>
                  <marker
                    id="alibi-arrowhead"
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
                      markerEnd="url(#alibi-arrowhead)"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
            )}

            {/* Token cards */}
            <div className="flex justify-center gap-1.5" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = i === selected;
              const weight = weights[i];
              const isTarget = weight > 0.01 && !isSelected;
              const distance = itIdx - i;
              const isNoun = tok.label === "cat" || tok.label === "dog";

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 56 }}>
                  {/* Token label */}
                  <div
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    className={`rounded-md border px-2 py-1 ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-1 border-border bg-surface"
                        : "border-border bg-surface"
                    }`}
                  >
                    <span className={`text-sm font-bold ${tok.color}`}>{tok.label}</span>
                  </div>

                  {/* Compact info below the token */}
                  <div className="mt-1 flex flex-col items-center gap-0.5">
                    {isSelected ? (
                      <span className="text-[9px] font-bold text-accent uppercase">query</span>
                    ) : (
                      <>
                        <span className="text-[9px] text-muted">
                          {isNoun ? `key=${tok.key[0]}` : `key=${tok.key[0]}`}
                        </span>
                        {slope > 0 && distance > 0 && (
                          <span className="text-[9px] text-red-500">
                            −{(slope * distance).toFixed(1)}
                          </span>
                        )}
                      </>
                    )}
                    {/* Attention weight pill */}
                    {isTarget ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold text-white"
                        style={{ backgroundColor: weightToPill(weight) }}
                      >
                        {pct(weight)}
                      </span>
                    ) : (
                      <span className={`font-mono text-[9px] font-bold ${isSelected ? "text-accent" : "text-muted"}`}>
                        {pct(weight)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
