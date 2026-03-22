"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import {
  loadTransformerModel,
  forward,
  tokenize,
  topK,
  type TransformerModel,
} from "./model-inference";

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/transformer-models";

const MODEL_CONFIGS = [
  { name: "1 layer", path: `${MODEL_BASE}/depth-1`, layers: 1, color: "#f59e0b" },
  { name: "2 layers", path: `${MODEL_BASE}/depth-2`, layers: 2, color: "#60a5fa" },
  { name: "4 layers", path: `${MODEL_BASE}/depth-4`, layers: 4, color: "#4ade80" },
];

const PROMPTS = [
  "Once upon a time there was",
  "The little cat sat on",
  "She looked at the big",
];

interface ModelResult {
  name: string;
  layers: number;
  color: string;
  predictions: { token: string; prob: number }[];
  loaded: boolean;
  error: boolean;
}

export function DepthComparison() {
  const [models, setModels] = useState<Map<string, TransformerModel>>(new Map());
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState(PROMPTS[0]);

  // Load all models
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled(
      MODEL_CONFIGS.map(async (cfg) => {
        const model = await loadTransformerModel(cfg.path);
        return { name: cfg.name, model };
      }),
    ).then((settled) => {
      if (cancelled) return;
      const loaded = new Map<string, TransformerModel>();
      for (const result of settled) {
        if (result.status === "fulfilled") {
          loaded.set(result.value.name, result.value.model);
        }
      }
      setModels(loaded);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Run inference on all models when prompt changes
  const results = useMemo((): ModelResult[] => {
    return MODEL_CONFIGS.map((cfg) => {
      const model = models.get(cfg.name);
      if (!model) {
        return {
          name: cfg.name,
          layers: cfg.layers,
          color: cfg.color,
          predictions: [],
          loaded: false,
          error: false,
        };
      }

      try {
        const tokenIds = tokenize(prompt, model.vocab);
        const truncated = tokenIds.slice(-model.config.context_len);
        const result = forward(model, truncated);
        const predictions = topK(result.probs, model.vocab, 5).map((p) => ({
          token: p.token,
          prob: p.prob,
        }));
        return {
          name: cfg.name,
          layers: cfg.layers,
          color: cfg.color,
          predictions,
          loaded: true,
          error: false,
        };
      } catch {
        return {
          name: cfg.name,
          layers: cfg.layers,
          color: cfg.color,
          predictions: [],
          loaded: true,
          error: true,
        };
      }
    });
  }, [models, prompt]);

  const handleReset = useCallback(() => {
    setPrompt(PROMPTS[0]);
  }, []);

  if (loading) {
    return (
      <WidgetContainer
        title="Depth Comparison"
        description="Compare transformers with 1, 2, and 4 layers"
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
            Loading models…
          </div>
        </div>
      </WidgetContainer>
    );
  }

  const anyLoaded = results.some((r) => r.loaded && !r.error);

  return (
    <WidgetContainer
      title="Depth Comparison"
      description="Same prompt, different depths — see how more layers = better understanding"
      onReset={handleReset}
    >
      {/* Prompt selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => setPrompt(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              prompt === p
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            &ldquo;{p}&rdquo;
          </button>
        ))}
      </div>

      {/* Current prompt */}
      <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground">
        {prompt}{" "}
        <span className="inline-block h-3 w-0.5 animate-pulse bg-accent" />
      </div>

      {!anyLoaded ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
          Models haven&apos;t been trained and uploaded yet. This widget will show
          side-by-side predictions from 1-layer, 2-layer, and 4-layer
          transformers once the model weights are available.
        </div>
      ) : (
        /* Side-by-side results */
        <div className="grid gap-4 sm:grid-cols-3">
          {results.map((r) => (
            <div
              key={r.name}
              className="rounded-lg border-2 p-3"
              style={{ borderColor: `${r.color}40` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {r.layers}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {r.name}
                </span>
              </div>

              {r.error ? (
                <div className="text-xs text-red-400">Error running model</div>
              ) : !r.loaded ? (
                <div className="text-xs text-muted">Not loaded</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {r.predictions.map((pred, i) => {
                    const barWidth = Math.min(100, pred.prob * 100 * 3);
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-16 shrink-0 truncate font-mono text-[11px] font-semibold text-foreground">
                          {pred.token}
                        </span>
                        <div className="relative h-3.5 flex-1 rounded bg-foreground/5">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: r.color,
                              opacity: 0.6,
                            }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-[9px] text-muted">
                          {(pred.prob * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 text-[10px] text-muted">
        Same architecture, same training data — the only difference is the
        number of layers. More layers = more rounds of &ldquo;gather context,
        think about it&rdquo; = better predictions.
      </div>
    </WidgetContainer>
  );
}
