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
    query: "the thing being referred to",
    keyQuestion: "a physical object",
    value: "It means the glass.",
    matchScore: 9,
    answers: {
      3: "a physical object",
      1: "an action",
      6: "an action",
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
    query: "someone who could have opened something",
    keyQuestion: "a person",
    value: "The chef did it.",
    matchScore: 9,
    answers: {
      1: "a person",
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
    query: "the place this sky is part of",
    keyQuestion: "a place",
    value: "The scene is on Mars.",
    matchScore: 9,
    answers: {
      1: "a place",
      4: "a person",
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
    query: "which specific treaty this is",
    keyQuestion: "a treaty, or a place",
    value: "The Treaty of Versailles, or the place Versailles.",
    matchScore: 9,
    answers: {
      3: "a treaty, or a place",
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
    query: "a river or some money",
    keyQuestion: "a river",
    value: "We mean a river.",
    matchScore: 6,
    inexact: true,
    answers: {
      4: "a river",
      8: "plants",
      6: "an action",
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

/** Height of the arc region above the dot-product grid, in pixels. */
const QKV_ARC_H = 52;

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
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2">
            <span className={`w-11 shrink-0 text-xs font-semibold uppercase leading-snug tracking-wide ${r.color}`}>
              {r.label}
            </span>
            <span className="text-base leading-snug text-foreground">{r.val}</span>
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
  // Dot-product mode arrow: x of the asker column and x of the compared column.
  const [qkvArrow, setQkvArrow] = useState<{ fromX: number; toX: number } | null>(null);
  // Dotted "exploded" connectors from each token in the grid down to its
  // detail card, so the cards read as a zoomed-in view of those two tokens.
  const [connectors, setConnectors] = useState<
    { x1: number; y1: number; x2: number; y2: number; kind: "query" | "key" }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const gridContentRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Map<number, HTMLElement>>(new Map());
  const explodeRef = useRef<HTMLDivElement>(null);
  const detailCardRefs = useRef<Map<number, HTMLElement>>(new Map());

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

  // Dot-product mode: measure the x of the asker column and the compared
  // column so we can draw an arrow between them across the top of the grid.
  // The arrow SVG lives inside the scrolling grid, so these coordinates are
  // relative to the grid content and stay aligned as it scrolls.
  useEffect(() => {
    if (mode === "basic") return;
    const raf = requestAnimationFrame(() => {
      const content = gridContentRef.current;
      const fromEl = colRefs.current.get(selectedWord);
      const toEl = colRefs.current.get(effectiveAnswerer);
      if (!content || !fromEl || !toEl || selectedWord === effectiveAnswerer) {
        setQkvArrow(null);
        return;
      }
      const c = content.getBoundingClientRect();
      const f = fromEl.getBoundingClientRect();
      const t = toEl.getBoundingClientRect();
      setQkvArrow({
        fromX: f.left + f.width / 2 - c.left,
        toX: t.left + t.width / 2 - c.left,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [effectiveAnswerer, selectedWord, sentenceIdx, mode]);

  // Keep the compared column horizontally visible inside the grid when it sits
  // off to one side. Scroll only the grid's own container, never the page, so
  // loading this widget below the fold can't yank the whole page down to it.
  useEffect(() => {
    if (mode === "basic") return;
    const raf = requestAnimationFrame(() => {
      const scroller = gridScrollRef.current;
      const col = colRefs.current.get(effectiveAnswerer);
      if (!scroller || !col) return;
      const s = scroller.getBoundingClientRect();
      const c = col.getBoundingClientRect();
      const pad = 12;
      if (c.left < s.left + pad) {
        scroller.scrollBy({ left: c.left - s.left - pad, behavior: "smooth" });
      } else if (c.right > s.right - pad) {
        scroller.scrollBy({ left: c.right - s.right + pad, behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [effectiveAnswerer, sentenceIdx, mode]);

  // Measure the dotted connectors from the query/key token columns down to
  // their detail cards, relative to the exploded-view wrapper.
  const measureConnectors = useCallback(() => {
    const wrap = explodeRef.current;
    if (mode === "basic" || !wrap) {
      setConnectors([]);
      return;
    }
    const w = wrap.getBoundingClientRect();
    const lines: { x1: number; y1: number; x2: number; y2: number; kind: "query" | "key" }[] = [];
    for (const idx of [selectedWord, effectiveAnswerer]) {
      const col = colRefs.current.get(idx);
      const card = detailCardRefs.current.get(idx);
      if (!col || !card) continue;
      const c = col.getBoundingClientRect();
      const cd = card.getBoundingClientRect();
      lines.push({
        x1: c.left + c.width / 2 - w.left,
        y1: c.bottom - w.top,
        x2: cd.left + cd.width / 2 - w.left,
        y2: cd.top - w.top,
        kind: idx === selectedWord ? "query" : "key",
      });
    }
    setConnectors(lines);
    // sentenceIdx: the grid columns and cards remount when the sentence changes,
    // so re-measure even if the token indices happen to line up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedWord, effectiveAnswerer, sentenceIdx]);

  // Recompute connectors on selection change, and keep them tracking while the
  // grid scrolls or the window resizes.
  useEffect(() => {
    if (mode === "basic") return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureConnectors);
    };
    run();
    const scroller = gridScrollRef.current;
    scroller?.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
    return () => {
      cancelAnimationFrame(raf);
      scroller?.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
    };
  }, [mode, measureConnectors]);

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

  const title =
    mode === "qkv"
      ? "Scoring the Match"
      : mode === "answering"
        ? "Query, Key, and Value"
        : "Which Tokens Need Other Tokens?";

  const description =
    mode === "qkv"
      ? "Each token's key gets a dot-product score against the query. Click any token to compare it; the matched token's value gets pulled in."
      : mode === "answering"
        ? "The highlighted token's query lines up with one token's key, strongly or loosely. Click other tokens to compare their keys."
        : "The highlighted token needs help from specific other tokens. Follow the arrow.";

  // The interactive token row, shared by the answering and dot-product modes.
  // The dot-product mode adds a match-score row; both draw the arc arrow from
  // the asker column to the compared column inside the scrolling content.
  const showScores = mode === "qkv";
  const tokenGrid = (
    <div ref={gridScrollRef} className="overflow-x-auto rounded-md border border-border">
      <div ref={gridContentRef} className="relative w-max">
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width="100%"
          height={QKV_ARC_H}
          style={{ zIndex: 10 }}
        >
          <defs>
            <marker id={`arc-arrowhead-${mode}`} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
              <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HIGHLIGHT_HUE}, 75%, 55%, 0.85)`} />
            </marker>
          </defs>
          {qkvArrow && (
            <path
              d={`M ${qkvArrow.fromX} ${QKV_ARC_H - 6} Q ${(qkvArrow.fromX + qkvArrow.toX) / 2} 2 ${qkvArrow.toX} ${QKV_ARC_H - 8}`}
              fill="none"
              stroke={`hsla(${HIGHLIGHT_HUE}, 75%, 55%, 0.85)`}
              strokeWidth={2}
              markerEnd={`url(#arc-arrowhead-${mode})`}
              className="transition-all duration-300"
            />
          )}
        </svg>
        <div className="border-b border-border" style={{ height: QKV_ARC_H }} aria-hidden />
        <div className="flex items-stretch">
          <div className="flex shrink-0 flex-col bg-foreground/[0.02]">
            <div
              className={`flex h-9 items-center justify-end px-3 text-[10px] font-semibold uppercase tracking-wide text-muted ${
                showScores ? "border-b border-border" : ""
              }`}
            >
              token
            </div>
            {showScores && (
              <div className="flex h-11 items-center justify-end px-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                match&nbsp;score
              </div>
            )}
          </div>
          {sentence.words.map((word, i) => {
            const isAsker = i === selectedWord;
            const isSel = i === effectiveAnswerer && !isAsker;
            const isTgt = i === targetIdx;
            const canClick = !isAsker && (mode === "qkv" || i in sentence.answers);
            const sc = scoreFor(i);
            return (
              <button
                key={`${sentenceIdx}-${i}`}
                ref={(el) => {
                  if (el) colRefs.current.set(i, el);
                  else colRefs.current.delete(i);
                }}
                onClick={canClick ? () => setClickedAnswerer(i) : undefined}
                aria-pressed={isSel}
                className={`flex flex-col items-stretch border-l border-border transition-colors ${
                  canClick ? "cursor-pointer hover:bg-accent/10" : "cursor-default"
                } ${
                  isAsker
                    ? "relative z-[1] bg-accent/10 ring-2 ring-inset ring-accent"
                    : isSel
                      ? isTgt
                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                        : "bg-accent/5"
                      : ""
                }`}
              >
                <div
                  className={`flex h-9 items-center justify-center whitespace-nowrap px-3 text-lg ${
                    showScores ? "border-b border-border" : ""
                  } ${
                    isAsker
                      ? "font-bold text-accent"
                      : isTgt
                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                        : "text-foreground"
                  } ${
                    canClick && !isSel && !showScores
                      ? "underline decoration-dotted decoration-accent/60 decoration-2 underline-offset-4"
                      : ""
                  }`}
                >
                  {word}
                </div>
                {showScores && (
                  <div
                    className={`flex h-11 items-center justify-center px-3 ${
                      isAsker
                        ? "text-[10px] font-semibold uppercase tracking-wide text-accent"
                        : `font-mono text-2xl font-bold ${isTgt ? "text-accent" : "text-muted/60"}`
                    }`}
                  >
                    {isAsker ? "query" : sc}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <WidgetContainer title={title} description={description} onReset={handleReset}>
      <div className="flex flex-col gap-5">
        {/* Sentence selector tabs */}
        <WidgetTabs tabs={TABS} activeTab={String(sentenceIdx)} onTabChange={handleTabChange} />

        {/* Basic mode reads the sentence naturally with an arrow overlay. The
            interactive modes use the exploded token-grid view below. */}
        {mode === "basic" && (
        <div className="relative rounded-lg border border-border bg-surface" ref={containerRef}>
          <>
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
              const isTargetHighlight = i in targets;

              const cls = isSelected
                ? "font-semibold text-accent ring-2 ring-accent ring-offset-1 ring-offset-surface"
                : isTargetHighlight
                  ? "font-semibold text-indigo-600 dark:text-indigo-400"
                  : "";

              return (
                <span
                  key={`${sentenceIdx}-${i}`}
                  ref={(el) => {
                    if (el) wordRefs.current.set(i, el);
                    else wordRefs.current.delete(i);
                  }}
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
          </>
        </div>
        )}


        {/* Interactive modes share one exploded view: the token row up top,
            then dotted connectors down to a detailed card for each of the two
            tokens being matched, the asker (its query) and the compared token
            (its key and value). Dot-product mode adds a match-score row and the
            numeric dot product; answering mode adds a match verdict. */}
        {isInteractive && (
          <div className="flex flex-col gap-4">
            <div className="text-center text-sm font-medium text-accent">
              {mode === "qkv"
                ? `Click any token to score its key against “${selectedWordText}”’s query.`
                : `Click any underlined token to compare its key against “${selectedWordText}”’s query.`}
            </div>

            <div ref={explodeRef} className="relative">
              <div className="rounded-lg border border-border bg-surface p-3">{tokenGrid}</div>

              {/* Dotted connectors: each token in the grid links down to its
                  expanded card, so the cards read as a zoom-in on those tokens. */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                style={{ zIndex: 5 }}
              >
                {connectors.map((ln) => {
                  const midY = (ln.y1 + ln.y2) / 2;
                  return (
                    <path
                      key={ln.kind}
                      d={`M ${ln.x1} ${ln.y1} C ${ln.x1} ${midY}, ${ln.x2} ${midY}, ${ln.x2} ${ln.y2}`}
                      fill="none"
                      stroke={`hsla(${HIGHLIGHT_HUE}, 35%, 55%, 0.7)`}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              <div className="h-7" aria-hidden />

              <div className="grid gap-3 sm:grid-cols-2">
                {[selectedWord, effectiveAnswerer]
                  .sort((a, b) => a - b)
                  .map((idx) => (
                    <div
                      key={idx}
                      ref={(el) => {
                        if (el) detailCardRefs.current.set(idx, el);
                        else detailCardRefs.current.delete(idx);
                      }}
                    >
                      {idx === selectedWord ? (
                        <TokenCard name={selectedWordText} tone="asker" query={sentence.query} />
                      ) : (
                        <TokenCard
                          name={effectiveAnswererText}
                          tone={answererMatches ? "match" : "nomatch"}
                          keyText={sentence.answers[effectiveAnswerer] ?? EMPTY}
                          value={answererMatches ? sentence.value : undefined}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {mode === "qkv" ? (
              <>
                <div className="rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-center text-sm leading-relaxed">
                  <span className="font-semibold text-accent">query</span> (&ldquo;{sentence.query}&rdquo;){" "}
                  <span className="text-lg font-bold text-muted">·</span>{" "}
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">key</span> (&ldquo;
                  {sentence.answers[effectiveAnswerer] ?? EMPTY}&rdquo;){" = "}
                  <span className="font-mono text-lg font-bold text-accent">{scoreFor(effectiveAnswerer)}</span>
                </div>
                <div className="text-center text-sm text-muted">
                  {answererMatches
                    ? `"${effectiveAnswererText}" is the best match, so its value gets pulled in.`
                    : `Far below "${sentence.words[targetIdx]}" at ${scoreFor(targetIdx)}, so it's mostly ignored.`}
                </div>
              </>
            ) : (
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
                  {!answererMatches ? "No match" : sentence.inexact ? "Loose match" : "Strong match"}
                </span>
                <span className="text-muted">
                  {!answererMatches
                    ? `"${effectiveAnswererText}" advertises something else, so "${selectedWordText}" looks elsewhere.`
                    : sentence.inexact
                      ? "the query and the key aren't identical, but they clearly line up."
                      : "the query and the key line up closely."}
                </span>
              </div>
            )}
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
