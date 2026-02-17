"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";
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
    const configResp = await fetch(`${MODEL_BASE}.json`);
    if (!configResp.ok) throw new Error(`Model config: ${configResp.status}`);
    const json = await configResp.json();
    const config: ModelConfig = json.config;
    const vocab: string[] = json.vocab;

    const binResp = await fetch(`${MODEL_BASE}.weights.bin`);
    if (!binResp.ok) throw new Error(`Model weights: ${binResp.status}`);
    const buf = await binResp.arrayBuffer();
    const view = new DataView(buf);

    let offset = 0;

    function readTensor(): { data: Float32Array } {
      const ndims = view.getUint32(offset, true);
      offset += 4;
      let nElements = 1;
      for (let i = 0; i < ndims; i++) {
        nElements *= view.getUint32(offset, true);
        offset += 4;
      }
      const data = new Float32Array(buf, offset, nElements);
      offset += nElements * 4;
      return { data };
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

/** Return top-K predictions with probabilities. */
function predict(model: Model, tokenIds: number[], topK: number = 5): Prediction[] {
  const { config, vocab, weights } = model;
  const { embed_dim, context_len, hidden_dim, vocab_size } = config;

  const ids = tokenIds.slice(-context_len);
  if (ids.length < context_len) return [];

  // Embedding lookup + flatten
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
    hidden[i] = sum > 0 ? sum : 0;
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

/** Sample one token from the model using temperature. */
function sampleToken(
  model: Model,
  tokenIds: number[],
  temperature: number,
): { token: string; tokenId: number } | null {
  const { config, vocab, weights } = model;
  const { embed_dim, context_len, hidden_dim, vocab_size } = config;

  const ids = tokenIds.slice(-context_len);
  if (ids.length < context_len) return null;

  const flat = new Float32Array(context_len * embed_dim);
  for (let i = 0; i < context_len; i++) {
    const embOffset = ids[i] * embed_dim;
    for (let j = 0; j < embed_dim; j++) {
      flat[i * embed_dim + j] = weights.embedding[embOffset + j];
    }
  }

  const hidden = new Float32Array(hidden_dim);
  for (let i = 0; i < hidden_dim; i++) {
    let sum = weights.fc1_bias[i];
    const rowOffset = i * (context_len * embed_dim);
    for (let j = 0; j < context_len * embed_dim; j++) {
      sum += weights.fc1_weight[rowOffset + j] * flat[j];
    }
    hidden[i] = sum > 0 ? sum : 0;
  }

  const logits = new Float32Array(vocab_size);
  for (let i = 0; i < vocab_size; i++) {
    let sum = weights.fc2_bias[i];
    const rowOffset = i * hidden_dim;
    for (let j = 0; j < hidden_dim; j++) {
      sum += weights.fc2_weight[rowOffset + j] * hidden[j];
    }
    logits[i] = sum;
  }

  // Temperature-scaled softmax
  const t = Math.max(temperature, 0.01);
  let maxLogit = -Infinity;
  for (let i = 0; i < vocab_size; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i];
  }
  let sumExp = 0;
  const probs = new Float32Array(vocab_size);
  for (let i = 0; i < vocab_size; i++) {
    probs[i] = Math.exp((logits[i] - maxLogit) / t);
    sumExp += probs[i];
  }
  for (let i = 0; i < vocab_size; i++) {
    probs[i] /= sumExp;
  }

  // Sample from distribution
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < vocab_size; i++) {
    cumulative += probs[i];
    if (r <= cumulative) {
      return { token: vocab[i], tokenId: i };
    }
  }

  return { token: vocab[vocab_size - 1], tokenId: vocab_size - 1 };
}

function displayToken(token: string): string {
  if (token.startsWith("##")) return token.slice(2);
  return token;
}

/** Join a token onto existing text (no space for ## continuation tokens). */
function appendToken(text: string, token: string): string {
  if (token.startsWith("##")) return text + token.slice(2);
  return text + " " + token;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Tab = "explore" | "generate";

const NN_TABS: { id: Tab; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "generate", label: "Generate" },
];

