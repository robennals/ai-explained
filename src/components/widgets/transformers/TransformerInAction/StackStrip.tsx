"use client";

import type { LayerDef, LayerId } from "./types";

interface StackStripProps {
  layers: LayerDef[];
  selectedId: LayerId;
  onSelect: (id: LayerId) => void;
}

export function StackStrip({ layers, selectedId, onSelect }: StackStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        Layers
      </span>
      {layers.map((layer, idx) => (
        <div key={layer.id} className="flex items-center gap-1.5">
          {idx > 0 && <span className="text-muted">▸</span>}
          <button
            type="button"
            onClick={() => onSelect(layer.id)}
            aria-pressed={selectedId === layer.id}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              selectedId === layer.id
                ? "border-accent bg-accent text-white"
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
