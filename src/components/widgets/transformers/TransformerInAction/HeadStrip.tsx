"use client";

import type { HeadDef } from "./types";

interface HeadStripProps {
  heads: HeadDef[];
  selectedHeadId: string | null;
  onSelect: (id: string) => void;
  /** Layer label (e.g. "L2") shown as a prefix. */
  layerLabel: string;
}

export function HeadStrip({ heads, selectedHeadId, onSelect, layerLabel }: HeadStripProps) {
  if (heads.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 pl-4">
      <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        Heads in {layerLabel}
      </span>
      {heads.map((head) => (
        <button
          key={head.id}
          type="button"
          onClick={() => onSelect(head.id)}
          aria-pressed={selectedHeadId === head.id}
          className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            selectedHeadId === head.id
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-foreground hover:bg-foreground/10"
          }`}
        >
          {head.label}
        </button>
      ))}
    </div>
  );
}
