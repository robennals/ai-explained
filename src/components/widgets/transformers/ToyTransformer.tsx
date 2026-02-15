"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

type SymbolShape = "circle" | "square" | "triangle";
const COLORS = [
  { name: "red", hex: "#f87171" },
  { name: "blue", hex: "#60a5fa" },
  { name: "green", hex: "#4ade80" },
];

interface Token {
  shape: SymbolShape;
  color: number;
}

interface Example {
  name: string;
  input: Token[];
  embeddings: number[][];
  attention: number[];
  afterAttention: number[];
  afterFF: number[];
  outputScores: number[];
  prediction: number;
}

const EXAMPLES: Example[] = [
  {
    name: "Example 1",
    input: [
      { shape: "circle", color: 0 },
      { shape: "square", color: 1 },
      { shape: "triangle", color: 0 },
      { shape: "circle", color: 0 },
    ],
    embeddings: [
      [0.8, -0.2, 0.5, 0.1],
      [-0.3, 0.7, 0.2, 0.4],
      [0.6, -0.1, 0.8, -0.3],
      [0.8, -0.2, 0.5, 0.1],
    ],
    attention: [0.3, 0.1, 0.28, 0.32],
    afterAttention: [0.62, -0.1, 0.52, 0.04],
    afterFF: [0.85, -0.15, 0.7, 0.1],
    outputScores: [0.72, 0.18, 0.1],
    prediction: 0,
  },
  {
    name: "Example 2",
    input: [
      { shape: "square", color: 1 },
      { shape: "triangle", color: 2 },
      { shape: "circle", color: 1 },
      { shape: "square", color: 1 },
    ],
    embeddings: [
      [-0.3, 0.7, 0.2, 0.4],
      [0.1, 0.3, -0.6, 0.8],
      [-0.2, 0.8, 0.1, 0.3],
      [-0.3, 0.7, 0.2, 0.4],
    ],
    attention: [0.28, 0.12, 0.3, 0.3],
    afterAttention: [-0.22, 0.68, 0.15, 0.38],
    afterFF: [-0.3, 0.82, 0.2, 0.45],
    outputScores: [0.12, 0.75, 0.13],
    prediction: 1,
  },
  {
    name: "Example 3",
    input: [
      { shape: "triangle", color: 2 },
      { shape: "circle", color: 2 },
      { shape: "square", color: 0 },
      { shape: "triangle", color: 2 },
    ],
    embeddings: [
      [0.1, 0.3, -0.6, 0.8],
      [0.2, 0.4, -0.5, 0.7],
      [0.8, -0.2, 0.5, 0.1],
      [0.1, 0.3, -0.6, 0.8],
    ],
    attention: [0.28, 0.25, 0.15, 0.32],
    afterAttention: [0.15, 0.3, -0.45, 0.68],
    afterFF: [0.1, 0.35, -0.55, 0.8],
    outputScores: [0.1, 0.15, 0.75],
    prediction: 2,
  },
];

const STEP_LABELS = [
  "Input Sequence",
  "Embeddings",
  "Attention",
  "Feed-Forward",
  "Output",
];

function ShapeIcon({
  shape,
  color,
  size = 32,
}: {
  shape: string;
  color: string;
  size?: number;
}) {
  const half = size / 2;
  if (shape === "circle") {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={half} cy={half} r={half - 2} fill={color} />
      </svg>
    );
  }
  if (shape === "square") {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect x={2} y={2} width={size - 4} height={size - 4} rx={2} fill={color} />
      </svg>
    );
  }
  // triangle
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={`${half},2 ${size - 2},${size - 2} 2,${size - 2}`}
        fill={color}
      />
    </svg>
  );
}

