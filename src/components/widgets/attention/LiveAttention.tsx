"use client";

import { useEffect, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import {
  loadTransformerModel,
  forward,
  type TransformerModel,
  type InferenceResult,
} from "../transformers/model-inference";
import { loadTokenizer, type WordPieceTokenizer } from "./wordpiece-tokenizer";

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/attention-model/model";
const TOKENIZER_URL = "/data/tokenizer/ts-tokenizer-4096.json";

const DEFAULT_SENTENCE =
  "Once upon a time, a little girl walked into the woods. She saw a big bear.";
const DEFAULT_SELECTED_TOKEN = 14; // "she" — pronoun, midway through the second sentence
const DEFAULT_HEAD = { layer: 0, head: 0 };

interface LoadState {
  model: TransformerModel | null;
  tokenizer: WordPieceTokenizer | null;
  loading: boolean;
  error: string | null;
}

export function LiveAttention() {
  const [state, setState] = useState<LoadState>({
    model: null,
    tokenizer: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadTransformerModel(MODEL_BASE), loadTokenizer(TOKENIZER_URL)])
      .then(([model, tokenizer]) => {
        if (cancelled) return;
        setState({ model, tokenizer, loading: false, error: null });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setState({ model: null, tokenizer: null, loading: false, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <WidgetContainer
        title="Live Attention Heads"
        description="A tiny transformer running in your browser"
      >
        <div className="flex items-center justify-center py-12 text-sm text-muted">
          Loading attention model…
        </div>
      </WidgetContainer>
    );
  }

  if (state.error || !state.model || !state.tokenizer) {
    return (
      <WidgetContainer
        title="Live Attention Heads"
        description="A tiny transformer running in your browser"
      >
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
          Couldn&apos;t load the live model: {state.error ?? "unknown error"}.
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Live Attention Heads"
      description="A tiny transformer running in your browser — type any sentence and watch attention happen."
    >
      <LiveAttentionLoaded model={state.model} tokenizer={state.tokenizer} />
    </WidgetContainer>
  );
}

function LiveAttentionLoaded({
  model,
  tokenizer,
}: {
  model: TransformerModel;
  tokenizer: WordPieceTokenizer;
}) {
  const [input, setInput] = useState(DEFAULT_SENTENCE);
  const [result, setResult] = useState<{
    tokens: string[];
    inference: InferenceResult;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(DEFAULT_SELECTED_TOKEN);
  const [selectedHead, setSelectedHead] = useState<{ layer: number; head: number }>(DEFAULT_HEAD);

  useEffect(() => {
    const handle = setTimeout(() => {
      setRunning(true);
      try {
        const enc = tokenizer.encode(input);
        const ids = [tokenizer.bosId, ...enc.ids].slice(0, model.config.context_len);
        const tokens = ["[BOS]", ...enc.tokens].slice(0, model.config.context_len);
        const inference = forward(model, ids);
        setResult({ tokens, inference });
        setSelectedToken((prev) => (prev !== null && prev >= tokens.length ? null : prev));
      } finally {
        setRunning(false);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [input, model, tokenizer]);

  const seqLen = result?.tokens.length ?? 0;
  const headAttn = result
    ? result.inference.layerAttentions[selectedHead.layer]?.[selectedHead.head]
    : undefined;
  const attentionRow: number[] | null =
    selectedToken !== null && headAttn
      ? Array.from({ length: seqLen }, (_, j) => headAttn[selectedToken * seqLen + j])
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* All-heads grid */}
      {result && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted">
            All heads ({model.config.num_layers} × {model.config.num_heads}) — click a cell to
            inspect that head
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${model.config.num_heads}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: model.config.num_layers }, (_, l) =>
              Array.from({ length: model.config.num_heads }, (_, h) => {
                const active = selectedHead.layer === l && selectedHead.head === h;
                const cellAttn = result.inference.layerAttentions[l]?.[h];
                const cellRow: number[] =
                  cellAttn && selectedToken !== null
                    ? Array.from({ length: seqLen }, (_, j) => cellAttn[selectedToken * seqLen + j])
                    : [];
                return (
                  <button
                    key={`${l}-${h}`}
                    onClick={() => setSelectedHead({ layer: l, head: h })}
                    title={`L${l}H${h}`}
                    className={`relative flex h-12 flex-col items-stretch rounded border p-0.5 transition-colors ${
                      active
                        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <span className="text-[8px] leading-tight text-muted">
                      L{l}H{h}
                    </span>
                    <div className="flex h-full items-end gap-px">
                      {cellRow.length > 0
                        ? cellRow.map((w, j) => (
                            <div
                              key={j}
                              className="flex-1"
                              style={{
                                height: `${Math.min(100, w * 100)}%`,
                                backgroundColor: "rgb(99,102,241)",
                                opacity: 0.7,
                              }}
                            />
                          ))
                        : null}
                    </div>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}

      {/* Sentence input — placed directly above the token row so it's
          obvious the reader can edit the sentence. */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Sentence (edit me)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm"
          placeholder="Type any sentence…"
        />
      </div>

      {/* Token row with attention readout */}
      {result && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted">
            {selectedToken !== null ? (
              <>
                Attention from{" "}
                <span className="font-mono">{result.tokens[selectedToken]}</span> in head{" "}
                <span className="font-mono">
                  L{selectedHead.layer}H{selectedHead.head}
                </span>
                {running ? " · running…" : ""}
              </>
            ) : (
              <>Click any token below to see what it attends to{running ? " · running…" : ""}</>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-x-1 gap-y-4 rounded-lg border border-border bg-surface px-5 py-5">
            {result.tokens.map((tok, j) => {
              const isSelected = j === selectedToken;
              const w = attentionRow !== null ? (attentionRow[j] ?? 0) : 0;
              const alpha =
                attentionRow === null || w < 0.02
                  ? 0
                  : Math.min(0.12 + w * 0.73, 0.85);
              return (
                <span key={j} className="relative inline-flex flex-col items-center">
                  {attentionRow !== null && w >= 0.02 ? (
                    <span
                      className={`mb-1 font-mono text-[10px] font-bold leading-none ${
                        isSelected ? "text-accent" : ""
                      }`}
                      style={
                        !isSelected
                          ? { color: w > 0.3 ? "rgb(99,102,241)" : "var(--color-muted)" }
                          : undefined
                      }
                    >
                      {Math.round(w * 100)}%
                    </span>
                  ) : (
                    <span className="mb-1 text-[10px] leading-none text-transparent">·</span>
                  )}
                  <button
                    onClick={() => setSelectedToken(isSelected ? null : j)}
                    className="cursor-pointer px-1.5 py-1 font-mono text-sm transition-all"
                    style={
                      isSelected
                        ? {
                            borderRadius: 4,
                            outline: "2.5px solid var(--color-accent)",
                            outlineOffset: 2,
                            fontWeight: 700,
                          }
                        : alpha > 0
                          ? {
                              backgroundColor: `rgba(99,102,241,${alpha})`,
                              color: w > 0.4 ? "white" : undefined,
                              borderRadius: 4,
                            }
                          : undefined
                    }
                  >
                    {tok}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
