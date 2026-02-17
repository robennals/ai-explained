"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Data: hand-curated attention examples                             */
/* ------------------------------------------------------------------ */

interface AttentionTarget {
  /** Maps source-word index → importance weight 0-1 */
  weights: Record<number, number>;
  /** One-line explanation shown when this word is selected */
  explanation: string;
}

interface SentenceExample {
  label: string;
  words: string[];
  /** Only some word indices are clickable (have attention data) */
  targets: Record<number, AttentionTarget>;
}

const SENTENCES: SentenceExample[] = [
  {
    label: "Pronoun resolution",
    words: [
      "The", "dog", "chased", "the", "cat", "because",
      "it", "was", "angry", ".",
    ],
    targets: {
      6: {
        // "it"
        weights: { 1: 0.9, 4: 0.25, 8: 0.15 },
        explanation:
          '"it" must refer to the dog — dogs chase things because they\'re angry, not the thing being chased.',
      },
      8: {
        // "angry"
        weights: { 1: 0.7, 6: 0.5 },
        explanation:
          '"angry" describes whoever "it" refers to — so you need to trace back through "it" to "dog."',
      },
    },
  },
  {
    label: "Word sense",
    words: [
      "The", "bank", "by", "the", "river", "was",
      "covered", "in", "wildflowers", ".",
    ],
    targets: {
      1: {
        // "bank"
        weights: { 4: 0.95, 8: 0.3 },
        explanation:
          '"bank" could mean a financial institution or a riverbank. "river" tells you which meaning is intended.',
      },
      6: {
        // "covered"
        weights: { 1: 0.6, 8: 0.7 },
        explanation:
          'What\'s covered? The bank. Covered in what? Wildflowers. You need both to picture the scene.',
      },
    },
  },
  {
    label: "Long-range subject",
    words: [
      "The", "chef", "who", "won", "the", "competition",
      "last", "year", "opened", "a", "restaurant", ".",
    ],
    targets: {
      8: {
        // "opened"
        weights: { 1: 0.9, 5: 0.25, 10: 0.4 },
        explanation:
          'Who opened? The chef — not the competition. The clause "who won the competition last year" is a detour; you have to skip over it to connect "opened" back to "chef."',
      },
    },
  },
  {
    label: "Tricky pronoun",
    words: [
      "The", "trophy", "didn't", "fit", "in", "the",
      "suitcase", "because", "it", "was", "too", "big", ".",
    ],
    targets: {
      8: {
        // "it"
        weights: { 1: 0.85, 6: 0.2, 11: 0.5 },
        explanation:
          '"it" refers to the trophy, not the suitcase. You need common-sense reasoning: if something is "too big" to fit, it\'s the object being packed, not the container.',
      },
    },
  },
  {
    label: "Negation + sentiment",
    words: [
      "The", "movie", "was", "not", "what", "I",
      "expected", "but", "I", "loved", "it", "anyway", ".",
    ],
    targets: {
      9: {
        // "loved"
        weights: { 1: 0.6, 3: 0.4, 7: 0.7, 10: 0.3 },
        explanation:
          '"but" signals a contrast — the movie wasn\'t as expected, yet still loved. Without seeing "but" and "not," you\'d misunderstand the sentiment.',
      },
      10: {
        // "it" (second)
        weights: { 1: 0.9, 9: 0.3 },
        explanation:
          '"it" refers all the way back to "movie" — the start of the sentence.',
      },
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/** Accent hue for highlights (indigo-ish) */
const HIGHLIGHT_HUE = 240;

function weightToBorder(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HIGHLIGHT_HUE}, 80%, 50%, ${alpha})`;
}

function weightToStroke(w: number): string {
  const alpha = 0.25 + w * 0.6;
  return `hsla(${HIGHLIGHT_HUE}, 75%, 55%, ${alpha})`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

export function WhyAttentionMatters() {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const sentence = SENTENCES[sentenceIdx];
  const currentTarget =
    selectedWord !== null ? sentence.targets[selectedWord] : null;

  const hasSelection = selectedWord !== null && currentTarget !== null;

  // Measure word positions and compute arrows after layout settles
  useEffect(() => {
    if (!hasSelection || !containerRef.current) {
      const raf = requestAnimationFrame(() => setArrows([]));
      return () => cancelAnimationFrame(raf);
    }

    // Wait a frame so the padding-top change has been applied
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const fromEl = wordRefs.current.get(selectedWord!);
      if (!fromEl) { setArrows([]); return; }

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top - containerRect.top;

      const newArrows: Arrow[] = [];
      for (const [idxStr, weight] of Object.entries(currentTarget!.weights)) {
        const idx = Number(idxStr);
        const toEl = wordRefs.current.get(idx);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX,
          fromY,
          toX: toRect.left + toRect.width / 2 - containerRect.left,
          toY: toRect.top - containerRect.top,
          weight,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [hasSelection, selectedWord, currentTarget, sentenceIdx]);

  const handleReset = useCallback(() => {
    setSentenceIdx(0);
    setSelectedWord(null);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentenceIdx(idx);
    setSelectedWord(null);
  };

  const isClickable = (wordIdx: number) => wordIdx in sentence.targets;

  // SVG padding above words for arcs
  const arcPad = 60;

  return (
    <WidgetContainer
      title="Which Words Matter?"
      description="Click a highlighted word to see which other words you need in order to understand it."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector tabs */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === sentenceIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Word display with arrow overlay */}
        <div className="relative rounded-lg border border-border bg-surface" ref={containerRef}>
          {/* SVG overlay for curved arrows */}
          {hasSelection && arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker
                  id="arrowhead"
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
                // Arc height based on horizontal distance
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.15, 100);
                // Control point is above midpoint
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
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          {/* Words */}
          <div className="flex flex-wrap gap-x-1 gap-y-0 px-5 py-4 text-lg" style={{ paddingTop: `${arcPad + 16}px` }}>
            {sentence.words.map((word, i) => {
              const clickable = isClickable(i);
              const isSelected = selectedWord === i;
              const weight = currentTarget?.weights[i] ?? 0;
              const isSource = currentTarget != null && weight > 0;

              return (
                <span
                  key={`${sentenceIdx}-${i}`}
                  className="inline-flex flex-col items-center"
                >
                  <span
                    ref={(el) => {
                      if (el) wordRefs.current.set(i, el);
                      else wordRefs.current.delete(i);
                    }}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => setSelectedWord(isSelected ? null : i) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedWord(isSelected ? null : i);
                            }
                          }
                        : undefined
                    }
                    className={`inline-block rounded px-1 py-0.5 transition-all duration-200 ${
                      clickable
                        ? "cursor-pointer font-semibold text-accent underline decoration-accent/40 decoration-2 underline-offset-4 hover:decoration-accent/70"
                        : ""
                    } ${isSelected ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""}`}
                  >
                    {word}
                  </span>
                  {/* Fixed-height slot for percentage pill — always present to prevent shifting */}
                  <span className="flex h-5 items-center">
                    {isSource ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold text-white transition-all duration-200"
                        style={{ backgroundColor: weightToBorder(weight) }}
                      >
                        {Math.round(weight * 100)}%
                      </span>
                    ) : null}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        <div
          className={`rounded-lg border px-4 py-3 text-sm transition-all duration-200 ${
            currentTarget
              ? "border-accent/30 bg-accent/5 text-foreground"
              : "border-border bg-foreground/[0.02] text-muted"
          }`}
        >
          {currentTarget ? (
            currentTarget.explanation
          ) : (
            <span>
              Click an{" "}
              <span className="font-semibold text-accent">underlined word</span>{" "}
              to see which other words help you understand it.
            </span>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
