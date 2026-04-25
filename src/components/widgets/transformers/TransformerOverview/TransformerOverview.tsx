"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { simpleOverviewExample } from "./simple-example";
import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { Grid } from "./Grid";
import { Popup } from "./Popup";
import { layerRowY, LABEL_GUTTER_RIGHT_X, VIEW_WIDTH, VIEW_HEIGHT, previousLayer } from "./geometry";
import { LAYER_SUMMARIES } from "./layer-summaries";
import { overviewEdges } from "./edges";

interface CellSelection {
  tokenIndex: number;
  layer: LayerId;
}

export function TransformerOverview() {
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>(null);

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

  const layerPopup = useMemo(() => {
    if (!selectedLayer) return null;
    const layerDef = simpleOverviewExample.layers.find((l) => l.id === selectedLayer);
    const layerLabel = layerDef ? layerDef.label : selectedLayer;
    return {
      anchorX: LABEL_GUTTER_RIGHT_X,
      anchorY: layerRowY(selectedLayer) + 11,
      title: (
        <span>
          {selectedLayer} — {layerLabel}
        </span>
      ),
      body: LAYER_SUMMARIES[selectedLayer],
    };
  }, [selectedLayer]);

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
            viewWidth={VIEW_WIDTH}
            viewHeight={VIEW_HEIGHT}
            title={layerPopup.title}
            body={layerPopup.body}
            onClose={() => setSelectedLayer(null)}
          />
        )}
      </div>
    </WidgetContainer>
  );
}
