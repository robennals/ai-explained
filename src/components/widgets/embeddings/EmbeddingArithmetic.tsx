"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";
import { vecAdd, vecSub, findNearest } from "./embeddingUtils";

interface Preset {
  a: string;
  b: string;
  c: string;
  label: string;
}

interface PresetGroup {
  name: string;
  presets: Preset[];
}

const PRESET_GROUPS: PresetGroup[] = [
  {
    name: "Gender",
    presets: [
      { a: "king", b: "man", c: "woman", label: "king \u2212 man + woman" },
      { a: "actor", b: "man", c: "woman", label: "actor \u2212 man + woman" },
      { a: "nephew", b: "man", c: "woman", label: "nephew \u2212 man + woman" },
      { a: "grandfather", b: "man", c: "woman", label: "grandfather \u2212 man + woman" },
      { a: "husband", b: "man", c: "woman", label: "husband \u2212 man + woman" },
    ],
  },
  {
    name: "Capitals",
    presets: [
      { a: "paris", b: "france", c: "germany", label: "paris \u2212 france + germany" },
      { a: "paris", b: "france", c: "japan", label: "paris \u2212 france + japan" },
      { a: "paris", b: "france", c: "italy", label: "paris \u2212 france + italy" },
      { a: "paris", b: "france", c: "russia", label: "paris \u2212 france + russia" },
      { a: "tokyo", b: "japan", c: "france", label: "tokyo \u2212 japan + france" },
    ],
  },
  {
    name: "Verb tense",
    presets: [
      { a: "walking", b: "walk", c: "swim", label: "walking \u2212 walk + swim" },
      { a: "running", b: "run", c: "walk", label: "running \u2212 run + walk" },
      { a: "walked", b: "walk", c: "swim", label: "walked \u2212 walk + swim" },
      { a: "walked", b: "walk", c: "fly", label: "walked \u2212 walk + fly" },
    ],
  },
  {
    name: "Comparative",
    presets: [
      { a: "bigger", b: "big", c: "fast", label: "bigger \u2212 big + fast" },
      { a: "bigger", b: "big", c: "slow", label: "bigger \u2212 big + slow" },
      { a: "faster", b: "fast", c: "slow", label: "faster \u2212 fast + slow" },
    ],
  },
  {
    name: "Workplace",
    presets: [
      { a: "surgeon", b: "hospital", c: "restaurant", label: "surgeon \u2212 hospital + restaurant" },
      { a: "farmer", b: "farm", c: "school", label: "farmer \u2212 farm + school" },
    ],
  },
];

function Autocomplete({
  words,
  onSelect,
  placeholder,
  value,
}: {
  words: string[];
  onSelect: (word: string) => void;
  placeholder: string;
  value: string;
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
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function EmbeddingArithmetic() {
  const { data, loading, error } = useEmbeddingData();
  const [wordA, setWordA] = useState("king");
  const [wordB, setWordB] = useState("man");
  const [wordC, setWordC] = useState("woman");

  const wordSet = useMemo(() => new Set(data?.words ?? []), [data]);

  const resetState = useCallback(() => {
    setWordA("king");
    setWordB("man");
    setWordC("woman");
  }, []);

  const results = useMemo(() => {
    if (!data) return [];
    const idxA = data.words.indexOf(wordA);
    const idxB = data.words.indexOf(wordB);
    const idxC = data.words.indexOf(wordC);
    if (idxA < 0 || idxB < 0 || idxC < 0) return [];

    const resultVec = vecAdd(vecSub(data.vectors[idxA], data.vectors[idxB]), data.vectors[idxC]);
    const excludeSet = new Set<number>([idxA, idxB, idxC]);
    return findNearest(resultVec, data.vectors, 5, excludeSet);
  }, [data, wordA, wordB, wordC]);

  const missingWord = useMemo(() => {
    if (!data) return null;
    if (!wordSet.has(wordA)) return wordA;
    if (!wordSet.has(wordB)) return wordB;
    if (!wordSet.has(wordC)) return wordC;
    return null;
  }, [data, wordSet, wordA, wordB, wordC]);

  if (loading) {
    return (
      <WidgetContainer title="Embedding Arithmetic" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading word vectors...
        </div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Embedding Arithmetic">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Embedding Arithmetic"
      description="Subtract one word's embedding from another, add a third, and see what word lands nearest the result."
      onReset={resetState}
    >
      {/* Preset buttons grouped by category */}
      <div className="mb-4 space-y-2">
        {PRESET_GROUPS.map((group) => (
          <div key={group.name} className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted">
              {group.name}
            </span>
            {group.presets.map((p) => {
              const active = p.a === wordA && p.b === wordB && p.c === wordC;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    setWordA(p.a);
                    setWordB(p.b);
                    setWordC(p.c);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:bg-accent/10 hover:text-accent"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Equation inputs */}
      <div className="mb-4 flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-[100px]">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Word A
          </label>
          <Autocomplete
            words={data.words}
            onSelect={(w) => wordSet.has(w) && setWordA(w)}
            placeholder={wordA}
            value={wordA}
          />
        </div>
        <span className="mt-7 text-lg font-bold text-muted select-none">&minus;</span>
        <div className="flex-1 min-w-[100px]">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Word B
          </label>
          <Autocomplete
            words={data.words}
            onSelect={(w) => wordSet.has(w) && setWordB(w)}
            placeholder={wordB}
            value={wordB}
          />
        </div>
        <span className="mt-7 text-lg font-bold text-muted select-none">+</span>
        <div className="flex-1 min-w-[100px]">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Word C
          </label>
          <Autocomplete
            words={data.words}
            onSelect={(w) => wordSet.has(w) && setWordC(w)}
            placeholder={wordC}
            value={wordC}
          />
        </div>
        <span className="mt-7 text-lg font-bold text-muted select-none">=</span>
        <div className="flex-1 min-w-[100px]">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Result
          </label>
          <div className="rounded-md border border-dashed border-accent bg-accent/5 px-2.5 py-1.5 text-xs text-muted">
            nearest match
          </div>
          <div className="mt-1 text-sm font-semibold text-accent">
            {missingWord
              ? `"${missingWord}" not in vocabulary`
              : results.length > 0
                ? data.words[results[0].index]
                : "\u2014"}
          </div>
        </div>
      </div>

      {/* Results */}
      {missingWord ? (
        <div className="rounded-lg bg-surface p-4 text-xs text-muted">
          &ldquo;{missingWord}&rdquo; is not in the vocabulary. Try another word.
        </div>
      ) : results.length > 0 ? (
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Top 5 nearest words to the result
          </label>
          <div className="space-y-0.5">
            {results.map((r, i) => {
              const barWidth = Math.max(0, r.similarity * 100);
              return (
                <div
                  key={data.words[r.index]}
                  className="flex items-center gap-2 rounded-md px-1 py-0.5"
                >
                  <span className="w-4 text-right text-[10px] text-muted">{i + 1}</span>
                  <span
                    className={`w-20 text-left text-xs font-medium truncate ${
                      i === 0 ? "text-accent" : "text-foreground"
                    }`}
                  >
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
        </div>
      ) : null}
    </WidgetContainer>
  );
}
