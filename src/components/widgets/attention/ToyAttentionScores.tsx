"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { dot } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data — each token's query and key are questions (shown as words).  */
/*  Underneath each is a vector; the match score is their dot product, */
/*  which we make up rather than print a fake one-dimensional vector.  */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];
  query: number[];
  /** The question this token asks (its query), in words. */
  queryText: string;
  /** The question this token offers to answer (its key), in words. */
  keyText: string;
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const NOUN_Q = "What noun are we talking about?";
const NOUN_K = "a noun";

const CAT: Token = {
  label: "cat", key: [1], query: [0], queryText: "—", keyText: NOUN_K,
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [1], query: [0], queryText: "—", keyText: NOUN_K,
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], query: [0], queryText: "—", keyText: "nothing",
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], query: [1], queryText: NOUN_Q, keyText: "nothing",
  color: "text-purple-600 dark:text-purple-400",
};

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
      description={'Click a token to see how well the question it asks matches what every other token offers to answer. No percentages yet.'}
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

                  {/* Query and key as words. The asker's question shows on the
                      selected token; every token shows the question it offers to
                      answer, plus the made-up match score. */}
                  <div className="mt-2 flex w-full flex-col items-center gap-1 text-center">
                    {isSelected && tok.queryText !== "—" && (
                      <div className="text-[11px] leading-tight text-accent">
                        <span className="font-semibold">asks:</span> {tok.queryText}
                      </div>
                    )}
                    <div className="text-[11px] leading-tight text-muted">
                      <span className="font-semibold uppercase tracking-wide">offers:</span> {tok.keyText}
                    </div>
                    {hasSelection && score != null && (
                      <div className="mt-0.5 flex flex-col items-center leading-tight">
                        <span className="text-[10px] uppercase tracking-wide text-muted">match</span>
                        <span className={`font-mono text-2xl font-bold ${score > 0 ? "text-accent" : "text-foreground/40"}`}>
                          {score}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plain-English explanation of what just happened */}
        {hasSelection && scores && (() => {
          const asker = tokens[selected!];
          const askingNothing = asker.query.every((q) => q === 0);

          if (askingNothing) {
            return (
              <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-muted">
                <span className="font-bold text-foreground">&ldquo;{asker.label}&rdquo;</span> isn&apos;t asking anything
                in this head. Its query is all zeros, so every match score is 0.
              </div>
            );
          }

          const matches = scores
            .map((s, i) => ({ score: s, tok: tokens[i], i }))
            .filter(({ score, i }) => score > 0 && i !== selected);

          if (matches.length === 0) {
            return (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
                <span className="font-bold">&ldquo;{asker.label}&rdquo;</span> is looking for a noun, but there are no
                nouns in this sentence. Every score is 0.
              </div>
            );
          }

          if (matches.length === 1) {
            return (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
                <span className="font-bold">&ldquo;{asker.label}&rdquo;</span> is looking for a noun. It found{" "}
                <span className="font-bold">&ldquo;{matches[0].tok.label}&rdquo;</span>. The other tokens didn&apos;t match.
              </div>
            );
          }

          const labels = matches.map((m) => m.tok.label);
          const quoted = labels.map((l) => `“${l}”`);
          const phrase =
            quoted.length === 2 ? `${quoted[0]} and ${quoted[1]}` : quoted.join(", ");
          return (
            <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
              <span className="font-bold">&ldquo;{asker.label}&rdquo;</span> is looking for a noun. It found{" "}
              <span className="font-bold">{phrase}</span>. The model can&apos;t tell which one matters yet.
            </div>
          );
        })()}
      </div>
    </WidgetContainer>
  );
}
