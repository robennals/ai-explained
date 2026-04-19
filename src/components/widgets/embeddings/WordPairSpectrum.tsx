"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";
import {
  vecSub,
  vecScale,
  vecNormalize,
  dotProduct,
} from "./embeddingUtils";

interface Preset {
  label: string;
  wordA: string;
  wordB: string;
  description: string;
}

const PRESETS: Preset[] = [
  { label: "tiny \u2194 huge", wordA: "tiny", wordB: "huge", description: "Pure size gradient \u2014 both endpoints are size adjectives, so the line fills with size words: small, smaller, larger, vast, bigger, biggest, gigantic, enormous." },
  { label: "rabbit \u2194 elephant", wordA: "rabbit", wordB: "elephant", description: "Size gradient within mammals \u2014 mouse, rat, pig, goat, cat, dog, deer, monkey, lion, rhino. Both endpoints are terrestrial mammals, so size is the only thing varying." },
  { label: "salad \u2194 cake", wordA: "salad", wordB: "cake", description: "Savory to sweet \u2014 lettuce, spinach, tomato, soup at one end; pudding, pie, cookie, chocolate at the other. A clean taste axis." },
  { label: "man \u2194 sausage", wordA: "man", wordB: "sausage", description: "No shared axis \u2014 nothing meaningful connects people and sausages, so nothing sits between them. Words pile up near each end with empty space in the middle." },
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
  t: number; // 0..1 normalized position on the arc (A at 0, B at 1)
  closeness: number; // cosine similarity to closest point on the arc (1 = on the line, 0 = perpendicular)
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

  // Treat the embedding as a hypersphere: words are directions, the "spectrum"
  // between A and B is the great-circle arc between them. Rank candidate words
  // by angular distance from that arc (smaller = more on-spectrum), and place
  // each candidate by its arc position (t=0 at A, t=1 at B).
  const entries = useMemo((): SpectrumEntry[] | null => {
    if (!data) return null;
    const idxA = data.words.indexOf(wordA);
    const idxB = data.words.indexOf(wordB);
    if (idxA < 0 || idxB < 0) return null;

    const uA = vecNormalize(data.vectors[idxA]);
    const uB = vecNormalize(data.vectors[idxB]);
    const dotAB = dotProduct(uA, uB);
    const thetaAB = Math.acos(Math.max(-1, Math.min(1, dotAB)));
    if (thetaAB < 1e-6) return null;

    // Orthonormal basis (uA, ePerp) for the plane containing the arc.
    const ePerp = vecNormalize(vecSub(uB, vecScale(uA, dotAB)));

    const margin = 0.1;
    // Quality threshold: orth = sin(angle to closest arc point). Random pairs
    // in 300d hover around orth ≈ 0.99, so 0.86 means ≥3× closer to the arc
    // than a random word. Only show words that are genuinely on the direction;
    // don't pad weak results with noise. The widget self-documents: clean
    // directions surface many words, sparse ones surface few.
    const maxOrth = 0.86;
    const exclude = new Set([idxA, idxB]);
    const scored: { index: number; t: number; closeness: number; orth: number }[] = [];

    for (let i = 0; i < data.words.length; i++) {
      if (exclude.has(i)) continue;
      const uP = vecNormalize(data.vectors[i]);
      const pA = dotProduct(uP, uA);
      const pPerp = dotProduct(uP, ePerp);
      const planeMag2 = pA * pA + pPerp * pPerp;
      const orth = Math.sqrt(Math.max(0, 1 - planeMag2));
      if (orth > maxOrth) continue;
      const t = Math.atan2(pPerp, pA) / thetaAB;
      if (t < -margin || t > 1 + margin) continue;
      // closeness = cos similarity to closest point on arc = √(planeMag²)
      const closeness = Math.sqrt(planeMag2);
      scored.push({ index: i, t, closeness, orth });
    }

    scored.sort((a, b) => a.orth - b.orth);
    const top = scored.slice(0, NUM_RESULTS);

    const all: SpectrumEntry[] = [
      { word: wordA, t: 0, closeness: 1, isAnchor: true },
      { word: wordB, t: 1, closeness: 1, isAnchor: true },
      ...top.map((r) => ({
        word: data.words[r.index],
        t: Math.max(0, Math.min(1, r.t)),
        closeness: r.closeness,
        isAnchor: false,
      })),
    ];

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
      description="Pick two words. Each candidate gets two bars: where it sits along the line between A and B, and how close it is to that line. Words too far off the line are dropped — sparse directions surface few words, by design."
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
          {/* Header row showing what the two bars represent */}
          <div className="mb-1 flex items-center gap-2 text-[10px] text-muted">
            <span className="w-24" />
            <div className="flex-[2] flex items-baseline justify-between">
              <span>{wordA}</span>
              <span className="text-[9px] uppercase tracking-wider">position on the line</span>
              <span>{wordB}</span>
            </div>
            <div className="w-24 text-center text-[9px] uppercase tracking-wider">closeness to line</div>
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
              {/* Position bar (slider with dot at t) */}
              <div className="relative flex-[2] h-3">
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
              {/* Closeness bar (slider with dot at planeMag, with fill behind) */}
              <div className="relative w-24 h-3">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div className="h-px w-full bg-border" />
                </div>
                <div
                  className={`absolute inset-y-0 left-0 rounded-sm ${
                    entry.isAnchor ? "bg-accent/30" : "bg-foreground/15"
                  }`}
                  style={{ width: `${entry.closeness * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${entry.closeness * 100}%` }}
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
