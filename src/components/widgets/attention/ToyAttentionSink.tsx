"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot, softmax } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data — sink as a dedicated 5th token + a "none" key/query dim.    */
/*  Every off-task token (cat, dog, blah, sink itself) has its query  */
/*  pointing at the sink's "none" component, so attention always has  */
/*  somewhere harmless to land. Only "it" has a noun-finding query —  */
/*  which dominates when a real noun is around.                       */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];   // [noun, none]
  query: number[]; // [noun, none]
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const SINK: Token = {
  label: "sink",
  key: [0.5, 0.5], query: [0, 10],
  color: "text-emerald-600 dark:text-emerald-400",
};
const CAT: Token = {
  label: "cat", key: [1, 0], query: [0, 10],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [1, 0], query: [0, 10],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0, 0], query: [0, 10],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0, 0], query: [10, 0],
  color: "text-purple-600 dark:text-purple-400",
};

const PROPS = ["noun", "none"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [SINK, CAT, BLA, BLA, IT] },
  { label: "cat blah dog it", tokens: [SINK, CAT, BLA, DOG, IT] },
  { label: "dog blah dog it", tokens: [SINK, DOG, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [SINK, BLA, BLA, BLA, IT] },
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

export function ToyAttentionSink() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(4); // default: "it" (last token)
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(4);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    const newTokens = SENTENCES[idx].tokens;
    const itIdx = newTokens.map((t, i) => (t.label === "it" ? i : -1)).filter((i) => i >= 0);
    setSelected(itIdx.length > 0 ? itIdx[itIdx.length - 1] : newTokens.length - 1);
  };

  const scores = selected !== null
    ? tokens.map((t) => dot(tokens[selected].query, t.key))
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
      title="Attention with Sink"
      description={'A dedicated sink token absorbs attention when no real match exists. Click any token, try any sentence.'}
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
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 10 }}>
              <defs>
                <marker id="sink-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
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
                    markerEnd="url(#sink-arrowhead)"
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
              // Highlight a token's key only when it actually won meaningful attention,
              // not just because its raw score was non-zero. The sink's score is always
              // positive but should only "light up" when it actually absorbed attention.
              const isMatch = hasSelection && weight != null && weight > 0.05 && !isSelected;

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
                      name="" emoji="" properties={PROPS} values={tok.query}
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
                        isMatch ? "!border-accent" : ""
                      }`}
                      label="KEY"
                    />

                    {/* Big percentage */}
                    {weight != null && (
                      <span
                        className={`mt-0.5 rounded-full px-3 py-0.5 font-mono text-sm font-bold ${
                          isMatch
                            ? "text-white"
                            : isSelected
                            ? "text-accent"
                            : "text-muted"
                        }`}
                        style={isMatch ? { backgroundColor: weightToPill(weight) } : undefined}
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

        {/* Plain-English explanation */}
        {hasSelection && weights && (() => {
          const asker = tokens[selected!];
          const sinkWeight = weights[0]; // sink is always at position 0
          const matches = weights
            .map((w, i) => ({ w, tok: tokens[i], i }))
            .filter(({ i, tok }) => i !== selected && i !== 0 && tok.label !== "blah" && weights[i] > 0.05);

          if (asker.label !== "it") {
            return (
              <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-muted">
                <span className="font-bold text-foreground">&ldquo;{asker.label}&rdquo;</span> isn&apos;t looking
                for a noun in this head — its query points at the &ldquo;none&rdquo; dimension instead, which
                only the sink advertises. So almost all of its attention parks on the{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">sink</span> ({pct(sinkWeight)}).
                Off-task tokens have somewhere harmless to land.
              </div>
            );
          }

          if (matches.length === 0) {
            return (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
                <span className="font-bold">&ldquo;it&rdquo;</span> is looking for a noun, but there are no
                nouns in this sentence. The <span className="font-bold text-emerald-600 dark:text-emerald-400">sink</span> token
                wins by default ({pct(sinkWeight)}) because its key is the only thing that scores above zero.
              </div>
            );
          }

          if (matches.length === 1) {
            return (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
                <span className="font-bold">&ldquo;it&rdquo;</span> is looking for a noun. It found{" "}
                <span className="font-bold">&ldquo;{matches[0].tok.label}&rdquo;</span> ({pct(matches[0].w)}).
                The sink absorbs the small leftover ({pct(sinkWeight)}).
              </div>
            );
          }

          const labels = matches.map((m) => `“${m.tok.label}”`);
          const phrase = labels.length === 2 ? `${labels[0]} and ${labels[1]}` : labels.join(", ");
          return (
            <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
              <span className="font-bold">&ldquo;it&rdquo;</span> is looking for a noun. It found{" "}
              <span className="font-bold">{phrase}</span> with roughly equal weight. The sink absorbs the
              small leftover ({pct(sinkWeight)}).
            </div>
          );
        })()}
      </div>
    </WidgetContainer>
  );
}
