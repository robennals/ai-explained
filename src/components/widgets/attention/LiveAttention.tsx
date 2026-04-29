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

interface NamedHead {
  label: string;
  layer: number;
  head: number;
  explanation: string;
}

// Coordinates and labels come from the Phase 1 trained-model inspection,
// then re-validated against per-position behavior (cross-probe means hid
// per-position decay, so this set is narrower than the original Phase 1
// recommendations). See docs/superpowers/reports/2026-04-28-attention-heads-phase1.md.
const NAMED_HEADS: NamedHead[] = [
  {
    label: "Induction",
    layer: 3,
    head: 3,
    explanation:
      "When a phrase repeats, attention jumps back to whatever followed the earlier occurrence — a simple form of in-context learning. On non-repeated tokens this head mostly attends to itself.",
  },
  {
    label: "Previous token",
    layer: 0,
    head: 7,
    explanation:
      "Each token looks at the one immediately before it. The cleanest single pattern in the model — works at every position.",
  },
  {
    label: "Punctuation",
    layer: 2,
    head: 3,
    explanation:
      "After a period or comma, this head pulls attention back to the punctuation mark — the model has learned where sentence boundaries are.",
  },
];

interface Example {
  label: string;
  text: string;
  defaultHeadLabel?: string;
  defaultSelectedToken?: number;
  hint: string;
}

const EXAMPLES: Example[] = [
  {
    label: "Induction",
    text: "The dog chased the cat because it was angry",
    defaultHeadLabel: "Induction",
    defaultSelectedToken: 4, // second "the" (after [BOS] is prepended)
    hint:
      'Click the second "the" with the Induction head selected. Attention jumps to "dog" — the word that followed "the" earlier in the sentence.',
  },
  {
    label: "Previous token",
    text: "Mary had a little lamb",
    defaultHeadLabel: "Previous token",
    defaultSelectedToken: 4, // "little" — clean diagonal demo
    hint:
      "On the Previous token head, every token's attention slides one cell to the left. Try clicking different words and watch the diagonal hold.",
  },
  {
    label: "Punctuation",
    text: "She picked up the book. The book was heavy.",
    defaultHeadLabel: "Punctuation",
    defaultSelectedToken: 8, // "book" after the period
    hint:
      'Click any token after the period — the Punctuation head pulls most of its attention back to "." even when the period is several words behind. The model learned where sentences end without anyone telling it.',
  },
];

interface LoadState {
  model: TransformerModel | null;
  tokenizer: WordPieceTokenizer | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_EXAMPLE = EXAMPLES[0];

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
  const [input, setInput] = useState(DEFAULT_EXAMPLE.text);
  const [result, setResult] = useState<{
    tokens: string[];
    inference: InferenceResult;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(
    DEFAULT_EXAMPLE.defaultSelectedToken ?? null,
  );
  const initialHead =
    NAMED_HEADS.find((h) => h.label === DEFAULT_EXAMPLE.defaultHeadLabel) ?? NAMED_HEADS[0];
  const [selectedHead, setSelectedHead] = useState<{ layer: number; head: number }>({
    layer: initialHead.layer,
    head: initialHead.head,
  });
  const [viewMode, setViewMode] = useState<"named" | "grid">("named");

  // Debounce + run forward pass.
  useEffect(() => {
    const handle = setTimeout(() => {
      setRunning(true);
      try {
        const enc = tokenizer.encode(input);
        const ids = [tokenizer.bosId, ...enc.ids].slice(0, model.config.context_len);
        const tokens = ["[BOS]", ...enc.tokens].slice(0, model.config.context_len);
        const inference = forward(model, ids);
        setResult({ tokens, inference });
        // If the sentence shrank below the previously-selected token, clear
        // the selection so the readout doesn't read past the new attention row.
        setSelectedToken((prev) => (prev !== null && prev >= tokens.length ? null : prev));
      } finally {
        setRunning(false);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [input, model, tokenizer]);

  const namedHeadMatch = NAMED_HEADS.find(
    (h) => h.layer === selectedHead.layer && h.head === selectedHead.head,
  );
  const activeExample = EXAMPLES.find((ex) => ex.text === input);
  const seqLen = result?.tokens.length ?? 0;
  const headAttn = result
    ? result.inference.layerAttentions[selectedHead.layer]?.[selectedHead.head]
    : undefined;
  const attentionRow: number[] | null =
    selectedToken !== null && headAttn
      ? Array.from({ length: seqLen }, (_, j) => headAttn[selectedToken * seqLen + j])
      : null;

  function applyExample(ex: Example) {
    setInput(ex.text);
    if (ex.defaultHeadLabel) {
      const h = NAMED_HEADS.find((nh) => nh.label === ex.defaultHeadLabel);
      if (h) setSelectedHead({ layer: h.layer, head: h.head });
    }
    // Clear result so the readout disappears until the new forward pass
    // completes — otherwise we briefly index the new head into the old
    // attention matrix.
    setResult(null);
    setSelectedToken(ex.defaultSelectedToken ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sentence tabs */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => applyExample(ex)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              input === ex.text
                ? "bg-accent text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Free-text input */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Type any sentence</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm"
          placeholder="Type something…"
        />
      </div>

      {/* Named-head chips + view toggle */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">
            {viewMode === "named" ? "Named heads" : "All heads"}
          </span>
          <button
            onClick={() => setViewMode(viewMode === "named" ? "grid" : "named")}
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            {viewMode === "named" ? "Show all heads" : "Show named heads"}
          </button>
        </div>

        {viewMode === "named" ? (
          <div className="flex flex-wrap gap-1.5">
            {NAMED_HEADS.map((h) => {
              const active = h.layer === selectedHead.layer && h.head === selectedHead.head;
              return (
                <button
                  key={h.label}
                  onClick={() => setSelectedHead({ layer: h.layer, head: h.head })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-border text-muted hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {h.label} <span className="opacity-50">L{h.layer}H{h.head}</span>
                </button>
              );
            })}
          </div>
        ) : (
          result && (
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${model.config.num_heads}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: model.config.num_layers }, (_, l) =>
                Array.from({ length: model.config.num_heads }, (_, h) => {
                  const named = NAMED_HEADS.find((nh) => nh.layer === l && nh.head === h);
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
                      title={named ? `${named.label} (L${l}H${h})` : `L${l}H${h}`}
                      className={`relative flex h-12 flex-col items-stretch rounded border p-0.5 transition-colors ${
                        active
                          ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40"
                          : named
                            ? "border-indigo-300 bg-indigo-50/30 dark:border-indigo-700 dark:bg-indigo-950/20"
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
          )
        )}

        {namedHeadMatch && viewMode === "named" && (
          <div className="mt-2 rounded-lg border border-border bg-foreground/[0.02] px-3 py-2 text-xs text-muted">
            {namedHeadMatch.explanation}
          </div>
        )}
      </div>

      {/* Single token row: each token is clickable AND shows attention weight
          coming from the currently-selected token under the current head. */}
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
                {namedHeadMatch ? <> · <span>{namedHeadMatch.label}</span></> : null}
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

      {/* Per-example hint */}
      {activeExample && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-xs text-muted">
          <strong className="text-foreground">Try this:</strong> {activeExample.hint}
        </div>
      )}
    </div>
  );
}
