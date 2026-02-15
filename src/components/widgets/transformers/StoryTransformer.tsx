"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const STORY_DATA: Record<string, { word: string; prob: number }[]> = {
  "Once upon a time there was a little": [
    { word: "girl", prob: 0.28 },
    { word: "boy", prob: 0.24 },
    { word: "dog", prob: 0.12 },
    { word: "cat", prob: 0.09 },
    { word: "rabbit", prob: 0.06 },
  ],
  "Once upon a time there was a little girl": [
    { word: "named", prob: 0.35 },
    { word: "who", prob: 0.28 },
    { word: "with", prob: 0.1 },
    { word: "called", prob: 0.08 },
    { word: "and", prob: 0.05 },
  ],
  "Once upon a time there was a little girl named": [
    { word: "Lily", prob: 0.18 },
    { word: "Emma", prob: 0.12 },
    { word: "Sara", prob: 0.1 },
    { word: "Mia", prob: 0.09 },
    { word: "Lucy", prob: 0.08 },
  ],
  "Once upon a time there was a little girl named Lily": [
    { word: "who", prob: 0.32 },
    { word: ".", prob: 0.2 },
    { word: "and", prob: 0.12 },
    { word: "that", prob: 0.08 },
    { word: ",", prob: 0.07 },
  ],
  "Once upon a time there was a little girl named Lily who": [
    { word: "loved", prob: 0.25 },
    { word: "lived", prob: 0.18 },
    { word: "had", prob: 0.12 },
    { word: "wanted", prob: 0.1 },
    { word: "was", prob: 0.08 },
  ],
  "Once upon a time there was a little girl named Lily who loved": [
    { word: "to", prob: 0.4 },
    { word: "her", prob: 0.12 },
    { word: "animals", prob: 0.08 },
    { word: "flowers", prob: 0.06 },
    { word: "playing", prob: 0.05 },
  ],
  "Once upon a time there was a little girl named Lily who loved to": [
    { word: "play", prob: 0.3 },
    { word: "sing", prob: 0.12 },
    { word: "dance", prob: 0.1 },
    { word: "read", prob: 0.08 },
    { word: "explore", prob: 0.07 },
  ],
  "The big brown dog": [
    { word: "was", prob: 0.25 },
    { word: "ran", prob: 0.18 },
    { word: "sat", prob: 0.12 },
    { word: "jumped", prob: 0.1 },
    { word: "barked", prob: 0.08 },
  ],
  "The big brown dog ran": [
    { word: "to", prob: 0.22 },
    { word: "through", prob: 0.15 },
    { word: "across", prob: 0.12 },
    { word: "into", prob: 0.1 },
    { word: "around", prob: 0.08 },
  ],
  "The big brown dog ran to": [
    { word: "the", prob: 0.35 },
    { word: "his", prob: 0.12 },
    { word: "her", prob: 0.1 },
    { word: "its", prob: 0.08 },
    { word: "a", prob: 0.07 },
  ],
  "The big brown dog ran to the": [
    { word: "park", prob: 0.18 },
    { word: "door", prob: 0.12 },
    { word: "garden", prob: 0.1 },
    { word: "little", prob: 0.08 },
    { word: "river", prob: 0.07 },
  ],
  "It was a sunny day and the children were": [
    { word: "playing", prob: 0.3 },
    { word: "happy", prob: 0.15 },
    { word: "excited", prob: 0.1 },
    { word: "running", prob: 0.08 },
    { word: "laughing", prob: 0.06 },
  ],
  "It was a sunny day and the children were playing": [
    { word: "in", prob: 0.35 },
    { word: "outside", prob: 0.15 },
    { word: "with", prob: 0.12 },
    { word: "together", prob: 0.08 },
    { word: "happily", prob: 0.06 },
  ],
  "It was a sunny day and the children were playing in": [
    { word: "the", prob: 0.45 },
    { word: "a", prob: 0.1 },
    { word: "their", prob: 0.08 },
    { word: "his", prob: 0.05 },
    { word: "her", prob: 0.04 },
  ],
  "It was a sunny day and the children were playing in the": [
    { word: "park", prob: 0.25 },
    { word: "garden", prob: 0.18 },
    { word: "yard", prob: 0.12 },
    { word: "water", prob: 0.08 },
    { word: "field", prob: 0.06 },
  ],
};

const ATTENTION_HINTS: Record<
  string,
  { from: string; to: string; strength: string }[]
