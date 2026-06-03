"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import {
  ANIMAL_DOMAIN,
  type VectorDomain,
} from "../vectors/vectorData";
import { matVecMul, invert } from "./matrixMath";

export interface DetectorStackProps {
  /** Domain whose `properties` label the input dimensions and whose `items` are pickable. Defaults to ANIMAL_DOMAIN. */
  domain?: VectorDomain;
  /** Which view to show. Later tasks implement "attention". */
  mode?: "detectors" | "round-trip" | "attention";
  title?: string;
  description?: string;
}

function scoreColor(score: number): string {
  if (score >= 0.7) return "#22c55e";
  if (score >= 0.45) return "#f59e0b";
  return "#94a3b8";
}

const DEFAULT_INPUT = "Cat";
const DEFAULT_ROWS_DETECTORS = ["Bear", "Eagle", "Snake", "Dog"];
const DEFAULT_ROWS_ROUNDTRIP = ["Bear", "Eagle", "Snake", "Dog", "Rabbit", "Elephant"];

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
  const color = scoreColor(score);
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

// Chip toggle row shared by both modes
function ChipSelector({
  domain,
  rowNames,
  onToggle,
  minRows,
  label,
}: {
  domain: VectorDomain;
  rowNames: string[];
  onToggle: (name: string) => void;
  minRows: number;
  label: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 text-xs font-medium text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {domain.items.map((item) => {
          const selected = rowNames.includes(item.name);
          const wouldRemove = selected && rowNames.length <= minRows;
          const disabled =
            (!selected && rowNames.length >= domain.properties.length) ||
            wouldRemove;
          return (
            <button
              key={item.name}
              onClick={() => !wouldRemove && onToggle(item.name)}
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
  );
}

// ─── Detectors mode ────────────────────────────────────────────────────────────

function DetectorsView({
  domain,
  inputName,
  setInputName,
  rowNames,
  toggleRow,
  inputOptions,
}: {
  domain: VectorDomain;
  inputName: string;
  setInputName: (n: string) => void;
  rowNames: string[];
  toggleRow: (n: string) => void;
  inputOptions: { value: string; label: string }[];
}) {
  const inputItem = useMemo(
    () => domain.items.find((i) => i.name === inputName)!,
    [domain, inputName]
  );
  const input = inputItem.values;

  const matrix = useMemo(
    () => rowNames.map((n) => domain.items.find((i) => i.name === n)!.values),
    [domain, rowNames]
  );

  const output = useMemo(() => matVecMul(matrix, input), [matrix, input]);

  return (
    <>
      <div className="mb-4">
        <SelectControl
          label="Input animal"
          value={inputName}
          options={inputOptions}
          onChange={setInputName}
        />
      </div>

      <ChipSelector
        domain={domain}
        rowNames={rowNames}
        onToggle={toggleRow}
        minRows={1}
        label={`Detectors (matrix rows) — pick up to ${domain.properties.length}:`}
      />

      {rowNames.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          Pick at least one detector above.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div
            className="grid items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted"
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
              const color = scoreColor(score);
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
    </>
  );
}

// ─── Round-trip mode ───────────────────────────────────────────────────────────

// A card showing property bars with a label
function PropertyCard({
  title,
  values,
  properties,
  color,
}: {
  title: string;
  values: number[];
  properties: string[];
  color: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
        {title}
      </div>
      <PropertyBars values={values} properties={properties} color={color} />
    </div>
  );
}

function RoundTripView({
  domain,
  inputName,
  setInputName,
  rowNames,
  toggleRow,
  inputOptions,
}: {
  domain: VectorDomain;
  inputName: string;
  setInputName: (n: string) => void;
  rowNames: string[];
  toggleRow: (n: string) => void;
  inputOptions: { value: string; label: string }[];
}) {
  const inputItem = useMemo(
    () => domain.items.find((i) => i.name === inputName)!,
    [domain, inputName]
  );
  const input = inputItem.values;

  const matrix = useMemo(
    () => rowNames.map((n) => domain.items.find((i) => i.name === n)!.values),
    [domain, rowNames]
  );

  const scores = useMemo(() => matVecMul(matrix, input), [matrix, input]);

  const isSquare = rowNames.length === domain.properties.length;

  const inv = useMemo(() => {
    if (!isSquare) return null;
    return invert(matrix);
  }, [isSquare, matrix]);

  const recovered = useMemo(() => {
    if (!inv) return null;
    return matVecMul(inv, scores);
  }, [inv, scores]);

  const maxDiff = useMemo(() => {
    if (!recovered) return null;
    return Math.max(...input.map((v, i) => Math.abs(v - recovered[i])));
  }, [input, recovered]);

  return (
    <>
      <div className="mb-4">
        <SelectControl
          label="Input animal"
          value={inputName}
          options={inputOptions}
          onChange={setInputName}
        />
      </div>

      <ChipSelector
        domain={domain}
        rowNames={rowNames}
        onToggle={toggleRow}
        minRows={3}
        label={`Reference animals (matrix rows) — pick 3–${domain.properties.length}:`}
      />

      {/* Re-described scores */}
      <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Re-described ({rowNames.length} numbers)
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {rowNames.map((refName, i) => {
            const refItem = domain.items.find((it) => it.name === refName)!;
            const score = scores[i];
            const color = scoreColor(score);
            return (
              <div key={refName} className="flex items-center gap-1">
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {score.toFixed(3)}
                </span>
                <span className="text-xs text-muted">
                  {refItem.name.toLowerCase()}-like
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Three-card layout for square invertible, or two-card for others */}
      {isSquare ? (
        inv ? (
          <>
            <div className="flex gap-3 mb-4">
              <PropertyCard
                title="Original"
                values={input}
                properties={domain.properties}
                color="#6366f1"
              />
              <PropertyCard
                title="Recovered"
                values={recovered!}
                properties={domain.properties}
                color="#22c55e"
              />
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
              Lossless — the inverse matrix undoes it exactly (max difference ≈{" "}
              {maxDiff!.toFixed(6)}).
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
            These reference animals overlap too much — no inverse exists, so detail is lost.
          </div>
        )
      ) : (
        <>
          <div className="mb-4">
            <PropertyCard
              title="Original"
              values={input}
              properties={domain.properties}
              color="#6366f1"
            />
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-2.5 text-sm text-red-800 dark:text-red-300">
            Only {rowNames.length} numbers describe a {domain.properties.length}-property animal
            — there&apos;s no way back. Detail is lost. This compression-without-recovery is
            the idea behind embeddings.
          </div>
        </>
      )}
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function DetectorStack(props: DetectorStackProps) {
  const domain = props.domain ?? ANIMAL_DOMAIN;
  const mode = props.mode ?? "detectors";

  const defaultRows =
    mode === "round-trip" ? DEFAULT_ROWS_ROUNDTRIP : DEFAULT_ROWS_DETECTORS;

  const [inputName, setInputName] = useState(DEFAULT_INPUT);
  const [rowNames, setRowNames] = useState<string[]>(defaultRows);

  const resetToDefaults = useCallback(() => {
    setInputName(DEFAULT_INPUT);
    setRowNames(defaultRows);
  }, [defaultRows]);

  // Toggle a name in/out of rowNames, capping at domain.properties.length
  const toggleRow = useCallback(
    (name: string) => {
      setRowNames((prev) => {
        if (prev.includes(name)) {
          return prev.filter((n) => n !== name);
        }
        if (prev.length >= domain.properties.length) {
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

  const title =
    mode === "round-trip"
      ? (props.title ?? "Can You Get the Original Back?")
      : (props.title ?? "A Matrix Is Many Dot Products");

  const description =
    mode === "round-trip"
      ? (props.description ??
          "Enough good reference animals and the inverse matrix recovers the original exactly.")
      : (props.description ??
          "Each row is one detector. One multiply runs them all.");

  return (
    <WidgetContainer
      title={title}
      description={description}
      onReset={resetToDefaults}
    >
      {mode === "round-trip" ? (
        <RoundTripView
          domain={domain}
          inputName={inputName}
          setInputName={setInputName}
          rowNames={rowNames}
          toggleRow={toggleRow}
          inputOptions={inputOptions}
        />
      ) : (
        <DetectorsView
          domain={domain}
          inputName={inputName}
          setInputName={setInputName}
          rowNames={rowNames}
          toggleRow={toggleRow}
          inputOptions={inputOptions}
        />
      )}
    </WidgetContainer>
  );
}
