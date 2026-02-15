"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const EXAMPLES = [
  {
    sentence: ["The", "cat", "sat", "on", "the", "mat"],
    target: 2,
    queries: [0.8, 0.3],
    keys: [
      [0.2, 0.1],
      [0.7, 0.4],
      [0.8, 0.3],
      [0.1, 0.6],
      [0.2, 0.1],
      [0.5, 0.5],
    ],
    values: [
      [0.1, 0.9],
      [0.8, 0.2],
      [0.5, 0.5],
      [0.3, 0.7],
      [0.1, 0.9],
      [0.6, 0.4],
    ],
    dotProducts: [0.19, 0.68, 0.73, 0.26, 0.19, 0.55],
    softmax: [0.08, 0.23, 0.24, 0.1, 0.08, 0.27],
  },
  {
    sentence: ["She", "gave", "him", "the", "book"],
    target: 2,
    queries: [0.6, 0.7],
    keys: [
      [0.7, 0.8],
      [0.4, 0.3],
      [0.6, 0.7],
      [0.1, 0.2],
      [0.3, 0.5],
    ],
    values: [
      [0.9, 0.1],
      [0.3, 0.7],
      [0.5, 0.5],
      [0.2, 0.8],
      [0.4, 0.6],
    ],
    dotProducts: [0.98, 0.45, 0.85, 0.2, 0.53],
    softmax: [0.33, 0.12, 0.29, 0.06, 0.2],
  },
];

const STEP_LABELS = [
  "Query",
  "Keys",
  "Dot Products",
  "Softmax",
  "Output",
];

function VectorBar({
  values,
  color,
  label,
  maxVal = 1,
}: {
  values: number[];
  color: string;
  label?: string;
  maxVal?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && (
        <span className="text-[10px] text-muted">{label}</span>
      )}
      <div className="flex gap-0.5">
        {values.map((v, i) => (
          <div
            key={i}
            className="w-4 rounded-sm"
            style={{
              height: `${Math.max(4, (v / maxVal) * 28)}px`,
              backgroundColor: color,
              opacity: 0.4 + (v / maxVal) * 0.6,
            }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] text-muted">
        [{values.map((v) => v.toFixed(1)).join(", ")}]
      </span>
    </div>
  );
}

export function AttentionStepThrough() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [step, setStep] = useState(0);

  const example = EXAMPLES[exampleIndex];
  const { sentence, target, queries, keys, values, dotProducts, softmax } =
    example;

  const handleReset = useCallback(() => {
    setStep(0);
    setExampleIndex(0);
  }, []);

  const maxDot = Math.max(...dotProducts);

  // Compute weighted output
  const output = [0, 0];
  for (let i = 0; i < sentence.length; i++) {
    output[0] += softmax[i] * values[i][0];
    output[1] += softmax[i] * values[i][1];
  }

  return (
    <WidgetContainer
      title="Attention Step-by-Step"
      description="Walk through Query, Key, Value attention on a real sentence"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Example selector */}
        <div className="flex gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setExampleIndex(i);
                setStep(0);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                exampleIndex === i
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {ex.sentence.join(" ")}
            </button>
          ))}
        </div>

        {/* Sentence display */}
        <div className="flex flex-wrap gap-2">
          {sentence.map((word, i) => (
            <span
              key={i}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-all ${
                i === target
                  ? "bg-accent text-white"
                  : step >= 3
                    ? "border border-border bg-surface text-foreground"
                    : "border border-border bg-surface text-foreground"
              }`}
              style={
                step >= 3 && i !== target
                  ? {
                      borderColor: `rgba(99,102,241,${softmax[i]})`,
                      boxShadow: `0 0 0 ${Math.round(softmax[i] * 4)}px rgba(99,102,241,${softmax[i] * 0.3})`,
                    }
                  : undefined
              }
            >
              {word}
            </span>
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`flex h-6 items-center rounded-full px-2.5 text-[10px] font-medium transition-colors ${
                  i === step
                    ? "bg-accent text-white"
                    : i < step
                      ? "bg-accent/20 text-accent"
                      : "bg-foreground/5 text-muted"
                }`}
              >
                {i + 1}. {label}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="mx-0.5 h-px w-2 bg-foreground/10" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[140px] rounded-lg border border-border bg-surface px-4 py-3">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground">
                <strong>&quot;{sentence[target]}&quot;</strong> creates a query
                vector: &quot;What should I pay attention to?&quot;
              </div>
              <VectorBar values={queries} color="#6366f1" label="Query vector" />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground">
                Each word advertises what information it has via its key vector.
              </div>
              <div className="flex flex-wrap gap-3">
                {sentence.map((word, i) => (
                  <VectorBar
                    key={i}
                    values={keys[i]}
                    color={i === target ? "#6366f1" : "#94a3b8"}
                    label={word}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground">
                Dot product of query with each key. Higher = more relevant.
              </div>
              <div className="flex flex-wrap gap-3">
                {sentence.map((word, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted">{word}</span>
                    <div
                      className="flex h-8 w-12 items-center justify-center rounded"
                      style={{
                        backgroundColor: `rgba(99,102,241,${0.15 + (dotProducts[i] / maxDot) * 0.6})`,
                      }}
                    >
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {dotProducts[i].toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground">
                Softmax turns scores into percentages that add up to 100%. The
                biggest scores dominate.
              </div>
              <div className="flex flex-wrap gap-3">
                {sentence.map((word, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted">{word}</span>
                    <div className="relative h-14 w-10 rounded bg-foreground/5">
                      <div
                        className="absolute bottom-0 w-full rounded bg-indigo-500"
                        style={{
                          height: `${softmax[i] * 100}%`,
                          opacity: 0.4 + softmax[i] * 1.5,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      {(softmax[i] * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground">
                The output is a weighted blend of all value vectors, where each
                word contributes proportionally to its attention score.
              </div>
              <div className="flex flex-wrap items-end gap-4">
                {sentence.map((word, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted">{word}</span>
                    <VectorBar
                      values={values[i]}
                      color="#94a3b8"
                    />
                    <span className="font-mono text-[9px] text-muted">
                      x{(softmax[i] * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-bold text-accent">=</span>
                  <VectorBar
                    values={output.map((v) => Math.round(v * 100) / 100)}
                    color="#6366f1"
                    label="Output"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-30"
          >
            Previous Step
          </button>
          <button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={step === 4}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-30"
          >
            Next Step
          </button>
        </div>
      </div>
    </WidgetContainer>
  );
}
