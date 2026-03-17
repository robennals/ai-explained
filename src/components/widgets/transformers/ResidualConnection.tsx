"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";

// ---------------------------------------------------------------------------
// Each layer "discovers" a fixed pattern for one token.
// Magnitude slider controls how strongly that discovery contributes.
// With residuals: final = embedding + layer1*mag1 + layer2*mag2 + ...
// Without residuals: final = layerN*magN (only the last layer counts)
// ---------------------------------------------------------------------------

const LAYER_COLORS = ["#94a3b8", "#60a5fa", "#f59e0b", "#4ade80", "#a78bfa"];
const LAYER_LABELS = [
  "Embedding",
  "Is it a noun?",
  "Is it the subject?",
  "Is it a character?",
  "What emotion?",
];

const DIM = 8;

const PATTERNS: number[][] = [
  [0.5, -0.2, 0.3, -0.1, 0.4, 0.1, -0.3, 0.2],   // embedding
  [0.8, 0.1, -0.3, 0.5, -0.1, 0.2, -0.4, 0.6],   // layer 1: noun-ness
  [-0.2, 0.7, 0.4, -0.1, 0.6, -0.3, 0.1, -0.5],   // layer 2: subject-ness
  [0.3, -0.5, 0.6, 0.2, -0.4, 0.8, -0.1, 0.3],     // layer 3: character-ness
  [-0.4, 0.2, -0.1, 0.7, 0.3, -0.6, 0.5, 0.1],     // layer 4: emotion
];

// ---------------------------------------------------------------------------
// A single horizontal row showing one layer's contribution to the vector.
// Each dimension is a cell whose color intensity shows the value.
// ---------------------------------------------------------------------------

function VectorRow({
  values,
  color,
  label,
  maxAbs,
  dimmed,
}: {
  values: number[];
  color: string;
  label: string;
  maxAbs: number;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 transition-opacity ${dimmed ? "opacity-20" : ""}`}
    >
      <div
        className="w-32 shrink-0 text-right text-sm font-medium"
        style={{ color }}
      >
        {label}
      </div>
      <div className="flex flex-1 gap-1">
        {values.map((v, d) => {
          const intensity = Math.min(1, Math.abs(v) / maxAbs);
          const isPositive = v >= 0;
          return (
            <div
              key={d}
              className="relative flex h-8 flex-1 items-center justify-center rounded"
              style={{
                backgroundColor: isPositive
                  ? `color-mix(in srgb, ${color} ${Math.round(intensity * 70)}%, transparent)`
                  : `color-mix(in srgb, ${color} ${Math.round(intensity * 70)}%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
              }}
              title={`Dimension ${d + 1}: ${v.toFixed(2)}`}
            >
              <span
                className="text-xs font-mono"
                style={{
                  color: intensity > 0.4 ? "white" : color,
                  opacity: intensity > 0.1 ? 1 : 0.3,
                }}
              >
                {v >= 0 ? "+" : ""}{v.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ResidualConnection() {
  // magnitudes[0] = embedding (always 1, not adjustable)
  // magnitudes[1..4] = layer contributions
  const [magnitudes, setMagnitudes] = useState([1, 0.5, 0.5, 0.5, 0.5]);
  const [residualEnabled, setResidualEnabled] = useState(true);

  const handleReset = useCallback(() => {
    setMagnitudes([1, 0.5, 0.5, 0.5, 0.5]);
    setResidualEnabled(true);
  }, []);

  const setMagnitude = useCallback((idx: number, value: number) => {
    setMagnitudes((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

  // Compute each layer's scaled contribution and the final sum
  const { rows, finalValues, maxAbs } = useMemo(() => {
    const layerRows: { values: number[]; color: string; label: string; dimmed: boolean }[] = [];

    if (residualEnabled) {
      // Show all layers
      for (let l = 0; l < 5; l++) {
        const scaled = PATTERNS[l].map((v) => v * magnitudes[l]);
        layerRows.push({
          values: scaled,
          color: LAYER_COLORS[l],
          label: LAYER_LABELS[l],
          dimmed: magnitudes[l] < 0.01,
        });
      }
    } else {
      // Only show the last layer
      const lastIdx = 4;
      const scaled = PATTERNS[lastIdx].map((v) => v * magnitudes[lastIdx]);
      layerRows.push({
        values: scaled,
        color: LAYER_COLORS[lastIdx],
        label: LAYER_LABELS[lastIdx],
        dimmed: false,
      });
    }

    // Compute final vector (sum of all shown rows)
    const final = new Array(DIM).fill(0);
    for (const row of layerRows) {
      for (let d = 0; d < DIM; d++) {
        final[d] += row.values[d];
      }
    }

    // Find max abs across all rows and final for consistent coloring
    let mAbs = 0;
    for (const row of layerRows) {
      for (const v of row.values) mAbs = Math.max(mAbs, Math.abs(v));
    }
    for (const v of final) mAbs = Math.max(mAbs, Math.abs(v));

    return { rows: layerRows, finalValues: final, maxAbs: Math.max(0.3, mAbs) };
  }, [magnitudes, residualEnabled]);

  return (
    <WidgetContainer
      title="Residual Connections"
      description="See how each layer's discoveries add up in a single token's vector."
      onReset={handleReset}
    >
      {/* Toggle */}
      <div className="mb-5">
        <ToggleControl
          label="Residual connections (keep earlier layers' work)"
          checked={residualEnabled}
          onChange={setResidualEnabled}
        />
      </div>

      {/* Layer magnitude sliders (skip embedding at index 0) */}
      <div className="mb-5 space-y-1.5">
        {LAYER_LABELS.slice(1).map((label, i) => {
          const idx = i + 1;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded"
                style={{ backgroundColor: LAYER_COLORS[idx] }}
              />
              <div className="flex-1">
                <SliderControl
                  label={label}
                  value={magnitudes[idx]}
                  min={0}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => setMagnitude(idx, v)}
                  formatValue={(v) => v.toFixed(2)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Vector rows */}
      <div className="mb-2 rounded-lg border border-border bg-surface p-4">
        {/* Dimension labels */}
        <div className="mb-1 flex items-center gap-3">
          <div className="w-32 shrink-0" />
          <div className="flex flex-1 gap-1">
            {Array.from({ length: DIM }, (_, d) => (
              <div
                key={d}
                className="flex-1 text-center text-xs text-muted"
              >
                d{d + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Individual layer contributions */}
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <VectorRow
              key={i}
              values={row.values}
              color={row.color}
              label={row.label}
              maxAbs={maxAbs}
              dimmed={row.dimmed}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="my-3 flex items-center gap-3">
          <div className="w-32 shrink-0 text-right text-sm text-muted">+</div>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Final sum */}
        <VectorRow
          values={finalValues}
          color="#333"
          label="= Final vector"
          maxAbs={maxAbs}
        />
      </div>

      {/* Explanation */}
      <div
        className={`rounded-md border px-4 py-3 text-sm ${
          residualEnabled
            ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
            : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
        }`}
      >
        {residualEnabled ? (
          <>
            Each row is what one layer figured out about this word. The final
            vector is the sum of all of them — it contains everything every layer
            discovered. Try cranking one slider up to see that layer dominate, or
            turning it down to zero to see what the vector looks like without it.
          </>
        ) : (
          <>
            Without residuals, only the last layer&apos;s output survives.
            Everything the earlier layers discovered is thrown away. Toggle
            residuals back on to see all the layers&apos; contributions stack up.
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