export function SimpleNNPredictor() {
  const [tab, setTab] = useState<Tab>("explore");
  const [text, setText] = useState("once upon a");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<Model | null>(null);
  const tokRef = useRef<{ encode: (t: string) => EncodedPiece[] } | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  // Explore state
  const [explorePreds, setExplorePreds] = useState<Prediction[]>([]);
  const [exploreTokens, setExploreTokens] = useState<EncodedPiece[]>([]);

  // Generate state
  const [genPrompt, setGenPrompt] = useState("once upon a");
  const [genOutput, setGenOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [temperature, setTemperature] = useState(0.8);
  const cancelRef = useRef(false);

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

  // Run explore inference when text changes
  useEffect(() => {
    if (loading || error || !modelRef.current || !tokRef.current) return;
    if (tab !== "explore") return;

    const pieces = tokRef.current.encode(text);
    setExploreTokens(pieces);
    const ids = pieces.map((p) => p.id);
    if (ids.length >= modelRef.current.config.context_len) {
      setExplorePreds(predict(modelRef.current, ids, 10));
    } else {
      setExplorePreds([]);
    }
  }, [text, tab, loading, error]);

  const handlePredictionClick = useCallback((pred: Prediction) => {
    setText((prev) => appendToken(prev, pred.token));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!modelRef.current || !tokRef.current || generating) return;

    const model = modelRef.current;
    const tok = tokRef.current;
    cancelRef.current = false;
    setGenerating(true);
    setGenOutput(genPrompt);

    const pieces = tok.encode(genPrompt);
    const ids = pieces.map((p) => p.id);
    const currentIds = [...ids];
    let currentText = genPrompt;
    let step = 0;
    const maxSteps = 40;

    const interval = setInterval(() => {
      if (cancelRef.current || step >= maxSteps) {
        clearInterval(interval);
        setGenerating(false);
        return;
      }

      const result = sampleToken(model, currentIds, temperature);
      if (!result) {
        clearInterval(interval);
        setGenerating(false);
        return;
      }

      currentText = appendToken(currentText, result.token);
      currentIds.push(result.tokenId);
      setGenOutput(currentText);
      step++;
    }, 80);
  }, [genPrompt, generating, temperature]);

  const handleStopGenerate = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const resetState = useCallback(() => {
    setText("once upon a");
    setTab("explore");
    setGenPrompt("once upon a");
    setGenOutput("");
    setGenerating(false);
    cancelRef.current = true;
    setTemperature(0.8);
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
      <WidgetTabs
        tabs={NN_TABS}
        activeTab={tab}
        onTabChange={(t) => {
          setTab(t);
          if (t === "generate") {
            cancelRef.current = true;
            setGenerating(false);
          }
        }}
      />

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
        <GenerateTab
          prompt={genPrompt}
          setPrompt={setGenPrompt}
          output={genOutput}
          generating={generating}
          temperature={temperature}
          setTemperature={setTemperature}
          onGenerate={handleGenerate}
          onStop={handleStopGenerate}
        />
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
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type some text..."
          className="w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

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

      {contextTokens.length === contextLen && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Model sees:</span>
          <span className="font-mono font-medium text-accent">
            [{contextTokens.map((t) => t.token).join(", ")}]
          </span>
          <span>&rarr; predict next</span>
        </div>
      )}

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
// Generate tab
// ---------------------------------------------------------------------------
function GenerateTab({
  prompt,
  setPrompt,
  output,
  generating,
  temperature,
  setTemperature,
  onGenerate,
  onStop,
}: {
  prompt: string;
  setPrompt: (s: string) => void;
  output: string;
  generating: boolean;
  temperature: number;
  setTemperature: (t: number) => void;
  onGenerate: () => void;
  onStop: () => void;
}) {
  const tempLabel =
    temperature < 0.3
      ? "Very predictable"
      : temperature < 0.6
        ? "Conservative"
        : temperature < 1.0
          ? "Balanced"
          : temperature < 1.5
            ? "Creative"
            : "Wild";

  return (
    <div className="space-y-4">
      {/* Prompt input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating}
          placeholder="Enter a prompt..."
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
        />
        {generating ? (
          <button
            onClick={onStop}
            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onGenerate}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Generate
          </button>
        )}
      </div>

      {/* Temperature slider */}
      <SliderControl
        label="Temperature"
        value={temperature}
        onChange={setTemperature}
        min={0.1}
        max={2.0}
        step={0.1}
        formatValue={() => `${temperature.toFixed(1)} — ${tempLabel}`}
      />

      {/* Output */}
      {output && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <div className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {output}
            {generating && (
              <span className="animate-pulse text-accent">|</span>
            )}
          </div>
        </div>
      )}

      {!output && !generating && (
        <div className="rounded-lg bg-surface px-4 py-8 text-center text-sm text-muted">
          Enter a prompt and hit Generate to watch the model write word by word.
        </div>
      )}
    </div>
  );
}
