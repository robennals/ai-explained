"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Example {
  label: string;
  kind: "reorder" | "attention";
}

interface ReorderExample extends Example {
  kind: "reorder";
  sentenceA: string[];
  sentenceB: string[];
  meaningA: string;
  meaningB: string;
  explanation: string;
}

interface AttentionExample extends Example {
  kind: "attention";
  sentenceA: string[];
  sentenceB: string[];
  /** Which word index to highlight as the focus word (same word text in both) */
  focusWord: string;
  /** For sentence A: focus word index → target indices with weights */
  attentionA: { focusIdx: number; targets: Record<number, number> };
  /** For sentence B: focus word index → target indices with weights */
  attentionB: { focusIdx: number; targets: Record<number, number> };
  explanationA: string;
  explanationB: string;
}

type SentenceExample = ReorderExample | AttentionExample;

const EXAMPLES: SentenceExample[] = [
  {
    label: "What does \"it\" mean?",
    kind: "attention",
    sentenceA: ["The", "truck", "towed", "the", "car", ".", "It", "had", "broken", "down", "."],
    sentenceB: ["The", "car", "towed", "the", "truck", ".", "It", "had", "broken", "down", "."],
    focusWord: "It",
    attentionA: { focusIdx: 6, targets: { 4: 0.95 } },
    attentionB: { focusIdx: 6, targets: { 4: 0.95 } },
    explanationA: "\"It\" refers to the car — the thing being towed is the one that broke down.",
    explanationB: "Now \"it\" refers to the truck — swapping \"truck\" and \"car\" changes which one broke down.",
  },
  {
    label: "Moving one word",
    kind: "reorder",
    sentenceA: ["I", "only", "love", "you"],
    sentenceB: ["Only", "I", "love", "you"],
    meaningA: "You're the only person I love.",
    meaningB: "Nobody else loves you — just me.",
    explanation:
      "Moving \"only\" one position changes the entire meaning. Word order isn't just decoration — it's how language carries meaning.",
  },
  {
    label: "Active vs. passive",
    kind: "reorder",
    sentenceA: ["The", "dog", "bit", "the", "man"],
    sentenceB: ["The", "man", "bit", "the", "dog"],
    meaningA: "A dog attacked a person.",
    meaningB: "A person attacked a dog!",
    explanation:
      "Same five words, but who's biting whom is completely different. Position determines who does what to whom.",
  },
  {
    label: "Question or statement?",
    kind: "reorder",
    sentenceA: ["You", "are", "happy"],
    sentenceB: ["Are", "you", "happy"],
    meaningA: "A statement — I'm telling you how you feel.",
    meaningB: "A question — I'm asking how you feel.",
    explanation: "Swapping just the first two words turns a statement into a question.",
  },
];

/* ------------------------------------------------------------------ */
/*  Arrow helpers                                                      */
/* ------------------------------------------------------------------ */

const HIGHLIGHT_HUE = 240;

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HIGHLIGHT_HUE}, 75%, 55%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HIGHLIGHT_HUE}, 80%, 50%, ${alpha})`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Renders a sentence with optional attention arrows */
function SentenceDisplay({
  words,
  label,
  meaning,
  attention,
  arrowIdPrefix,
}: {
  words: string[];
  label: string;
  meaning?: string;
  attention?: { focusIdx: number; targets: Record<number, number> };
  arrowIdPrefix: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const arcPad = 50;

  useEffect(() => {
    if (!attention || !containerRef.current) {
      const raf = requestAnimationFrame(() => setArrows([]));
      return () => cancelAnimationFrame(raf);
    }

    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const fromEl = wordRefs.current.get(attention.focusIdx);
      if (!fromEl) {
        setArrows([]);
        return;
      }

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top - containerRect.top;

      const newArrows: Arrow[] = [];
      for (const [idxStr, weight] of Object.entries(attention.targets)) {
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
  }, [attention, words]);

  const markerId = `arrowhead-${arrowIdPrefix}`;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div
        className="relative rounded-lg border border-border bg-surface"
        ref={containerRef}
      >
        {/* SVG arrows */}
        {attention && arrows.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            style={{ zIndex: 10 }}
          >
            <defs>
              <marker
                id={markerId}
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
              const dx = Math.abs(a.toX - a.fromX);
              const arcHeight = Math.min(arcPad + dx * 0.15, 90);
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
                  markerEnd={`url(#${markerId})`}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        )}

        <div
          className="flex flex-wrap gap-x-1.5 gap-y-0 px-4 py-3 text-lg"
          style={attention ? { paddingTop: `${arcPad + 12}px` } : undefined}
        >
          {words.map((word, i) => {
            const isFocus = attention && i === attention.focusIdx;
            const weight = attention?.targets[i] ?? 0;
            const isTarget = weight > 0;

            return (
              <span key={i} className="inline-flex flex-col items-center">
                <span
                  ref={(el) => {
                    if (el) wordRefs.current.set(i, el);
                    else wordRefs.current.delete(i);
                  }}
                  className={`inline-block rounded px-1 py-0.5 transition-all duration-200 ${
                    isFocus
                      ? "font-bold text-accent ring-2 ring-accent ring-offset-1 ring-offset-surface"
                      : ""
                  }`}
                >
                  {word}
                </span>
                <span className="flex h-5 items-center">
                  {isTarget ? (
                    <span
                      className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold text-white"
                      style={{ backgroundColor: weightToPill(weight) }}
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
      {meaning && (
        <span className="text-sm text-foreground/70">{meaning}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export function WordOrderMatters() {
  const [exampleIdx, setExampleIdx] = useState(0);

  const example = EXAMPLES[exampleIdx];

  const handleReset = useCallback(() => {
    setExampleIdx(0);
  }, []);

  return (
    <WidgetContainer
      title="Word Order Changes Meaning"
      description="Pick an example to see how rearranging words changes what a sentence means."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Example selector */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setExampleIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === exampleIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Side-by-side sentence display */}
        <div className="grid gap-4 sm:grid-cols-2">
          {example.kind === "attention" ? (
            <>
              <SentenceDisplay
                words={example.sentenceA}
                label="Original"
                meaning={example.explanationA}
                attention={example.attentionA}
                arrowIdPrefix={`${exampleIdx}-a`}
              />
              <SentenceDisplay
                words={example.sentenceB}
                label="Words swapped"
                meaning={example.explanationB}
                attention={example.attentionB}
                arrowIdPrefix={`${exampleIdx}-b`}
              />
            </>
          ) : (
            <>
              <SentenceDisplay
                words={example.sentenceA}
                label="Version A"
                meaning={example.meaningA}
                arrowIdPrefix={`${exampleIdx}-a`}
              />
              <SentenceDisplay
                words={example.sentenceB}
                label="Version B"
                meaning={example.meaningB}
                arrowIdPrefix={`${exampleIdx}-b`}
              />
            </>
          )}
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {example.kind === "attention"
            ? "Swapping \"truck\" and \"car\" makes \"it\" refer to a completely different vehicle. A model that ignores word order can't tell these apart."
            : example.explanation}
        </div>
      </div>
    </WidgetContainer>
  );
}
