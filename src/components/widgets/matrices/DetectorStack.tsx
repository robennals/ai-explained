"use client";

import React, { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import { ToggleControl } from "../shared/ToggleControl";
import { SliderControl } from "../shared/SliderControl";
import {
  ANIMAL_DOMAIN,
  type VectorDomain,
} from "../vectors/vectorData";
import { matVecMul, invert, relu, applyActivation } from "./matrixMath";

export interface DetectorStackProps {
  /** Domain whose `properties` label the input dimensions and whose `items` are pickable. Defaults to ANIMAL_DOMAIN. */
  domain?: VectorDomain;
  /** Which view to show. Later tasks implement "attention". */
  mode?: "detectors" | "round-trip" | "attention";
  title?: string;
  description?: string;
  /** Show the activation (ReLU) toggle, threshold slider, and inline fired/silent results. Default false. */
  showActivation?: boolean;
}

// ─── Attention mode data ────────────────────────────────────────────────────────

// The context tokens whose KEY vectors form the rows of the keys matrix.
// "it" is the querying token — its query vector lives separately as IT_QUERY.
const TOKEN_DOMAIN: VectorDomain = {
  id: "tokens",
  label: "Tokens",
  properties: ["noun", "none"],
  items: [
    { name: "cat",  emoji: "🐱", values: [1, 0] }, // key: a noun
    { name: "dog",  emoji: "🐕", values: [1, 0] }, // key: a noun
    { name: "blah", emoji: "💬", values: [0, 1] }, // key: not a noun (filler)
    { name: "it",   emoji: "🔎", values: [0, 0] }, // the asker; query lives in IT_QUERY
  ],
};

// "it" is looking for a noun — its query matches anything with a high "noun" value.
const IT_QUERY = [1, 0];

// The context tokens that act as keys (everything except "it" itself).
const CONTEXT_TOKEN_NAMES = ["cat", "dog", "blah"];

function scoreColor(score: number): string {
  if (score >= 0.7) return "#22c55e";
  if (score >= 0.45) return "#f59e0b";
  return "#94a3b8";
}

const DEFAULT_INPUT = "Cat";
const DEFAULT_ROWS_DETECTORS = ["Bear", "Eagle", "Snake", "Dog"];
const DEFAULT_ROWS_ROUNDTRIP = ["Bear", "Eagle", "Snake", "Dog", "Rabbit", "Elephant"];
// Fixed reference animals that make up the matrix rows in detectors mode. Each
// one becomes a new output dimension ("bear-like", "dog-like", …).
const DETECTOR_ROW_NAMES = ["Bear", "Rabbit", "Eagle", "Snake", "Dog"];
// Start with one dimension selected so the reader notices they can be clicked.
const DEFAULT_SELECTED_ROW = "Dog";

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
  maxRows,
  label,
}: {
  domain: VectorDomain;
  rowNames: string[];
  onToggle: (name: string) => void;
  minRows: number;
  maxRows: number;
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
            (!selected && rowNames.length >= maxRows) ||
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
  selectedRow,
  setSelectedRow,
  activationOn,
  setActivationOn,
  threshold,
  setThreshold,
  showActivation,
}: {
  domain: VectorDomain;
  inputName: string;
  setInputName: (n: string) => void;
  selectedRow: string | null;
  setSelectedRow: (n: string | null) => void;
  activationOn: boolean;
  setActivationOn: (v: boolean) => void;
  threshold: number;
  setThreshold: (v: number) => void;
  showActivation: boolean;
}) {
  // Clicking a matrix row OR its matching output cell selects that reference
  // animal; clicking the selected one again clears it. Selection highlights the
  // matrix row and its output dimension together, and shows the dot product.
  const toggleRow = useCallback(
    (name: string) => {
      setSelectedRow(selectedRow === name ? null : name);
    },
    [selectedRow, setSelectedRow]
  );

  const inputItem = useMemo(
    () => domain.items.find((i) => i.name === inputName)!,
    [domain, inputName]
  );
  const input = inputItem.values;

  const inputOptions = useMemo(
    () => domain.items.map((item) => ({ value: item.name, label: `${item.emoji} ${item.name}` })),
    [domain]
  );

  // The matrix rows are a fixed set of reference animals; each becomes one of
  // the output vector's new dimensions.
  const rowItems = useMemo(() => {
    const picked = DETECTOR_ROW_NAMES
      .map((n) => domain.items.find((it) => it.name === n))
      .filter(Boolean) as typeof domain.items;
    return picked.length >= 2 ? picked : domain.items.slice(0, 5);
  }, [domain]);

  const matrix = useMemo(() => rowItems.map((item) => item.values), [rowItems]);
  const output = useMemo(() => matVecMul(matrix, input), [matrix, input]);
  const preActivation = useMemo(() => output.map((s) => s - threshold), [output, threshold]);
  const activated = useMemo(() => applyActivation(preActivation, relu), [preActivation]);

  const numProps = domain.properties.length;
  const LABEL_W = "8.5rem";
  const CELL_W = "3rem";
  const matrixTemplate = `${LABEL_W} repeat(${numProps}, ${CELL_W})`;

  const numRefs = rowItems.length;
  const OUT_CELL_W = "5rem";
  const outTemplate = `${LABEL_W} repeat(${numRefs}, ${OUT_CELL_W})`;

  const selItem = selectedRow ? rowItems.find((it) => it.name === selectedRow) ?? null : null;
  const selIndex = selItem ? rowItems.indexOf(selItem) : -1;

  return (
    <>
      {/* Input vector dropdown */}
      <div className="mb-4">
        <SelectControl
          label="Input vector"
          value={inputName}
          options={inputOptions}
          onChange={setInputName}
        />
      </div>

      {/* Activation controls — only when showActivation */}
      {showActivation && (
        <div className="mb-4 flex flex-col gap-2">
          <ToggleControl
            label="Apply activation (ReLU)"
            checked={activationOn}
            onChange={setActivationOn}
          />
          {activationOn && (
            <SliderControl
              label="Threshold (bias)"
              value={threshold}
              min={0}
              max={1}
              step={0.05}
              onChange={setThreshold}
              formatValue={(v) => v.toFixed(2)}
            />
          )}
        </div>
      )}

      {/* ── Equation: input × matrix = output, with the output as a row of
           NEW dimensions at the bottom. The block shrinks to its content so the
           centred × and = sit over the matrix, not the full widget width. ── */}
      <div className="overflow-x-auto">
        <div style={{ width: "max-content" }}>

          {/* Property column headers */}
          <div className="grid" style={{ gridTemplateColumns: matrixTemplate, columnGap: "0.375rem" }}>
            <div className="px-1 pb-1" />
            {domain.properties.map((prop) => (
              <div
                key={prop}
                className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted"
              >
                {prop}
              </div>
            ))}
          </div>

          {/* Input row (amber operand) */}
          <div className="mt-1.5 grid" style={{ gridTemplateColumns: matrixTemplate, columnGap: "0.375rem" }}>
            <div
              className="flex flex-col justify-center gap-0.5 rounded-md border bg-surface px-3 py-2.5"
              style={{ borderColor: "#f59e0b" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{inputItem.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                  {inputItem.name}
                </span>
              </div>
              <div className="text-[9px] leading-none" style={{ color: "#f59e0b" }}>
                input vector
              </div>
            </div>
            {input.map((val, vi) => (
              <div
                key={`input-${domain.properties[vi]}`}
                className="flex items-center justify-center rounded-md border bg-surface px-2 py-2.5"
                style={{ borderColor: "#f59e0b" }}
              >
                <span className="font-mono text-xs tabular-nums font-bold" style={{ color: "#f59e0b" }}>
                  {val.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* × between the input operand and the matrix — horizontally centred */}
          <div className="flex justify-center py-1">
            <span
              className="font-bold select-none"
              style={{ fontSize: "2rem", lineHeight: 1, color: "var(--color-muted, #94a3b8)" }}
              aria-hidden="true"
            >
              ×
            </span>
          </div>

          {/* Matrix rows — clickable; each pairs with one output dimension */}
          <div className="flex flex-col gap-1.5">
            {rowItems.map((rowItem) => {
              const selected = selectedRow === rowItem.name;
              return (
                <button
                  key={rowItem.name}
                  onClick={() => toggleRow(rowItem.name)}
                  aria-pressed={selected}
                  className="group grid text-left"
                  style={{ gridTemplateColumns: matrixTemplate, columnGap: "0.375rem" }}
                >
                  <div
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-2.5 transition-colors ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface group-hover:border-accent/50 group-hover:bg-accent/5"
                    }`}
                  >
                    <span className="text-base leading-none">{rowItem.emoji}</span>
                    <span className={`text-xs font-semibold ${selected ? "text-accent" : "text-foreground"}`}>
                      {rowItem.name}
                    </span>
                  </div>
                  {rowItem.values.map((val, vi) => (
                    <div
                      key={`${rowItem.name}-${domain.properties[vi]}`}
                      className={`flex items-center justify-center rounded-md border px-2 py-2.5 transition-colors ${
                        selected
                          ? "border-accent/60 bg-accent/5"
                          : "border-border bg-surface group-hover:border-accent/50 group-hover:bg-accent/5"
                      }`}
                    >
                      <span className="font-mono text-xs text-foreground tabular-nums">
                        {val.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </button>
              );
            })}
          </div>

          {/* = between the matrix and the output vector — horizontally centred */}
          <div className="flex justify-center py-2">
            <span
              className="font-bold select-none"
              style={{ fontSize: "2.5rem", lineHeight: 1, color: "var(--color-muted, #94a3b8)" }}
              aria-hidden="true"
            >
              =
            </span>
          </div>

          {/* Output vector — a row of NEW dimensions, one per reference animal */}
          <div className="grid" style={{ gridTemplateColumns: outTemplate, columnGap: "0.375rem" }}>
            <div className="flex items-end px-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-accent">
              new dimensions
            </div>
            {rowItems.map((rowItem) => {
              const active = selectedRow === rowItem.name;
              return (
                <div
                  key={`outhdr-${rowItem.name}`}
                  className={`flex flex-col items-center gap-0.5 px-1 pb-1 ${active ? "text-accent" : "text-foreground"}`}
                >
                  <span className="text-lg leading-none">{rowItem.emoji}</span>
                  <span className="flex flex-col items-center text-center leading-none">
                    <span className="text-xs font-bold">{rowItem.name.toLowerCase()}</span>
                    <span className="text-[11px] font-semibold text-muted">-like</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid" style={{ gridTemplateColumns: outTemplate, columnGap: "0.375rem" }}>
            {/* Output labelled with the input's name (it is the same animal, re-described) */}
            <div
              className="flex items-center gap-1.5 rounded-md border bg-surface px-3 py-2.5"
              style={{ borderColor: "#f59e0b" }}
            >
              <span className="text-base leading-none">{inputItem.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>{inputItem.name}</span>
            </div>
            {rowItems.map((rowItem, i) => {
              const selected = selectedRow === rowItem.name;
              const score = output[i];
              const pre = preActivation[i];
              const act = activated[i];
              const fired = showActivation && activationOn && pre > 0;
              const scoreCol = showActivation && activationOn
                ? fired ? "#16a34a" : "#dc2626"
                : scoreColor(score);
              const displayScore = showActivation && activationOn ? (fired ? act : 0) : score;
              return (
                <button
                  key={`out-${rowItem.name}`}
                  onClick={() => toggleRow(rowItem.name)}
                  aria-pressed={selected}
                  className={`flex items-center justify-center gap-1 rounded-md border px-2 py-2.5 transition-colors ${
                    selected
                      ? "border-accent bg-accent/20 ring-1 ring-accent"
                      : "border-border bg-surface hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <span className="font-mono text-xs font-bold tabular-nums" style={{ color: scoreCol }}>
                    {displayScore.toFixed(2)}
                  </span>
                  {showActivation && activationOn && (
                    <span className="text-[9px] font-semibold" style={{ color: scoreCol }}>
                      {fired ? "✓" : "✗"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>{/* end min-width block */}
      </div>{/* end overflow-x-auto */}

      {/* Dot product for the selected dimension, or a prompt to click */}
      {selItem ? (
        <div className="mt-3 rounded-md border border-border bg-foreground/2 px-3 py-2 font-mono text-[11px] leading-relaxed break-words">
          <span className="font-semibold" style={{ color: "#f59e0b" }}>{inputItem.name.toLowerCase()}</span>
          <span className="text-muted"> · </span>
          <span className="font-semibold" style={{ color: "#3b82f6" }}>{selItem.name.toLowerCase()}</span>
          <span className="text-muted"> = </span>
          {input.map((v, vi) => (
            <span key={domain.properties[vi]}>
              {vi > 0 && <span className="text-muted"> + </span>}
              <span className="text-muted">(</span>
              <span style={{ color: "#f59e0b" }}>{v.toFixed(2)}</span>
              <span className="text-muted"> × </span>
              <span style={{ color: "#3b82f6" }}>{selItem.values[vi].toFixed(2)}</span>
              <span className="text-muted">)</span>
            </span>
          ))}
          <span className="text-muted"> = </span>
          <span className="font-bold" style={{ color: scoreColor(output[selIndex]) }}>{output[selIndex].toFixed(2)}</span>
        </div>
      ) : (
        <div className="mt-3 text-xs text-muted text-center">
          Click a matrix row, or an output cell, to see the dot product that made it. The output describes {inputItem.name.toLowerCase()} in a new set of dimensions: how similar it is to each reference animal.
        </div>
      )}

      {/* Activation explainer — only when showActivation */}
      {showActivation && activationOn && (
        <div className="mt-3 rounded-md bg-surface px-3 py-2 text-xs text-muted border border-border">
          A neural-network layer is exactly this: the matrix, then a bias and an activation function applied to the whole output vector at once. ReLU zeros out the weak matches.
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
        maxRows={domain.properties.length}
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

// ─── Attention mode ────────────────────────────────────────────────────────────

function AttentionView() {
  // Build the keys matrix: one row per context token
  const keysMatrix = useMemo(
    () =>
      CONTEXT_TOKEN_NAMES.map(
        (name) => TOKEN_DOMAIN.items.find((it) => it.name === name)!.values
      ),
    []
  );

  // scores[i] = dot(keysMatrix[i], IT_QUERY) — one match score per context token
  const scores = useMemo(() => matVecMul(keysMatrix, IT_QUERY), [keysMatrix]);

  return (
    <>
      {/* Query description */}
      <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-2.5">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted">
          Query &mdash; &ldquo;it&rdquo; is looking for a noun
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">🔎</span>
          <div>
            <div className="text-xs font-semibold text-foreground mb-1">it — query vector</div>
            <PropertyBars
              values={IT_QUERY}
              properties={TOKEN_DOMAIN.properties}
              color="#f59e0b"
            />
          </div>
        </div>
      </div>

      {/* Keys × query = scores */}
      <div className="space-y-2 mb-4">
        {/* Column headers */}
        <div
          className="grid items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted"
          style={{ gridTemplateColumns: "9rem 1fr auto 1fr" }}
        >
          <span>Token key (row)</span>
          <span>Key vector</span>
          <span className="text-center px-1">× 🔎 query</span>
          <span>Match score</span>
        </div>

        {CONTEXT_TOKEN_NAMES.map((name, i) => {
          const token = TOKEN_DOMAIN.items.find((it) => it.name === name)!;
          const score = scores[i];
          return (
            <div
              key={name}
              className="grid items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              style={{ gridTemplateColumns: "9rem 1fr auto 1fr" }}
            >
              {/* Token label */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base leading-none">{token.emoji}</span>
                <span className="text-xs font-semibold text-foreground truncate">
                  {token.name}
                </span>
              </div>

              {/* Key vector bars */}
              <PropertyBars
                values={token.values}
                properties={TOKEN_DOMAIN.properties}
                color="#6366f1"
              />

              {/* Multiply operator + query bars */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-muted">×</span>
                <PropertyBars
                  values={IT_QUERY}
                  properties={TOKEN_DOMAIN.properties}
                  color="#f59e0b"
                />
              </div>

              {/* Match score */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">=</span>
                <ScoreBar score={score} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Output scores summary card */}
      <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Match scores (output vector)
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {CONTEXT_TOKEN_NAMES.map((name, i) => {
            const token = TOKEN_DOMAIN.items.find((it) => it.name === name)!;
            const score = scores[i];
            const color = scoreColor(score);
            return (
              <div key={name} className="flex items-center gap-1.5">
                <span className="text-sm">{token.emoji}</span>
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {score.toFixed(2)}
                </span>
                <span className="text-sm text-muted">match for {token.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory prose */}
      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground leading-relaxed">
        Attention&apos;s match step is the same picture: stack the other tokens&apos; keys as
        rows, multiply by this token&apos;s query, and out come the match scores — one matrix ×
        vector per token, per head. (The query, key, and value vectors are themselves made by
        matrix multiplies, and blending the values is one more — attention is matrix
        multiplication through and through.)
      </div>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLD = 0.5;

export function DetectorStack(props: DetectorStackProps) {
  const domain = props.domain ?? ANIMAL_DOMAIN;
  const mode = props.mode ?? "detectors";
  const showActivation = props.showActivation ?? false;

  const defaultRows =
    mode === "round-trip" ? DEFAULT_ROWS_ROUNDTRIP : DEFAULT_ROWS_DETECTORS;

  const [inputName, setInputName] = useState(DEFAULT_INPUT);
  const [rowNames, setRowNames] = useState<string[]>(defaultRows);

  // Activation state is only meaningful in detectors mode; lifted here so
  // the parent-owned reset button can clear it alongside inputName/rowNames.
  const [activationOn, setActivationOn] = useState(false);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  // Single selected row/dimension (detectors mode). Starts on one row so the
  // reader sees straight away that rows and output cells are clickable.
  const [selectedRow, setSelectedRow] = useState<string | null>(DEFAULT_SELECTED_ROW);

  const resetToDefaults = useCallback(() => {
    setInputName(DEFAULT_INPUT);
    setRowNames(defaultRows);
    setActivationOn(false);
    setThreshold(DEFAULT_THRESHOLD);
    setSelectedRow(DEFAULT_SELECTED_ROW);
  }, [defaultRows]);

  // Toggle a name in/out of rowNames.
  // For detectors mode: uncapped (up to all domain items).
  // For round-trip mode: capped at domain.properties.length (square matrix required for inverse).
  const maxRows = mode === "round-trip" ? domain.properties.length : domain.items.length;
  const toggleRow = useCallback(
    (name: string) => {
      setRowNames((prev) => {
        if (prev.includes(name)) {
          return prev.filter((n) => n !== name);
        }
        if (prev.length >= maxRows) {
          return prev;
        }
        return [...prev, name];
      });
    },
    [maxRows]
  );

  const inputOptions = domain.items.map((item) => ({
    value: item.name,
    label: `${item.emoji} ${item.name}`,
  }));

  const title =
    mode === "round-trip"
      ? (props.title ?? "Can You Get the Original Back?")
      : mode === "attention"
        ? (props.title ?? "Attention Is a Matrix Multiply")
        : (props.title ?? "A Matrix Is Many Dot Products");

  const description =
    mode === "round-trip"
      ? (props.description ??
          "Enough good reference animals and the inverse matrix recovers the original exactly.")
      : mode === "attention"
        ? (props.description ??
            "Stack the context tokens' keys as rows, multiply by the query — out come match scores.")
        : (props.description ??
            "Each row is one detector. One multiply runs them all.");

  // Attention mode is a fixed worked example — no interactive state to reset.
  const onReset = mode === "attention" ? undefined : resetToDefaults;

  return (
    <WidgetContainer
      title={title}
      description={description}
      onReset={onReset}
    >
      {mode === "attention" ? (
        <AttentionView />
      ) : mode === "round-trip" ? (
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
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          activationOn={activationOn}
          setActivationOn={setActivationOn}
          threshold={threshold}
          setThreshold={setThreshold}
          showActivation={showActivation}
        />
      )}
    </WidgetContainer>
  );
}
