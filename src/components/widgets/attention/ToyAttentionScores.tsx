"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data — step 1: 1-dim keys/queries, 1/0 values                     */
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

const CAT: Token = {
  label: "cat", key: [1], query: [0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [1], query: [0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], query: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], query: [1],
  color: "text-purple-600 dark:text-purple-400",
};

const PROPS = ["noun"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "blah dog blah it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [BLA, BLA, BLA, IT] },
];

/* ------------------------------------------------------------------ */
/*  Arrow helpers                                                     */
/* ------------------------------------------------------------------ */

const HUE = 240;

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  score: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ToyAttentionScores() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(3); // default: "it" of first sentence
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(3);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    // default to last "it" position; if no "it", select last token
    const newTokens = SENTENCES[idx].tokens;
    const itIdx = newTokens.map((t, i) => (t.label === "it" ? i : -1)).filter((i) => i >= 0);
    setSelected(itIdx.length > 0 ? itIdx[itIdx.length - 1] : newTokens.length - 1);
  };

  const scores = selected !== null
    ? tokens.map((t) => dot(tokens[selected].query, t.key))
    : null;
  const hasSelection = selected !== null;

  // Compute arrows from selected token to others, weighted by score
  useEffect(() => {
    if (!hasSelection || !scores || !rowRef.current) {
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
        const s = scores![i];
        if (s <= 0) continue;
        const toEl = cardRefs.current.get(i);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX, fromY,
          toX: toRect.left + toRect.width / 2 - rowRect.left,
          toY: toRect.top - rowRect.top,
          score: s,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [hasSelection, selected, scores, sentIdx, tokens]);

  const arcPad = 50;

  return (
    <WidgetContainer
      title="Match Scores"
      description={'Click any token to see its raw match scores against every key. No percentages yet.'}
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
        <div className="relative" ref={rowRef}>
          {arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker id="scores-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HUE}, 75%, 55%, 0.7)`} />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.1, 80);
                const midX = (a.fromX + a.toX) / 2;
                const midY = Math.min(a.fromY, a.toY) - arcHeight;
                return (
                  <path
                    key={i}
                    d={`M ${a.fromX} ${a.fromY} Q ${midX} ${midY} ${a.toX} ${a.toY}`}
                    fill="none"
                    stroke={`hsla(${HUE}, 75%, 55%, 0.7)`}
                    strokeWidth={2}
                    markerEnd="url(#scores-arrowhead)"
                  />
                );
              })}
            </svg>
          )}

          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const score = scores?.[i];

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 130 }}>
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

                  {/* Always show key + query for every token */}
                  <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                    <VectorCard
                      name=""
                      emoji=""
                      properties={PROPS}
                      values={tok.key}
                      barMax={1}
                      animate={false}
                      labelWidth="w-10"
                      barWidth="w-10"
                      className="text-xs w-full"
                      label="KEY"
                    />
                    <VectorCard
                      name=""
                      emoji=""
                      properties={PROPS}
                      values={tok.query}
                      barColor="var(--color-accent)"
                      barMax={1}
                      animate={false}
                      labelWidth="w-10"
                      barWidth="w-10"
                      className="text-xs w-full"
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />

                    {/* Score row — shown only when something is selected */}
                    {hasSelection && score != null && (
                      <div className="text-center font-mono text-[10px] text-muted leading-tight">
                        <span>[{tokens[selected!].query.join(", ")}]</span>
                        {" · "}
                        <span>[{tok.key.join(", ")}]</span>
                        {" = "}
                        <span className="font-bold text-foreground">{score}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation when nothing is asking */}
        {hasSelection && tokens[selected!].query.every((q) => q === 0) && (
          <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-muted">
            <span className="font-bold text-foreground">{tokens[selected!].label}</span> isn&apos;t asking
            anything in this head — its query is all zeros. Every match score is 0.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
