"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { ToggleControl } from "../shared/ToggleControl";

const SENTENCES = [
  {
    label: "Story opening",
    words: ["Once", "upon", "a", "time", "there", "was", "a", "cat"],
  },
  {
    label: "Simple sentence",
    words: ["The", "dog", "chased", "the", "cat", "up", "the", "tree"],
  },
  {
    label: "With pronoun",
    words: ["The", "cat", "sat", "because", "it", "was", "very", "tired"],
  },
];

// Colors for words to make them visually distinct
const WORD_COLORS = [
  "#60a5fa",
  "#f87171",
  "#4ade80",
  "#f59e0b",
  "#a78bfa",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function CausalMask() {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [maskEnabled, setMaskEnabled] = useState(true);

  const sentence = SENTENCES[sentenceIdx];
  const words = sentence.words;
  const n = words.length;

  const handleReset = useCallback(() => {
    setSentenceIdx(0);
    setSelectedWord(null);
    setMaskEnabled(true);
  }, []);

  // Can word `from` attend to word `to`?
  const canAttend = (from: number, to: number): boolean => {
    if (!maskEnabled) return true;
    return to <= from;
  };

  // Get attention strength (fake but illustrative — nearby words get more)
  const getAttentionWeight = (from: number, to: number): number => {
    if (!canAttend(from, to)) return 0;
    // Simple distance-based decay
    const dist = from - to;
    return Math.exp(-dist * 0.3);
  };

  // Normalize weights for a given `from` word
  const getNormalizedWeights = (from: number): number[] => {
    const raw = words.map((_, to) => getAttentionWeight(from, to));
    const sum = raw.reduce((a, b) => a + b, 0);
    return sum > 0 ? raw.map((w) => w / sum) : raw;
  };

  return (
    <WidgetContainer
      title="Causal Mask"
      description="See which words each position can attend to"
      onReset={handleReset}
    >
      {/* Sentence selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SENTENCES.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setSentenceIdx(i);
              setSelectedWord(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              sentenceIdx === i
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Mask toggle */}
      <div className="mb-4">
        <ToggleControl
          label="Causal mask (no peeking forward)"
          checked={maskEnabled}
          onChange={setMaskEnabled}
        />
      </div>

      {/* Word selector */}
      <div className="mb-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          Click a word to see what it can attend to
        </div>
        <div className="flex flex-wrap gap-2">
          {words.map((word, i) => {
            const isSelected = selectedWord === i;
            const isVisible =
              selectedWord !== null && canAttend(selectedWord, i);
            const isBlocked =
              selectedWord !== null && !canAttend(selectedWord, i);

            return (
              <button
                key={i}
                onClick={() => setSelectedWord(isSelected ? null : i)}
                className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                  isSelected
                    ? "border-accent bg-accent/10 text-accent ring-2 ring-accent/20"
                    : isBlocked
                      ? "border-red-500/30 bg-red-500/5 text-red-400/50 line-through"
                      : isVisible
                        ? "border-green-500/50 bg-green-500/10 text-foreground"
                        : "border-border bg-surface text-foreground hover:border-foreground/30"
                }`}
              >
                {word}
                <span className="ml-1 text-[9px] font-normal text-muted">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
        {selectedWord !== null && (
          <div className="mt-2 text-xs text-muted">
            <span className="font-semibold text-accent">
              &ldquo;{words[selectedWord]}&rdquo;
            </span>{" "}
            (position {selectedWord + 1}) can see{" "}
            {maskEnabled ? (
              <>
                positions 1–{selectedWord + 1} (
                {selectedWord + 1} word{selectedWord > 0 ? "s" : ""})
              </>
            ) : (
              <>all {n} words (no mask)</>
            )}
            {!maskEnabled && (
              <span className="ml-1 text-red-400">
                — it can see the future!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attention matrix */}
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        Attention matrix {maskEnabled ? "(triangle — no future access)" : "(full — cheating!)"}
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex">
            <div className="h-8 w-16 shrink-0" />
            {words.map((word, j) => (
              <div
                key={j}
                className="flex h-8 w-10 items-end justify-center pb-0.5"
              >
                <span
                  className="origin-bottom-left -rotate-45 whitespace-nowrap text-[9px] font-medium"
                  style={{ color: WORD_COLORS[j % WORD_COLORS.length] }}
                >
                  {word}
                </span>
              </div>
            ))}
          </div>
          {/* Rows */}
          {words.map((fromWord, i) => (
            <div key={i} className="flex items-center">
              <div
                className="flex h-10 w-16 shrink-0 items-center justify-end pr-2 text-[10px] font-medium"
                style={{ color: WORD_COLORS[i % WORD_COLORS.length] }}
              >
                {fromWord}
              </div>
              {words.map((_, j) => {
                const allowed = canAttend(i, j);
                const isFromSelected = selectedWord === i;
                const isToHighlighted = isFromSelected && allowed;
                const isToBlocked = isFromSelected && !allowed;
                const weight = allowed ? getNormalizedWeights(i)[j] : 0;

                return (
                  <div
                    key={j}
                    className={`flex h-10 w-10 items-center justify-center border transition-all ${
                      isToBlocked
                        ? "border-red-500/20 bg-red-500/10"
                        : isToHighlighted
                          ? "border-accent/30"
                          : "border-border/30"
                    }`}
                    style={{
                      backgroundColor: allowed
                        ? isToHighlighted
                          ? `color-mix(in srgb, var(--color-accent) ${Math.round(weight * 80)}%, transparent)`
                          : `color-mix(in srgb, var(--color-foreground) ${Math.round(weight * 30)}%, transparent)`
                        : isToBlocked
                          ? undefined
                          : "var(--color-foreground-05, rgba(0,0,0,0.03))",
                    }}
                  >
                    {allowed ? (
                      <span
                        className={`text-[9px] font-mono ${isToHighlighted ? "font-bold text-accent" : "text-muted"}`}
                      >
                        {(weight * 100).toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-400/40">✕</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-3 rounded-md border border-border bg-surface/50 px-3 py-2 text-xs text-muted">
        {maskEnabled ? (
          <>
            The causal mask creates a <strong>triangle</strong> — each word can
            only attend to itself and earlier words. The upper-right is blocked.
            This is what makes text generation possible: the model learns to
            predict without peeking.
          </>
        ) : (
          <>
            With the mask off, every word can see every other word — including{" "}
            <strong>future words</strong>. During training, this would mean the
            model just copies the answer instead of learning patterns. Try
            turning the mask back on!
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
