"use client";

import type { LayerDef, LayerId } from "./types";

interface StackStripProps {
  layers: LayerDef[];
  selectedId: LayerId;
  onSelect: (id: LayerId) => void;
}

export function StackStrip({ layers, selectedId, onSelect }: StackStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs font-medium uppercase tracking-wider text-muted">
        Layers
      </span>
      {layers.map((layer, idx) => (
        <div key={layer.id} className="flex items-center gap-2">
          {idx > 0 && (
            <span className="text-xl font-semibold text-foreground/60" aria-hidden>
              →
            </span>
          )}
          <button
            type="button"
            onClick={() => onSelect(layer.id)}
            aria-pressed={selectedId === layer.id}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
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
