"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

/* ------------------------------------------------------------------ */
/*  Modes                                                              */
/*  - basic: just which words matter (arrows + enriched meaning)       */
/*  - qa:    each word asks a plain-English question, another answers  */
/*  - qkv:   the question becomes a query/key, the answer a value,     */
/*           matched by a (made-up) dot-product score                  */
/* ------------------------------------------------------------------ */

type Mode = "basic" | "qa" | "answering" | "qkv";

interface SentenceExample {
  label: string;
  words: string[];
  /** Index of the auto-selected word */
  selectedWord: number;
  /** Maps word index → relevance weight 0-1 (controls arrow thickness) */
  targets: Record<number, number>;
  /** Explanation shown below */
  explanation: string;
  /** Richer meaning the selected word gets once it gathers info from the target */
  enrichedMeaning: string;
  /** The question the highlighted word is asking (its query). */
  query: string;
  /** The question the matched word can answer (its key). */
  keyQuestion: string;
  /** What the matched word hands back, written as a full statement (its value). */
  value: string;
  /** A made-up match score between the query and the matched key, 0-10. */
  matchScore: number;
  /** True when the query and key overlap without being identical. */
  inexact?: boolean;
}

const SENTENCES: SentenceExample[] = [
  {
    label: "What does it refer to?",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", "."],
    selectedWord: 5,
    targets: { 3: 0.95 },
    explanation:
      'What does "it" refer to? You have to look back to "glass," the thing that was dropped.',
    enrichedMeaning: "the glass",
    query: "What thing are we talking about?",
    keyQuestion: "What thing are we talking about?",
    value: "We're talking about the glass.",
    matchScore: 9,
  },
  {
    label: "Who did it?",
    words: ["The", "chef", "who", "won", "the", "competition", "opened", "a", "restaurant", "."],
    selectedWord: 6,
    targets: { 1: 0.95 },
    explanation:
      'Who opened a restaurant? The chef, not the competition. You have to skip over the whole "who won the competition" clause to connect "opened" back to "chef."',
    enrichedMeaning: "opened by the chef",
    query: "Who performed the action?",
    keyQuestion: "Who performed the action?",
    value: "The chef performed it.",
    matchScore: 9,
  },
  {
    label: "Where is this?",
    words: ["On", "Mars", ",", "the", "astronaut", "looked", "up", "at", "the", "sky", "."],
    selectedWord: 9,
    targets: { 1: 0.95 },
    explanation:
      'Which sky? The Martian one. "sky" has to reach back to "Mars" to become "the sky of Mars," not the sky on Earth.',
    enrichedMeaning: "the sky of Mars",
    query: "Where is this scene set?",
    keyQuestion: "Where is this scene set?",
    value: "The scene is set on Mars.",
    matchScore: 8,
  },
  {
    label: "Which one?",
    words: ["The", "Treaty", "of", "Versailles", "was", "signed", "in", "1919", "…", "the", "treaty", "reshaped", "Europe", "."],
    selectedWord: 10,
    targets: { 3: 0.95 },
    explanation:
      'Which treaty reshaped Europe? You have to reach back across the gap to "Versailles" to know. Once a model has been through several transformer layers, "Versailles" itself may already carry that it means the treaty, not the city, along with the treaty\'s details. The Transformers chapter shows how.',
    enrichedMeaning: "the Treaty of Versailles",
    query: "Which specific treaty is this?",
    keyQuestion: "Which treaty am I?",
    value: "It's the Treaty of Versailles.",
    matchScore: 8,
  },
  {
    label: "What does it mean?",
    words: ["The", "bank", "by", "the", "river", "was", "covered", "in", "wildflowers", "."],
    selectedWord: 1,
    targets: { 4: 0.95 },
    explanation:
      '"bank" could mean a place for money or the side of a river. You need to see "river" to know which meaning is intended.',
    enrichedMeaning: "the bank of a river",
    query: "Are we talking about a river or money?",
    keyQuestion: "Are we talking about a river?",
    value: "We're talking about a river.",
    matchScore: 6,
    inexact: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
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

export function WhyAttentionMatters({ mode = "basic" }: { mode?: Mode } = {}) {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [boxAnchorX, setBoxAnchorX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const sentence = SENTENCES[sentenceIdx];
  const selectedWord = sentence.selectedWord;
  const targets = sentence.targets;
  const targetIdx = Number(Object.keys(targets)[0]);
  const selectedWordText = sentence.words[selectedWord];
  const targetWordText = sentence.words[targetIdx];

  // Measure word positions and compute arrows after layout settles
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const fromEl = wordRefs.current.get(selectedWord);
      if (!fromEl) {
        setArrows([]);
        setBoxAnchorX(null);
        return;
      }

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
      setBoxAnchorX(fromX);
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

  const description =
    mode === "qkv"
      ? "The highlighted word's question becomes a query and a key; the answer becomes a value. They match by a score."
      : mode === "answering"
        ? "The highlighted word asks a question; the word it points to can answer one. See whether they match exactly or just closely."
        : mode === "qa"
          ? "Each highlighted word asks a question. Another word in the sentence answers it. Follow the arrow."
          : "The highlighted word needs help from specific other words. Follow the arrow.";

  return (
    <WidgetContainer title="Which Words Matter?" description={description} onReset={handleReset}>
      <div className="flex flex-col gap-5">
        {/* Sentence selector tabs */}
        <WidgetTabs tabs={TABS} activeTab={String(sentenceIdx)} onTabChange={handleTabChange} />

        {/* Word display with arrow overlay */}
        <div className="relative rounded-lg border border-border bg-surface" ref={containerRef}>
          {/* SVG overlay for curved arrows */}
          {arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HIGHLIGHT_HUE}, 75%, 55%, 0.7)`} />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.15, 100);
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
          <div className="flex flex-wrap gap-x-1 gap-y-0 px-5 pt-4 text-lg" style={{ paddingTop: `${arcPad + 16}px` }}>
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

          {/* Enriched-meaning box (basic mode only) */}
          {mode === "basic" ? (
            <div className="relative px-5 pb-5 pt-2">
              {boxAnchorX !== null && (
                <div
                  className="pointer-events-none absolute text-sm"
                  style={{ left: `${boxAnchorX}px`, top: 0, transform: "translateX(-50%)", maxWidth: "calc(100% - 24px)" }}
                >
                  <div className="mx-auto mb-1 h-3 w-px bg-indigo-400/60 dark:bg-indigo-400/40" />
                  <div className="rounded-md border border-indigo-400/60 bg-indigo-50 px-3 py-1.5 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-950/40">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">{selectedWordText}</span>
                    <span className="text-muted">: </span>
                    <span className="italic text-foreground">{sentence.enrichedMeaning}</span>
                  </div>
                </div>
              )}
              <div className="h-14" aria-hidden />
            </div>
          ) : (
            <div className="pb-3" aria-hidden />
          )}
        </div>

        {/* Plain-English question and answer (qa mode) */}
        {mode === "qa" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
              <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                {selectedWordText} asks
              </div>
              <div className="text-foreground">{sentence.query}</div>
            </div>
            <div className="rounded-lg border border-indigo-400/50 bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40">
              <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                {targetWordText} answers
              </div>
              <div className="text-foreground">{sentence.value}</div>
            </div>
          </div>
        )}

        {/* Asks vs can-answer + exact/close match (answering mode) */}
        {mode === "answering" && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  {selectedWordText} asks
                </div>
                <div className="text-foreground">{sentence.query}</div>
              </div>
              <div className="rounded-lg border border-indigo-400/50 bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                  {targetWordText} can answer
                </div>
                <div className="text-foreground">{sentence.keyQuestion}</div>
              </div>
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Answer
                </div>
                <div className="font-medium text-foreground">{sentence.value}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-foreground/[0.02] px-3 py-2 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                  sentence.inexact ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-success/15 text-success"
                }`}
              >
                {sentence.inexact ? "Close match" : "Exact match"}
              </span>
              <span className="text-muted">
                {sentence.inexact
                  ? "the two questions aren't identical, but they overlap enough to count."
                  : "the question asked and the question answered are the same."}
              </span>
            </div>
          </div>
        )}

        {/* Query / key / value + match score (qkv mode) */}
        {mode === "qkv" && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  Query · {selectedWordText}
                </div>
                <div className="text-foreground">{sentence.query}</div>
              </div>
              <div className="rounded-lg border border-indigo-400/50 bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                  Key · {targetWordText}
                </div>
                <div className="text-foreground">{sentence.keyQuestion}</div>
              </div>
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Value
                </div>
                <div className="font-medium text-foreground">{sentence.value}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-foreground/[0.02] px-3 py-2 text-sm">
              <span className="text-muted">Query · Key match score</span>
              <span className="font-mono text-xl font-bold text-accent">{sentence.matchScore}</span>
              <span className="text-muted">
                {sentence.inexact
                  ? "— a loose match: the question asks about more than the key answers, but they overlap enough to win."
                  : "— a strong match: the question and the key line up."}
              </span>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {sentence.explanation}
        </div>
      </div>
    </WidgetContainer>
  );
}
