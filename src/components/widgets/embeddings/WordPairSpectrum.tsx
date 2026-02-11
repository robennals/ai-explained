"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";
import {
  vecSub,
  vecAdd,
  vecScale,
  vecNormalize,
  dotProduct,
  cosineSimilarity,
} from "./embeddingUtils";

interface Preset {
  label: string;
  wordA: string;
  wordB: string;
  description: string;
}

const PRESETS: Preset[] = [
  { label: "ant \u2194 whale", wordA: "ant", wordB: "whale", description: "Small to large animals \u2014 the embedding captures size within a category." },
  { label: "salad \u2194 cake", wordA: "salad", wordB: "cake", description: "Healthy to indulgent foods \u2014 the direction encodes something like richness." },
  { label: "boy \u2194 man", wordA: "boy", wordB: "man", description: "Youth to maturity \u2014 a direction encoding age." },
  { label: "cottage \u2194 palace", wordA: "cottage", wordB: "palace", description: "Modest to grand \u2014 the embedding captures a spectrum of grandeur." },
  { label: "violin \u2194 drum", wordA: "violin", wordB: "drum", description: "Melodic to percussive \u2014 instruments organized by type." },
  { label: "bicycle \u2194 airplane", wordA: "bicycle", wordB: "airplane", description: "Simple to complex vehicles \u2014 a spectrum of speed and technology." },
];

const NUM_RESULTS = 12;

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

  return (
    <div className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && suggestions.length > 0) {
            e.preventDefault();
            handleSelect(suggestions[0]);
          }
        }}
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

interface SpectrumEntry {
  word: string;
  t: number; // 0..1 normalized position on the spectrum
  isAnchor: boolean;
}

export function WordPairSpectrum() {
  const { data, loading, error } = useEmbeddingData();
  const [wordA, setWordA] = useState("ant");
  const [wordB, setWordB] = useState("whale");
  const [presetDescription, setPresetDescription] = useState(PRESETS[0].description);

  const resetState = useCallback(() => {
    setWordA("ant");
    setWordB("whale");
    setPresetDescription(PRESETS[0].description);
  }, []);

  const wordSet = useMemo(() => new Set(data?.words ?? []), [data]);

  // Compute spectrum results as a sorted list
  const entries = useMemo((): SpectrumEntry[] | null => {
    if (!data) return null;
    const idxA = data.words.indexOf(wordA);
    const idxB = data.words.indexOf(wordB);
    if (idxA < 0 || idxB < 0) return null;

    const vecA = data.vectors[idxA];
    const vecB = data.vectors[idxB];

    // Direction from A to B
    const direction = vecNormalize(vecSub(vecB, vecA));
    // Midpoint for relevance scoring
    const midpoint = vecScale(vecAdd(vecA, vecB), 0.5);

    // Score all words by relevance to the pair
    const exclude = new Set([idxA, idxB]);
    const scored: { index: number; relevance: number; projection: number }[] = [];

    for (let i = 0; i < data.words.length; i++) {
      if (exclude.has(i)) continue;
      const simToMid = cosineSimilarity(data.vectors[i], midpoint);
      const proj = dotProduct(data.vectors[i], direction);
      scored.push({ index: i, relevance: simToMid, projection: proj });
    }

    // Take top by relevance
    scored.sort((a, b) => b.relevance - a.relevance);
    const top = scored.slice(0, NUM_RESULTS);

    // Include anchor projections
    const projA = dotProduct(vecA, direction);
    const projB = dotProduct(vecB, direction);

    // Compute min/max for normalization
    const allProjs = [projA, projB, ...top.map((t) => t.projection)];
    const minProj = Math.min(...allProjs);
    const maxProj = Math.max(...allProjs);
    const range = maxProj - minProj || 1;

    // Build entries: anchors + results
    const all: SpectrumEntry[] = [
      { word: wordA, t: (projA - minProj) / range, isAnchor: true },
      { word: wordB, t: (projB - minProj) / range, isAnchor: true },
      ...top.map((r) => ({
        word: data.words[r.index],
        t: (r.projection - minProj) / range,
        isAnchor: false,
      })),
    ];

    // Sort by projection (low to high = wordA direction to wordB direction)
    all.sort((a, b) => a.t - b.t);

    return all;
  }, [data, wordA, wordB]);

  const handlePreset = (preset: Preset) => {
    setWordA(preset.wordA);
    setWordB(preset.wordB);
    setPresetDescription(preset.description);
  };

  if (loading) {
    return (
      <WidgetContainer title="Word Pair Spectrum" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading word vectors...
        </div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Word Pair Spectrum">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Word Pair Spectrum"
      description="Pick two words. The embedding places related words on a spectrum between them."
      onReset={resetState}
    >
      {/* Preset buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted self-center">Try:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              wordA === preset.wordA && wordB === preset.wordB
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-accent/10 hover:text-accent"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Word inputs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Word A
          </label>
          <Autocomplete
            words={data.words}
            onSelect={(w) => {
              if (wordSet.has(w) && w !== wordB) {
                setWordA(w);
                setPresetDescription("");
              }
            }}
            placeholder={wordA}
          />
          <div className="mt-1 text-xs font-semibold text-foreground">{wordA}</div>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
            Word B
          </label>
          <Autocomplete
            words={data.words}
            onSelect={(w) => {
              if (wordSet.has(w) && w !== wordA) {
                setWordB(w);
                setPresetDescription("");
              }
            }}
            placeholder={wordB}
          />
          <div className="mt-1 text-xs font-semibold text-foreground">{wordB}</div>
        </div>
      </div>

      {/* Vertical spectrum list */}
      {entries ? (
        <div className="space-y-0">
          {/* Header row showing direction */}
          <div className="mb-1 flex items-center text-[10px] text-muted">
            <span className="w-24" />
            <span className="flex-1 text-left">{wordA}</span>
            <span className="flex-1 text-right">{wordB}</span>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.word}
              className={`flex items-center gap-2 rounded px-1 py-1 ${
                entry.isAnchor ? "bg-accent/8" : "hover:bg-surface"
              }`}
            >
              <span
                className={`w-24 text-right text-[13px] ${
                  entry.isAnchor
                    ? "font-bold text-accent"
                    : "font-medium text-foreground"
                }`}
              >
                {entry.word}
              </span>
              {/* Position bar */}
              <div className="relative flex-1 h-3">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div className="h-px w-full bg-border" />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${entry.t * 100}%` }}
                >
                  <div
                    className={`h-2.5 w-2.5 -ml-[5px] rounded-full ${
                      entry.isAnchor ? "bg-accent" : "bg-foreground/60"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg bg-surface p-8 text-xs text-muted">
          {!wordSet.has(wordA) ? `"${wordA}" not in vocabulary.` :
           !wordSet.has(wordB) ? `"${wordB}" not in vocabulary.` :
           "Enter two different words to see the spectrum."}
        </div>
      )}

      {presetDescription && (
        <div className="mt-3 rounded-lg bg-surface p-3 text-xs text-muted">
          {presetDescription}
        </div>
      )}
    </WidgetContainer>
  );
}
