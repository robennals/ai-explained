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
  /**
   * Every word that publishes a "can answer" question: word index → that
   * question. Includes the matching target (whose question equals keyQuestion)
   * plus a couple of distractor words whose questions don't match the query.
   */
  answers: Record<number, string>;
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
    answers: {
      3: "What thing are we talking about?",
      1: "What action happened?",
      6: "What happened next?",
    },
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
    answers: {
      1: "Who performed the action?",
      5: "What event is mentioned?",
      8: "What was opened?",
    },
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
    answers: {
      1: "Where is this scene set?",
      4: "Who is in the scene?",
      5: "What action happened?",
    },
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
    answers: {
      3: "Which treaty am I?",
      7: "When did it happen?",
      12: "What place is affected?",
    },
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
    answers: {
      4: "Are we talking about a river?",
      8: "What is growing here?",
      6: "What state is it in?",
    },
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
  // In answering mode the reader can click any word that publishes a
  // "can answer" question to compare it against the query. null = the
  // matching word (the default the arrow points to).
  const [clickedAnswerer, setClickedAnswerer] = useState<number | null>(null);
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

  // The word currently being compared against the query (answering mode only).
  const effectiveAnswerer = mode === "answering" ? (clickedAnswerer ?? targetIdx) : targetIdx;
  const effectiveAnswererText = sentence.words[effectiveAnswerer];
  const answererMatches = effectiveAnswerer === targetIdx;

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

      // In answering mode the arrow follows whichever word is being compared.
      const arrowTargets: [number, number][] =
        mode === "answering"
          ? [[effectiveAnswerer, 0.95]]
          : Object.entries(targets).map(([k, w]) => [Number(k), w]);

      const newArrows: Arrow[] = [];
      for (const [idx, weight] of arrowTargets) {
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
  }, [selectedWord, targets, sentenceIdx, mode, effectiveAnswerer]);

  const handleReset = useCallback(() => {
    setSentenceIdx(0);
    setClickedAnswerer(null);
  }, []);

  const TABS = SENTENCES.map((s, i) => ({ id: String(i), label: s.label }));

  const handleTabChange = useCallback((tabId: string) => {
    setSentenceIdx(Number(tabId));
    setClickedAnswerer(null);
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
              const isAnswering = mode === "answering";
              const isAnswerable = isAnswering && i in sentence.answers && i !== selectedWord;
              const isCompared = isAnswering && i === effectiveAnswerer;
              const isTargetHighlight = isAnswering ? isCompared && answererMatches : i in targets;

              const cls = isSelected
                ? "font-semibold text-accent ring-2 ring-accent ring-offset-1 ring-offset-surface"
                : isTargetHighlight
                  ? "font-semibold text-indigo-600 dark:text-indigo-400"
                  : isCompared
                    ? "font-semibold text-foreground ring-1 ring-foreground/40 ring-offset-1 ring-offset-surface"
                    : isAnswerable
                      ? "cursor-pointer underline decoration-dotted decoration-foreground/30 underline-offset-4 hover:text-foreground"
                      : "";

              return (
                <span
                  key={`${sentenceIdx}-${i}`}
                  ref={(el) => {
                    if (el) wordRefs.current.set(i, el);
                    else wordRefs.current.delete(i);
                  }}
                  onClick={isAnswerable ? () => setClickedAnswerer(i) : undefined}
                  role={isAnswerable ? "button" : undefined}
                  tabIndex={isAnswerable ? 0 : undefined}
                  onKeyDown={
                    isAnswerable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setClickedAnswerer(i);
                          }
                        }
                      : undefined
                  }
                  className={`inline-block rounded px-1 py-0.5 ${cls}`}
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

        {/* Asks vs can-answer + match (answering mode). The reader can click
            any underlined word to compare its can-answer question. */}
        {mode === "answering" && (
          <div className="flex flex-col gap-2">
            <div className="text-center text-xs text-muted">
              Click any underlined word to compare the question it can answer.
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  {selectedWordText} asks
                </div>
                <div className="text-foreground">{sentence.query}</div>
              </div>
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  answererMatches
                    ? "border-indigo-400/50 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-border bg-foreground/[0.02]"
                }`}
              >
                <div
                  className={`mb-0.5 text-xs font-semibold uppercase tracking-wide ${
                    answererMatches ? "text-indigo-700 dark:text-indigo-300" : "text-muted"
                  }`}
                >
                  {effectiveAnswererText} can answer
                </div>
                <div className="text-foreground">{sentence.answers[effectiveAnswerer]}</div>
              </div>
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Answer
                </div>
                <div className={answererMatches ? "font-medium text-foreground" : "text-muted"}>
                  {answererMatches ? sentence.value : "— nothing to give"}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-foreground/[0.02] px-3 py-2 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                  !answererMatches
                    ? "bg-foreground/10 text-muted"
                    : sentence.inexact
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "bg-success/15 text-success"
                }`}
              >
                {!answererMatches ? "No match" : sentence.inexact ? "Close match" : "Exact match"}
              </span>
              <span className="text-muted">
                {!answererMatches
                  ? `"${effectiveAnswererText}" answers a different question, so "${selectedWordText}" looks elsewhere.`
                  : sentence.inexact
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
