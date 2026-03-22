"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

type MaskMode = "causal" | "prefix";

const EXAMPLES = [
  {
    label: "Story prompt",
    prompt: ["Once", "upon", "a", "time"],
    generated: ["there", "was", "a", "cat"],
  },
  {
    label: "Question",
    prompt: ["What", "is", "the", "capital", "of"],
    generated: ["France", "?", "Paris"],
  },
  {
    label: "Instruction",
    prompt: ["Write", "a", "poem", "about"],
    generated: ["the", "sea", "and", "stars"],
  },
];

const PROMPT_COLOR = "#60a5fa";
const GEN_COLOR = "#4ade80";

export function PrefixAttention() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [mode, setMode] = useState<MaskMode>("causal");
  const [selectedWord, setSelectedWord] = useState<number | null>(null);

  const example = EXAMPLES[exampleIdx];
  const promptLen = example.prompt.length;
  const allWords = [...example.prompt, ...example.generated];
  const n = allWords.length;

  const handleReset = useCallback(() => {
    setExampleIdx(0);
    setMode("causal");
    setSelectedWord(null);
  }, []);

  const isPromptWord = (idx: number) => idx < promptLen;

  const canAttend = (from: number, to: number): boolean => {
    if (mode === "causal") {
      return to <= from;
    }
    // Prefix mode: prompt words see all prompt words; generated words use causal mask
    if (isPromptWord(from) && isPromptWord(to)) return true; // Prompt-to-prompt: full
    if (!isPromptWord(from) && isPromptWord(to)) return true; // Generated-to-prompt: always
    if (!isPromptWord(from) && !isPromptWord(to)) return to <= from; // Gen-to-gen: causal
    return false; // Prompt-to-generated: never
  };

  // Count visible words for selected
  const visibleCount =
    selectedWord !== null
      ? allWords.filter((_, j) => canAttend(selectedWord, j)).length
      : 0;

  return (
    <WidgetContainer
      title="Prefix Attention"
      description="Compare causal-only vs prefix attention — prompt words can see each other"
      onReset={handleReset}
    >
      {/* Example selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => {
              setExampleIdx(i);
              setSelectedWord(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              exampleIdx === i
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Mode selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setMode("causal");
            setSelectedWord(null);
          }}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            mode === "causal"
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Causal only (triangle)
        </button>
        <button
          onClick={() => {
            setMode("prefix");
            setSelectedWord(null);
          }}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            mode === "prefix"
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Prefix attention (square + triangle)
        </button>
      </div>

      {/* Word display */}
      <div className="mb-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          Click a word to see what it can attend to
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allWords.map((word, i) => {
            const isPrompt = isPromptWord(i);
            const isSelected = selectedWord === i;
            const isVisible = selectedWord !== null && canAttend(selectedWord, i);
            const isBlocked = selectedWord !== null && !canAttend(selectedWord, i);

            return (
              <button
                key={i}
                onClick={() => setSelectedWord(isSelected ? null : i)}
                className={`rounded-md border-2 px-2.5 py-1.5 text-sm font-semibold transition-all ${
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
                <span
                  className="ml-1 text-[8px] font-normal"
                  style={{ color: isPrompt ? PROMPT_COLOR : GEN_COLOR }}
                >
                  {isPrompt ? "prompt" : "gen"}
                </span>
              </button>
            );
          })}
        </div>
        {selectedWord !== null && (
          <div className="mt-2 text-xs text-muted">
            <span className="font-semibold text-accent">
              &ldquo;{allWords[selectedWord]}&rdquo;
            </span>{" "}
            ({isPromptWord(selectedWord) ? "prompt" : "generated"}) can see{" "}
            <strong>{visibleCount}</strong> of {n} words
            {mode === "prefix" && isPromptWord(selectedWord) && (
              <span className="ml-1 text-blue-400">
                — full visibility within the prompt!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attention matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Legend */}
          <div className="mb-2 flex gap-4 text-[10px]">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded"
                style={{ backgroundColor: PROMPT_COLOR }}
              />
              Prompt
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded"
                style={{ backgroundColor: GEN_COLOR }}
              />
              Generated
            </span>
          </div>

          {/* Column headers */}
          <div className="flex">
            <div className="h-6 w-14 shrink-0" />
            {allWords.map((word, j) => (
              <div
                key={j}
                className="flex h-6 w-9 items-end justify-center"
              >
                <span
                  className="origin-bottom-left -rotate-45 whitespace-nowrap text-[8px] font-medium"
                  style={{
                    color: isPromptWord(j) ? PROMPT_COLOR : GEN_COLOR,
                  }}
                >
                  {word}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {allWords.map((fromWord, i) => (
            <div key={i} className="flex items-center">
              <div
                className="flex h-9 w-14 shrink-0 items-center justify-end pr-1.5 text-[9px] font-medium"
                style={{
                  color: isPromptWord(i) ? PROMPT_COLOR : GEN_COLOR,
                }}
              >
                {fromWord}
              </div>
              {allWords.map((_, j) => {
                const allowed = canAttend(i, j);
                const isHighlighted = selectedWord === i;

                // Color by type of connection
                let bg = "transparent";
                if (allowed) {
                  const isP2P = isPromptWord(i) && isPromptWord(j);
                  const isG2P = !isPromptWord(i) && isPromptWord(j);
                  const isG2G = !isPromptWord(i) && !isPromptWord(j);

                  if (isP2P)
                    bg = isHighlighted
                      ? "rgba(96, 165, 250, 0.3)"
                      : "rgba(96, 165, 250, 0.12)";
                  else if (isG2P)
                    bg = isHighlighted
                      ? "rgba(96, 165, 250, 0.25)"
                      : "rgba(96, 165, 250, 0.08)";
                  else if (isG2G)
                    bg = isHighlighted
                      ? "rgba(74, 222, 128, 0.3)"
                      : "rgba(74, 222, 128, 0.12)";
                  else
                    bg = isHighlighted
                      ? "rgba(74, 222, 128, 0.2)"
                      : "rgba(74, 222, 128, 0.08)";
                }

                return (
                  <div
                    key={j}
                    className={`flex h-9 w-9 items-center justify-center border transition-all ${
                      !allowed && isHighlighted
                        ? "border-red-500/20"
                        : "border-border/20"
                    }`}
                    style={{
                      backgroundColor: allowed
                        ? bg
                        : isHighlighted
                          ? "rgba(248, 113, 113, 0.08)"
                          : "rgba(0,0,0,0.02)",
                    }}
                  >
                    {allowed ? (
                      <span className="text-[9px] text-foreground/30">
                        &#10003;
                      </span>
                    ) : (
                      <span className="text-[8px] text-red-400/30">✕</span>
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
        {mode === "causal" ? (
          <>
            <strong>Causal only:</strong> Pure triangle mask. Even prompt words
            are restricted — &ldquo;upon&rdquo; can&apos;t see &ldquo;time&rdquo; even
            though both are in the input you typed. This is simpler but wastes
            information.
          </>
        ) : (
          <>
            <strong>Prefix attention:</strong> The prompt block (blue) has{" "}
            <strong>full attention</strong> — every prompt word can see every
            other prompt word. Generated words (green) can see the full prompt
            plus earlier generated words. The shape is a filled square
            (prompt) with a triangle (generation) extending below.
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
