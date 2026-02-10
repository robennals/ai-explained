"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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

export function WordPairSpectrum() {
  const { data, loading, error } = useEmbeddingData();
  const [wordA, setWordA] = useState("ant");
  const [wordB, setWordB] = useState("whale");
  const [presetDescription, setPresetDescription] = useState(PRESETS[0].description);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resetState = useCallback(() => {
    setWordA("ant");
    setWordB("whale");
    setPresetDescription(PRESETS[0].description);
    setHoveredWord(null);
  }, []);

  const wordSet = useMemo(() => new Set(data?.words ?? []), [data]);

  // Compute spectrum results
  const spectrum = useMemo(() => {
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

    // Sort by projection for display
    top.sort((a, b) => a.projection - b.projection);

    // Compute projection range including the anchor words
    const projA = dotProduct(vecA, direction);
    const projB = dotProduct(vecB, direction);
    const allProjs = [projA, projB, ...top.map((t) => t.projection)];
    const minProj = Math.min(...allProjs);
    const maxProj = Math.max(...allProjs);
    const pad = (maxProj - minProj) * 0.08;

    return {
      results: top,
      projA,
      projB,
      minProj: minProj - pad,
      maxProj: maxProj + pad,
    };
  }, [data, wordA, wordB]);

  const handlePreset = (preset: Preset) => {
    setWordA(preset.wordA);
    setWordB(preset.wordB);
    setPresetDescription(preset.description);
    setHoveredWord(null);
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

  const PADDING = 50;
  const LINE_Y = 40;
  const svgHeight = 100;
  const lineWidth = containerWidth - PADDING * 2;

  const projToX = (proj: number) => {
    if (!spectrum) return PADDING;
    const t = (proj - spectrum.minProj) / (spectrum.maxProj - spectrum.minProj);
    return PADDING + Math.max(0, Math.min(1, t)) * lineWidth;
  };

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
            Left word
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
            Right word
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

      {/* Spectrum visualization */}
      <div ref={containerRef} className="w-full">
        {spectrum ? (
          <svg width={containerWidth} height={svgHeight} className="overflow-visible">
            {/* Main line */}
            <line
              x1={PADDING} y1={LINE_Y}
              x2={containerWidth - PADDING} y2={LINE_Y}
              stroke="var(--color-border)" strokeWidth={2}
            />
            {/* Arrows */}
            <polygon
              points={`${PADDING - 6},${LINE_Y} ${PADDING + 2},${LINE_Y - 4} ${PADDING + 2},${LINE_Y + 4}`}
              fill="var(--color-border)"
            />
            <polygon
              points={`${containerWidth - PADDING + 6},${LINE_Y} ${containerWidth - PADDING - 2},${LINE_Y - 4} ${containerWidth - PADDING - 2},${LINE_Y + 4}`}
              fill="var(--color-border)"
            />

            {/* Anchor words */}
            {[
              { word: wordA, proj: spectrum.projA },
              { word: wordB, proj: spectrum.projB },
            ].map(({ word, proj }) => {
              const cx = projToX(proj);
              return (
                <g key={`anchor-${word}`}>
                  <circle cx={cx} cy={LINE_Y} r={5} fill="var(--color-accent)" />
                  <text
                    x={cx} y={LINE_Y - 12}
                    textAnchor="middle"
                    className="text-[11px] font-bold pointer-events-none select-none"
                    fill="var(--color-accent)"
                  >
                    {word}
                  </text>
                </g>
              );
            })}

            {/* Result words */}
            {spectrum.results.map((r) => {
              const cx = projToX(r.projection);
              const word = data.words[r.index];
              const isHovered = hoveredWord === word;
              return (
                <g
                  key={r.index}
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  className="cursor-default"
                >
                  <circle
                    cx={cx} cy={LINE_Y}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? "var(--color-accent)" : "var(--color-foreground)"}
                    opacity={isHovered ? 1 : 0.7}
                  />
                  <text
                    x={cx} y={LINE_Y + 18}
                    textAnchor="middle"
                    className={`text-[10px] pointer-events-none select-none ${isHovered ? "font-bold" : "font-medium"}`}
                    fill={isHovered ? "var(--color-accent)" : "var(--color-foreground)"}
                    opacity={isHovered ? 1 : 0.8}
                  >
                    {word}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-surface p-8 text-xs text-muted">
            {!wordSet.has(wordA) ? `"${wordA}" not in vocabulary.` :
             !wordSet.has(wordB) ? `"${wordB}" not in vocabulary.` :
             "Enter two different words to see the spectrum."}
          </div>
        )}
      </div>

      {presetDescription && (
        <div className="mt-2 rounded-lg bg-surface p-3 text-xs text-muted">
          {presetDescription}
        </div>
      )}
    </WidgetContainer>
  );
}
