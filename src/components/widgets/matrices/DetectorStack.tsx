"use client";

import React, { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import { ToggleControl } from "../shared/ToggleControl";
import { SliderControl } from "../shared/SliderControl";
import {
  ANIMAL_DOMAIN,
  type VectorDomain,
  productColor,
} from "../vectors/vectorData";
import { VectorCard } from "../vectors/VectorCard";
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

/**
 * ProductColumn — mirrors DotProductComparison's local ProductColumn exactly,
 * reimplemented here without importing that component.
 * vecA = detector (blue), vecB = input (amber).
 */
function DetectorProductColumn({
  vecA,
  vecB,
  properties,
  score,
  scoreCol,
}: {
  vecA: number[];
  vecB: number[];
  properties: string[];
  score: number;
  scoreCol: string;
}) {
  const products = vecA.map((a, i) => a * vecB[i]);
  const maxProduct = Math.max(...products, 0.001);

  return (
    <div
      className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0"
      style={{ maxWidth: "10rem" }}
    >
      <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Multiply
        </span>
      </div>
      {properties.map((prop, i) => {
        const product = products[i];
        return (
          <div
            key={prop}
            className="flex items-center py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]"
          >
            <span className="font-mono text-[10px] text-muted whitespace-nowrap">
              <span style={{ color: "#3b82f6" }}>{vecA[i].toFixed(2)}</span>
              {" × "}
              <span style={{ color: "#f59e0b" }}>{vecB[i].toFixed(2)}</span>
              {" = "}
              <span className="font-bold" style={{ color: productColor(product, maxProduct) }}>
                {product.toFixed(2)}
              </span>
            </span>
          </div>
        );
      })}
      <div className="py-1.5 px-3 border-t-2 border-foreground/15 bg-foreground/[0.02]">
        <div className="font-mono text-[10px] font-bold">
          {products.map((p, idx) => (
            <span key={properties[idx]}>
              {idx > 0 && <span className="text-muted">{" + "}</span>}
              <span style={{ color: productColor(p, maxProduct) }}>{p.toFixed(2)}</span>
            </span>
          ))}
        </div>
        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: scoreCol }}>
          = {score.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function DetectorsView({
  domain,
  inputName,
  setInputName,
  expandedRows,
  setExpandedRows,
  activationOn,
  setActivationOn,
  threshold,
  setThreshold,
  showActivation,
}: {
  domain: VectorDomain;
  inputName: string;
  setInputName: (n: string) => void;
  // rowNames and toggleRow are no longer used in detectors mode (all rows always shown)
  rowNames?: string[];
  toggleRow?: (n: string) => void;
  expandedRows: Set<string>;
  setExpandedRows: (rows: Set<string>) => void;
  activationOn: boolean;
  setActivationOn: (v: boolean) => void;
  threshold: number;
  setThreshold: (v: number) => void;
  showActivation: boolean;
}) {
  const toggleExpanded = useCallback((name: string) => {
    setExpandedRows((() => {
      const next = new Set(expandedRows);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    })());
  }, [expandedRows, setExpandedRows]);

  const inputItem = useMemo(
    () => domain.items.find((i) => i.name === inputName)!,
    [domain, inputName]
  );
  const input = inputItem.values;

  const inputOptions = useMemo(
    () => domain.items.map((item) => ({ value: item.name, label: `${item.emoji} ${item.name}` })),
    [domain]
  );

  // All domain items are always matrix rows
  const allRowItems = domain.items;

  const matrix = useMemo(
    () => allRowItems.map((item) => item.values),
    [allRowItems]
  );

  const output = useMemo(() => matVecMul(matrix, input), [matrix, input]);

  const preActivation = useMemo(
    () => output.map((s) => s - threshold),
    [output, threshold]
  );

  const activated = useMemo(
    () => applyActivation(preActivation, relu),
    [preActivation]
  );

  // Grid template: label col + 6 property cols + output col
  const numProps = domain.properties.length;
  const gridTemplate = `minmax(8rem, auto) repeat(${numProps}, minmax(2.75rem, 1fr)) minmax(4rem, auto)`;

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

      {/* Matrix × vector grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid min-w-full"
          style={{
            gridTemplateColumns: gridTemplate,
            rowGap: "0.375rem",
            columnGap: "0.375rem",
          }}
        >
          {/* ── Header row ── */}
          {/* Empty label cell */}
          <div className="px-1 pb-1" />
          {/* Property column headers */}
          {domain.properties.map((prop) => (
            <div
              key={prop}
              className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted"
            >
              {prop}
            </div>
          ))}
          {/* Output column header */}
          <div className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
            {showActivation && activationOn ? "output" : "output"}
          </div>

          {/* ── Input row (amber) ── */}
          {/* Input label cell */}
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
          {/* Input property value cells — amber */}
          {input.map((val, vi) => (
            <div
              key={`input-${domain.properties[vi]}`}
              className="flex items-center justify-center rounded-md border bg-surface px-2 py-2.5"
              style={{ borderColor: "#f59e0b" }}
            >
              <span
                className="font-mono text-xs tabular-nums font-bold"
                style={{ color: "#f59e0b" }}
              >
                {val.toFixed(2)}
              </span>
            </div>
          ))}
          {/* Output cell for input row — blank */}
          <div className="rounded-md border border-border bg-surface px-2 py-2.5" />

          {/* Divider spanning all columns */}
          <div
            style={{ gridColumn: `1 / -1` }}
            className="h-px bg-border"
          />

          {/* ── Matrix rows — one per animal ── */}
          {allRowItems.map((rowItem, i) => {
            const score = output[i];
            const pre = preActivation[i];
            const act = activated[i];
            const fired = showActivation && activationOn && pre > 0;
            const isExpanded = expandedRows.has(rowItem.name);
            const scoreCol = showActivation && activationOn
              ? fired ? "#16a34a" : "#dc2626"
              : scoreColor(score);
            const displayScore = showActivation && activationOn
              ? (fired ? act : 0)
              : score;

            return (
              <React.Fragment key={rowItem.name}>
                {/* Row label cell — clickable */}
                <button
                  onClick={() => toggleExpanded(rowItem.name)}
                  aria-expanded={isExpanded}
                  className="flex flex-col justify-center gap-0.5 rounded-md border border-border bg-surface px-3 py-2.5 text-left hover:bg-foreground/4 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base text-muted shrink-0 w-3.5 leading-none">
                      {isExpanded ? "▾" : "▸"}
                    </span>
                    <span className="text-base leading-none">{rowItem.emoji}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {rowItem.name}
                    </span>
                  </div>
                </button>

                {/* Property value cells — blue tint */}
                {rowItem.values.map((val, vi) => (
                  <div
                    key={`${rowItem.name}-${domain.properties[vi]}`}
                    className="flex items-center justify-center rounded-md border border-border bg-surface px-2 py-2.5"
                  >
                    <span className="font-mono text-xs text-foreground tabular-nums">
                      {val.toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Output cell — dot product result colored by score */}
                <div className="flex items-center justify-center rounded-md border border-border bg-surface px-2 py-2.5">
                  <span
                    className="font-mono text-xs font-bold tabular-nums"
                    style={{ color: scoreCol }}
                  >
                    {displayScore.toFixed(2)}
                  </span>
                  {showActivation && activationOn && (
                    <span
                      className="ml-1 text-[9px] font-semibold"
                      style={{ color: scoreCol }}
                    >
                      {fired ? "✓" : "✗"}
                    </span>
                  )}
                </div>

                {/* Expand panel — full-width, inserted between rows */}
                {isExpanded && (
                  <div
                    style={{ gridColumn: "1 / -1" }}
                    className="border border-border rounded-lg bg-foreground/2 px-3 py-3"
                  >
                    <div className="grid grid-cols-2 gap-2 items-start md:grid-cols-[1fr_1fr_auto]">
                      {/* Row animal card (blue = detector/row) */}
                      <VectorCard
                        name={rowItem.name}
                        emoji={rowItem.emoji}
                        properties={domain.properties}
                        values={rowItem.values}
                        barColor="#3b82f6"
                        label="ROW"
                        labelColor="#3b82f6"
                      />
                      {/* Input animal card (amber) */}
                      <VectorCard
                        name={inputItem.name}
                        emoji={inputItem.emoji}
                        properties={domain.properties}
                        values={input}
                        barColor="#f59e0b"
                        label="INPUT"
                        labelColor="#f59e0b"
                      />
                      {/* Multiply column */}
                      <div className="col-span-2 mt-2 flex justify-center md:col-span-1 md:mt-0 md:justify-start">
                        <DetectorProductColumn
                          vecA={rowItem.values}
                          vecB={input}
                          properties={domain.properties}
                          score={score}
                          scoreCol={scoreColor(score)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* One-line caption */}
      <div className="mt-4 text-xs text-muted text-center">
        Multiplying a vector by a matrix takes the dot product of the input with every row, giving one output number per row.
      </div>

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
  // Expanded rows state lifted here so reset can collapse all rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const resetToDefaults = useCallback(() => {
    setInputName(DEFAULT_INPUT);
    setRowNames(defaultRows);
    setActivationOn(false);
    setThreshold(DEFAULT_THRESHOLD);
    setExpandedRows(new Set());
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
          rowNames={rowNames}
          toggleRow={toggleRow}
          expandedRows={expandedRows}
          setExpandedRows={setExpandedRows}
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
