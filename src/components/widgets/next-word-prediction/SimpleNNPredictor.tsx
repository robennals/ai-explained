"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { loadTinyStoriesTokenizer } from "../embeddings/bpeTokenizer";
import type { EncodedPiece } from "../embeddings/bpeTokenizer";

// ---------------------------------------------------------------------------
// Model loading & inference (pure JS, no TF.js needed)
// ---------------------------------------------------------------------------

interface ModelConfig {
  vocab_size: number;
  embed_dim: number;
  context_len: number;
  hidden_dim: number;
}

interface Model {
  config: ModelConfig;
  vocab: string[];
  weights: {
    embedding: Float32Array; // (vocab_size, embed_dim)
    fc1_weight: Float32Array; // (hidden_dim, context_len * embed_dim)
    fc1_bias: Float32Array; // (hidden_dim,)
    fc2_weight: Float32Array; // (vocab_size, hidden_dim)
    fc2_bias: Float32Array; // (vocab_size,)
  };
}

interface Prediction {
  token: string;
  prob: number;
  tokenId: number;
}

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/next-word-model/next-word-ctx3";

let modelPromise: Promise<Model> | null = null;

async function loadModel(): Promise<Model> {
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    // Load config + vocab JSON
    const configResp = await fetch(`${MODEL_BASE}.json`);
    if (!configResp.ok) throw new Error(`Model config: ${configResp.status}`);
    const json = await configResp.json();
    const config: ModelConfig = json.config;
    const vocab: string[] = json.vocab;

    // Load binary weights
    const binResp = await fetch(`${MODEL_BASE}.weights.bin`);
    if (!binResp.ok) throw new Error(`Model weights: ${binResp.status}`);
    const buf = await binResp.arrayBuffer();
    const view = new DataView(buf);

    let offset = 0;

    function readTensor(): { shape: number[]; data: Float32Array } {
      const ndims = view.getUint32(offset, true);
      offset += 4;
      const shape: number[] = [];
      for (let i = 0; i < ndims; i++) {
        shape.push(view.getUint32(offset, true));
        offset += 4;
      }
      let nElements = 1;
      for (const d of shape) nElements *= d;
      const data = new Float32Array(buf, offset, nElements);
      offset += nElements * 4;
      return { shape, data };
    }

    const embedding = readTensor();
    const fc1_weight = readTensor();
    const fc1_bias = readTensor();
    const fc2_weight = readTensor();
    const fc2_bias = readTensor();

    return {
      config,
      vocab,
      weights: {
        embedding: embedding.data,
        fc1_weight: fc1_weight.data,
        fc1_bias: fc1_bias.data,
        fc2_weight: fc2_weight.data,
        fc2_bias: fc2_bias.data,
      },
    };
  })();

  return modelPromise;
}

function predict(model: Model, tokenIds: number[], topK: number = 5): Prediction[] {
  const { config, vocab, weights } = model;
  const { embed_dim, context_len, hidden_dim, vocab_size } = config;

  // Take the last context_len tokens
  const ids = tokenIds.slice(-context_len);
  if (ids.length < context_len) return [];

  // Embedding lookup + flatten: (context_len * embed_dim,)
  const flat = new Float32Array(context_len * embed_dim);
  for (let i = 0; i < context_len; i++) {
    const embOffset = ids[i] * embed_dim;
    for (let j = 0; j < embed_dim; j++) {
      flat[i * embed_dim + j] = weights.embedding[embOffset + j];
    }
  }

  // fc1: hidden = ReLU(W1 @ flat + b1)
  const hidden = new Float32Array(hidden_dim);
  for (let i = 0; i < hidden_dim; i++) {
    let sum = weights.fc1_bias[i];
    const rowOffset = i * (context_len * embed_dim);
    for (let j = 0; j < context_len * embed_dim; j++) {
      sum += weights.fc1_weight[rowOffset + j] * flat[j];
    }
    hidden[i] = sum > 0 ? sum : 0; // ReLU
  }

  // fc2: logits = W2 @ hidden + b2
  const logits = new Float32Array(vocab_size);
  for (let i = 0; i < vocab_size; i++) {
    let sum = weights.fc2_bias[i];
    const rowOffset = i * hidden_dim;
    for (let j = 0; j < hidden_dim; j++) {
      sum += weights.fc2_weight[rowOffset + j] * hidden[j];
    }
    logits[i] = sum;
  }

  // Softmax
  let maxLogit = -Infinity;
  for (let i = 0; i < vocab_size; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i];
  }
  let sumExp = 0;
  const probs = new Float32Array(vocab_size);
  for (let i = 0; i < vocab_size; i++) {
    probs[i] = Math.exp(logits[i] - maxLogit);
    sumExp += probs[i];
  }
  for (let i = 0; i < vocab_size; i++) {
    probs[i] /= sumExp;
  }

  // Top-K
  const indices = Array.from({ length: vocab_size }, (_, i) => i);
  indices.sort((a, b) => probs[b] - probs[a]);

  return indices.slice(0, topK).map((idx) => ({
    token: vocab[idx],
    prob: probs[idx],
    tokenId: idx,
  }));
}

