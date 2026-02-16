"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Hand-crafted attention data for real sentences (encoder-style)     */
/* ------------------------------------------------------------------ */

interface SentenceData {
  label: string;
  words: string[];
  /**
   * attention[i][j] = how much word i attends to word j.
   * Each row sums to ~1. Only words with interesting patterns
   * need hand-tuned rows; others get uniform attention.
   */
  attention: number[][];
  /** Optional per-word notes shown when that word is selected */
  notes?: Record<number, string>;
}

/** Build a uniform attention row of length n */
function uniform(n: number): number[] {
  return Array(n).fill(1 / n);
}

/** Build an attention row from sparse weights, normalize to sum=1 */
function row(n: number, weights: Record<number, number>): number[] {
  const r = Array(n).fill(0.01); // small baseline
  for (const [idx, w] of Object.entries(weights)) {
    r[Number(idx)] = w;
  }
  const sum = r.reduce((a, b) => a + b, 0);
  return r.map((v) => v / sum);
}

const SENTENCES: SentenceData[] = [
  {
    label: "Pronoun",
    words: ["The", "dog", "chased", "the", "cat", "because", "it", "was", "angry"],
    attention: (() => {
      const n = 9;
      return [
        uniform(n), // The
        row(n, { 1: 0.6, 2: 0.2, 4: 0.1 }), // dog
        row(n, { 1: 0.5, 4: 0.3, 2: 0.1 }), // chased
        uniform(n), // the
        row(n, { 4: 0.5, 1: 0.2, 2: 0.2 }), // cat
        row(n, { 2: 0.3, 6: 0.3, 8: 0.2 }), // because
        row(n, { 1: 0.7, 4: 0.15, 8: 0.1 }), // it → dog
        row(n, { 6: 0.4, 8: 0.3, 1: 0.15 }), // was
        row(n, { 6: 0.3, 1: 0.4, 7: 0.15 }), // angry → dog via it
      ];
    })(),
    notes: {
      6: '"it" attends strongly to "dog" — it needs to resolve which noun the pronoun refers to.',
      1: '"dog" mostly attends to itself and its verb "chased" — it\'s the subject.',
      8: '"angry" attends to "dog" and "it" — it describes whoever "it" refers to.',
      2: '"chased" looks at both its subject ("dog") and object ("cat").',
    },
  },
  {
    label: "Word sense",
    words: ["The", "bank", "by", "the", "river", "was", "steep"],
    attention: (() => {
      const n = 7;
      return [
        uniform(n),
        row(n, { 1: 0.3, 4: 0.45, 6: 0.15 }), // bank → river
        row(n, { 1: 0.4, 4: 0.3 }), // by
        uniform(n),
        row(n, { 4: 0.4, 1: 0.3, 2: 0.15 }), // river
        row(n, { 1: 0.4, 6: 0.3 }), // was
        row(n, { 1: 0.35, 5: 0.25, 4: 0.2 }), // steep → bank
      ];
    })(),
    notes: {
      1: '"bank" attends strongly to "river" — that\'s what tells you it means a riverbank, not a financial institution.',
      6: '"steep" attends to "bank" — it\'s describing the bank\'s slope.',
    },
  },
  {
    label: "Long-range",
    words: ["The", "chef", "who", "won", "the", "prize", "opened", "a", "restaurant"],
    attention: (() => {
      const n = 9;
      return [
        uniform(n),
        row(n, { 1: 0.3, 3: 0.25, 6: 0.25 }), // chef
        row(n, { 1: 0.6, 3: 0.2 }), // who → chef
        row(n, { 1: 0.3, 2: 0.2, 5: 0.25 }), // won
        uniform(n),
        row(n, { 3: 0.4, 5: 0.3 }), // prize
        row(n, { 1: 0.55, 8: 0.25 }), // opened → chef
        uniform(n),
        row(n, { 6: 0.4, 1: 0.25, 8: 0.15 }), // restaurant
      ];
    })(),
    notes: {
      6: '"opened" attends to "chef" — skipping over the entire "who won the prize" clause to find its true subject.',
      2: '"who" attends to "chef" — it\'s a relative pronoun referring back to the chef.',
    },
  },
  {
    label: "Negation",
    words: ["The", "film", "was", "not", "great", "but", "I", "enjoyed", "it"],
    attention: (() => {
      const n = 9;
      return [
        uniform(n),
        row(n, { 1: 0.3, 4: 0.2, 7: 0.2 }), // film
        row(n, { 1: 0.3, 4: 0.25, 3: 0.2 }), // was
        row(n, { 4: 0.5, 2: 0.2 }), // not → great
        row(n, { 3: 0.35, 1: 0.25, 2: 0.15 }), // great ← not
        row(n, { 3: 0.2, 4: 0.2, 7: 0.3 }), // but
        row(n, { 6: 0.4, 7: 0.3 }), // I
        row(n, { 1: 0.3, 5: 0.25, 8: 0.2, 6: 0.15 }), // enjoyed
        row(n, { 1: 0.65, 7: 0.2 }), // it → film
      ];
    })(),
    notes: {
      3: '"not" attends strongly to "great" — negation modifies the word that follows it.',
      7: '"enjoyed" attends to "film" (what was enjoyed), "but" (the contrast signal), and "it".',
      8: '"it" attends strongly to "film" — resolving the pronoun across the sentence.',
      5: '"but" signals a contrast — it connects the negative first half to the positive second half.',
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/** Attention weight → background color for attended-to words */
function weightToStyle(w: number): React.CSSProperties {
  if (w < 0.03) return {};
  const alpha = Math.min(0.15 + w * 0.75, 0.85);
  return {
    backgroundColor: `rgba(99, 102, 241, ${alpha})`,
    color: w > 0.35 ? "white" : undefined,
    borderRadius: 4,
  };
}

/** Style for the selected (query) word */
const selectedStyle: React.CSSProperties = {
  borderRadius: 4,
  outline: "2.5px solid var(--color-accent)",
  outlineOffset: 2,
  fontWeight: 700,
};

export function AttentionPlayground() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const sentence = SENTENCES[sentIdx];
  const attnRow = selected !== null ? sentence.attention[selected] : null;
  const note = selected !== null ? sentence.notes?.[selected] : null;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(null);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    setSelected(null);
  };

  return (
    <WidgetContainer
      title="Attention Playground"
      description="Click any word to see how much it attends to every other word."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence tabs */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Words */}
        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-3 rounded-lg border border-border bg-surface px-5 py-4">
          {sentence.words.map((word, i) => {
            const isSelected = selected === i;
            const weight = attnRow?.[i] ?? 0;

            return (
              <span key={`${sentIdx}-${i}`} className="relative inline-flex flex-col items-center">
                {/* Weight label */}
                {attnRow != null && weight >= 0.03 && !isSelected && (
                  <span
                    className="mb-0.5 font-mono text-[10px] font-bold leading-none"
                    style={{
                      color: weight > 0.3
                        ? "rgb(99, 102, 241)"
                        : "var(--color-muted)",
                    }}
                  >
                    {Math.round(weight * 100)}%
                  </span>
                )}
                {isSelected && (
                  <span className="mb-0.5 font-mono text-[10px] font-bold leading-none text-accent">
                    query
                  </span>
                )}
                {attnRow != null && !isSelected && weight < 0.03 && (
                  <span className="mb-0.5 text-[10px] leading-none text-transparent">·</span>
                )}
                <button
                  onClick={() => setSelected(isSelected ? null : i)}
                  className="cursor-pointer px-1.5 py-1 text-lg transition-all"
                  style={isSelected ? selectedStyle : weightToStyle(weight)}
                >
                  {word}
                </button>
              </span>
            );
          })}
        </div>

        {/* Note */}
        <div
          className={`rounded-lg border px-4 py-3 text-sm transition-all duration-200 ${
            note
              ? "border-accent/30 bg-accent/5 text-foreground"
              : selected !== null
                ? "border-border bg-foreground/[0.02] text-muted"
                : "border-border bg-foreground/[0.02] text-muted"
          }`}
        >
          {note ? (
            note
          ) : selected !== null ? (
            <span>
              <strong>{sentence.words[selected]}</strong> — no specific note for
              this word. Try clicking words that are pronouns, verbs, or
              ambiguous nouns.
            </span>
          ) : (
            "Click any word to see its attention pattern — which other words it focuses on most."
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