function EmbeddingBars({ values, color }: { values: number[]; color: string }) {
  const maxAbs = 1;
  return (
    <div className="flex flex-col gap-0.5">
      {values.map((v, i) => {
        const width = Math.abs(v / maxAbs) * 100;
        const isNeg = v < 0;
        return (
          <div key={i} className="flex items-center gap-1">
            <span className="w-7 text-right font-mono text-[9px] text-muted">
              {v.toFixed(1)}
            </span>
            <div className="relative h-2.5 w-16 rounded-sm bg-foreground/5">
              <div
                className="absolute top-0 h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${width / 2}%`,
                  left: isNeg ? `${50 - width / 2}%` : "50%",
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
              <div
                className="absolute top-0 h-full w-px bg-foreground/20"
                style={{ left: "50%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlowArrow({ direction = "right" }: { direction?: "right" | "down" }) {
  if (direction === "down") {
    return (
      <div className="flex justify-center py-2 text-muted">
        <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
          <path
            d="M10 2v18m0 0l-5-5m5 5l5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex items-center px-1 text-muted">
      <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
        <path
          d="M2 10h18m0 0l-5-5m5 5l-5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StepInput({ example }: { example: Example }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted">
        The transformer receives 4 colored symbols as input:
      </div>
      <div className="flex items-center justify-center gap-4">
        {example.input.map((token, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <ShapeIcon shape={token.shape} color={COLORS[token.color].hex} size={40} />
            <span className="text-[10px] text-muted">pos {i}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-xs text-muted">
        Task: predict the next symbol&apos;s color (the most frequent color wins)
      </div>
    </div>
  );
}

function StepEmbeddings({ example }: { example: Example }) {
  return (
    <div>
      <div className="mb-3 text-xs font-medium text-muted">
        Each symbol is converted to a 4-dimensional embedding vector:
      </div>
      <div className="flex flex-wrap items-start justify-center gap-4">
        {example.input.map((token, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <ShapeIcon shape={token.shape} color={COLORS[token.color].hex} size={28} />
            <EmbeddingBars
              values={example.embeddings[i]}
              color={COLORS[token.color].hex}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-xs text-muted">
        The embedding captures both the shape and color as numbers
      </div>
    </div>
  );
}

function StepAttention({ example }: { example: Example }) {
  const positions = example.input;
  const weights = example.attention;
  return (
    <div>
      <div className="mb-3 text-xs font-medium text-muted">
        The last position attends to all positions to gather context:
      </div>
      <div className="flex flex-col items-center">
        {/* Shapes row */}
        <div className="flex items-center gap-6">
          {positions.map((token, i) => (
            <div key={i} className="flex flex-col items-center">
              <ShapeIcon shape={token.shape} color={COLORS[token.color].hex} size={28} />
              <span className="mt-0.5 text-[10px] text-muted">pos {i}</span>
            </div>
          ))}
        </div>
        {/* Attention arcs SVG */}
        <svg width="280" height="60" viewBox="0 0 280 60" className="mt-1">
          {weights.map((w, i) => {
            const fromX = 245;
            const toX = 35 + i * 70;
            const midY = 10 + (1 - w) * 30;
            return (
              <g key={i}>
                <path
                  d={`M ${fromX} 5 Q ${(fromX + toX) / 2} ${midY} ${toX} 5`}
                  fill="none"
                  stroke={COLORS[positions[i].color].hex}
                  strokeWidth={Math.max(1, w * 6)}
                  opacity={0.3 + w * 0.7}
                />
                <text
                  x={toX}
                  y={55}
                  textAnchor="middle"
                  className="fill-muted text-[10px]"
                >
                  {(w * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
        </svg>
        {/* Context vector */}
        <div className="mt-2 flex flex-col items-center">
          <div className="mb-1 text-[10px] font-medium text-muted">
            Context vector (weighted mix):
          </div>
          <div className="rounded border border-border bg-surface px-3 py-1.5">
            <span className="font-mono text-[11px] text-foreground">
              [{example.afterAttention.map((v) => v.toFixed(2)).join(", ")}]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFeedForward({ example }: { example: Example }) {
  return (
    <div>
      <div className="mb-3 text-xs font-medium text-muted">
        A small neural network processes what attention gathered:
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded border border-border bg-surface px-3 py-2">
            <div className="mb-1 text-[9px] font-medium text-muted">Input</div>
            <EmbeddingBars values={example.afterAttention} color="var(--color-accent)" />
          </div>
          <FlowArrow direction="right" />
          <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Feed-Forward
            </div>
            <div className="mt-1 text-[9px] text-accent/60">Neural network</div>
          </div>
          <FlowArrow direction="right" />
          <div className="rounded border border-border bg-surface px-3 py-2">
            <div className="mb-1 text-[9px] font-medium text-muted">Output</div>
            <EmbeddingBars values={example.afterFF} color="var(--color-accent)" />
          </div>
        </div>
        <div className="text-center text-xs text-muted">
          The feed-forward network transforms the context into a richer representation
        </div>
      </div>
    </div>
  );
}

function StepOutput({ example }: { example: Example }) {
  return (
    <div>
      <div className="mb-3 text-xs font-medium text-muted">
        Output scores determine the predicted color:
      </div>
      <div className="flex flex-col items-center gap-4">
        {/* Bar chart */}
        <div className="flex items-end gap-6">
          {COLORS.map((color, i) => {
            const score = example.outputScores[i];
            const heightPct = score * 100;
            const isPredicted = i === example.prediction;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="font-mono text-xs font-medium text-foreground">
                  {(score * 100).toFixed(0)}%
                </span>
                <div
                  className="w-14 rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(8, heightPct * 1.2)}px`,
                    backgroundColor: color.hex,
                    opacity: isPredicted ? 1 : 0.4,
                    boxShadow: isPredicted
                      ? `0 0 12px ${color.hex}60`
                      : "none",
                  }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isPredicted ? color.hex : undefined }}
                >
                  {color.name}
                </span>
                {isPredicted && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                    predicted
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Prediction */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
          <span className="text-xs text-muted">Next symbol:</span>
          <ShapeIcon
            shape="circle"
            color={COLORS[example.prediction].hex}
            size={24}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: COLORS[example.prediction].hex }}
          >
            {COLORS[example.prediction].name}
          </span>
          <span className="text-xs text-muted">(most common in input)</span>
        </div>
      </div>
    </div>
  );
}

export function ToyTransformer() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [step, setStep] = useState(0);

  const example = EXAMPLES[exampleIndex];

  const handleReset = useCallback(() => {
    setExampleIndex(0);
    setStep(0);
  }, []);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepInput example={example} />;
      case 1:
        return <StepEmbeddings example={example} />;
      case 2:
        return <StepAttention example={example} />;
      case 3:
        return <StepFeedForward example={example} />;
      case 4:
        return <StepOutput example={example} />;
      default:
        return null;
    }
  };

  return (
    <WidgetContainer
      title="Toy Transformer"
      description="Step through a tiny 1-layer transformer processing colored symbols"
      onReset={handleReset}
    >
      {/* Example selector */}
      <div className="mb-4 flex flex-wrap gap-2">
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
            {ex.name}
          </button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => setStep(i)}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                step === i
                  ? "bg-accent text-white"
                  : step > i
                    ? "bg-accent/20 text-accent"
                    : "bg-surface text-muted"
              }`}
            >
              {label}
            </button>
            {i < STEP_LABELS.length - 1 && (
              <svg width="16" height="10" viewBox="0 0 16 10" className="text-muted/40">
                <path
                  d="M2 5h10m0 0l-3-3m3 3l-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[200px] rounded-lg border border-border bg-surface/50 p-4">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md bg-surface px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous Step
        </button>
        <span className="text-xs text-muted">
          Step {step + 1} of {STEP_LABELS.length}
        </span>
        <button
          onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
          disabled={step === STEP_LABELS.length - 1}
          className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next Step
        </button>
      </div>
    </WidgetContainer>
  );
}
