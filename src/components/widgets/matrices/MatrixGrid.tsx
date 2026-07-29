"use client";

import { useState, useCallback, Fragment } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VECTOR_DOMAINS } from "@/components/widgets/vectors/vectorData";

const DEFAULT_DOMAIN = VECTOR_DOMAINS[0].id;

// Singular noun for the row label caption, keyed by domain id.
const ROW_NOUN: Record<string, string> = {
  animals: "animal",
  rpg: "character",
  foods: "food",
  instruments: "instrument",
};

interface SelectedCell {
  row: number;
  col: number;
}

// Start with one cell selected (Bear · scary) so the reader sees cells are clickable.
const DEFAULT_SELECTED: SelectedCell = { row: 0, col: 1 };

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "An" : "A";
}

function DomainTabs({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 text-xs font-medium text-muted">
        Kind of vector
      </div>
      <div className="flex flex-wrap gap-1.5">
        {VECTOR_DOMAINS.map((domain) => {
          const selected = domain.id === activeId;
          return (
            <button
              key={domain.id}
              onClick={() => onSelect(domain.id)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                selected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {domain.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MatrixGrid() {
  const [domainId, setDomainId] = useState<string>(DEFAULT_DOMAIN);
  const [selected, setSelected] = useState<SelectedCell | null>(DEFAULT_SELECTED);

  const resetToDefaults = useCallback(() => {
    setDomainId(DEFAULT_DOMAIN);
    setSelected(DEFAULT_SELECTED);
  }, []);

  // Switching kinds of vector clears the selection (row/col indices don't carry over).
  const selectDomain = useCallback((id: string) => {
    setDomainId(id);
    setSelected(null);
  }, []);

  const toggleCell = useCallback((row: number, col: number) => {
    setSelected((prev) =>
      prev && prev.row === row && prev.col === col ? null : { row, col }
    );
  }, []);

  const domain =
    VECTOR_DOMAINS.find((d) => d.id === domainId) ?? VECTOR_DOMAINS[0];
  const properties = domain.properties;
  const rowNoun = ROW_NOUN[domain.id] ?? "row";

  const selItem = selected ? domain.items[selected.row] : null;
  const selProp = selected ? properties[selected.col] : null;
  const selValue =
    selItem && selected ? selItem.values[selected.col] : null;

  return (
    <WidgetContainer
      title="Writing a Matrix as a Grid"
      description="A list of vectors written out together. Each row is one thing; each column is one property."
      onReset={resetToDefaults}
    >
      <DomainTabs activeId={domainId} onSelect={selectDomain} />

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid min-w-full"
          style={{
            gridTemplateColumns: `minmax(10rem, auto) repeat(${properties.length}, minmax(3.5rem, 1fr))`,
            rowGap: "0.375rem",
            columnGap: "0.375rem",
          }}
        >
          {/* Column headers — the selected column's heading is emphasised strongly */}
          <div className="px-1 pb-1" />
          {properties.map((prop, ci) => {
            const colActive = selected?.col === ci;
            return (
              <div
                key={prop}
                className={`px-1 pb-1 text-center uppercase tracking-widest transition-colors ${
                  colActive
                    ? "text-accent font-extrabold text-[12px] border-b-2 border-accent"
                    : "text-muted font-bold text-[10px]"
                }`}
              >
                {prop}
              </div>
            );
          })}

          {/* One row per item in the domain */}
          {domain.items.map((item, ri) => {
            const rowActive = selected?.row === ri;
            return (
              <Fragment key={item.name}>
                {/* Row label — the whole selected row is filled to show these
                    are the dimensions of one animal. */}
                <div
                  className={`flex flex-col justify-center gap-0.5 rounded-md border px-3 py-2.5 transition-colors ${
                    rowActive
                      ? "border-accent bg-accent/15"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span
                      className={`text-xs font-semibold ${
                        rowActive ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Property value cells — clickable. The selected row is filled
                    (strong), the selected column gets a light outline, and the
                    selected cell itself is emphasised strongest and bold. */}
                {item.values.map((val, vi) => {
                  const colActive = selected?.col === vi;
                  const isSelected = rowActive && colActive;
                  const cellClass = isSelected
                    ? "border-accent bg-accent/30 ring-2 ring-accent"
                    : rowActive
                      ? "border-accent/40 bg-accent/12"
                      : colActive
                        ? "border-accent/50 bg-surface"
                        : "border-border bg-surface hover:border-accent/60 hover:bg-accent/5";
                  const textClass = isSelected
                    ? "font-bold text-accent"
                    : rowActive
                      ? "text-accent"
                      : "text-foreground";
                  return (
                    <button
                      key={`${item.name}-${properties[vi]}`}
                      onClick={() => toggleCell(ri, vi)}
                      aria-pressed={isSelected}
                      title={`${item.name} · ${properties[vi]}`}
                      className={`flex items-center justify-center rounded-md border px-2 py-2.5 cursor-pointer transition-colors ${cellClass}`}
                    >
                      <span className={`font-mono text-xs tabular-nums ${textClass}`}>
                        {val.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Selection explainer / hint */}
      {selItem && selProp && selValue !== null ? (
        <div className="mt-4 rounded-md border border-accent/40 bg-accent/5 px-3 py-2.5 text-sm text-foreground">
          <span className="mr-1.5 text-base leading-none">{selItem.emoji}</span>
          {articleFor(selItem.name)} {selItem.name.toLowerCase()} has a{" "}
          <span className="font-semibold text-accent">{selProp}</span> rating of{" "}
          <span className="font-mono font-bold text-accent">
            {selValue.toFixed(2)}
          </span>
          . That number is one dimension of the {selItem.name.toLowerCase()}
          &apos;s vector, sitting in the &ldquo;{selProp}&rdquo; column.
        </div>
      ) : (
        <div className="mt-4 text-xs text-muted leading-relaxed">
          Each row is one {rowNoun}&apos;s vector of properties. Click any cell to
          read what it means, or switch tabs to see the same idea for a
          completely different kind of thing.
        </div>
      )}
    </WidgetContainer>
  );
}
