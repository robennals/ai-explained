"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { Grid } from "./Grid";

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

  return (
    <WidgetContainer title="A Transformer At a Glance" onReset={handleReset}>
      <div className="overflow-x-auto">
        <Grid
          selectedCell={selectedCell}
          selectedLayer={selectedLayer}
          onCellClick={handleCellClick}
          onLayerLabelClick={handleLayerLabelClick}
        />
      </div>
    </WidgetContainer>
  );
}
