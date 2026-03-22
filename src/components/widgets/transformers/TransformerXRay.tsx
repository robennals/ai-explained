"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import {
  loadTransformerModel,
  forward,
  tokenize,
  type TransformerModel,
  type InferenceResult,
} from "./model-inference";

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/transformer-models/story";

const SENTENCES = [
  "The cat sat on the mat because it was tired",
  "Once upon a time there was a little girl",
  "The dog chased the ball across the yard",
  "She picked up the book and started reading",
];

type TabId = "attention" | "residual" | "changes";
const TABS: { id: TabId; label: string }[] = [
  { id: "attention", label: "Attention Heads" },
  { id: "residual", label: "Residual Stream" },
  { id: "changes", label: "What Changed?" },
];

function AttentionTab({
  result,
  tokens,
  config,
}: {
  result: InferenceResult;
  tokens: string[];
  config: { num_layers: number; num_heads: number };
}) {
  const [layerIdx, setLayerIdx] = useState(0);
  const [headIdx, setHeadIdx] = useState(0);
  const n = tokens.length;

  const weights =
    result.layerAttentions[layerIdx]?.[headIdx] ?? new Float32Array(0);

  return (
    <div>
      {/* Layer selector */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted">Layer:</span>
        {Array.from({ length: config.num_layers }, (_, l) => (
          <button
            key={l}
            onClick={() => setLayerIdx(l)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              layerIdx === l
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {l + 1}
          </button>
        ))}
      </div>

      {/* Head selector */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted">Head:</span>
        {Array.from({ length: config.num_heads }, (_, h) => (
          <button
            key={h}
            onClick={() => setHeadIdx(h)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              headIdx === h
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {h + 1}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="flex">
            <div className="h-6 w-14 shrink-0" />
            {tokens.map((tok, j) => (
              <div key={j} className="flex h-6 w-8 items-end justify-center">
                <span className="origin-bottom-left -rotate-45 whitespace-nowrap text-[7px] font-medium text-muted">
                  {tok.length > 5 ? tok.slice(0, 4) + "…" : tok}
                </span>
              </div>
            ))}
          </div>
          {tokens.map((tok, i) => (
            <div key={i} className="flex items-center">
              <div className="flex h-8 w-14 shrink-0 items-center justify-end pr-1.5 text-[8px] font-medium text-muted">
                {tok.length > 5 ? tok.slice(0, 4) + "…" : tok}
              </div>
              {tokens.map((_, j) => {
                const w = j <= i ? weights[i * n + j] : 0;
                return (
                  <div
                    key={j}
                    className="flex h-8 w-8 items-center justify-center border border-border/10"
                    style={{
                      backgroundColor:
                        j <= i
                          ? `rgba(99, 102, 241, ${w * 0.85})`
                          : "rgba(0,0,0,0.02)",
                    }}
                  >
                    {j <= i && w > 0.08 && (
                      <span className="text-[7px] font-mono text-white/70">
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

      <div className="mt-2 text-[10px] text-muted">
        Each cell shows how much attention word (row) pays to word (column).
        Try different heads — they specialize in different patterns!
      </div>
    </div>
  );
}

function ResidualTab({
  result,
  tokens,
  config,
}: {
  result: InferenceResult;
  tokens: string[];
  config: { embed_dim: number; num_layers: number };
}) {
  // Show how the last token's representation evolves
  return (
    <div>
      <div className="mb-3 text-xs text-muted">
        How the last word&apos;s ({tokens[tokens.length - 1]}) representation changes layer by layer:
      </div>
      <div className="flex flex-col gap-2">
        {result.layerOutputs.map((output, l) => {
          let maxAbs = 0;
          for (let i = 0; i < output.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(output[i]));
          }
          maxAbs = Math.max(0.1, maxAbs);
          const dimCount = Math.min(config.embed_dim, 64);

          return (
            <div key={l} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-right text-[10px] font-medium text-muted">
                Layer {l + 1}
              </span>
              <div className="flex gap-px">
                {Array.from({ length: dimCount }, (_, d) => {
                  const v = output[d];
                  const intensity = Math.min(1, Math.abs(v) / maxAbs);
                  return (
                    <div
                      key={d}
                      className="h-4 rounded-sm"
                      style={{
                        width: `${Math.max(2, 200 / dimCount)}px`,
                        backgroundColor:
                          v >= 0
                            ? `rgba(99, 102, 241, ${intensity})`
                            : `rgba(248, 113, 113, ${intensity})`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] text-muted">
        Blue = positive, red = negative. Watch how the pattern evolves — each
        layer refines the representation while preserving the overall structure
        (thanks to residual connections).
      </div>
    </div>
  );
}

function ChangesTab({
  result,
  config,
}: {
  result: InferenceResult;
  config: { embed_dim: number; num_layers: number };
}) {
  // Show the difference between consecutive layers
  const diffs: { layer: number; diff: Float32Array; magnitude: number }[] = [];

  for (let l = 0; l < result.layerOutputs.length; l++) {
    const current = result.layerOutputs[l];
    // Compare to previous (or zeros for first)
    const prev = l > 0 ? result.layerOutputs[l - 1] : new Float32Array(config.embed_dim);
    const diff = new Float32Array(config.embed_dim);
    let mag = 0;
    for (let d = 0; d < config.embed_dim; d++) {
      diff[d] = current[d] - prev[d];
      mag += diff[d] * diff[d];
    }
    diffs.push({ layer: l + 1, diff, magnitude: Math.sqrt(mag) });
  }

  const maxMag = Math.max(...diffs.map((d) => d.magnitude), 0.1);

  return (
    <div>
      <div className="mb-3 text-xs text-muted">
        What each layer <em>added</em> to the representation (the residual):
      </div>
      <div className="flex flex-col gap-2">
        {diffs.map((d) => {
          const barWidth = (d.magnitude / maxMag) * 100;
          let maxAbs = 0;
          for (let i = 0; i < d.diff.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(d.diff[i]));
          }
          maxAbs = Math.max(0.1, maxAbs);
          const dimCount = Math.min(config.embed_dim, 64);

          return (
            <div key={d.layer} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-right text-[10px] font-medium text-muted">
                Layer {d.layer}
              </span>
              <div className="flex gap-px">
                {Array.from({ length: dimCount }, (_, i) => {
                  const v = d.diff[i];
                  const intensity = Math.min(1, Math.abs(v) / maxAbs);
                  return (
                    <div
                      key={i}
                      className="h-4 rounded-sm"
                      style={{
                        width: `${Math.max(2, 200 / dimCount)}px`,
                        backgroundColor:
                          v >= 0
                            ? `rgba(74, 222, 128, ${intensity})`
                            : `rgba(251, 146, 60, ${intensity})`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="w-16">
                <div className="h-2 w-full rounded bg-foreground/5">
                  <div
                    className="h-full rounded bg-accent/50"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-[9px] font-mono text-muted">
                {d.magnitude.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] text-muted">
        Green = positive change, orange = negative change. The bar on the right
        shows total change magnitude. Notice how each layer makes different-sized
        adjustments — some layers do more work than others.
      </div>
    </div>
  );
}

export function TransformerXRay() {
  const [model, setModel] = useState<TransformerModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentence, setSentence] = useState(SENTENCES[0]);
  const [tab, setTab] = useState<TabId>("attention");

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

  const result = useMemo((): InferenceResult | null => {
    if (!model || !sentence.trim()) return null;
    const tokenIds = tokenize(sentence, model.vocab);
    if (tokenIds.length === 0) return null;
    const truncated = tokenIds.slice(-model.config.context_len);
    try {
      return forward(model, truncated);
    } catch {
      return null;
    }
  }, [model, sentence]);

  const tokens = sentence.split(/\s+/).filter((t) => t.length > 0);

  const handleReset = useCallback(() => {
    setSentence(SENTENCES[0]);
    setTab("attention");
  }, []);

  if (loading) {
    return (
      <WidgetContainer
        title="Transformer X-Ray"
        description="See inside a transformer — attention patterns, residual stream, and more"
      >
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-sm text-muted">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Loading model…
          </div>
        </div>
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="Transformer X-Ray"
        description="See inside a transformer — attention patterns, residual stream, and more"
      >
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
          {error} — The model hasn&apos;t been trained and uploaded yet.
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Transformer X-Ray"
      description="See inside a transformer — attention patterns, residual stream, and layer contributions"
      onReset={handleReset}
    >
      {/* Sentence selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {SENTENCES.map((s) => (
          <button
            key={s}
            onClick={() => setSentence(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              sentence === s
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            &ldquo;{s.length > 30 ? s.slice(0, 28) + "…" : s}&rdquo;
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="mb-4">
        <input
          type="text"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="Type a sentence to analyze..."
        />
      </div>

      <WidgetTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <div className="min-h-[250px]">
        {!result ? (
          <div className="py-8 text-center text-sm text-muted">
            Type a sentence to see its internals
          </div>
        ) : tab === "attention" ? (
          <AttentionTab
            result={result}
            tokens={tokens}
            config={model!.config}
          />
        ) : tab === "residual" ? (
          <ResidualTab
            result={result}
            tokens={tokens}
            config={model!.config}
          />
        ) : (
          <ChangesTab result={result} config={model!.config} />
        )}
      </div>
    </WidgetContainer>
  );
}
