"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SENTENCE = [
  "The",
  "cat",
  "sat",
  "on",
  "the",
  "mat",
  "because",
  "it",
  "was",
  "tired",
];

const HEADS = [
  {
    name: "Head 1: Nearby words",
    description: "Focuses on grammatically adjacent words",
    target: 7,
    weights: [0.02, 0.03, 0.05, 0.03, 0.02, 0.04, 0.35, 0.0, 0.38, 0.08],
    color: "#3b82f6",
  },
  {
    name: "Head 2: Reference",
    description: "Finds what pronouns refer to",
    target: 7,
    weights: [0.03, 0.42, 0.05, 0.02, 0.03, 0.08, 0.05, 0.0, 0.12, 0.2],
    color: "#10b981",
  },
  {
    name: "Head 3: Subject-verb",
    description: "Connects subjects to their verbs",
    target: 7,
    weights: [0.05, 0.08, 0.3, 0.02, 0.05, 0.03, 0.04, 0.0, 0.35, 0.08],
    color: "#f59e0b",
  },
];

const WEIGHT_THRESHOLD = 0.05;

function AttentionArc({
  fromX,
  toX,
  weight,
  color,
  rowOffset,
}: {
  fromX: number;
  toX: number;
  weight: number;
  color: string;
  rowOffset: number;
}) {
  if (weight <= WEIGHT_THRESHOLD) return null;

  const midX = (fromX + toX) / 2;
  const distance = Math.abs(toX - fromX);
  const arcHeight = Math.min(distance * 0.4, 40) + rowOffset * 8;

  return (
    <path
      d={`M ${fromX} 0 Q ${midX} ${-arcHeight} ${toX} 0`}
      fill="none"
      stroke={color}
      strokeWidth={weight * 5 + 0.5}
      opacity={0.3 + weight * 0.7}
    />
  );
}

export function MultiHead() {
  const [visibleHeads, setVisibleHeads] = useState<boolean[]>([
    true,
    true,
    true,
  ]);
  const [selectedWord, setSelectedWord] = useState(7);

  const handleReset = useCallback(() => {
    setVisibleHeads([true, true, true]);
    setSelectedWord(7);
  }, []);

  const toggleHead = (index: number) => {
    setVisibleHeads((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // We only have data for word 7 ("it")
  const hasData = selectedWord === 7;

  return (
    <WidgetContainer
      title="Multi-Head Attention"
      description="Different heads learn to look for different things in the same sentence"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Sentence with arcs */}
        <div className="overflow-x-auto">
          <div className="relative min-w-[600px] px-2">
            {/* SVG arcs layer */}
            <svg
              className="absolute left-0 top-0 w-full"
              height="60"
              style={{ overflow: "visible" }}
            >
              <g transform="translate(0, 58)">
                {hasData &&
                  HEADS.map(
                    (head, headIdx) =>
                      visibleHeads[headIdx] &&
                      SENTENCE.map((_, wordIdx) => {
                        if (wordIdx === selectedWord) return null;
                        const fromX = selectedWord * 62 + 31 + 8;
                        const toX = wordIdx * 62 + 31 + 8;
                        return (
                          <AttentionArc
                            key={`${headIdx}-${wordIdx}`}
                            fromX={fromX}
                            toX={toX}
                            weight={head.weights[wordIdx]}
                            color={head.color}
                            rowOffset={headIdx}
                          />
                        );
                      })
                  )}
              </g>
            </svg>

            {/* Word chips */}
            <div className="relative flex gap-1 pt-[60px]">
              {SENTENCE.map((word, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedWord(i)}
                  className={`w-[60px] shrink-0 rounded-md px-1.5 py-1.5 text-center text-xs font-medium transition-all ${
                    i === selectedWord
                      ? "bg-accent text-white"
                      : "border border-border bg-surface text-foreground hover:border-accent/40"
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!hasData && (
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-xs text-muted">
            Attention data is only available for &quot;it&quot; (position 8) in
            this demo. Click &quot;it&quot; to see the attention patterns.
          </div>
        )}

        {/* Head toggles and weights */}
        <div className="flex flex-col gap-3">
          {HEADS.map((head, headIdx) => (
            <div
              key={headIdx}
              className={`rounded-lg border px-3 py-2 transition-opacity ${
                visibleHeads[headIdx]
                  ? "border-border bg-surface"
                  : "border-border/50 bg-surface/50 opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleHead(headIdx)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{
                    borderColor: head.color,
                    backgroundColor: visibleHeads[headIdx]
                      ? head.color
                      : "transparent",
                  }}
                >
                  {visibleHeads[headIdx] && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: head.color }}
                  >
                    {head.name}
                  </span>
                  <span className="ml-2 text-[10px] text-muted">
                    {head.description}
                  </span>
                </div>
              </div>
              {hasData && visibleHeads[headIdx] && (
                <div className="mt-2 flex gap-1">
                  {SENTENCE.map((word, wordIdx) => (
                    <div
                      key={wordIdx}
                      className="flex w-[48px] shrink-0 flex-col items-center gap-0.5"
                    >
                      <div className="relative h-8 w-full rounded-sm bg-foreground/5">
                        <div
                          className="absolute bottom-0 w-full rounded-sm transition-all"
                          style={{
                            height: `${head.weights[wordIdx] * 100}%`,
                            backgroundColor: head.color,
                            opacity: 0.3 + head.weights[wordIdx] * 1.5,
                          }}
                        />
                      </div>
                      <span className="text-[8px] text-muted">{word}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key message */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          Each head specializes. <strong>Head 1</strong> looks at nearby grammar.{" "}
          <strong>Head 2</strong> finds what &quot;it&quot; refers to (the cat!).{" "}
          <strong>Head 3</strong> connects subjects to verbs.
        </div>
      </div>
    </WidgetContainer>
  );
}
