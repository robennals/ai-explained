"use client";

import { useMemo, useState, useCallback } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { astronautExample } from "./astronaut-example";
import { StackStrip } from "./StackStrip";
import { HeadStrip } from "./HeadStrip";
import { Passage } from "./Passage";
import { DetailCard } from "./DetailCard";
import { PredictionCard } from "./PredictionCard";
import type { HeadCard, HeadDef, LayerId, NonPredictLayerId } from "./types";

const INITIAL_LAYER: LayerId = "L0";
const INITIAL_FOCAL: number | null = null;

export function TransformerInAction() {
  const data = astronautExample;

  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>(INITIAL_LAYER);
  const [selectedHeadId, setSelectedHeadId] = useState<string | null>(null);
  const [focalTokenIndex, setFocalTokenIndex] = useState<number | null>(INITIAL_FOCAL);

  const selectedLayer = useMemo(
    () => data.layers.find((l) => l.id === selectedLayerId) ?? data.layers[0],
    [data.layers, selectedLayerId]
  );

  const selectedHead: HeadDef | null = useMemo(() => {
    if (!selectedLayer || selectedLayer.heads.length === 0) return null;
    if (selectedHeadId) {
      const found = selectedLayer.heads.find((h) => h.id === selectedHeadId);
      if (found) return found;
    }
    return selectedLayer.heads[0];
  }, [selectedLayer, selectedHeadId]);

  const handleSelectLayer = useCallback((id: LayerId) => {
    setSelectedLayerId(id);
    setSelectedHeadId(null); // re-auto-select first head on layer change
  }, []);

  const handleSelectHead = useCallback((id: string) => {
    setSelectedHeadId(id);
  }, []);

  const handleClickToken = useCallback((index: number) => {
    setFocalTokenIndex(index);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedLayerId(INITIAL_LAYER);
    setSelectedHeadId(null);
    setFocalTokenIndex(INITIAL_FOCAL);
  }, []);

  // Resolve what to show in the detail region.
  const focalToken = focalTokenIndex !== null ? data.tokens[focalTokenIndex] : null;

  const card: HeadCard | null = useMemo(() => {
    if (!focalToken || !selectedHead) return null;
    if (selectedLayerId === "Predict" || selectedLayerId === "L0") return null;
    const layerCards = focalToken.headCards[selectedLayerId as NonPredictLayerId];
    return layerCards?.[selectedHead.id] ?? null;
  }, [focalToken, selectedHead, selectedLayerId]);

  const outputRep: string | null = useMemo(() => {
    if (!focalToken) return null;
    if (selectedLayerId === "Predict") return null;
    return focalToken.reps[selectedLayerId as NonPredictLayerId];
  }, [focalToken, selectedLayerId]);

  const pulledFromIndices = card?.pulls.map((p) => p.fromTokenIndex) ?? [];

  // Indices of tokens that have something inspectable at the current layer/head.
  // L0: every clickable token has a rep to show.
  // Predict: nothing per-token to inspect.
  // Other layers: only tokens that have a head card for the selected head.
  const tokensWithContent = useMemo(() => {
    if (selectedLayerId === "Predict") return [];
    if (selectedLayerId === "L0") {
      return data.tokens
        .map((t, i) => (t.clickable ? i : -1))
        .filter((i) => i >= 0);
    }
    if (!selectedHead) return [];
    const layerId = selectedLayerId as NonPredictLayerId;
    return data.tokens
      .map((t, i) => (t.headCards[layerId]?.[selectedHead.id] ? i : -1))
      .filter((i) => i >= 0);
  }, [data.tokens, selectedLayerId, selectedHead]);

  const currentLayerIndex = data.layers.findIndex((l) => l.id === selectedLayerId);
  const nextLayer = currentLayerIndex >= 0 ? data.layers[currentLayerIndex + 1] : undefined;
  const handleNextLayer = useCallback(() => {
    if (nextLayer) handleSelectLayer(nextLayer.id);
  }, [nextLayer, handleSelectLayer]);

  const predictionSlotToken = "blue";
  const predictionFinalRep = data.tokens[data.tokens.length - 1].reps.L4;

  return (
    <WidgetContainer
      title="A Transformer In Action"
      description="Watch this sentence flow through 3 transformer layers. Click a layer to see each token's current rep; click a word to see what any head did to it."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4 p-4">
        <StackStrip
          layers={data.layers}
          selectedId={selectedLayerId}
          onSelect={handleSelectLayer}
        />

        {selectedLayer && selectedLayer.heads.length > 0 && (
          <HeadStrip
            heads={selectedLayer.heads}
            selectedHeadId={selectedHead?.id ?? null}
            onSelect={handleSelectHead}
            layerLabel={selectedLayer.label}
          />
        )}

        <Passage
          tokens={data.tokens}
          focusedTokenIndex={focalTokenIndex}
          pulledFromIndices={pulledFromIndices}
          tokensWithContent={tokensWithContent}
          onClickToken={handleClickToken}
        />

        {selectedLayerId === "Predict" ? (
          <PredictionCard
            predictions={data.predictions}
            predictionSlotToken={predictionSlotToken}
            finalRep={predictionFinalRep}
          />
        ) : focalToken ? (
          <DetailCard
            focalToken={focalToken}
            tokens={data.tokens}
            headDef={selectedHead}
            card={card}
            outputRep={outputRep}
            layerLabel={selectedLayer.label}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-foreground/[0.03] p-6 text-center text-sm italic text-muted">
            Click a word in the passage above to inspect it.
          </div>
        )}

        {selectedLayer && (
          <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-base text-foreground/80 dark:bg-blue-900/20">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-blue-900 dark:text-blue-300">
              About this layer
            </div>
            <div>{selectedLayer.description}</div>
          </div>
        )}

        <div className="rounded border border-border/60 bg-foreground/[0.03] p-3 text-xs italic text-muted">
          Real transformers use dozens of narrow heads per layer. We&apos;re showing the five that do the visible
          work for this sentence. Other heads exist but don&apos;t contribute here.
        </div>

        {nextLayer && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNextLayer}
              className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
            >
              Next layer →
            </button>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
