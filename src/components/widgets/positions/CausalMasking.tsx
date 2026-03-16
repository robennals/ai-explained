"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Example {
  label: string;
  tokens: string[];
  /** Fake attention weights: attentionWeights[i][j] = how much token i attends to token j (j <= i) */
  attentionWeights: number[][];
}

const EXAMPLES: Example[] = [
  {
    label: "Simple sentence",
    tokens: ["The", "cat", "sat", "on", "the", "mat"],
    attentionWeights: [
      [1.0],
      [0.3, 0.7],
      [0.1, 0.6, 0.3],
      [0.05, 0.15, 0.3, 0.5],
      [0.05, 0.1, 0.1, 0.15, 0.6],
      [0.05, 0.1, 0.1, 0.1, 0.25, 0.4],
    ],
  },
  {
    label: "Pronoun resolution",
    tokens: ["The", "dog", "chased", "the", "cat", "because", "it", "was", "fast"],
    attentionWeights: [
      [1.0],
      [0.3, 0.7],
      [0.1, 0.5, 0.4],
      [0.1, 0.1, 0.2, 0.6],
      [0.05, 0.1, 0.15, 0.2, 0.5],
      [0.05, 0.05, 0.3, 0.05, 0.15, 0.4],
      [0.05, 0.45, 0.1, 0.05, 0.15, 0.05, 0.15],
      [0.02, 0.1, 0.08, 0.02, 0.08, 0.1, 0.4, 0.2],
      [0.02, 0.15, 0.05, 0.02, 0.06, 0.05, 0.25, 0.15, 0.25],
    ],
  },
  {
    label: "Story generation",
    tokens: ["Once", "upon", "a", "time", "there", "was", "a", "dragon"],
    attentionWeights: [
      [1.0],
      [0.6, 0.4],
      [0.15, 0.15, 0.7],
      [0.2, 0.3, 0.1, 0.4],
      [0.1, 0.1, 0.05, 0.25, 0.5],
      [0.05, 0.05, 0.05, 0.1, 0.35, 0.4],
      [0.05, 0.05, 0.05, 0.05, 0.15, 0.15, 0.5],
      [0.05, 0.05, 0.05, 0.1, 0.1, 0.15, 0.1, 0.4],
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ACCENT_HUE = 240;

function weightToColor(w: number, masked: boolean): string {
  if (masked) return "hsla(0, 0%, 50%, 0.08)";
  const alpha = 0.15 + w * 0.75;
  return `hsla(${ACCENT_HUE}, 75%, 55%, ${alpha})`;
}

function weightToTextColor(w: number, masked: boolean): string {
  if (masked) return "hsla(0, 0%, 50%, 0.3)";
  if (w > 0.3) return "white";
  return `hsla(${ACCENT_HUE}, 60%, 25%, 1)`;
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export function CausalMasking() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(1); // how many tokens have been "generated"
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const example = EXAMPLES[exampleIdx];
  const tokens = example.tokens;
  const maxTokens = tokens.length;

  // Auto-play: generate one token at a time
  useEffect(() => {
    if (!isPlaying) return;
    if (generatedCount >= maxTokens) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setGeneratedCount((c) => c + 1);
    }, 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, generatedCount, maxTokens]);

  // When selectedToken is beyond generated range, clear it
  useEffect(() => {
    if (selectedToken !== null && selectedToken >= generatedCount) {
      setSelectedToken(null);
    }
  }, [generatedCount, selectedToken]);

  const handleReset = useCallback(() => {
    setExampleIdx(0);
    setGeneratedCount(1);
    setIsPlaying(false);
    setSelectedToken(null);
  }, []);

  const handleExampleChange = useCallback((idx: number) => {
    setExampleIdx(idx);
    setGeneratedCount(1);
    setIsPlaying(false);
    setSelectedToken(null);
  }, []);

  const handlePlay = useCallback(() => {
    if (generatedCount >= maxTokens) {
      setGeneratedCount(1);
      setSelectedToken(null);
    }
    setIsPlaying(true);
  }, [generatedCount, maxTokens]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStep = useCallback(() => {
    setIsPlaying(false);
    if (generatedCount < maxTokens) {
      setGeneratedCount((c) => c + 1);
    }
  }, [generatedCount, maxTokens]);

  // The visible tokens are only the ones generated so far
  const visibleTokens = tokens.slice(0, generatedCount);
  // The attention row for the most recently generated token
  const latestIdx = generatedCount - 1;

  return (
    <WidgetContainer
      title="Causal Masking"
      description="Watch text being generated one token at a time. Each token can only attend to tokens that came before it."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Example selector */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleExampleChange(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === exampleIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="rounded-lg bg-foreground/10 px-3 py-1.5 text-sm font-medium hover:bg-foreground/15 transition-colors"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              {generatedCount >= maxTokens ? "Replay" : generatedCount === 1 ? "Generate" : "Continue"}
            </button>
          )}
          <button
            onClick={handleStep}
            disabled={generatedCount >= maxTokens}
            className="rounded-lg bg-foreground/10 px-3 py-1.5 text-sm font-medium hover:bg-foreground/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +1 token
          </button>
          <span className="ml-2 text-xs text-muted">
            {generatedCount} / {maxTokens} tokens
          </span>
        </div>

        {/* Token sequence display */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {tokens.map((token, i) => {
            const isGenerated = i < generatedCount;
            const isLatest = i === generatedCount - 1;
            const isSelected = selectedToken === i;
            return (
              <button
                key={i}
                onClick={() => isGenerated && setSelectedToken(isSelected ? null : i)}
                disabled={!isGenerated}
                className={`rounded-lg px-2.5 py-1 text-sm font-medium transition-all duration-300 ${
                  !isGenerated
                    ? "bg-foreground/5 text-foreground/20 cursor-default"
                    : isSelected
                    ? "bg-accent text-white ring-2 ring-accent ring-offset-1 ring-offset-surface"
                    : isLatest
                    ? "bg-accent/15 text-accent border border-accent/40"
                    : "bg-foreground/8 text-foreground/80 hover:bg-foreground/12 cursor-pointer"
                }`}
              >
                {token}
              </button>
            );
          })}
        </div>

        {/* Attention matrix visualization */}
        <div className="overflow-x-auto">
          <div className="min-w-fit">
            {/* Header row: key tokens */}
            <div className="flex items-end gap-0.5 mb-0.5 pl-20">
              {tokens.map((token, j) => (
                <div
                  key={j}
                  className={`w-12 text-center text-[10px] font-medium truncate transition-opacity duration-300 ${
                    j < generatedCount ? "text-muted" : "text-foreground/15"
                  }`}
                >
                  {token}
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {tokens.map((token, i) => {
              const isGenerated = i < generatedCount;
              const isActiveRow = selectedToken === i || (selectedToken === null && i === latestIdx);
              const weights = example.attentionWeights[i] || [];

              return (
                <div
                  key={i}
                  className={`flex items-center gap-0.5 transition-all duration-300 ${
                    !isGenerated ? "opacity-20" : isActiveRow ? "" : "opacity-50"
                  }`}
                >
                  {/* Row label */}
                  <div
                    className={`w-20 text-right pr-2 text-xs font-medium truncate transition-colors ${
                      isActiveRow && isGenerated ? "text-accent" : "text-muted"
                    }`}
                  >
                    {token}
                  </div>

                  {/* Cells */}
                  {tokens.map((_, j) => {
                    const isMasked = j > i; // causal: can't look ahead
                    const weight = !isMasked && j < weights.length ? weights[j] : 0;
                    const isVisible = isGenerated && j < generatedCount;

                    return (
                      <div
                        key={j}
                        className={`w-12 h-7 rounded-sm flex items-center justify-center text-[10px] font-mono transition-all duration-300 ${
                          isMasked ? "bg-foreground/3" : ""
                        }`}
                        style={
                          isVisible && !isMasked
                            ? {
                                backgroundColor: weightToColor(weight, false),
                                color: weightToTextColor(weight, false),
                              }
                            : isMasked && isGenerated
                            ? { backgroundColor: "hsla(0,0%,50%,0.05)" }
                            : {}
                        }
                      >
                        {isVisible && !isMasked
                          ? `${Math.round(weight * 100)}`
                          : isMasked && isGenerated
                          ? "✕"
                          : ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `hsla(${ACCENT_HUE}, 75%, 55%, 0.6)` }}
            />
            <span>Attends to</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-foreground/5 flex items-center justify-center text-[9px]">
              ✕
            </div>
            <span>Masked (can&apos;t see future)</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {generatedCount === 1
            ? "The first token has nothing to attend to except itself. Click \"Generate\" to watch the sequence grow."
            : generatedCount < maxTokens
            ? `"${tokens[latestIdx]}" can attend to the ${generatedCount} tokens generated so far, but not to the ${maxTokens - generatedCount} tokens that haven't been generated yet. Click a token to see its attention pattern.`
            : "All tokens generated. Each token could only see the tokens that came before it — never the future. Click any token to see what it attended to."}
        </div>
      </div>
    </WidgetContainer>
  );
}
