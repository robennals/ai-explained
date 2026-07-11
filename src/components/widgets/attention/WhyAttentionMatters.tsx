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

type Mode = "basic" | "answering" | "qkv";

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
  /** What the highlighted word is looking for (its query), as search keywords. */
  query: string;
  /** What the matched word has (its key), as search keywords. */
  keyQuestion: string;
  /** The answer the matched word hands back (its value). */
  value: string;
  /** A made-up match score between the query and the matched key, 0-10. */
  matchScore: number;
  /** True when the query and key overlap without being identical. */
  inexact?: boolean;
  /**
   * Every word that advertises what it has: word index → those keywords.
   * Includes the matching target (whose keywords equal keyQuestion) plus a
   * couple of distractor words whose keywords don't match the query.
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
    query: "the thing being talked about",
    keyQuestion: "the thing being talked about",
    value: "It means the glass.",
    matchScore: 9,
    answers: {
      3: "the thing being talked about",
      1: "an action that happened",
      6: "what happened next",
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
    query: "the doer of the action",
    keyQuestion: "the doer of the action",
    value: "The chef did it.",
    matchScore: 9,
    answers: {
      1: "the doer of the action",
      5: "an event",
      8: "a place",
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
    query: "where the scene is set",
    keyQuestion: "where the scene is set",
    value: "The scene is on Mars.",
    matchScore: 9,
    answers: {
      1: "where the scene is set",
      4: "a person in the scene",
      5: "an action",
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
    query: "which specific treaty",
    keyQuestion: "which specific treaty",
    value: "It's the Treaty of Versailles.",
    matchScore: 9,
    answers: {
      3: "which specific treaty",
      7: "a date",
      12: "a place",
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
    query: "a river or money",
    keyQuestion: "a river",
    value: "We mean a river.",
    matchScore: 6,
    inexact: true,
    answers: {
      4: "a river",
      8: "plants",
      6: "a state",
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

/** Placeholder shown for a query/key/value field a token isn't using here. */
const EMPTY = "–";

/**
 * One token shown as a card: its name on top, then whichever of its query,
 * key, and value it uses in this match. Only fields that are passed (not
 * undefined) are shown, so the token doing the looking shows just its query
 * and the token being found shows just its key and value.
 */
