"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot, softmax } from "./toyMath";

interface Token {
  label: string;
  key: number[];
  baseQuery: number[]; // 0 or 1, scaled by query magnitude when computing
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const CAT: Token = {
  label: "cat", key: [1], baseQuery: [0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [1], baseQuery: [0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], baseQuery: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], baseQuery: [1],
  color: "text-purple-600 dark:text-purple-400",
};

const PROPS = ["noun"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "blah dog blah it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
];

const HUE = 240;

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HUE}, 75%, 55%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HUE}, 80%, 50%, ${alpha})`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

export function ToyAttentionSoftmax() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(3);
  const [queryMag, setQueryMag] = useState<number>(1); // 1 or 10
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(3);
    setQueryMag(1);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    const newTokens = SENTENCES[idx].tokens;
    const itIdx = newTokens.map((t, i) => (t.label === "it" ? i : -1)).filter((i) => i >= 0);
    setSelected(itIdx.length > 0 ? itIdx[itIdx.length - 1] : newTokens.length - 1);
  };

  // Effective query for the selected token, scaled by queryMag
  const scaledQuery = (tok: Token): number[] =>
    tok.baseQuery.map((q) => q * queryMag);

  const scores = selected !== null
    ? tokens.map((t) => dot(scaledQuery(tokens[selected]), t.key))
    : null;
  const weights = scores ? softmax(scores) : null;
  const hasSelection = selected !== null;
  const askerHasAnyMatch = scores
    ? scores.some((s, i) => s > 0 && i !== selected)
    : false;

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
      title="Adding Softmax"
      description={'Now apply softmax to turn match scores into percentages. Try cranking the query magnitude up to 10 and watch the leak shrink.'}
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              aria-pressed={i === sentIdx}
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

        {/* Query magnitude toggle */}
        <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
          <span className="text-xs font-semibold uppercase text-muted">query magnitude for &ldquo;it&rdquo; token:</span>
          {[1, 10].map((m) => (
            <button
              key={m}
              onClick={() => setQueryMag(m)}
              aria-pressed={queryMag === m}
              className={`rounded-full px-4 py-1 font-mono text-sm font-bold transition-colors ${
                queryMag === m
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              [{m}]
            </button>
          ))}
        </div>

        {/* Token row */}
        <div className="relative" ref={rowRef}>
          {arrows.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 10 }}>
              <defs>
                <marker id="softmax-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HUE}, 75%, 55%, 0.7)`} />
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
                    markerEnd="url(#softmax-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const weight = weights?.[i];
              const isTarget = weight != null && weight > 0.01 && !isSelected;
              const queryShown = isSelected ? scaledQuery(tok) : tok.baseQuery;

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 145 }}>
                  <button
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    onClick={() => setSelected(isSelected ? null : i)}
                    aria-pressed={isSelected}
                    className={`rounded-lg border-2 px-4 py-2 transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                  </button>

                  <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                    <VectorCard
                      name="" emoji="" properties={PROPS} values={queryShown}
                      barColor="var(--color-accent)"
                      barMax={10} animate={false}
                      labelWidth="w-10" barWidth="w-8"
                      className={`text-xs w-full transition-colors ${
                        hasSelection && !isSelected ? "opacity-30" : ""
                      } ${
                        isSelected && askerHasAnyMatch ? "!border-accent" : ""
                      }`}
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />
                    <VectorCard
                      name="" emoji="" properties={PROPS} values={tok.key}
                      barMax={1} animate={false}
                      labelWidth="w-10" barWidth="w-8"
                      className={`text-xs w-full transition-colors ${
                        isTarget ? "!border-accent" : ""
                      }`}
                      label="KEY"
                    />

                    {/* Big percentage */}
                    {weight != null && (
                      <span
                        className={`mt-0.5 rounded-full px-3 py-0.5 font-mono text-sm font-bold ${
                          isTarget
                            ? "text-white"
                            : isSelected
                            ? "text-accent"
                            : "text-muted"
                        }`}
                        style={isTarget ? { backgroundColor: weightToPill(weight) } : undefined}
                      >
                        {pct(weight)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contextual explanation */}
        {hasSelection && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            {queryMag === 1 ? (
              <>With query magnitude <strong>1</strong>, the noun match is only twice as strong as no-match. Softmax distributes attention fairly evenly, and over half leaks to filler. Try magnitude <strong>10</strong>.</>
            ) : (
              <>With query magnitude <strong>10</strong>, the noun match completely dominates. Softmax puts almost 100% of the attention on the matching noun. The leak to other tokens is tiny — a fraction of a percent each.</>
            )}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
