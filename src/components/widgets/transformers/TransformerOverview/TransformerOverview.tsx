"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { astronautExample } from "@/components/widgets/transformers/TransformerInAction/astronaut-example";
import type { LayerId, NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { Grid } from "./Grid";
import { Popup } from "./Popup";
import { columnX, layerRowY, VIEW_WIDTH, VIEW_HEIGHT } from "./geometry";

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

  const cellPopup = useMemo(() => {
    if (!selectedCell) return null;
    const tok = astronautExample.tokens[selectedCell.tokenIndex];
    const layerDef = astronautExample.layers.find((l) => l.id === selectedCell.layer);
    const layerLabel = layerDef ? layerDef.label : selectedCell.layer;
    const isPredict = selectedCell.layer === "Predict";
    let bodyText: string;
    if (isPredict) {
      const top = astronautExample.predictions
        .slice(0, 3)
        .map((p) => `${p.token} (${Math.round(p.probability * 100)}%)`)
        .join(", ");
      bodyText = `Top guesses for the next word: ${top}.`;
    } else {
      bodyText = tok.reps[selectedCell.layer as NonPredictLayerId];
    }
    return {
      anchorX: columnX(selectedCell.tokenIndex),
      anchorY: layerRowY(selectedCell.layer),
      title: (
        <span>
          {tok.token}
          <span className="ml-1 font-normal text-muted">
            · after {selectedCell.layer} ({layerLabel})
          </span>
        </span>
      ),
      body: bodyText,
    };
  }, [selectedCell]);

  return (
    <WidgetContainer title="A Transformer At a Glance" onReset={handleReset}>
      <div className="relative overflow-x-auto">
        <Grid
          selectedCell={selectedCell}
          selectedLayer={selectedLayer}
          onCellClick={handleCellClick}
          onLayerLabelClick={handleLayerLabelClick}
        />
        {cellPopup && (
          <Popup
            anchorX={cellPopup.anchorX}
            anchorY={cellPopup.anchorY}
            pointerDirection="below"
            viewWidth={VIEW_WIDTH}
            viewHeight={VIEW_HEIGHT}
            title={cellPopup.title}
            body={cellPopup.body}
            onClose={() => setSelectedCell(null)}
          />
        )}
      </div>
    </WidgetContainer>
  );
}
