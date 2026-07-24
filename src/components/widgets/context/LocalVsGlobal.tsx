"use client";

import { useCallback, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { formatCount } from "./cost";
import {
  type LayerKind,
  totalCost,
  reachableDistance,
  gemma3Layers,
} from "./attentionReach";

/* ------------------------------------------------------------------ */
/*  Constants — a toy sequence small enough to draw every token, and   */
/*  a small window range so the sliding window is visible on it.       */
/* ------------------------------------------------------------------ */

const TOKEN_COUNT = 24;
const CHOSEN_INDEX = 12;
const DEFAULT_WINDOW = 3;
const DEFAULT_LAYERS = gemma3Layers(1); // 5 local, 1 global — 6 rows

function layerLabel(kind: LayerKind): string {
  return kind === "local" ? "Local" : "Global";
}

/* ------------------------------------------------------------------ */
/*  Small segmented Local/Global switch for a single layer row         */
/* ------------------------------------------------------------------ */

function LayerToggle({
  kind,
  onChange,
}: {
  kind: LayerKind;
  onChange: (kind: LayerKind) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border text-xs font-semibold">
      {(["local", "global"] as const).map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-3 py-1.5 transition-colors ${
            kind === k
              ? k === "local"
                ? "bg-accent text-white"
                : "bg-error text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {layerLabel(k)}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LocalVsGlobal() {
  const [layers, setLayers] = useState<LayerKind[]>(DEFAULT_LAYERS);
  const [windowSize, setWindowSize] = useState(DEFAULT_WINDOW);
  const [activeLayer, setActiveLayer] = useState(0);

  const handleReset = useCallback(() => {
    setLayers(DEFAULT_LAYERS);
    setWindowSize(DEFAULT_WINDOW);
    setActiveLayer(0);
  }, []);

  const updateLayer = useCallback((i: number, kind: LayerKind) => {
    setLayers((prev) => prev.map((k, idx) => (idx === i ? kind : k)));
  }, []);

  const cost = useMemo(
    () => totalCost(layers, TOKEN_COUNT, windowSize),
    [layers, windowSize]
  );
  const reach = useMemo(
    () => reachableDistance(layers, windowSize, TOKEN_COUNT),
    [layers, windowSize]
  );
  const reachIsFull = reach >= TOKEN_COUNT;

  const activeKind = layers[activeLayer] ?? "local";

  const isVisible = (tokenIndex: number) => {
    if (activeKind === "global") return true;
    return Math.abs(tokenIndex - CHOSEN_INDEX) <= windowSize;
  };

  return (
    <WidgetContainer
      title="Most words don't need most words"
      description="Most layers only need to look at their neighbors. A few layers that look at everything are enough to carry information the rest of the way."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLayers(Array(6).fill("global"))}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            All global
          </button>
          <button
            onClick={() => setLayers(Array(6).fill("local"))}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            All local
          </button>
          <button
            onClick={() => setLayers(gemma3Layers(1))}
            className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            Gemma 3 (5 local : 1 global)
          </button>
        </div>

        {/* Window size */}
        <SliderControl
          label="Window size"
          value={windowSize}
          min={1}
          max={8}
          step={1}
          onChange={setWindowSize}
          formatValue={(v) => `${v} each side`}
        />

        {/* Token row: what the chosen word can see in the active layer */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-xs text-muted">
            What the highlighted word can see in{" "}
            <span className="font-semibold text-foreground">
              layer {activeLayer + 1}
            </span>{" "}
            ({layerLabel(activeKind).toLowerCase()}) — hover or tap a layer
            below to inspect it.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: TOKEN_COUNT }, (_, i) => {
              const chosen = i === CHOSEN_INDEX;
              const visible = isVisible(i);
              return (
                <div
                  key={i}
                  className={`h-5 w-5 rounded-full transition-colors sm:h-6 sm:w-6 ${
                    chosen
                      ? "bg-foreground"
                      : visible
                        ? activeKind === "local"
                          ? "bg-accent"
                          : "bg-error/70"
                        : "bg-foreground/10"
                  }`}
                  title={chosen ? "chosen word" : visible ? "visible" : "not visible"}
                />
              );
            })}
          </div>
        </div>

        {/* Layer stack */}
        <div className="flex flex-col gap-1.5">
          {layers.map((kind, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveLayer(i)}
              onClick={() => setActiveLayer(i)}
              className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                activeLayer === i
                  ? "border-accent bg-accent/5"
                  : "border-border bg-transparent"
              }`}
            >
              <span className="text-xs font-medium text-muted">
                Layer {i + 1}
              </span>
              <LayerToggle
                kind={kind}
                onChange={(k) => updateLayer(i, k)}
              />
            </div>
          ))}
        </div>

        {/* Big read-outs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-error">
              Total cost
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-error">
              {formatCount(cost)}
            </p>
            <p className="mt-0.5 text-xs text-muted">comparisons, all layers</p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              How far a word can reach
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-accent">
              {reach} <span className="text-sm font-medium text-muted">tokens</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {reachIsFull ? "= whole sequence" : `out of ${TOKEN_COUNT}`}
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
