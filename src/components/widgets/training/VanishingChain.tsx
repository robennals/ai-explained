"use client";

import { useCallback, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";
import {
  chainForward,
  chainWeightGradients,
  type Activation,
  type ChainNeuron,
} from "./neuronMath";

const TARGET = 0.7;
const LR = 0.5;

function makeChain(depth: number): ChainNeuron[] {
  // Fixed pseudo-random-ish weights so the demo is deterministic across renders.
  return Array.from({ length: depth }, (_, i) => ({
    w: 0.9 + 0.15 * Math.sin(i * 1.7),
    b: -0.1 + 0.1 * Math.cos(i * 2.3),
  }));
}

export function VanishingChain() {
  const [depth, setDepth] = useState(10);
  const [residual, setResidual] = useState(false);
  const [act] = useState<Activation>("sigmoid");
  const [neurons, setNeurons] = useState<ChainNeuron[]>(() => makeChain(10));
  const [steps, setSteps] = useState(0);

  const applyDepth = useCallback((d: number) => {
    const rounded = Math.round(d);
    setDepth(rounded);
    setNeurons(makeChain(rounded));
    setSteps(0);
  }, []);

  const reset = useCallback(() => {
    setResidual(false);
    setNeurons(makeChain(depth));
    setSteps(0);
  }, [depth]);

  const { grads, maxGrad, firstGrad } = useMemo(() => {
    const state = chainForward(neurons, act, residual);
    const g = chainWeightGradients(neurons, state, TARGET, act, residual);
    return {
      grads: g,
      maxGrad: Math.max(...g, 1e-9),
      firstGrad: g[0],
    };
  }, [neurons, act, residual]);

  const step = useCallback(() => {
    setNeurons((cur) => {
      const state = chainForward(cur, act, residual);
      const g = chainWeightGradients(cur, state, TARGET, act, residual);
      // Recompute signed gradient to actually update (reuse magnitude sign via
      // a fresh signed pass would be cleaner; here we nudge by magnitude toward
      // reducing error, which is enough for the illustration).
      const signedState = chainForward(cur, act, residual);
      const errSign = Math.sign(signedState.as[cur.length - 1] - TARGET);
      return cur.map((n, i) => ({
        w: n.w - LR * errSign * g[i],
        b: n.b,
      }));
    });
    setSteps((s) => s + 1);
  }, [act, residual]);

  return (
    <WidgetContainer
      title="Learning fades in a deep chain"
      description="Each bar shows how much that neuron actually learns in one step. In a plain deep chain, the earliest neurons barely move."
      onReset={reset}
    >
      <div className="rounded-lg border border-widget-border bg-surface p-4">
        <div className="flex items-end justify-between gap-1" style={{ height: 140 }}>
          {grads.map((g, i) => {
            const h = Math.max(2, (g / maxGrad) * 120);
            const isFirst = i === 0;
            return (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-end"
                style={{ height: "100%" }}
              >
                <div
                  className="w-full rounded-t"
                  style={{
                    height: h,
                    backgroundColor: isFirst
                      ? "#ef4444"
                      : "var(--color-accent)",
                    opacity: isFirst ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted">
          <span>← earliest neuron (deepest to blame)</span>
          <span>last neuron (nearest the output) →</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        The earliest neuron learns{" "}
        <span
          className={
            firstGrad / maxGrad < 0.15
              ? "font-semibold text-red-500"
              : "font-semibold text-emerald-600"
          }
        >
          {((firstGrad / maxGrad) * 100).toFixed(1)}%
        </span>{" "}
        as fast as the last one.
        {residual
          ? " With residual skips, the signal reaches all the way back."
          : " Turn on residual connections and watch the early bars come back."}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <SliderControl
          label="Depth"
          value={depth}
          min={3}
          max={16}
          step={1}
          onChange={applyDepth}
          formatValue={(v) => `${Math.round(v)}`}
        />
        <div className="flex flex-wrap items-center gap-4">
          <ToggleControl
            label="Residual connections"
            checked={residual}
            onChange={setResidual}
          />
          <button
            onClick={step}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
          >
            Take one learning step
          </button>
          <span className="text-xs text-muted">
            Steps: <span className="font-mono text-foreground">{steps}</span>
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}
