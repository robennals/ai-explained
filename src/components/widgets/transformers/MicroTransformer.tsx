"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import {
  loadTransformerModel,
  forward,
  tokenize,
  topK,
  type TransformerModel,
  type InferenceResult,
} from "./model-inference";

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/transformer-models/micro";

const PRESETS = [
  "Once upon a time",
  "The little cat",
  "A big dog ran",
  "She was very",
];

type TabId = "predictions" | "attention" | "internals";
const TABS: { id: TabId; label: string }[] = [
  { id: "predictions", label: "Predictions" },
  { id: "attention", label: "Attention" },
  { id: "internals", label: "Internals" },
];

function PredictionBars({
  predictions,
  onSelect,
}: {
  predictions: { token: string; prob: number; id: number }[];
  onSelect: (token: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {predictions.map(({ token, prob }) => {
        const barWidth = Math.min(100, prob * 100 * 3);
        return (
          <button
            key={token}
            onClick={() => onSelect(token)}
            className="group flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <span className="w-20 shrink-0 truncate font-mono text-sm font-semibold text-foreground">
              {token}
            </span>
            <div className="relative flex-1">
              <div className="h-5 w-full rounded bg-foreground/5">
                <div
                  className="h-full rounded bg-accent/60 transition-all group-hover:bg-accent"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-xs text-muted">
              {(prob * 100).toFixed(1)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AttentionHeatmap({
  weights,
  tokens,
  headIdx,
  numHeads,
  onHeadChange,
}: {
  weights: Float32Array;
  tokens: string[];
  headIdx: number;
  numHeads: number;
  onHeadChange: (h: number) => void;
}) {
  const n = tokens.length;

  return (
    <div>
      {/* Head selector */}
      <div className="mb-3 flex gap-2">
        {Array.from({ length: numHeads }, (_, h) => (
          <button
            key={h}
            onClick={() => onHeadChange(h)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              headIdx === h
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            Head {h + 1}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex">
            <div className="h-8 w-16 shrink-0" />
            {tokens.map((tok, j) => (
              <div
                key={j}
                className="flex h-8 w-10 items-end justify-center"
              >
                <span className="origin-bottom-left -rotate-45 whitespace-nowrap text-[8px] font-medium text-muted">
                  {tok.length > 6 ? tok.slice(0, 5) + "…" : tok}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {tokens.map((tok, i) => (
            <div key={i} className="flex items-center">
              <div className="flex h-10 w-16 shrink-0 items-center justify-end pr-2 text-[9px] font-medium text-muted">
                {tok.length > 6 ? tok.slice(0, 5) + "…" : tok}
              </div>
              {tokens.map((_, j) => {
                const w = j <= i ? weights[i * n + j] : 0;
                return (
                  <div
                    key={j}
                    className="flex h-10 w-10 items-center justify-center border border-border/20"
                    style={{
                      backgroundColor:
                        j <= i
                          ? `rgba(99, 102, 241, ${w * 0.8})`
                          : "rgba(0,0,0,0.02)",
                    }}
                  >
                    {j <= i && w > 0.05 && (
                      <span className="text-[8px] font-mono text-white/80">
                        {(w * 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InternalsView({
  result,
  config,
}: {
  result: InferenceResult;
  config: { embed_dim: number; num_layers: number };
}) {
  return (
    <div>
      <div className="mb-3 text-xs text-muted">
        The last token&apos;s representation as it flows through each layer:
      </div>
      <div className="flex flex-wrap gap-4">
        {result.layerOutputs.map((output, l) => {
          // Show as colored bars
          let maxAbs = 0;
          for (let i = 0; i < output.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(output[i]));
          }
          maxAbs = Math.max(1, maxAbs);

          return (
            <div key={l} className="flex flex-col items-center">
              <div className="mb-1 text-[9px] font-medium text-muted">
                Layer {l + 1}
              </div>
              <div className="flex gap-px">
                {Array.from(
                  { length: Math.min(config.embed_dim, 32) },
                  (_, d) => {
                    const v = output[d];
                    const intensity = Math.abs(v) / maxAbs;
                    const isPositive = v >= 0;
                    return (
                      <div
                        key={d}
                        className="h-6 w-1 rounded-sm"
                        style={{
                          backgroundColor: isPositive
                            ? `rgba(99, 102, 241, ${intensity})`
                            : `rgba(248, 113, 113, ${intensity})`,
                        }}
                        title={`d${d}: ${v.toFixed(3)}`}
                      />
                    );
                  },
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[10px] text-muted">
        Blue = positive, red = negative. Each bar is one dimension of the{" "}
        {config.embed_dim}-dimensional embedding. Notice how the pattern
        changes as information flows through layers.
      </div>
    </div>
  );
}

export function MicroTransformer() {
  const [model, setModel] = useState<TransformerModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(PRESETS[0]);
  const [tab, setTab] = useState<TabId>("predictions");
  const [headIdx, setHeadIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Run inference when text changes
  const result = useMemo((): InferenceResult | null => {
    if (!model || !text.trim()) return null;
    const tokenIds = tokenize(text, model.vocab);
    if (tokenIds.length === 0) return null;
    const truncated = tokenIds.slice(-model.config.context_len);
    try {
      return forward(model, truncated);
    } catch {
      return null;
    }
  }, [model, text]);

  const predictions = result
    ? topK(result.probs, model!.vocab, 8)
    : [];

  const tokens = text.split(/\s+/).filter((t) => t.length > 0);

  const handleSelectWord = (word: string) => {
    setText((prev) => prev + " " + word);
  };

  const handleReset = useCallback(() => {
    setText(PRESETS[0]);
    setTab("predictions");
    setHeadIdx(0);
  }, []);

  if (loading) {
    return (
      <WidgetContainer
        title="Micro Transformer (50K params)"
        description="A real transformer running in your browser"
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
            Loading micro transformer model…
          </div>
        </div>
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="Micro Transformer (50K params)"
        description="A real transformer running in your browser"
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
      title="Micro Transformer (50K params)"
      description="A real transformer running in your browser — see every computation"
      onReset={handleReset}
    >
      {/* Preset buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setText(preset)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              text === preset
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="Type a prompt..."
        />
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
          <span>{tokens.length} tokens</span>
          <span>
            {model!.config.num_layers} layer, {model!.config.num_heads} heads,{" "}
            {model!.config.embed_dim}d embeddings
          </span>
        </div>
      </div>

      {/* Tabs */}
      <WidgetTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {/* Tab content */}
      <div className="min-h-[200px]">
        {tab === "predictions" && (
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              Top predictions (click to extend)
            </div>
            {predictions.length > 0 ? (
              <PredictionBars
                predictions={predictions}
                onSelect={handleSelectWord}
              />
            ) : (
              <div className="py-8 text-center text-sm text-muted">
                Type something to see predictions
              </div>
            )}
          </div>
        )}

        {tab === "attention" && result && (
          <AttentionHeatmap
            weights={result.layerAttentions[0]?.[headIdx] ?? new Float32Array(0)}
            tokens={tokens}
            headIdx={headIdx}
            numHeads={model!.config.num_heads}
            onHeadChange={setHeadIdx}
          />
        )}

        {tab === "internals" && result && (
          <InternalsView
            result={result}
            config={model!.config}
          />
        )}
      </div>
    </WidgetContainer>
  );
}
