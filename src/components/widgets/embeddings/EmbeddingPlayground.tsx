"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";
import { vecAdd, vecSub, findNearest } from "./embeddingUtils";

interface Preset {
  label: string;
  word: string;
  closeTo: string[];
  farFrom: string[];
}

const PRESETS: Preset[] = [
  { label: "dog", word: "dog", closeTo: [], farFrom: [] },
  { label: "guitar", word: "guitar", closeTo: [], farFrom: [] },
  { label: "king → queen", word: "king", closeTo: ["woman"], farFrom: ["man"] },
  { label: "puppy → kitten", word: "puppy", closeTo: ["cat"], farFrom: ["dog"] },
  { label: "paris → rome", word: "paris", closeTo: ["italy"], farFrom: ["france"] },
];

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

function WordChip({
  word,
  onRemove,
}: {
  word: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
      {word}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 text-accent/60 hover:bg-accent/20 hover:text-accent"
        aria-label={`Remove ${word}`}
      >
        &times;
      </button>
    </span>
  );
}

export function EmbeddingPlayground() {
  const { data, loading, error } = useEmbeddingData();
  const [mainWord, setMainWord] = useState("dog");
  const [closeTo, setCloseTo] = useState<string[]>([]);
  const [farFrom, setFarFrom] = useState<string[]>([]);

  const wordSet = useMemo(() => new Set(data?.words ?? []), [data]);

  const resetState = useCallback(() => {
    setMainWord("dog");
    setCloseTo([]);
    setFarFrom([]);
  }, []);

  // Compute query vector: base + sum(closeTo) - sum(farFrom)
  const results = useMemo(() => {
    if (!data) return [];
    const mainIdx = data.words.indexOf(mainWord);
    if (mainIdx < 0) return [];

    let queryVec = [...data.vectors[mainIdx]];

    for (const w of closeTo) {
      const idx = data.words.indexOf(w);
      if (idx >= 0) queryVec = vecAdd(queryVec, data.vectors[idx]);
    }

    for (const w of farFrom) {
      const idx = data.words.indexOf(w);
      if (idx >= 0) queryVec = vecSub(queryVec, data.vectors[idx]);
    }

    // Exclude the query words from results
    const excludeSet = new Set<number>();
    excludeSet.add(mainIdx);
    for (const w of [...closeTo, ...farFrom]) {
      const idx = data.words.indexOf(w);
      if (idx >= 0) excludeSet.add(idx);
    }

    return findNearest(queryVec, data.vectors, 10, excludeSet);
  }, [data, mainWord, closeTo, farFrom]);

  const handlePreset = (preset: Preset) => {
    setMainWord(preset.word);
    setCloseTo(preset.closeTo);
    setFarFrom(preset.farFrom);
  };

  if (loading) {
    return (
      <WidgetContainer title="Embedding Playground" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading word vectors...
        </div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Embedding Playground">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  // Build the equation display
  const equationParts: string[] = [mainWord];
  for (const w of closeTo) equationParts.push(`+ ${w}`);
  for (const w of farFrom) equationParts.push(`\u2212 ${w}`);
  const hasModifiers = closeTo.length > 0 || farFrom.length > 0;

  return (
    <WidgetContainer
      title="Exploring a Real Embedding"
      description="Type a word to see its nearest neighbors. Steer by adding 'also close to' and 'far from' words."
      onReset={resetState}
    >
      {/* Preset buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted self-center">Try:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset)}
            className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        {/* Left: Inputs */}
        <div className="space-y-3">
          {/* Main word */}
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
            <div className="mt-1 text-xs font-semibold text-foreground">{mainWord}</div>
          </div>

          {/* Also close to */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
              Also close to (+)
            </label>
            <Autocomplete
              words={data.words}
              onSelect={(w) => {
                if (wordSet.has(w) && !closeTo.includes(w) && w !== mainWord) {
                  setCloseTo((prev) => [...prev, w]);
                }
              }}
              placeholder="Add a word..."
            />
            {closeTo.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {closeTo.map((w) => (
                  <WordChip
                    key={w}
                    word={w}
                    onRemove={() => setCloseTo((prev) => prev.filter((x) => x !== w))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Far from */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
              Far from (\u2212)
            </label>
            <Autocomplete
              words={data.words}
              onSelect={(w) => {
                if (wordSet.has(w) && !farFrom.includes(w) && w !== mainWord) {
                  setFarFrom((prev) => [...prev, w]);
                }
              }}
              placeholder="Add a word..."
            />
            {farFrom.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {farFrom.map((w) => (
                  <WordChip
                    key={w}
                    word={w}
                    onRemove={() => setFarFrom((prev) => prev.filter((x) => x !== w))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div>
          {/* Equation display */}
          {hasModifiers && (
            <div className="mb-2 rounded-lg bg-accent/5 px-3 py-2 text-xs font-medium text-foreground">
              {equationParts.join(" ")} = ?
            </div>
          )}

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