function TokenCard({
  name,
  tone,
  query,
  keyText,
  value,
}: {
  name: string;
  tone: "asker" | "match" | "nomatch";
  query?: string;
  keyText?: string;
  value?: string;
}) {
  const headerColor =
    tone === "asker"
      ? "text-accent"
      : tone === "match"
        ? "text-indigo-700 dark:text-indigo-300"
        : "text-foreground";
  const rows = [
    query !== undefined ? { label: "Query", val: query, color: "text-accent" } : null,
    keyText !== undefined ? { label: "Key", val: keyText, color: "text-indigo-700 dark:text-indigo-300" } : null,
    value !== undefined ? { label: "Value", val: value, color: "text-foreground/70" } : null,
  ].filter((r): r is { label: string; val: string; color: string } => r !== null);
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <div className={`mb-1.5 border-b border-border pb-1 text-center text-base font-bold ${headerColor}`}>
        &ldquo;{name}&rdquo;
      </div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2">
            <span className={`w-11 shrink-0 text-[10px] font-semibold uppercase leading-snug tracking-wide ${r.color}`}>
              {r.label}
            </span>
            <span className="leading-snug text-foreground">{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  const sentence = SENTENCES[sentenceIdx];
  const selectedWord = sentence.selectedWord;
  const targets = sentence.targets;
  const targetIdx = Number(Object.keys(targets)[0]);
  const selectedWordText = sentence.words[selectedWord];

  // Answering and dot-product modes are interactive: the reader can click a
  // token to compare it against the query.
  const isInteractive = mode === "answering" || mode === "qkv";
  const effectiveAnswerer = isInteractive ? (clickedAnswerer ?? targetIdx) : targetIdx;
  const effectiveAnswererText = sentence.words[effectiveAnswerer];
  const answererMatches = effectiveAnswerer === targetIdx;
  // The asker's query scored against a token's key. The target gets the real
  // match; every other token gets a small, deterministic non-zero score, well
  // below the match (real dot products of unrelated tokens are rarely exactly
  // zero, just small).
  const scoreFor = (i: number) => (i === targetIdx ? sentence.matchScore : ((i * 37 + 11) % 3) + 1);

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

      // In the interactive modes the arrow follows whichever token is being compared.
      const arrowTargets: [number, number][] =
        mode === "answering" || mode === "qkv"
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

  // Dot-product mode: keep the selected token's card centered in the scrolling
  // row. inline:"center" scrolls the row horizontally; block:"nearest" avoids
  // moving the page vertically.
  useEffect(() => {
    if (mode !== "qkv") return;
    const raf = requestAnimationFrame(() => {
      cardRefs.current.get(effectiveAnswerer)?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [effectiveAnswerer, sentenceIdx, mode]);

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
      ? "Each token's key gets a dot-product score against the query. Click any token to compare it; the matched token's value gets pulled in."
      : mode === "answering"
        ? "The highlighted token's query matches one token's key, exactly or closely. Click other tokens to compare their keys."
        : "The highlighted token needs help from specific other tokens. Follow the arrow.";

  // The query box shown at the top of the interactive panels.
  const queryBox = (
    <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-accent">
        Query for &ldquo;{selectedWordText}&rdquo;
      </div>
      <div className="text-foreground">{sentence.query}</div>
    </div>
  );

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
              // Dot-product mode: every token is clickable and gets a score.
              // Answering mode: only tokens that publish a key are clickable.
              const isAnswerable =
                i !== selectedWord &&
                (mode === "qkv" || (mode === "answering" && i in sentence.answers));
              const isCompared = isInteractive && i === effectiveAnswerer;
              const isTargetHighlight = isInteractive ? isCompared && answererMatches : i in targets;

              const clickableStyle =
                mode === "qkv"
                  ? "cursor-pointer transition-colors hover:bg-accent/10 hover:text-accent"
                  : "cursor-pointer underline decoration-accent decoration-dotted decoration-2 underline-offset-4 transition-colors hover:bg-accent/10 hover:text-accent";
              const cls = isSelected
                ? "font-semibold text-accent ring-2 ring-accent ring-offset-1 ring-offset-surface"
                : isTargetHighlight
                  ? "font-semibold text-indigo-600 dark:text-indigo-400"
                  : isCompared
                    ? "font-semibold text-foreground ring-1 ring-foreground/40 ring-offset-1 ring-offset-surface"
                    : isAnswerable
                      ? clickableStyle
                      : "";

              const score = scoreFor(i);
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
                  className={`${
                    mode === "qkv" ? "inline-flex flex-col items-center align-top" : "inline-block"
                  } rounded px-1 py-0.5 ${cls}`}
                >
                  {mode === "qkv" ? (
                    <>
                      <span className="leading-tight">{word}</span>
                      <span
                        className={`mt-0.5 font-mono text-2xl font-bold leading-none ${
                          i === selectedWord ? "opacity-0" : i === targetIdx ? "text-accent" : "text-muted/60"
                        }`}
                      >
                        {score}
                      </span>
                    </>
                  ) : (
                    word
                  )}
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


        {/* Query on top, the compared token as a card below (answering mode). */}
        {mode === "answering" && (
          <div className="flex flex-col gap-2">
            <div className="text-center text-sm font-medium text-accent">
              Click any underlined token to compare its key.
            </div>
            {queryBox}
            <TokenCard
              name={effectiveAnswererText}
              tone={answererMatches ? "match" : "nomatch"}
              keyText={sentence.answers[effectiveAnswerer] ?? EMPTY}
              value={answererMatches ? sentence.value : undefined}
            />
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
                  ? `"${effectiveAnswererText}" has a different key, so "${selectedWordText}" looks elsewhere.`
                  : sentence.inexact
                    ? "the query and the key aren't identical, but they overlap enough to count."
                    : "the query and the key are the same."}
              </span>
            </div>
          </div>
        )}

        {/* Query on top, a horizontal row of token cards below (dot-product
            mode). The selected token's card stays centered and highlighted. */}
        {mode === "qkv" && (
          <div className="flex flex-col gap-3">
            <div className="text-center text-sm font-medium text-accent">
              Click any token to score its key against the query.
            </div>
            {queryBox}
            <div
              ref={rowRef}
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ paddingLeft: "calc(50% - 5.5rem)", paddingRight: "calc(50% - 5.5rem)" }}
            >
              {sentence.words.map((word, i) => {
                if (i === selectedWord) return null;
                const isSel = i === effectiveAnswerer;
                const isTgt = i === targetIdx;
                const cardKey = sentence.answers[i] ?? EMPTY;
                const cardVal = isTgt ? sentence.value : undefined;
                const sc = scoreFor(i);
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    onClick={() => setClickedAnswerer(i)}
                    className={`flex w-44 shrink-0 flex-col rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                      isSel
                        ? isTgt
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                          : "border-accent bg-accent/5"
                        : "border-border bg-surface hover:border-foreground/25"
                    }`}
                  >
                    <div
                      className={`border-b border-border pb-1 text-center text-base font-bold ${
                        isSel && isTgt ? "text-indigo-700 dark:text-indigo-300" : "text-foreground"
                      }`}
                    >
                      &ldquo;{word}&rdquo;
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 text-sm">
                      <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                        Key
                      </span>
                      <span className="leading-snug text-foreground">{cardKey}</span>
                    </div>
                    {cardVal !== undefined && (
                      <div className="mt-1 flex items-baseline gap-2 text-sm">
                        <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                          Value
                        </span>
                        <span className="leading-snug text-foreground">{cardVal}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-baseline justify-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-muted">score</span>
                      <span className={`font-mono text-3xl font-bold ${isTgt ? "text-accent" : "text-muted"}`}>{sc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-sm text-muted">
              {answererMatches
                ? `"${effectiveAnswererText}" scores ${scoreFor(effectiveAnswerer)}, the best match, so its value gets pulled in.`
                : `"${effectiveAnswererText}" scores only ${scoreFor(effectiveAnswerer)}, far below "${sentence.words[targetIdx]}".`}
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
