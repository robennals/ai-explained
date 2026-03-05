"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

/* ------------------------------------------------------------------ */
/*  Data — same toy tokens as ALiBiToyTokens                          */
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
  label: "bla", key: [0], query: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], query: [S],
  color: "text-purple-600 dark:text-purple-400",
};

const SENTENCES: Sentence[] = [
  { label: "dog bla bla bla cat bla it", tokens: [DOG, BLA, BLA, BLA, CAT, BLA, IT] },
  { label: "cat bla bla bla dog bla it", tokens: [CAT, BLA, BLA, BLA, DOG, BLA, IT] },
  { label: "dog bla cat bla it", tokens: [DOG, BLA, CAT, BLA, IT] },
  { label: "cat bla bla bla bla dog bla bla it", tokens: [CAT, BLA, BLA, BLA, BLA, DOG, BLA, BLA, IT] },
];

/* ------------------------------------------------------------------ */
/*  Math                                                              */
/* ------------------------------------------------------------------ */

/**
 * We take the 1D key/query value, treat it as the x-component of a 2D
 * vector (x, 0), rotate by the given angle, then compute a 2D dot product.
 */
function rotateScalar(value: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [value * Math.cos(rad), value * Math.sin(rad)];
}

function dot2(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
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

const HIGHLIGHT_HUE = 30; // amber hue to distinguish from ALiBi's blue

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HIGHLIGHT_HUE}, 75%, 50%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HIGHLIGHT_HUE}, 80%, 45%, ${alpha})`;
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

export function RotationToyTokens() {
  const [sentIdx, setSentIdx] = useState(0);
  const [degPerPos, setDegPerPos] = useState(15);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;
  const itIdx = tokens.length - 1;
  const selected = itIdx;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setDegPerPos(15);
  }, []);

  // Compute rotated dot products and attention weights
  const itQuery = rotateScalar(tokens[selected].query[0], selected * degPerPos);
  const rawScores = tokens.map((t, i) => {
    const rotatedKey = rotateScalar(t.key[0], i * degPerPos);
    return dot2(itQuery, rotatedKey);
  });
  const weights = softmax(rawScores);

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
      title="Rotation Applied to a Dimension"
      description="One dimension gets split into x/y and rotated by position. Drag the speed to see distance-based attention emerge."
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

        {/* Rotation speed slider */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Rotation speed (degrees per position)
          </div>
          <SliderControl
            label=""
            value={degPerPos}
            min={0}
            max={45}
            step={1}
            onChange={setDegPerPos}
            formatValue={(v) => `${v}°`}
          />
          <div className="mt-1 text-[11px] text-amber-700/70 dark:text-amber-400/70">
            {degPerPos === 0
              ? "No rotation — attention is position-blind. Both nouns get equal scores."
              : `Each position rotates by ${degPerPos}°. Nearby keys stay more aligned with the query.`}
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
                    id="rotation-arrowhead"
                    markerWidth="6"
                    markerHeight="5"
                    refX="5"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 6 2.5, 0 5"
                      fill={`hsla(${HIGHLIGHT_HUE}, 75%, 50%, 0.7)`}
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
                      markerEnd="url(#rotation-arrowhead)"
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
              const angleDiff = Math.abs((itIdx - i) * degPerPos);
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
                          rot {(i * degPerPos)}°
                        </span>
                        {degPerPos > 0 && isNoun && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400">
                            Δ{angleDiff}°
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
