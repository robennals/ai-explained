"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { ANIMAL_DOMAIN } from "@/components/widgets/vectors/vectorData";

const DEFAULT_ROW_NAMES = ["Bear", "Eagle", "Snake"];
const MAX_ROWS = 6;
const MIN_ROWS = 1;

// Compact horizontal bar: value in [0, 1]
function MiniBar({ value }: { value: number }) {
  const width = 36;
  const barW = Math.max(0, Math.min(1, value)) * width;
  return (
    <svg width={width} height={10} style={{ display: "block" }}>
      <rect x={0} y={2} width={width} height={6} rx={2} fill="#e5e7eb" />
      <rect x={0} y={2} width={barW} height={6} rx={2} fill="#6366f1" />
    </svg>
  );
}

function ChipSelector({
  rowNames,
  onToggle,
}: {
  rowNames: string[];
  onToggle: (name: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 text-xs font-medium text-muted">
        Animals to match against
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ANIMAL_DOMAIN.items.map((item) => {
          const selected = rowNames.includes(item.name);
          const atMax = !selected && rowNames.length >= MAX_ROWS;
          const atMin = selected && rowNames.length <= MIN_ROWS;
          const disabled = atMax || atMin;
          return (
            <button
              key={item.name}
              onClick={() => !disabled && onToggle(item.name)}
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
      {rowNames.length >= MAX_ROWS && (
        <div className="mt-1.5 text-xs text-muted">
          Maximum {MAX_ROWS} rows (one per property dimension).
        </div>
      )}
    </div>
  );
}

export function MatrixGrid() {
  const [rowNames, setRowNames] = useState<string[]>(DEFAULT_ROW_NAMES);

  const resetToDefaults = useCallback(() => {
    setRowNames(DEFAULT_ROW_NAMES);
  }, []);

  const toggleRow = useCallback((name: string) => {
    setRowNames((prev) => {
      if (prev.includes(name)) {
        if (prev.length <= MIN_ROWS) return prev;
        return prev.filter((n) => n !== name);
      }
      if (prev.length >= MAX_ROWS) return prev;
      return [...prev, name];
    });
  }, []);

  const properties = ANIMAL_DOMAIN.properties;

  return (
    <WidgetContainer
      title="Writing the Matrix as a Grid"
      description="Each row is one animal you match against. Stack the rows and you have written a matrix."
      onReset={resetToDefaults}
    >
      <ChipSelector rowNames={rowNames} onToggle={toggleRow} />

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid min-w-full"
          style={{
            gridTemplateColumns: `minmax(10rem, auto) repeat(${properties.length}, 1fr)`,
            rowGap: "0.5rem",
            columnGap: "0",
          }}
        >
          {/* Column headers */}
          <div className="px-3 pb-1" />
          {properties.map((prop) => (
            <div
              key={prop}
              className="px-2 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted"
            >
              {prop}
            </div>
          ))}

          {/* One row per selected animal */}
          {rowNames.map((name) => {
            const item = ANIMAL_DOMAIN.items.find((it) => it.name === name)!;
            return (
              <>
                {/* Row label — part of the boxed row */}
                <div
                  key={`${name}-label`}
                  className="flex flex-col justify-center gap-0.5 rounded-l-lg border-y border-l border-border bg-surface px-3 py-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[9px] text-muted leading-none">
                    detector for {item.name}
                  </div>
                </div>

                {/* Property value cells */}
                {item.values.map((val, vi) => {
                  const isLast = vi === item.values.length - 1;
                  return (
                    <div
                      key={`${name}-${properties[vi]}`}
                      className={`flex flex-col items-center justify-center gap-1 border-y border-r-0 border-l-0 border-border bg-surface px-2 py-2.5 ${
                        isLast ? "rounded-r-lg border-r" : ""
                      }`}
                    >
                      <MiniBar value={val} />
                      <span className="font-mono text-[11px] text-foreground tabular-nums">
                        {val.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      {/* Caption */}
      <div className="mt-4 text-xs text-muted leading-relaxed">
        Each row is one animal&apos;s vector — one detector. Stack them and the grid is your matrix.
      </div>
    </WidgetContainer>
  );
}
