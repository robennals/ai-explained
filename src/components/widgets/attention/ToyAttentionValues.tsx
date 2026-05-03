"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot, softmax, weightedSum } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data — 2D K/Q with a sink token AND a "none" key/query dim,       */
/*  matching the Sink widget. Off-task tokens park on the sink.       */
/*  Values are 2D [cat, dog]. Empty result [0, 0] = nothing gathered. */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];   // [noun, none]
  query: number[]; // [noun, none]
  value: number[]; // [cat, dog]
  valueLabel: string;
  color: string;
  hexColor: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const SINK: Token = {
  label: "sink",
  key: [0.5, 0.5], query: [0, 10], value: [0, 0], valueLabel: "–",
  color: "text-emerald-600 dark:text-emerald-400", hexColor: "#059669",
};
const CAT: Token = {
  label: "cat", key: [1, 0], query: [0, 10], value: [1, 0], valueLabel: "cat",
  color: "text-amber-600 dark:text-amber-400", hexColor: "#d97706",
};
const DOG: Token = {
  label: "dog", key: [1, 0], query: [0, 10], value: [0, 1], valueLabel: "dog",
  color: "text-blue-600 dark:text-blue-400", hexColor: "#2563eb",
};
const BLA: Token = {
  label: "blah", key: [0, 0], query: [0, 10], value: [0, 0], valueLabel: "–",
  color: "text-foreground/40", hexColor: "#9ca3af",
};
const IT: Token = {
  label: "it", key: [0, 0], query: [10, 0], value: [0, 0], valueLabel: "–",
  color: "text-purple-600 dark:text-purple-400", hexColor: "#9333ea",
};

const QUERY_PROPS = ["noun", "none"];
const VALUE_PROPS = ["cat", "dog"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [SINK, CAT, BLA, BLA, IT] },
  { label: "cat blah dog it", tokens: [SINK, CAT, BLA, DOG, IT] },
  { label: "dog blah dog it", tokens: [SINK, DOG, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [SINK, BLA, BLA, BLA, IT] },
];

/* ------------------------------------------------------------------ */
/*  Formatting                                                        */
/* ------------------------------------------------------------------ */

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

function outputLabel(v: number[]): string {
  const [cat, dog] = v;
  if (cat < 0.05 && dog < 0.05) return "empty — nothing useful gathered";
  if (cat >= 0.7 && dog < 0.3) return "mostly cat";
  if (dog >= 0.7 && cat < 0.3) return "mostly dog";
  if (cat > 0.3 && dog > 0.3) return `${Math.round(cat * 100)}% cat, ${Math.round(dog * 100)}% dog`;
  return `${Math.round(cat * 100)}% cat, ${Math.round(dog * 100)}% dog`;
}

/* ------------------------------------------------------------------ */
/*  Arrow helpers                                                     */
/* ------------------------------------------------------------------ */

const HUE = 240;

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HUE}, 75%, 55%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HUE}, 80%, 50%, ${alpha})`;
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
  const [selected, setSelected] = useState<number | null>(4); // default: "it"
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
  const output = weights ? weightedSum(weights, tokens.map((t) => t.value)) : null;
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
      title="Attention + Values"
      description={'See how attention weights blend token values into a result. Try the two-dog sentence — the result is sharper than with one dog.'}
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
                <marker id="val-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
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
                    markerEnd="url(#val-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          {/* Token cards. Grid on mobile (responsive layout from main), flex on desktop. */}
          <div
            className="grid gap-2 sm:flex sm:justify-center sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${tokens.length}, minmax(0, 1fr))`,
              paddingTop: `${arcPad + 8}px`,
            }}
          >
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const weight = weights?.[i];
              const isTarget = weight != null && weight > 0.01 && !isSelected;

              return (
                <div key={`${sentIdx}-${i}`} className="flex min-w-0 flex-col items-center sm:w-[145px]">
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
                    {/* QUERY card — same pattern as the other widgets */}
                    <VectorCard
                      name="" emoji="" properties={QUERY_PROPS} values={tok.query}
                      barColor="var(--color-accent)"
                      barMax={10} animate={false}
                      labelWidth="w-10" barWidth="w-8"
                      mobileHideBar
                      className={`text-xs w-full transition-colors ${
                        hasSelection && !isSelected ? "opacity-30" : ""
                      } ${
                        isSelected && askerHasAnyMatch ? "!border-accent" : ""
                      }`}
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />

                    {/* Big percentage */}
                    {weight != null && (
                      <span
                        className={`rounded-full px-3 py-0.5 font-mono text-sm font-bold ${
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

                    {/* Value card */}
                    <VectorCard
                      name="" emoji="" properties={VALUE_PROPS} values={tok.value}
                      barColor={tok.hexColor}
                      barMax={1} animate={false}
                      labelWidth="w-10" barWidth="w-8"
                      mobileHideBar
                      className={`text-xs w-full transition-colors ${
                        hasSelection && !isTarget && !isSelected ? "opacity-40" : ""
                      } ${
                        isTarget ? "!border-accent" : ""
                      }`}
                      label="VALUE"
                      footer={tok.valueLabel}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        {hasSelection && output && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <span className="text-xs font-semibold uppercase text-muted">Result for &ldquo;{tokens[selected!].label}&rdquo;:</span>
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
            />
          </div>
        )}

        {/* Big verdict callout — the headline answer */}
        {hasSelection && output && (
          <div className="rounded-lg border-2 border-accent bg-accent/10 px-4 py-4 text-center">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
              The answer
            </div>
            <div className="text-xl font-bold text-foreground">
              {outputLabel(output)}
            </div>
          </div>
        )}

        {/* "Two of a kind" callout — fires only on dog-blah-dog-it (or similar) */}
        {hasSelection && (() => {
          const counts = tokens.reduce<Record<string, number>>((acc, t) => {
            if (t.label === "cat" || t.label === "dog") acc[t.label] = (acc[t.label] ?? 0) + 1;
            return acc;
          }, {});
          const repeated = Object.entries(counts).find(([, n]) => n >= 2);
          if (!repeated) return null;
          return (
            <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
              The sentence has two <strong>&ldquo;{repeated[0]}&rdquo;</strong> tokens. The result is sharper than with just one because softmax&apos;s denominator dilutes the leak. More matches → more confident.
            </div>
          );
        })()}

        {/* Prompt when nothing selected */}
        {!hasSelection && (
          <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center text-sm text-muted">
            Click a token to see how attention weights blend values.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
