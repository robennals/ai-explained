"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SENTENCE = ["The", "cat", "chased", "the", "dog"];

const ATTENTION_SCORES = [
  [0.05, 0.25, 0.3, 0.1, 0.3],
  [0.15, 0.05, 0.35, 0.1, 0.35],
  [0.1, 0.4, 0.05, 0.1, 0.35],
  [0.1, 0.2, 0.25, 0.05, 0.4],
  [0.1, 0.35, 0.35, 0.1, 0.1],
];

function shuffleArray(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function HeatmapCell({
  value,
  maxVal,
}: {
  value: number;
  maxVal: number;
}) {
  const intensity = value / maxVal;
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-sm font-mono text-[10px] transition-all sm:h-12 sm:w-12"
      style={{
        backgroundColor: `rgba(99,102,241,${0.08 + intensity * 0.65})`,
        color: intensity > 0.5 ? "white" : undefined,
      }}
    >
      {value.toFixed(2)}
    </div>
  );
}

export function PositionScramble() {
  const [permutation, setPermutation] = useState<number[] | null>(null);

  const isScrambled = permutation !== null;
  const order = useMemo(() => permutation ?? [0, 1, 2, 3, 4], [permutation]);

  const displaySentence = useMemo(
    () => order.map((i) => SENTENCE[i]),
    [order]
  );

  // When scrambled, reorder the matrix so that the visual rows/cols follow
  // the new word positions, but the actual word-to-word scores stay the same.
  const displayMatrix = useMemo(() => {
    return order.map((fromOrig) =>
      order.map((toOrig) => ATTENTION_SCORES[fromOrig][toOrig])
    );
  }, [order]);

  const maxVal = Math.max(...ATTENTION_SCORES.flat());

  const handleScramble = () => {
    let newPerm = shuffleArray(5);
    // Ensure it's actually different from the original order
    while (newPerm.every((v, i) => v === i)) {
      newPerm = shuffleArray(5);
    }
    setPermutation(newPerm);
  };

  const handleReset = useCallback(() => {
    setPermutation(null);
  }, []);

  const scrambledText = isScrambled
    ? displaySentence.join(" ")
    : null;

  return (
    <WidgetContainer
      title="Attention is Order-Blind"
      description="Scramble the words and watch what happens to the attention scores"
      onReset={handleReset}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Sentence display */}
        <div className="flex flex-wrap gap-2">
          {displaySentence.map((word, i) => (
            <span
              key={i}
              className={`rounded-md border px-2.5 py-1 text-sm font-medium ${
                isScrambled
                  ? "border-amber-400/50 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              {word}
              <span className="ml-1 font-mono text-[9px] text-muted">
                {order[i]}
              </span>
            </span>
          ))}
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Column headers */}
            <div className="flex">
              <div className="h-8 w-11 sm:w-12" />
              {displaySentence.map((word, i) => (
                <div
                  key={i}
                  className="flex h-8 w-11 items-end justify-center sm:w-12"
                >
                  <span className="text-[10px] font-medium text-muted">
                    {word}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {displayMatrix.map((row, rowIdx) => (
              <div key={rowIdx} className="flex">
                <div className="flex h-11 w-11 items-center justify-end pr-1.5 sm:h-12 sm:w-12">
                  <span className="text-[10px] font-medium text-muted">
                    {displaySentence[rowIdx]}
                  </span>
                </div>
                {row.map((val, colIdx) => (
                  <HeatmapCell key={colIdx} value={val} maxVal={maxVal} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleScramble}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Scramble!
          </button>
          {isScrambled && (
            <button
              onClick={handleReset}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>

        {/* Warning when scrambled */}
        {isScrambled && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <span className="font-semibold">Same scores, different meaning!</span>{" "}
            &quot;The cat chased the dog&quot; ≠ &quot;{scrambledText}&quot;
          </div>
        )}

        {/* Explanation */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          The attention scores between words stay exactly the same, no matter
          what order they&apos;re in! Attention only looks at embeddings — it
          has no idea where words are in the sentence.{" "}
          <strong>This is a problem we need to fix.</strong>
        </div>
      </div>
    </WidgetContainer>
  );
}