// ---------------------------------------------------------------------------
// Format a token for display (strip ## prefix, handle special tokens)
// ---------------------------------------------------------------------------
function displayToken(token: string): string {
  if (token.startsWith("##")) return token.slice(2);
  return token;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Tab = "explore" | "compare";

const COMPARE_GROUPS = [
  { label: "Animals", words: ["cat", "dog", "bird", "fish"] },
  { label: "People", words: ["boy", "girl", "mom", "dad"] },
  { label: "Feelings", words: ["happy", "sad", "scared", "angry"] },
];

export function SimpleNNPredictor() {
  const [tab, setTab] = useState<Tab>("explore");
  const [text, setText] = useState("once upon a");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<Model | null>(null);
  const tokRef = useRef<{ encode: (t: string) => EncodedPiece[] } | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  // Predictions for explore mode
  const [explorePreds, setExplorePreds] = useState<Prediction[]>([]);
  const [exploreTokens, setExploreTokens] = useState<EncodedPiece[]>([]);

  // Predictions for compare mode
  const [comparePreds, setComparePreds] = useState<
    Map<string, Prediction[]>
  >(new Map());

  // Load model and tokenizer
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [model, tok] = await Promise.all([
          loadModel(),
          loadTinyStoriesTokenizer(),
        ]);
        if (cancelled) return;
        modelRef.current = model;
        tokRef.current = tok;
        setModelConfig(model.config);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load model");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Run inference when text or tab changes
  useEffect(() => {
    if (loading || error || !modelRef.current || !tokRef.current) return;

    if (tab === "explore") {
      const pieces = tokRef.current.encode(text);
      setExploreTokens(pieces);
      const ids = pieces.map((p) => p.id);
      if (ids.length >= modelRef.current.config.context_len) {
        setExplorePreds(predict(modelRef.current, ids, 10));
      } else {
        setExplorePreds([]);
      }
    } else {
      // Compare: run predictions for all words in all groups
      const results = new Map<string, Prediction[]>();
      for (const group of COMPARE_GROUPS) {
        for (const word of group.words) {
          const pieces = tokRef.current!.encode(`the ${word}`);
          const ids = pieces.map((p) => p.id);
          if (ids.length >= modelRef.current!.config.context_len) {
            results.set(word, predict(modelRef.current!, ids, 5));
          }
        }
      }
      setComparePreds(results);
    }
  }, [text, tab, loading, error]);

  const handlePredictionClick = useCallback((pred: Prediction) => {
    setText((prev) => {
      const token = pred.token;
      // If it's a continuation token (##...), append without space
      if (token.startsWith("##")) {
        return prev + token.slice(2);
      }
      return prev + " " + token;
    });
  }, []);

  const resetState = useCallback(() => {
    setText("once upon a");
    setTab("explore");
  }, []);

  if (error) {
    return (
      <WidgetContainer
        title="Neural Network Predictor"
        description="A real neural network predicting the next word"
        onReset={resetState}
      >
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load model: {error}
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Neural Network Predictor"
      description="A real neural network trained on children's stories"
      onReset={resetState}
    >
      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
        <button
          onClick={() => setTab("explore")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "explore"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setTab("compare")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "compare"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Compare Words
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading model...
        </div>
      ) : tab === "explore" ? (
        <ExploreTab
          text={text}
          setText={setText}
          tokens={exploreTokens}
          predictions={explorePreds}
          contextLen={modelConfig!.context_len}
          onPredictionClick={handlePredictionClick}
        />
      ) : (
        <CompareTab predictions={comparePreds} />
      )}

      {/* Model info */}
      {!loading && modelConfig && (
        <div className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Trained on 50,000 children&apos;s stories. Architecture: embedding
          (dim&nbsp;{modelConfig.embed_dim}) &rarr; dense
          ({modelConfig.hidden_dim} neurons, ReLU) &rarr;{" "}
          {modelConfig.vocab_size.toLocaleString()} word
          probabilities. Context: {modelConfig.context_len} tokens.
        </div>
      )}
    </WidgetContainer>
  );
}

// ---------------------------------------------------------------------------
// Explore tab
// ---------------------------------------------------------------------------
function ExploreTab({
  text,
  setText,
  tokens,
  predictions,
  contextLen,
  onPredictionClick,
}: {
  text: string;
  setText: (t: string) => void;
  tokens: EncodedPiece[];
  predictions: Prediction[];
  contextLen: number;
  onPredictionClick: (p: Prediction) => void;
}) {
  const maxProb = predictions.length > 0 ? predictions[0].prob : 1;
  const contextTokens = tokens.slice(-contextLen);

  return (
    <div className="space-y-4">
      {/* Text input */}
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type some text..."
          className="w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {/* Tokens the model sees */}
      {tokens.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Tokens:</span>
          {tokens.map((t, i) => {
            const isContext = i >= tokens.length - contextLen;
            return (
              <span
                key={i}
                className={`inline-block rounded px-1.5 py-0.5 font-mono text-xs ${
                  isContext
                    ? "bg-accent/15 text-accent font-medium"
                    : "bg-surface text-muted"
                }`}
              >
                {t.token}
              </span>
            );
          })}
          {tokens.length < contextLen && (
            <span className="text-xs text-muted italic">
              (need {contextLen - tokens.length} more token
              {contextLen - tokens.length > 1 ? "s" : ""})
            </span>
          )}
        </div>
      )}

      {/* Context arrow */}
      {contextTokens.length === contextLen && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Model sees:</span>
          <span className="font-mono font-medium text-accent">
            [{contextTokens.map((t) => t.token).join(", ")}]
          </span>
          <span>&rarr; predict next</span>
        </div>
      )}

      {/* Predictions */}
      {predictions.length > 0 ? (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted mb-2">
            Top predictions (click to extend):
          </div>
          {predictions.map((pred) => (
            <button
              key={pred.tokenId}
              onClick={() => onPredictionClick(pred)}
              className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-surface"
            >
              <span className="w-20 text-right font-mono text-xs text-foreground group-hover:text-accent transition-colors truncate">
                {displayToken(pred.token)}
              </span>
              <div className="flex-1">
                <div
                  className="h-4 rounded-sm bg-accent/60 transition-all duration-300 group-hover:bg-accent/80"
                  style={{
                    width: `${(pred.prob / maxProb) * 100}%`,
                    minWidth: "2px",
                  }}
                />
              </div>
              <span className="w-12 text-right font-mono text-xs text-muted">
                {(pred.prob * 100).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      ) : tokens.length > 0 ? (
        <div className="rounded-lg bg-surface px-4 py-3 text-center text-sm text-muted">
          Need at least {contextLen} tokens to make a prediction.
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare tab
// ---------------------------------------------------------------------------
function CompareTab({
  predictions,
}: {
  predictions: Map<string, Prediction[]>;
}) {
  return (
    <div className="space-y-6">
      <div className="text-xs text-muted">
        The model sees &ldquo;the [word]&rdquo; and predicts what comes next.
        Similar words get similar predictions — the model generalizes through
        embeddings.
      </div>
      {COMPARE_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="mb-2 text-xs font-semibold text-foreground uppercase tracking-wide">
            {group.label}
          </div>
          <div className="space-y-3">
            {group.words.map((word) => {
              const preds = predictions.get(word);
              if (!preds || preds.length === 0) return null;
              const maxProb = preds[0].prob;
              return (
                <div key={word} className="space-y-0.5">
                  <div className="text-xs text-muted">
                    the <span className="font-medium text-foreground">{word}</span> &rarr;
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {preds.slice(0, 5).map((pred) => (
                      <div
                        key={pred.tokenId}
                        className="flex items-center gap-1"
                      >
                        <div
                          className="h-2.5 rounded-sm bg-accent/60"
                          style={{
                            width: `${Math.max(4, (pred.prob / maxProb) * 48)}px`,
                          }}
                        />
                        <span className="font-mono text-xs text-foreground">
                          {displayToken(pred.token)}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {(pred.prob * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Insight callout */}
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
        Notice how &ldquo;cat&rdquo; and &ldquo;dog&rdquo; produce similar predictions
        — the model learned that animals behave similarly in stories. Same for
        &ldquo;boy&rdquo; and &ldquo;girl,&rdquo; or &ldquo;happy&rdquo; and &ldquo;sad.&rdquo;
        The neural network generalizes through embeddings: similar words in, similar predictions out.
      </div>
    </div>
  );
}
