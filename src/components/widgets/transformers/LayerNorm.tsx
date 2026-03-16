"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";

function layerNorm(values: number[]): number[] {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((a, v) => a + (v - mean) * (v - mean), 0) / n;
  const std = Math.sqrt(variance + 1e-5);
  return values.map((v) => (v - mean) / std);
}

function ValueBars({
  values,
  maxAbs,
  label,
  showValues,
}: {
  values: number[];
  maxAbs: number;
  label: string;
  showValues?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-[9px] font-medium text-muted">{label}</div>
      <div className="flex items-center gap-1">
        {values.map((v, i) => {
          const absNorm = Math.min(1, Math.abs(v) / maxAbs);
          const height = absNorm * 60;
          const isPositive = v >= 0;
          const color =
            Math.abs(v) > maxAbs * 0.8
              ? "#f87171"
              : Math.abs(v) > maxAbs * 0.5
                ? "#f59e0b"
                : "#4ade80";

          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="relative flex h-[64px] w-4 items-center">
                {/* Zero line */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-foreground/10" />
                {/* Bar */}
                <div
                  className="absolute left-0 w-full rounded-sm transition-all duration-300"
                  style={{
                    height: `${height / 2}px`,
                    top: isPositive ? `${32 - height / 2}px` : "32px",
                    backgroundColor: color,
                    opacity: 0.4 + absNorm * 0.6,
                  }}
                />
              </div>
              {showValues && (
                <span className="text-[8px] font-mono text-muted">
                  {Math.abs(v) >= 100
                    ? v.toFixed(0)
                    : Math.abs(v) >= 10
                      ? v.toFixed(1)
                      : v.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stats({ values, label }: { values: number[]; label: string }) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const maxVal = Math.max(...values.map(Math.abs));
  const variance =
    values.reduce((a, v) => a + (v - mean) * (v - mean), 0) / values.length;
  const std = Math.sqrt(variance);

  return (
    <div className="flex gap-3 text-[10px] text-muted">
      <span>
        {label} — mean:{" "}
        <span className="font-mono font-medium text-foreground">
          {mean.toFixed(2)}
        </span>
      </span>
      <span>
        std:{" "}
        <span className="font-mono font-medium text-foreground">
          {std.toFixed(2)}
        </span>
      </span>
      <span>
        max |v|:{" "}
        <span
          className={`font-mono font-medium ${maxVal > 10 ? "text-red-500" : "text-foreground"}`}
        >
          {maxVal.toFixed(1)}
        </span>
      </span>
    </div>
  );
}

export function LayerNorm() {
  const [numLayers, setNumLayers] = useState(5);
  const [normEnabled, setNormEnabled] = useState(true);
  const [manualValues, setManualValues] = useState<number[]>([
    0.9, -0.4, 0.7, -0.2, 0.5, 0.8,
  ]);

  const handleReset = useCallback(() => {
    setNumLayers(5);
    setNormEnabled(true);
    setManualValues([0.9, -0.4, 0.7, -0.2, 0.5, 0.8]);
  }, []);

  // Tab 1: Manual normalization
  const normalizedValues = useMemo(
    () => layerNorm(manualValues),
    [manualValues],
  );

  // Tab 2: Stacked layers simulation
  const layerHistory = useMemo(() => {
    const history: number[][] = [[0.9, -0.4, 0.7, -0.2, 0.5, 0.8]];
    let current = history[0];

    for (let i = 0; i < numLayers; i++) {
      // Simulate a layer that tends to amplify values
      const next = current.map((v, j) => {
        const seed = i * 100 + j;
        const r = Math.sin(seed * 9301 + 49297) * 49297;
        const noise = (r - Math.floor(r)) * 0.5 - 0.25;
        return v * 1.3 + noise + 0.1;
      });

      if (normEnabled) {
        current = layerNorm(next);
      } else {
        current = next;
      }

      history.push([...current]);
    }

    return history;
  }, [numLayers, normEnabled]);

  // Determine max for consistent scale
  const layerMaxAbs = useMemo(() => {
    let max = 2;
    for (const layer of layerHistory) {
      for (const v of layer) {
        max = Math.max(max, Math.abs(v));
      }
    }
    return max;
  }, [layerHistory]);

  const manualMaxAbs = Math.max(
    2,
    ...manualValues.map(Math.abs),
    ...normalizedValues.map(Math.abs),
  );

  return (
    <WidgetContainer
      title="Layer Normalization"
      description="See how layer norm keeps values stable across many layers"
      onReset={handleReset}
    >
      {/* Manual normalization section */}
      <div className="mb-6 rounded-lg border border-border bg-surface/50 p-4">
        <div className="mb-3 text-xs font-semibold text-foreground">
          Try it: push values to extremes, watch layer norm snap them back
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {manualValues.map((v, i) => (
            <div key={i}>
              <SliderControl
                label={`d${i + 1}`}
                value={v}
                min={-5}
                max={5}
                step={0.1}
                onChange={(newV) => {
                  const next = [...manualValues];
                  next[i] = newV;
                  setManualValues(next);
                }}
                formatValue={(val) => val.toFixed(1)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-center gap-6">
          <div>
            <ValueBars
              values={manualValues}
              maxAbs={manualMaxAbs}
              label="Before"
              showValues
            />
            <Stats values={manualValues} label="Before" />
          </div>

          <svg
            width="24"
            height="20"
            viewBox="0 0 24 20"
            className="mb-6 text-accent"
          >
            <path
              d="M2 10h18m0 0l-5-5m5 5l-5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div>
            <ValueBars
              values={normalizedValues}
              maxAbs={manualMaxAbs}
              label="After Layer Norm"
              showValues
            />
            <Stats values={normalizedValues} label="After" />
          </div>
        </div>
      </div>

      {/* Stacked layers section */}
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <div className="mb-3 text-xs font-semibold text-foreground">
          Stack layers: what happens to values over time?
        </div>

        <div className="mb-2">
          <SliderControl
            label="Layers"
            value={numLayers}
            min={1}
            max={20}
            step={1}
            onChange={setNumLayers}
            formatValue={(v) => String(v)}
          />
        </div>
        <div className="mb-4">
          <ToggleControl
            label="Layer normalization"
            checked={normEnabled}
            onChange={setNormEnabled}
          />
        </div>

        <div className="mb-2 overflow-x-auto">
          <div className="flex items-end gap-2 pb-2">
            {layerHistory.map((values, i) => {
              // Show a subset if too many
              if (
                numLayers > 8 &&
                i > 0 &&
                i < numLayers &&
                i % Math.ceil(numLayers / 6) !== 0
              )
                return null;
              return (
                <div key={i} className="flex items-end gap-1">
                  <ValueBars
                    values={values}
                    maxAbs={layerMaxAbs}
                    label={i === 0 ? "Input" : `L${i}`}
                  />
                  {i < layerHistory.length - 1 && (
                    <svg
                      width="8"
                      height="12"
                      viewBox="0 0 8 12"
                      className="mb-4 text-muted/30"
                    >
                      <path
                        d="M1 6h4m0 0l-1.5-1.5m1.5 1.5l-1.5 1.5"
                        stroke="currentColor"
                        strokeWidth="1"
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

        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            normEnabled
              ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
              : layerMaxAbs > 50
                ? "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400"
                : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
          }`}
        >
          {normEnabled ? (
            <>
              <strong>With layer norm:</strong> Values stay in a stable range
              (roughly -2 to 2) no matter how many layers. The model can learn
              reliably.
            </>
          ) : layerMaxAbs > 50 ? (
            <>
              <strong>Without layer norm:</strong> After {numLayers} layers,
              values have exploded to {layerMaxAbs.toFixed(0)}+. Gradients
              would be enormous — learning becomes impossible. Turn layer norm
              on to fix this!
            </>
          ) : (
            <>
              <strong>Without layer norm:</strong> Values are starting to drift.
              Add more layers to see them explode.
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
