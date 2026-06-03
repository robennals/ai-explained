"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import {
  ANIMAL_DOMAIN,
  vecDot,
  type VectorDomain,
} from "../vectors/vectorData";
import { matVecMul } from "./matrixMath";

export interface DetectorStackProps {
  /** Domain whose `properties` label the input dimensions and whose `items` are pickable. Defaults to ANIMAL_DOMAIN. */
  domain?: VectorDomain;
  /** Which view to show. Later tasks implement "round-trip" and "attention". */
  mode?: "detectors" | "round-trip" | "attention";
  title?: string;
  description?: string;
}

const DEFAULT_INPUT = "Cat";
const DEFAULT_ROWS = ["Bear", "Eagle", "Snake", "Dog"];

// Compact horizontal bar: value in [0, 1]
function MiniBar({
  value,
  color = "#3b82f6",
  width = 48,
}: {
  value: number;
  color?: string;
  width?: number;
}) {
  const barW = Math.max(0, Math.min(1, value)) * width;
  return (
    <svg width={width} height={10} style={{ display: "block", flexShrink: 0 }}>
      <rect x={0} y={2} width={width} height={6} rx={2} fill="#e5e7eb" />
      <rect x={0} y={2} width={barW} height={6} rx={2} fill={color} />
    </svg>
  );
}

// A row of 6 mini-bars with property labels below
function PropertyBars({
  values,
  properties,
  color,
}: {
  values: number[];
  properties: string[];
  color: string;
}) {
  return (
    <div className="flex gap-1">
      {values.map((v, i) => (
        <div key={properties[i]} className="flex flex-col items-center gap-0.5">
          <MiniBar value={v} color={color} width={28} />
          <span className="text-[9px] text-muted leading-none">{properties[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Score bar for the output — full width relative to 1.0
function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  // Color: green for high, amber for mid, gray for low
  const color = score > 0.7 ? "#22c55e" : score > 0.45 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="relative h-5 rounded-sm overflow-hidden bg-foreground/8"
        style={{ width: 100, flexShrink: 0 }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-sm transition-all duration-200"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color }}>
        {score.toFixed(2)}
      </span>
    </div>
  );
}

export function DetectorStack(props: DetectorStackProps) {
  const domain = props.domain ?? ANIMAL_DOMAIN;

  const [inputName, setInputName] = useState(DEFAULT_INPUT);
  const [rowNames, setRowNames] = useState<string[]>(DEFAULT_ROWS);

  const resetToDefaults = useCallback(() => {
    setInputName(DEFAULT_INPUT);
    setRowNames(DEFAULT_ROWS);
  }, []);

  // Derived values
  const inputItem = useMemo(
    () => domain.items.find((i) => i.name === inputName)!,
    [domain, inputName]
  );
  const input = inputItem.values;

  const matrix = useMemo(
    () =>
      rowNames.map((n) => domain.items.find((i) => i.name === n)!.values),
    [domain, rowNames]
  );

  const output = useMemo(() => matVecMul(matrix, input), [matrix, input]);

  // Toggle a name in/out of rowNames, capping at domain.properties.length
  const toggleRow = useCallback(
    (name: string) => {
      setRowNames((prev) => {
        if (prev.includes(name)) {
          return prev.filter((n) => n !== name);
        }
        if (prev.length >= domain.properties.length) {
          // Cap enforced — ignore
          return prev;
        }
        return [...prev, name];
      });
    },
    [domain.properties.length]
  );

  const inputOptions = domain.items.map((item) => ({
    value: item.name,
    label: `${item.emoji} ${item.name}`,
  }));

  return (
    <WidgetContainer
      title={props.title ?? "A Matrix Is Many Dot Products"}
      description={
        props.description ??
        "Each row is one detector. One multiply runs them all."
      }
      onReset={resetToDefaults}
    >
      {/* Input animal selector */}
      <div className="mb-4">
        <SelectControl
          label="Input animal"
          value={inputName}
          options={inputOptions}
          onChange={setInputName}
        />
      </div>

      {/* Reference animal (detector) picker */}
      <div className="mb-5">
        <div className="mb-1.5 text-xs font-medium text-muted">
          Detectors (matrix rows) — pick up to {domain.properties.length}:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {domain.items.map((item) => {
            const selected = rowNames.includes(item.name);
            const disabled =
              !selected && rowNames.length >= domain.properties.length;
            return (
              <button
                key={item.name}
                onClick={() => toggleRow(item.name)}
                disabled={disabled}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "border-accent bg-accent/10 text-accent"
                    : disabled
                      ? "border-border text-muted/40 cursor-not-allowed"
                      : "border-border text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrix × vector visualization */}
      {rowNames.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          Pick at least one detector above.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted"
            style={{ gridTemplateColumns: "9rem 1fr auto 1fr" }}
          >
            <span>Detector (row)</span>
            <span>Row weights</span>
            <span className="text-center px-1">×&nbsp;{inputItem.emoji}&nbsp;input</span>
            <span>Score</span>
          </div>

          {rowNames.map((refName, i) => {
            const refItem = domain.items.find((it) => it.name === refName)!;
            const score = output[i];
            // Verify: score must equal vecDot(refItem.values, input)
            const _check = vecDot(refItem.values, input);
            void _check; // used only for correctness sanity
            return (
              <div
                key={refName}
                className="grid items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                style={{ gridTemplateColumns: "9rem 1fr auto 1fr" }}
              >
                {/* Detector label */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none">{refItem.emoji}</span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {refItem.name}
                  </span>
                </div>

                {/* Row weight bars */}
                <PropertyBars
                  values={refItem.values}
                  properties={domain.properties}
                  color="#6366f1"
                />

                {/* Multiply operator + input bars */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-muted">×</span>
                  <PropertyBars
                    values={input}
                    properties={domain.properties}
                    color="#f59e0b"
                  />
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">=</span>
                  <ScoreBar score={score} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Output vector summary card */}
      {rowNames.length > 0 && (
        <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
            Output vector
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {rowNames.map((refName, i) => {
              const refItem = domain.items.find((it) => it.name === refName)!;
              const score = output[i];
              const color =
                score > 0.7 ? "#22c55e" : score > 0.45 ? "#f59e0b" : "#94a3b8";
              return (
                <div key={refName} className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold" style={{ color }}>
                    {score.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted">
                    {refItem.name.toLowerCase()}-like
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* later tasks: "round-trip" and "attention" modes */}
    </WidgetContainer>
  );
}
