"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";
import { findNearest } from "./embeddingUtils";

const PRESET_WORDS = ["dog", "guitar", "queen", "computer", "river", "doctor"];

function Autocomplete({
  words,
  onSelect,
  placeholder,
}: {
  words: string[];
  onSelect: (word: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (input.length < 1) return [];
    const lower = input.toLowerCase();
    return words.filter((w) => w.startsWith(lower)).slice(0, 8);
  }, [input, words]);

  const handleSelect = (word: string) => {
    onSelect(word);
    setInput("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0]);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
          {suggestions.map((word) => (
            <button
              key={word}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(word)}
              className="block w-full px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-accent/10"
            >
              {word}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmbeddingPlayground() {
  const { data, loading, error } = useEmbeddingData();
  const [mainWord, setMainWord] = useState("dog");

  const wordSet = useMemo(() => new Set(data?.words ?? []), [data]);

  const resetState = useCallback(() => {
    setMainWord("dog");
  }, []);

  const results = useMemo(() => {
    if (!data) return [];
    const mainIdx = data.words.indexOf(mainWord);
    if (mainIdx < 0) return [];

    const excludeSet = new Set<number>([mainIdx]);
    return findNearest(data.vectors[mainIdx], data.vectors, 10, excludeSet);
  }, [data, mainWord]);

  if (loading) {
    return (
      <WidgetContainer title="Exploring a Real Embedding" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading word vectors...
        </div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Exploring a Real Embedding">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Exploring a Real Embedding"
      description="Type a word to see its nearest neighbors in GloVe's 50-dimensional space."
      onReset={resetState}
    >
      {/* Preset buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted self-center">Try:</span>
        {PRESET_WORDS.map((word) => (
          <button
            key={word}
            onClick={() => setMainWord(word)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              word === mainWord
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-accent/10 hover:text-accent"
            }`}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        {/* Left: Input */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Word
          </label>
          <Autocomplete
            words={data.words}
            onSelect={(w) => {
              if (wordSet.has(w)) setMainWord(w);
            }}
            placeholder={mainWord}
          />
          <div className="mt-1.5 text-sm font-semibold text-foreground">{mainWord}</div>
        </div>

        {/* Right: Results */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Nearest Neighbors
          </label>

          {results.length === 0 ? (
            <div className="rounded-lg bg-surface p-4 text-xs text-muted">
              {wordSet.has(mainWord) ? "No results found." : `"${mainWord}" not in vocabulary.`}
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((r, i) => {
                const barWidth = Math.max(0, r.similarity * 100);
                return (
                  <div key={data.words[r.index]} className="flex items-center gap-2">
                    <span className="w-4 text-right text-[10px] text-muted">{i + 1}</span>
                    <span className="w-20 text-xs font-medium text-foreground truncate">
                      {data.words[r.index]}
                    </span>
                    <div className="flex-1 h-4 rounded-sm bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-sm bg-accent/40"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-[10px] font-mono text-muted">
                      {r.similarity.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
