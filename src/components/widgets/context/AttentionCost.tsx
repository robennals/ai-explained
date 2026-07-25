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
  windowForEnergy,
  EQUIVALENTS,
  type Equivalent,
} from "./cost";

/* ------------------------------------------------------------------ */
/*  Ranges and anchors — all three sliders are linear                  */
/* ------------------------------------------------------------------ */

const MIN_WINDOW = 0;
const MAX_WINDOW = 10_000_000;

const MIN_HEADS = 0;
const MAX_HEADS = 18_000;

const MIN_HEAD_DIM = 8;
const MAX_HEAD_DIM = 256;

const WINDOW_ANCHORS: { label: string; value: number }[] = [
  { label: "a page", value: 700 },
  { label: "a book", value: 130_000 },
  { label: "128K", value: 128_000 },
  {
    label: "a modern context window — docs, tool output, search results, skills",
    value: 1_000_000,
  },
  {
    label: "Llama 4 Scout — and still smaller than a serious codebase",
    value: 10_000_000,
  },
];

const HEADS_ANCHORS: { label: string; value: number }[] = [
  { label: "GPT-2", value: 144 },
  { label: "Llama 4", value: 1920 },
  { label: "GLM-5.2", value: 4992 },
  { label: "DeepSeek-V3.2", value: 7808 },
  { label: "Llama-3.1 405B", value: 16_128 },
];

const HEAD_DIM_ANCHORS: { label: string; value: number }[] = [
  { label: "GPT-2", value: 64 },
  { label: "most models", value: 128 },
  { label: "DeepSeek/Kimi", value: 192 },
  { label: "GLM-5.2", value: 256 },
];

/* ------------------------------------------------------------------ */
/*  Model presets: (totalHeads, headDim, windowTokens)                 */
/* ------------------------------------------------------------------ */

interface Preset {
  label: string;
  totalHeads: number;
  headDim: number;
  windowTokens: number;
}

const PRESETS: Preset[] = [
  { label: "GPT-2 small", totalHeads: 144, headDim: 64, windowTokens: 1024 },
  { label: "Llama 4 Scout", totalHeads: 1920, headDim: 128, windowTokens: 10_000_000 },
  { label: "Kimi K2", totalHeads: 3904, headDim: 192, windowTokens: 128_000 },
  { label: "GLM-5.2", totalHeads: 4992, headDim: 256, windowTokens: 1_000_000 },
  { label: "Qwen3-235B", totalHeads: 6016, headDim: 128, windowTokens: 128_000 },
  { label: "DeepSeek-V3.2", totalHeads: 7808, headDim: 192, windowTokens: 128_000 },
  { label: "Llama 3.1 405B", totalHeads: 16_128, headDim: 128, windowTokens: 128_000 },
];

const DEFAULT_PRESET = PRESETS.find((p) => p.label === "GLM-5.2")!;

/** Name a preset whose (heads, headDim) matches the current sliders exactly. */
function matchingPreset(totalHeads: number, headDim: number): Preset | null {
  for (const preset of PRESETS) {
    if (preset.totalHeads === totalHeads && preset.headDim === headDim) {
      return preset;
    }
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AttentionCost() {
  const [windowTokens, setWindowTokens] = useState(DEFAULT_PRESET.windowTokens);
  const [totalHeads, setTotalHeads] = useState(DEFAULT_PRESET.totalHeads);
  const [headDim, setHeadDim] = useState(DEFAULT_PRESET.headDim);

  const handleReset = useCallback(() => {
    setWindowTokens(DEFAULT_PRESET.windowTokens);
    setTotalHeads(DEFAULT_PRESET.totalHeads);
    setHeadDim(DEFAULT_PRESET.headDim);
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setTotalHeads(preset.totalHeads);
    setHeadDim(preset.headDim);
    setWindowTokens(preset.windowTokens);
  }, []);

  const flops = useMemo(
    () => attentionFlops(windowTokens, headDim, totalHeads),
    [windowTokens, headDim, totalHeads]
  );
  const joules = energyJoules(flops);
  const usd = dollars(flops);
  const equivalent = nearestEquivalent(joules);

  const jumpToEquivalent = useCallback(
    (target: Equivalent) => {
      const w = windowForEnergy(target.joules, headDim, totalHeads);
      setWindowTokens(Math.round(clamp(w, MIN_WINDOW, MAX_WINDOW)));
    },
    [headDim, totalHeads]
  );

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
              value={windowTokens}
              min={MIN_WINDOW}
              max={MAX_WINDOW}
              step={1000}
              onChange={setWindowTokens}
              formatValue={() => `${formatCount(windowTokens)} tok`}
            />
            <p className="pl-[6.5rem] text-xs text-muted">
              {WINDOW_ANCHORS.map((a) => `${a.label} ≈ ${formatCount(a.value)}`).join(" · ")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <SliderControl
              label="Total heads"
              value={totalHeads}
              min={MIN_HEADS}
              max={MAX_HEADS}
              step={1}
              onChange={setTotalHeads}
              formatValue={() => formatCount(totalHeads)}
            />
            <p className="pl-[6.5rem] text-xs text-muted">
              {HEADS_ANCHORS.map((a) => `${a.label} ${formatCount(a.value)}`).join(" · ")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <SliderControl
              label="Dims per head"
              value={headDim}
              min={MIN_HEAD_DIM}
              max={MAX_HEAD_DIM}
              step={1}
              onChange={setHeadDim}
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

        {/* Preset buttons */}
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

        {/* Interactive real-world equivalent ladder */}
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            What does that energy look like?
          </p>
          <div className="flex flex-col gap-1">
            {EQUIVALENTS.map((e) => {
              const active = e === equivalent.entry;
              return (
                <button
                  key={e.singular}
                  onClick={() => jumpToEquivalent(e)}
                  className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-left text-xs transition-colors ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-transparent text-muted hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <span className="font-medium">{e.singular}</span>
                  <span className="font-mono">{formatEnergy(e.joules)}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            Click one to move the context window until this question costs about that much.
          </p>
        </div>

        <p className="text-center text-xs text-muted">
          {formatCount(flops)} FLOPs for full attention over {formatCount(windowTokens)} tokens,
          {" "}{formatCount(totalHeads)} heads at {headDim} dimensions each, all layers combined.
          Assumes ~1 pJ/FLOP effective energy and ~5&times;10<sup>14</sup> FLOP/s effective
          throughput at $2.50/GPU-hour.
        </p>
      </div>
    </WidgetContainer>
  );
}