> = {
  "Once upon a time there was a little girl named Lily who loved to": [
    { from: "loved", to: "Lily", strength: "strong" },
    { from: "loved", to: "girl", strength: "medium" },
    { from: "to", to: "loved", strength: "strong" },
  ],
};

const PRESETS = [
  "Once upon a time there was a little",
  "The big brown dog",
  "It was a sunny day and the children were",
];

export function StoryTransformer() {
  const [text, setText] = useState(PRESETS[0]);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const predictions = STORY_DATA[text] || null;
  const words = text.split(" ");
  const wordCount = words.length;

  // Find attention hints for current text
  const currentAttentionHints = ATTENTION_HINTS[text] || [];

  // Determine which words are highlighted by attention when hovering
  const getAttentionTargets = (word: string): Set<string> => {
    const targets = new Set<string>();
    for (const hint of currentAttentionHints) {
      if (hint.from === word) {
        targets.add(hint.to);
      }
      if (hint.to === word) {
        targets.add(hint.from);
      }
    }
    return targets;
  };

  const attentionTargets = hoveredWord
    ? getAttentionTargets(hoveredWord)
    : new Set<string>();

  const handleSelectWord = (word: string) => {
    setText((prev) => prev + " " + word);
  };

  const handleReset = useCallback(() => {
    setText(PRESETS[0]);
    setHoveredWord(null);
  }, []);

  // Highlight last few words
  const highlightCount = 3;
  const splitIndex = Math.max(0, words.length - highlightCount);
  const normalWords = words.slice(0, splitIndex);
  const highlightedWords = words.slice(splitIndex);

  return (
    <WidgetContainer
      title="Story Transformer"
      description="See how a transformer predicts the next word, one step at a time"
      onReset={handleReset}
    >
      {/* Preset buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setText(preset);
              setHoveredWord(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              text.startsWith(preset) && text === preset
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {preset.length > 30 ? preset.slice(0, 30) + "..." : preset}
          </button>
        ))}
      </div>

      {/* Current text display */}
      <div className="mb-4 rounded-lg border border-border bg-surface p-4">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
          Current text
        </div>
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 leading-relaxed">
          {normalWords.map((word, i) => {
            const isAttentionTarget =
              hoveredWord !== null && attentionTargets.has(word);
            return (
              <span
                key={`${i}-${word}`}
                className={`text-sm transition-all ${
                  isAttentionTarget
                    ? "rounded bg-accent/20 px-0.5 font-semibold text-accent"
                    : "text-foreground"
                }`}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
              >
                {word}
              </span>
            );
          })}
          {highlightedWords.map((word, i) => {
            const isAttentionTarget =
              hoveredWord !== null && attentionTargets.has(word);
            return (
              <span
                key={`h-${i}-${word}`}
                className={`text-sm font-semibold transition-all ${
                  isAttentionTarget
                    ? "rounded bg-accent/20 px-0.5 text-accent"
                    : "text-accent"
                }`}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
              >
                {word}
              </span>
            );
          })}
          <span className="inline-block h-4 w-0.5 animate-pulse bg-accent" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted">{wordCount} words</span>
          {currentAttentionHints.length > 0 && (
            <span className="text-[10px] text-accent">
              Hover words to see attention patterns
            </span>
          )}
        </div>
      </div>

      {/* Predictions */}
      {predictions ? (
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            Top-5 next word predictions (click to extend)
          </div>
          <div className="flex flex-col gap-1.5">
            {predictions.map(({ word, prob }) => {
              const barWidth = prob * 100 * 2.5; // scale up for visibility
              return (
                <button
                  key={word}
                  onClick={() => handleSelectWord(word)}
                  className="group flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  <span className="w-16 shrink-0 font-mono text-sm font-semibold text-foreground">
                    {word}
                  </span>
                  <div className="relative flex-1">
                    <div className="h-5 w-full rounded bg-foreground/5">
                      <div
                        className="h-full rounded bg-accent/60 transition-all group-hover:bg-accent"
                        style={{ width: `${Math.min(100, barWidth)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-xs text-muted">
                    {(prob * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface/50 p-6 text-center">
          <div className="text-sm text-muted">
            This path isn&apos;t pre-computed &mdash; try one of the preset prompts to
            start fresh!
          </div>
          <button
            onClick={() => {
              setText(PRESETS[0]);
              setHoveredWord(null);
            }}
            className="mt-3 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Start Over button */}
      {predictions && text !== PRESETS[0] && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setText(PRESETS[0]);
              setHoveredWord(null);
            }}
            className="rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Start Over
          </button>
        </div>
      )}
    </WidgetContainer>
  );
}
