"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import {
  loadTransformerModel,
  forward,
  tokenize,
  topK,
  softmax,
  sampleFromProbs,
  type TransformerModel,
  type InferenceResult,
} from "./model-inference";

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/transformer-models/story";

const PROMPTS = [
  "Once upon a time there was a little",
  "The big brown dog",
  "In a magical forest",
  "One sunny morning the children",
];

interface GeneratedToken {
  token: string;
  prob: number;
  alternatives: { token: string; prob: number }[];
}

export function LiveTransformer() {
  const [model, setModel] = useState<TransformerModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [temperature, setTemperature] = useState(0.8);
  const [generated, setGenerated] = useState<GeneratedToken[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);
  const stopRef = useRef(false);
  const generatingRef = useRef(false);

  // Load model
  useEffect(() => {
    loadTransformerModel(MODEL_BASE)
      .then((m) => {
        setModel(m);
        setLoading(false);
      })
      .catch((e) => {
        setError(`Failed to load model: ${e.message}`);
        setLoading(false);
      });
  }, []);

  const generate = useCallback(async () => {
    if (!model || generatingRef.current) return;
    stopRef.current = false;
    generatingRef.current = true;
    setIsGenerating(true);
    setGenerated([]);
    setSelectedTokenIdx(null);

    let currentText = prompt;
    const maxTokens = 60;

    for (let step = 0; step < maxTokens; step++) {
      if (stopRef.current) break;

      const tokenIds = tokenize(currentText, model.vocab);
      const truncated = tokenIds.slice(-model.config.context_len);

      let result: InferenceResult;
      try {
        result = forward(model, truncated);
      } catch {
        break;
      }

      // Apply temperature and sample
      const probs = softmax(result.logits, temperature);
      const tokenId =
        temperature < 0.01
          ? // Greedy
            probs.indexOf(Math.max(...Array.from(probs)))
          : sampleFromProbs(probs);

      const token = model.vocab[tokenId] ?? "<unk>";
      const alternatives = topK(probs, model.vocab, 5).map((p) => ({
        token: p.token,
        prob: p.prob,
      }));

      const genToken: GeneratedToken = {
        token,
        prob: probs[tokenId],
        alternatives,
      };

      setGenerated((prev) => [...prev, genToken]);
      currentText = currentText + " " + token;

      // Small delay for visual effect
      await new Promise((r) => setTimeout(r, 80));
    }

    setIsGenerating(false);
    generatingRef.current = false;
  }, [model, prompt, temperature]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
  }, []);

  const handleReset = useCallback(() => {
    stopRef.current = true;
    setPrompt(PROMPTS[0]);
    setTemperature(0.8);
    setGenerated([]);
    setSelectedTokenIdx(null);
    generatingRef.current = false;
    setIsGenerating(false);
  }, []);

  if (loading) {
    return (
      <WidgetContainer
        title="Story Transformer"
        description="A real transformer generating stories in your browser"
      >
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-sm text-muted">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-20"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Loading story transformer model…
          </div>
        </div>
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="Story Transformer"
        description="A real transformer generating stories in your browser"
      >
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
          {error} — The model hasn&apos;t been trained and uploaded yet. This
          widget will work once the model weights are available on R2.
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Story Transformer"
      description="Watch a real transformer write stories, word by word"
      onReset={handleReset}
    >
      {/* Prompt selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => {
              stopRef.current = true;
              generatingRef.current = false;
              setIsGenerating(false);
              setPrompt(p);
              setGenerated([]);
              setSelectedTokenIdx(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              prompt === p
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            &ldquo;{p.length > 25 ? p.slice(0, 25) + "…" : p}&rdquo;
          </button>
        ))}
      </div>

      {/* Temperature */}
      <div className="mb-1">
        <SliderControl
          label="Temperature"
          value={temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={setTemperature}
          formatValue={(v) => v.toFixed(1)}
        />
      </div>
      <div className="mb-4 flex justify-between px-1 text-[10px] text-muted">
        <span>Safe &amp; predictable</span>
        <span>Creative &amp; wild</span>
      </div>

      {/* Generate / Stop */}
      <div className="mb-4 flex gap-2">
        {!isGenerating ? (
          <button
            onClick={generate}
            className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90"
          >
            {generated.length > 0 ? "Generate Again" : "Generate"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="rounded-md bg-red-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            Stop
          </button>
        )}
      </div>

      {/* Story display */}
      <div className="mb-4 min-h-[100px] rounded-lg border border-border bg-surface p-4">
        <span className="text-sm font-bold text-foreground">{prompt} </span>
        {generated.map((g, i) => {
          const isSelected = selectedTokenIdx === i;
          // Color by confidence
          const confidence = g.prob;
          const opacity = 0.5 + confidence * 0.5;

          return (
            <span
              key={i}
              onClick={() => setSelectedTokenIdx(isSelected ? null : i)}
              className={`cursor-pointer text-sm transition-all hover:bg-accent/10 ${
                isSelected
                  ? "rounded bg-accent/15 px-0.5 font-semibold text-accent"
                  : "text-foreground"
              }`}
              style={{ opacity: isSelected ? 1 : opacity }}
              title={`${(confidence * 100).toFixed(1)}% confident`}
            >
              {g.token}{" "}
            </span>
          );
        })}
        {isGenerating && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent" />
        )}
      </div>

      {/* Selected token details */}
      {selectedTokenIdx !== null && generated[selectedTokenIdx] && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <div className="mb-2 text-xs font-semibold text-accent">
            &ldquo;{generated[selectedTokenIdx].token}&rdquo; — what the model
            was considering:
          </div>
          <div className="flex flex-col gap-1">
            {generated[selectedTokenIdx].alternatives.map((alt, i) => {
              const barWidth = Math.min(100, alt.prob * 100 * 3);
              const isChosen = alt.token === generated[selectedTokenIdx].token;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`w-20 shrink-0 truncate font-mono text-xs ${isChosen ? "font-bold text-accent" : "text-foreground"}`}
                  >
                    {alt.token} {isChosen && "←"}
                  </span>
                  <div className="relative h-4 flex-1 rounded bg-foreground/5">
                    <div
                      className={`h-full rounded ${isChosen ? "bg-accent" : "bg-foreground/20"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-[10px] text-muted">
                    {(alt.prob * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-generation info */}
      {generated.length > 0 && !isGenerating && (
        <div className="mt-3 text-[10px] text-muted">
          Click any generated word to see what alternatives the model
          considered. Words with lower opacity = lower confidence.
        </div>
      )}
    </WidgetContainer>
  );
}
