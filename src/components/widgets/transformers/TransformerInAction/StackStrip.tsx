"use client";

import type { LayerDef, LayerId } from "./types";

interface StackStripProps {
  layers: LayerDef[];
  selectedId: LayerId;
  onSelect: (id: LayerId) => void;
}

export function StackStrip({ layers, selectedId, onSelect }: StackStripProps) {
  return (
    // Tighter on phones so the strip wraps into a few lines, not one per layer.
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted sm:mr-2">
        Layers
      </span>
      {layers.map((layer, idx) => (
        <div key={layer.id} className="flex items-center gap-1.5 sm:gap-2">
          {idx > 0 && (
            <span className="text-base font-semibold text-foreground/60 sm:text-xl" aria-hidden>
              →
            </span>
          )}
          <button
            type="button"
            onClick={() => onSelect(layer.id)}
            aria-pressed={selectedId === layer.id}
            className={`rounded-md border px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              selectedId === layer.id
                ? "border-accent bg-accent text-white shadow-md ring-2 ring-accent/40"
                : "border-border bg-surface text-foreground hover:bg-foreground/10"
            }`}
          >
            {layer.label}
          </button>
        </div>
      ))}
    </div>
  );
}
