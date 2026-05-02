"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot, softmax, weightedSum } from "./toyMath";

interface Token {
  label: string;
  key: number[];     // [noun, sink]
  query: number[];   // [noun, sink]
  value: number[];   // [cat, dog, nothing]
  color: string;
  hexColor: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const CAT: Token = {
  label: "cat",
  key: [1, 1], query: [0, 1], value: [1, 0, 0],
  color: "text-amber-600 dark:text-amber-400", hexColor: "#d97706",
};
const DOG: Token = {
  label: "dog",
  key: [1, 1], query: [0, 1], value: [0, 1, 0],
  color: "text-blue-600 dark:text-blue-400", hexColor: "#2563eb",
};
const BLA: Token = {
  label: "blah",
  key: [0, 1], query: [0, 1], value: [0, 0, 1],
  color: "text-foreground/40", hexColor: "#9ca3af",
};
const IT: Token = {
  label: "it",
  key: [0, 1], query: [3, 1], value: [0, 0, 1],
  color: "text-purple-600 dark:text-purple-400", hexColor: "#9333ea",
};

const KQ_PROPS = ["noun", "sink"];
const VALUE_PROPS = ["cat", "dog", "nothing"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "dog blah dog it", tokens: [DOG, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [BLA, BLA, BLA, IT] },
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

function describeOutput(v: number[]): string {
  const [cat, dog, nothing] = v;
  if (nothing > 0.85) return "no useful info gathered — pure fallback.";
  if (cat > 0.7 && dog < 0.1) return `mostly cat, with about ${Math.round(nothing * 100)}% sink leak.`;
  if (dog > 0.7 && cat < 0.1) return `mostly dog, with about ${Math.round(nothing * 100)}% sink leak.`;
  if (cat > 0.3 && dog > 0.3) return `${Math.round(cat * 100)}% cat, ${Math.round(dog * 100)}% dog — the model isn't sure.`;
  return `${Math.round(cat * 100)}% cat, ${Math.round(dog * 100)}% dog, ${Math.round(nothing * 100)}% nothing.`;
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
  const [selected, setSelected] = useState<number | null>(3);
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
    setSelected(SENTENCES[idx].tokens.length - 1); // default to last token
  };

  const scores = selected !== null
    ? tokens.map((t) => dot(tokens[selected].query, t.key))
    : null;
  const weights = scores ? softmax(scores) : null;
  const output = weights ? weightedSum(weights, tokens.map((t) => t.value)) : null;
  const hasSelection = selected !== null;

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
      description={'Click any token, try any sentence. The sink dimension gives attention somewhere to go when nothing matches.'}
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
              const isTarget = weight != null && weight > 0.01 && !isSelected;

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 140 }}>
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
                      name="" emoji="" properties={KQ_PROPS} values={tok.key}
                      barMax={1} animate={false}
                      labelWidth="w-12" barWidth="w-10" className="text-xs w-full" label="KEY"
                    />
                    <VectorCard
                      name="" emoji="" properties={KQ_PROPS} values={tok.query}
                      barColor="var(--color-accent)"
                      barMax={3} animate={false}
                      labelWidth="w-12" barWidth="w-10" className="text-xs w-full"
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />
                    <VectorCard
                      name="" emoji="" properties={VALUE_PROPS} values={tok.value}
                      barColor={tok.hexColor}
                      barMax={1} animate={false}
                      labelWidth="w-12" barWidth="w-10" className="text-xs w-full"
                      label="VALUE"
                    />

                    {hasSelection && scores && (
                      <div className="text-center font-mono text-[10px] text-muted leading-tight">
                        score = <span className="font-bold text-foreground">{scores[i]}</span>
                      </div>
                    )}

                    {weight != null && (
                      isTarget ? (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
                          style={{ backgroundColor: weightToPill(weight) }}
                        >
                          {pct(weight)}
                        </span>
                      ) : (
                        <span className={`font-mono text-[10px] font-bold ${isSelected ? "text-accent" : "text-muted"}`}>
                          {pct(weight)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result vector */}
        {hasSelection && output && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <span className="text-xs font-semibold uppercase text-muted">Result for &ldquo;{tokens[selected!].label}&rdquo;:</span>
            <VectorCard
              name="" emoji="" properties={VALUE_PROPS} values={output}
              barColor="#059669"
              barMax={1} animate={false}
              labelWidth="w-12" barWidth="w-12" className="text-xs"
              label="OUTPUT"
              labelColor="#059669"
            />
          </div>
        )}

        {/* Plain-English explanation */}
        {hasSelection && output && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            <strong>What this means: </strong>
            {tokens[selected!].label === "it"
              ? `it was looking for a noun. ${describeOutput(output)}`
              : `${tokens[selected!].label} isn't asking the noun-finding question, so this head is idle for it. ${describeOutput(output)}`}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
