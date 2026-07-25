"use client";

import { useCallback, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import {
  attentionFlops,
  energyJoules,
  dollars,
  formatCount,
  formatEnergy,
  formatDollars,
  nearestEquivalent,
} from "./cost";

/* ------------------------------------------------------------------ */
/*  Log-scale slider helpers                                          */
/* ------------------------------------------------------------------ */

function makeLogSlider(min: number, max: number) {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  return {
    toSlider(value: number): number {
      const log = Math.log10(Math.max(value, min));
      return ((log - logMin) / (logMax - logMin)) * 100;
    },
    fromSlider(pos: number): number {
      const log = logMin + (pos / 100) * (logMax - logMin);
      return Math.round(Math.pow(10, log));
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Ranges and anchors                                                */
/* ------------------------------------------------------------------ */

const MIN_WINDOW = 30;
const MAX_WINDOW = 2_000_000;
const windowSlider = makeLogSlider(MIN_WINDOW, MAX_WINDOW);

const MIN_HEADS = 100;
const MAX_HEADS = 20_000;
const headsSlider = makeLogSlider(MIN_HEADS, MAX_HEADS);

const MIN_HEAD_DIM = 8;
const MAX_HEAD_DIM = 256;
const headDimSlider = makeLogSlider(MIN_HEAD_DIM, MAX_HEAD_DIM);

const WINDOW_ANCHORS: { label: string; value: number }[] = [
  { label: "a chat message", value: 30 },
  { label: "a page", value: 700 },
  { label: "a long blog post", value: 2700 },
  { label: "a novel", value: 130_000 },
  { label: "a big codebase", value: 1_000_000 },
];

const HEADS_ANCHORS: { label: string; value: number }[] = [
  { label: "GPT-2 small", value: 144 },
  { label: "Llama-3 70B", value: 5120 },
  { label: "DeepSeek-V3", value: 7808 },
  { label: "GPT-3", value: 9216 },
  { label: "Llama-3.1 405B", value: 16_128 },
];

const HEAD_DIM_ANCHORS: { label: string; value: number }[] = [
  { label: "DSA-style index", value: 24 },
  { label: "GPT-2", value: 64 },
  { label: "most modern models", value: 128 },
];

/* ------------------------------------------------------------------ */
/*  Presets: (totalHeads, headDim), optionally windowTokens too        */
/* ------------------------------------------------------------------ */

interface Preset {
  label: string;
  totalHeads: number;
  headDim: number;
  windowTokens?: number;
}

const PRESETS: Preset[] = [
  { label: "GPT-2 small", totalHeads: 144, headDim: 64 },
  { label: "GPT-3", totalHeads: 9216, headDim: 128 },
  { label: "DeepSeek-V3", totalHeads: 7808, headDim: 128 },
  { label: "Llama-3.1 405B", totalHeads: 16_128, headDim: 128 },
];

const DSA_INDEX_HEAD_DIM = 16;
const DSA_INDEX_TOTAL_HEADS = 100;

const DEFAULT_WINDOW = 130_000; // a novel
const DEFAULT_PRESET = PRESETS[2]; // DeepSeek-V3

/** Name a preset whose (heads, headDim) is close to the current sliders. */
function matchingPreset(totalHeads: number, headDim: number): Preset | null {
  for (const preset of PRESETS) {
    if (preset.totalHeads === totalHeads && preset.headDim === headDim) {
      return preset;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AttentionCost() {
  const [windowTokens, setWindowTokens] = useState(DEFAULT_WINDOW);
  const [totalHeads, setTotalHeads] = useState(DEFAULT_PRESET.totalHeads);
  const [headDim, setHeadDim] = useState(DEFAULT_PRESET.headDim);

  const handleReset = useCallback(() => {
    setWindowTokens(DEFAULT_WINDOW);
    setTotalHeads(DEFAULT_PRESET.totalHeads);
    setHeadDim(DEFAULT_PRESET.headDim);
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setTotalHeads(preset.totalHeads);
    setHeadDim(preset.headDim);
    if (preset.windowTokens) setWindowTokens(preset.windowTokens);
  }, []);

  const useIndex = useCallback(() => {
    setHeadDim(DSA_INDEX_HEAD_DIM);
    setTotalHeads(DSA_INDEX_TOTAL_HEADS);
  }, []);

  const flops = useMemo(
    () => attentionFlops(windowTokens, headDim, totalHeads),
    [windowTokens, headDim, totalHeads]
  );
  const joules = energyJoules(flops);
  const usd = dollars(flops);
  const equivalent = nearestEquivalent(joules);

  const preset = matchingPreset(totalHeads, headDim);

  return (
    <WidgetContainer
      title="The cost of looking at everything"
      description="Every token compares against every other token, and each comparison runs across every attention head, in every layer."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        {/* Sliders */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <SliderControl
              label="Context window"
              value={windowSlider.toSlider(windowTokens)}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setWindowTokens(windowSlider.fromSlider(v))}
              formatValue={() => `${formatCount(windowTokens)} tok`}
            />
            <p className="pl-[6.5rem] text-xs text-muted">
              {WINDOW_ANCHORS.map((a) => `${a.label} ≈ ${formatCount(a.value)}`).join(" · ")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <SliderControl
              label="Total heads"
              value={headsSlider.toSlider(totalHeads)}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setTotalHeads(headsSlider.fromSlider(v))}
              formatValue={() => formatCount(totalHeads)}
            />
            <p className="pl-[6.5rem] text-xs text-muted">
              {HEADS_ANCHORS.map((a) => `${a.label} ${formatCount(a.value)}`).join(" · ")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <SliderControl
              label="Dims per head"
              value={headDimSlider.toSlider(headDim)}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setHeadDim(headDimSlider.fromSlider(v))}
              formatValue={() => formatCount(headDim)}
            />
            <p className="pl-[6.5rem] text-xs text-muted">
              {HEAD_DIM_ANCHORS.map((a) => `${a.label} ≈ ${a.value}`).join(" · ")}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          {preset
            ? `That's roughly ${preset.label}'s attention shape.`
            : "Total attention heads, summed across every layer of the model."}
        </p>

        {/* Preset + index buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={useIndex}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Use a DSA-style index
          </button>
        </div>

        {/* Big readouts */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-error">
              Energy for one question
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-error">
              {formatEnergy(joules)}
            </p>
            <p className="mt-1 text-xs text-muted">
              &asymp; {equivalent.count >= 100 || equivalent.count < 1
                ? equivalent.count.toLocaleString(undefined, { maximumFractionDigits: 1 })
                : Math.round(equivalent.count).toLocaleString()}{" "}
              {equivalent.label}
            </p>
          </div>
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-error">
              Dollar cost
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-error">
              {formatDollars(usd)}
            </p>
            <p className="mt-1 text-xs text-muted">
              at roughly $2.50 per GPU-hour, effective throughput
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          {formatCount(flops)} FLOPs for full attention over {formatCount(windowTokens)} tokens,
          {" "}{formatCount(totalHeads)} heads at {headDim} dimensions each, all layers combined.
          Assumes ~1 pJ/FLOP effective energy and ~5&times;10<sup>14</sup> FLOP/s effective
          throughput at $2.50/GPU-hour &mdash; a real index also runs at lower numeric precision,
          which shrinks the cost further still.
        </p>
      </div>
    </WidgetContainer>
  );
}
