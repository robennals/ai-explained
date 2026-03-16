"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";

// Simulate a signal passing through N layers
// Each layer applies a random-ish linear transform that slightly distorts the signal
// With residual connections: output = input + layer(input)
// Without: output = layer(input)

function makeLayerTransform(seed: number): (v: number[]) => number[] {
  // Deterministic pseudo-random based on seed
  const rng = (s: number) => {
    const x = Math.sin(s * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  };

  return (input: number[]) => {
    return input.map((v, i) => {
      const r1 = rng(seed * 100 + i * 7 + 1) * 2 - 1;
      const r2 = rng(seed * 100 + i * 7 + 2) * 2 - 1;
      // A layer that shifts and scales — simulating a nonlinear transform
      return v * (0.8 + r1 * 0.4) + r2 * 0.3;
    });
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function SignalBars({
  values,
  color,
  maxAbs,
  label,
}: {
  values: number[];
  color: string;
  maxAbs: number;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && (
        <span className="mb-0.5 text-[9px] font-medium text-muted">
          {label}
        </span>
      )}
      <div className="flex gap-0.5">
        {values.map((v, i) => {
          const height = Math.min(1, Math.abs(v) / maxAbs);
          const isPositive = v >= 0;
          return (
            <div
              key={i}
              className="flex h-10 w-2 flex-col justify-end overflow-hidden rounded-sm"
              style={{ backgroundColor: `${color}15` }}
            >
              <div
                className={`w-full rounded-sm transition-all duration-300 ${isPositive ? "self-end" : "self-start"}`}
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: color,
                  opacity: 0.3 + height * 0.7,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResidualConnection() {
  const [numLayers, setNumLayers] = useState(8);
  const [residualEnabled, setResidualEnabled] = useState(true);

  const handleReset = useCallback(() => {
    setNumLayers(8);
    setResidualEnabled(true);
  }, []);

  // The original signal — a distinctive pattern
  const originalSignal = useMemo(
    () => [0.9, -0.4, 0.7, -0.2, 0.5, 0.8, -0.6, 0.3],
    [],
  );

  // Compute signal through N layers
  const layerOutputs = useMemo(() => {
    const outputs: { signal: number[]; similarity: number }[] = [
      { signal: originalSignal, similarity: 1.0 },
    ];

    let current = [...originalSignal];
    for (let layer = 0; layer < numLayers; layer++) {
      const transform = makeLayerTransform(layer);
      const transformed = transform(current);

      if (residualEnabled) {
        // Residual: output = input + 0.3 * layer(input)
        // The 0.3 scaling makes the "refinement" small relative to the signal
        current = current.map((v, i) => v + 0.3 * (transformed[i] - v));
      } else {
        current = transformed;
      }

      const sim = cosineSimilarity(originalSignal, current);
      outputs.push({ signal: [...current], similarity: sim });
    }

    return outputs;
  }, [numLayers, residualEnabled, originalSignal]);

  // Find max absolute value for consistent bar scaling
  const maxAbs = useMemo(() => {
    let max = 0;
    for (const o of layerOutputs) {
      for (const v of o.signal) {
        max = Math.max(max, Math.abs(v));
      }
    }
    return Math.max(1, max);
  }, [layerOutputs]);

  const finalSimilarity = layerOutputs[layerOutputs.length - 1].similarity;

  // Show a subset of layers to avoid visual overflow
  const displayIndices = useMemo(() => {
    const indices = [0]; // Always show original
    if (numLayers <= 6) {
      for (let i = 1; i <= numLayers; i++) indices.push(i);
    } else {
      // Show first, some middle, and last
      const step = Math.max(1, Math.floor(numLayers / 5));
      for (let i = step; i < numLayers; i += step) {
        indices.push(i);
      }
      indices.push(numLayers);
    }
    return [...new Set(indices)].sort((a, b) => a - b);
  }, [numLayers]);

  return (
    <WidgetContainer
      title="Residual Connections"
      description="Watch a signal pass through multiple layers — with and without the highway bypass"
      onReset={handleReset}
    >
      {/* Controls */}
      <div className="mb-2">
        <SliderControl
          label="Layers"
          value={numLayers}
          min={1}
          max={30}
          step={1}
          onChange={setNumLayers}
          formatValue={(v) => String(v)}
        />
      </div>
      <div className="mb-4">
        <ToggleControl
          label="Residual connections (highway bypass)"
          checked={residualEnabled}
          onChange={setResidualEnabled}
        />
      </div>

      {/* Signal flow visualization */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex items-end gap-3 pb-2">
          {displayIndices.map((idx, i) => {
            const output = layerOutputs[idx];
            const sim = output.similarity;
            const isOriginal = idx === 0;
            const isFinal = idx === numLayers;
            const color = isOriginal
              ? "#60a5fa"
              : sim > 0.8
                ? "#4ade80"
                : sim > 0.5
                  ? "#f59e0b"
                  : "#f87171";

            return (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex flex-col items-center">
                  <SignalBars
                    values={output.signal}
                    color={color}
                    maxAbs={maxAbs}
                    label={
                      isOriginal
                        ? "Original"
                        : isFinal
                          ? `Layer ${idx}`
                          : `L${idx}`
                    }
                  />
                  {!isOriginal && (
                    <div
                      className="mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: `${color}20`,
                        color,
                      }}
                    >
                      {(sim * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                {i < displayIndices.length - 1 && (
                  <svg
                    width="12"
                    height="16"
                    viewBox="0 0 12 16"
                    className="mb-4 shrink-0 text-muted/30"
                  >
                    <path
                      d="M2 8h6m0 0l-2-2m2 2l-2 2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Similarity graph */}
      <div className="mb-4 rounded-lg border border-border bg-surface p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          Similarity to original signal
        </div>
        <svg
          viewBox="0 0 300 80"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const y = 75 - v * 70;
            return (
              <g key={v}>
                <line
                  x1={30}
                  y1={y}
                  x2={295}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-foreground/5"
                />
                <text
                  x={27}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted text-[6px]"
                >
                  {(v * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Line */}
          <polyline
            points={layerOutputs
              .map((o, i) => {
                const x = 30 + (i / numLayers) * 265;
                const y = 75 - Math.max(0, Math.min(1, o.similarity)) * 70;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke={finalSimilarity > 0.5 ? "#4ade80" : "#f87171"}
            strokeWidth="2"
          />

          {/* End dot */}
          <circle
            cx={295}
            cy={75 - Math.max(0, Math.min(1, finalSimilarity)) * 70}
            r={3}
            fill={finalSimilarity > 0.5 ? "#4ade80" : "#f87171"}
          />

          {/* X-axis label */}
          <text x={162} y={78} textAnchor="middle" className="fill-muted text-[6px]">
            Layer
          </text>
        </svg>
      </div>

      {/* Verdict */}
      <div
        className={`rounded-md border px-3 py-2 text-xs ${
          residualEnabled
            ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
            : finalSimilarity < 0.3
              ? "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400"
              : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
        }`}
      >
        {residualEnabled ? (
          <>
            <strong>With residual connections:</strong> After {numLayers} layers,
            the signal retains{" "}
            <strong>{(finalSimilarity * 100).toFixed(0)}%</strong> similarity to
            the original. Each layer adds refinements while the original flows
            through safely.
          </>
        ) : finalSimilarity < 0.3 ? (
          <>
            <strong>Without residual connections:</strong> After {numLayers}{" "}
            layers, the signal has only{" "}
            <strong>{(finalSimilarity * 100).toFixed(0)}%</strong> similarity to
            the original — it&apos;s been distorted beyond recognition. Try
            turning residual connections on!
          </>
        ) : (
          <>
            <strong>Without residual connections:</strong> After {numLayers}{" "}
            layers, similarity has dropped to{" "}
            <strong>{(finalSimilarity * 100).toFixed(0)}%</strong>. Add more
            layers to see the signal degrade further.
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
