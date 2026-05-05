"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { useMediaQuery } from "@/components/widgets/shared/useMediaQuery";
import { simpleOverviewExample } from "./simple-example";
import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { Grid } from "./Grid";
import { Popup } from "./Popup";
import {
  layerRowY,
  LABEL_GUTTER_RIGHT_X,
  COMPACT_LABEL_GUTTER_RIGHT_X,
  VIEW_WIDTH,
  COMPACT_VIEW_WIDTH,
  VIEW_HEIGHT,
  previousLayer,
} from "./geometry";
import { LAYER_SUMMARIES } from "./layer-summaries";
import { overviewEdges } from "./edges";

interface CellSelection {
  tokenIndex: number;
  layer: LayerId;
}

// Guided tour through the most interesting cells, starting at "dog" on the
// Previous-token row (the first cell where attention actually pulls something).
const TOUR: CellSelection[] = [
  { tokenIndex: 1, layer: "L1" },
  { tokenIndex: 2, layer: "L1" },
  { tokenIndex: 3, layer: "L1" },
  { tokenIndex: 3, layer: "L2" },
  { tokenIndex: 3, layer: "Predict" },
];
const INITIAL_SELECTION: CellSelection = TOUR[0];

export function TransformerOverview() {
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(INITIAL_SELECTION);
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>(null);
  const compact = useMediaQuery("(max-width: 767.98px)");
  const labelGutterX = compact ? COMPACT_LABEL_GUTTER_RIGHT_X : LABEL_GUTTER_RIGHT_X;
  const viewWidth = compact ? COMPACT_VIEW_WIDTH : VIEW_WIDTH;

  const handleCellClick = useCallback((tokenIndex: number, layer: LayerId) => {
    setSelectedCell({ tokenIndex, layer });
    setSelectedLayer(null);
  }, []);

  const handleLayerLabelClick = useCallback((layer: LayerId) => {
    setSelectedLayer(layer);
    setSelectedCell(null);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedCell(INITIAL_SELECTION);
    setSelectedLayer(null);
  }, []);

  const closeAll = useCallback(() => {
    setSelectedCell(null);
    setSelectedLayer(null);
  }, []);

  const tourIndex = useMemo(() => {
    if (!selectedCell) return -1;
    return TOUR.findIndex(
      (t) => t.tokenIndex === selectedCell.tokenIndex && t.layer === selectedCell.layer
    );
  }, [selectedCell]);

  const nextTourCell: CellSelection | null =
    tourIndex >= 0 && tourIndex < TOUR.length - 1 ? TOUR[tourIndex + 1] : null;

  const handleNextToken = useCallback(() => {
    if (nextTourCell) {
      setSelectedCell(nextTourCell);
      setSelectedLayer(null);
    }
  }, [nextTourCell]);

  useEffect(() => {
    if (!selectedCell && !selectedLayer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCell, selectedLayer, closeAll]);

  const repBox = useMemo(() => {
    if (!selectedCell) {
      return { label: null as string | null, body: "Click any word-cell to see what it means at that layer." };
    }
    const tokIndex = selectedCell.tokenIndex;
    const tok = simpleOverviewExample.tokens[tokIndex];
    const layer = selectedCell.layer;
    const layerDef = simpleOverviewExample.layers.find((l) => l.id === layer);
    const layerLabel = layerDef ? layerDef.label : layer;
    const headerLeft = `${tok.token}`;
    const headerRight = `${layer}${layer !== "L0" && layer !== "Predict" ? ` · ${layerLabel}` : ""}`;
    if (layer === "Predict") {
      return {
        label: `${headerLeft} → predicted next word`,
        body: simpleOverviewExample.predictRep,
      };
    }
    if (layer === "L0") {
      return { label: `${headerLeft} · ${headerRight}`, body: tok.reps.L0 };
    }
    // L1 or L2: show prev → new if changed, else just the rep.
    const layerKey = layer as "L1" | "L2";
    const prevKey = layerKey === "L1" ? "L0" : "L1";
    const prev = tok.reps[prevKey];
    const now = tok.reps[layerKey];
    if (prev === now) {
      return { label: `${headerLeft} · ${headerRight}`, body: now };
    }
    return { label: `${headerLeft} · ${headerRight}`, body: `${prev} → ${now}` };
  }, [selectedCell]);

  const layerPopup = useMemo(() => {
    if (!selectedLayer) return null;
    const layerDef = simpleOverviewExample.layers.find((l) => l.id === selectedLayer);
    const layerLabel = layerDef ? layerDef.label : selectedLayer;
    return {
      anchorX: labelGutterX,
      anchorY: layerRowY(selectedLayer) + 11,
      title: (
        <span>
          {selectedLayer} — {layerLabel}
        </span>
      ),
      body: LAYER_SUMMARIES[selectedLayer],
    };
  }, [selectedLayer, labelGutterX]);

  const sourceCells = useMemo(() => {
    if (!selectedCell) return new Set<string>();
    const out = new Set<string>();

    // Residual: the same column on the layer immediately below.
    const below = previousLayer(selectedCell.layer);
    if (below) {
      out.add(`${below}:${selectedCell.tokenIndex}`);
    }

    // Attention sources at this layer, this column. None for L0 (no consumers) or Predict.
    if (selectedCell.layer !== "L0" && selectedCell.layer !== "Predict" && below) {
      for (const e of overviewEdges.attention) {
        if (e.toLayer === selectedCell.layer && e.toTokenIndex === selectedCell.tokenIndex) {
          out.add(`${below}:${e.fromTokenIndex}`);
        }
      }
    }
    return out;
  }, [selectedCell]);

  return (
    <WidgetContainer title="A Transformer At a Glance" onReset={handleReset}>
      <div
        className="relative overflow-x-auto mx-auto max-w-[960px]"
        onClick={(e) => { if (e.target === e.currentTarget) closeAll(); }}
      >
        <Grid
          compact={compact}
          selectedCell={selectedCell}
          selectedLayer={selectedLayer}
          sourceCells={sourceCells}
          onCellClick={handleCellClick}
          onLayerLabelClick={handleLayerLabelClick}
        />
        {layerPopup && (
          <Popup
            anchorX={layerPopup.anchorX}
            anchorY={layerPopup.anchorY}
            pointerDirection="above"
            viewWidth={viewWidth}
            viewHeight={VIEW_HEIGHT}
            title={layerPopup.title}
            body={layerPopup.body}
            onClose={() => setSelectedLayer(null)}
          />
        )}
      </div>
      <div
        className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-4 shadow-sm dark:bg-amber-900/20"
        aria-live="polite"
      >
        {repBox.label ? (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            {repBox.label}
          </div>
        ) : (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            What this token means
          </div>
        )}
        <div className="text-base text-foreground">{repBox.body}</div>
      </div>
      {nextTourCell && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleNextToken}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
          >
            Next token →
          </button>
        </div>
      )}
    </WidgetContainer>
  );
}
