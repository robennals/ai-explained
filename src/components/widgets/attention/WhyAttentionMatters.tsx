"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

/* ------------------------------------------------------------------ */
/*  Data: hand-curated attention examples                             */
/* ------------------------------------------------------------------ */

interface SentenceExample {
  label: string;
  words: string[];
  /** Index of the auto-selected word */
  selectedWord: number;
  /** Maps word index → relevance weight 0-1 (controls arrow thickness) */
  targets: Record<number, number>;
  /** Explanation shown below */
  explanation: string;
}

const SENTENCES: SentenceExample[] = [
  {
    label: "What does it mean?",
    words: [
      "The", "bank", "by", "the", "river", "was",
      "covered", "in", "wildflowers", ".",
    ],
    selectedWord: 1,
    targets: { 4: 0.95 },
    explanation:
      '"bank" could mean a place for money or the side of a river. You need to see "river" to know which meaning is intended.',
  },
  {
    label: "What does it refer to?",
    words: [
      "I", "dropped", "the", "glass", "and", "it", "broke", ".",
    ],
    selectedWord: 5,
    targets: { 3: 0.95 },
    explanation:
      'What does "it" refer to? You have to look back to "glass" — the thing that was dropped.',
  },
  {
    label: "Who did it?",
    words: [
      "The", "chef", "who", "won", "the", "competition",
      "opened", "a", "restaurant", ".",
    ],
    selectedWord: 6,
    targets: { 1: 0.95 },
    explanation:
      'Who opened a restaurant? The chef — not the competition. You have to skip over the whole "who won the competition" clause to connect "opened" back to "chef."',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const HIGHLIGHT_HUE = 240;

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
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const sentence = SENTENCES[sentenceIdx];
  const selectedWord = sentence.selectedWord;
  const targets = sentence.targets;

  // Measure word positions and compute arrows after layout settles
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const fromEl = wordRefs.current.get(selectedWord);
      if (!fromEl) { setArrows([]); return; }

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top - containerRect.top;

      const newArrows: Arrow[] = [];
      for (const [idxStr, weight] of Object.entries(targets)) {
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
  }, [selectedWord, targets, sentenceIdx]);

  const handleReset = useCallback(() => {
    setSentenceIdx(0);
  }, []);

  const TABS = SENTENCES.map((s, i) => ({ id: String(i), label: s.label }));

  const handleTabChange = useCallback((tabId: string) => {
    setSentenceIdx(Number(tabId));
  }, []);

  // SVG padding above words for arcs
  const arcPad = 60;

  return (
    <WidgetContainer
      title="Which Words Matter?"
      description="The highlighted word needs help from specific other words. Follow the arrows."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector tabs */}
        <WidgetTabs
          tabs={TABS}
          activeTab={String(sentenceIdx)}
          onTabChange={handleTabChange}
        />

        {/* Word display with arrow overlay */}
        <div className="relative rounded-lg border border-border bg-surface" ref={containerRef}>
          {/* SVG overlay for curved arrows */}
          {arrows.length > 0 && (
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
              const isSelected = i === selectedWord;
              const isTarget = i in targets;

              return (
                <span
                  key={`${sentenceIdx}-${i}`}
                  ref={(el) => {
                    if (el) wordRefs.current.set(i, el);
                    else wordRefs.current.delete(i);
                  }}
                  className={`inline-block rounded px-1 py-0.5 ${
                    isSelected
                      ? "font-semibold text-accent ring-2 ring-accent ring-offset-1 ring-offset-surface"
                      : isTarget
                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                        : ""
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {sentence.explanation}
        </div>
      </div>
    </WidgetContainer>
  );
}
