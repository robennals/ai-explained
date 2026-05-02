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

export function TransformerOverview() {
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
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
    setSelectedCell(null);
    setSelectedLayer(null);
  }, []);

  const closeAll = useCallback(() => {
    setSelectedCell(null);
    setSelectedLayer(null);
  }, []);

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
        className="mt-4 rounded-md border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm"
        aria-live="polite"
      >
        {repBox.label ? (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {repBox.label}
          </div>
        ) : null}
        <div className="text-foreground">{repBox.body}</div>
      </div>
    </WidgetContainer>
  );
}
