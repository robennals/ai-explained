"use client";

import { useCallback, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import {
  activate,
  activateDerivative,
  learningStep,
  type Activation,
} from "./neuronMath";

const LR = 0.6;
const CURVE_W = 280;
const CURVE_H = 140;
const Z_RANGE = 6;

interface LearningNeuronProps {
  title: string;
  description?: string;
  initialWeight: number;
  initialBias: number;
  initialTarget: number;
  initialActivation?: Activation;
  showActivationToggle?: boolean;
  /** Show "Bad start" / "Good start" preset buttons. */
  initPresets?: { bad: { w: number; b: number }; good: { w: number; b: number } };
}

export function LearningNeuron({
  title,
  description,
  initialWeight,
  initialBias,
  initialTarget,
  initialActivation = "sigmoid",
  showActivationToggle = false,
  initPresets,
}: LearningNeuronProps) {
  const [w, setW] = useState(initialWeight);
  const [b, setB] = useState(initialBias);
  const [target, setTarget] = useState(initialTarget);
  const [act, setAct] = useState<Activation>(initialActivation);
  const [steps, setSteps] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);

  const z = w + b;
  const out = activate(z, act);
  const slope = activateDerivative(z, act);
  const error = out - target;
  const saturated = Math.abs(slope) < 0.03;

  const reset = useCallback(() => {
    setW(initialWeight);
    setB(initialBias);
    setTarget(initialTarget);
    setAct(initialActivation);
    setSteps(0);
    setLastDelta(null);
  }, [initialWeight, initialBias, initialTarget, initialActivation]);

  const step = useCallback(
    (n: number) => {
      let cw = w;
      let cb = b;
      const before = activate(cw + cb, act);
      for (let i = 0; i < n; i++) {
        const next = learningStep(cw, cb, target, act, LR);
        cw = next.w;
        cb = next.b;
      }
      const after = activate(cw + cb, act);
      setW(cw);
      setB(cb);
      setSteps((s) => s + n);
      setLastDelta(after - before);
    },
    [w, b, target, act],
  );

  const applyPreset = useCallback(
    (p: { w: number; b: number }) => {
      setW(p.w);
      setB(p.b);
      setSteps(0);
      setLastDelta(null);
    },
    [],
  );

  // Activation curve path
  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const zi = -Z_RANGE + (2 * Z_RANGE * i) / 60;
      const a = activate(zi, act);
      const px = (i / 60) * CURVE_W;
      const py = CURVE_H - a * (CURVE_H - 20) - 10;
      pts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [act]);

  const dotX = ((z + Z_RANGE) / (2 * Z_RANGE)) * CURVE_W;
  const dotXClamped = Math.max(0, Math.min(CURVE_W, dotX));
  const dotY = CURVE_H - out * (CURVE_H - 20) - 10;

  // Output vs target track (domain 0..maxVal)
  const maxVal = Math.max(1, out, target) * 1.05;
  const toPct = (v: number) => `${Math.max(0, Math.min(1, v / maxVal)) * 100}%`;

  return (
    <WidgetContainer title={title} description={description} onReset={reset}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activation curve with operating point */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted">
            The neuron sits at this point on its activation curve
          </p>
          <svg
            viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
            className="w-full rounded-lg border border-widget-border bg-surface"
          >
            <path
              d={curvePath}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2}
            />
            <line
              x1={dotXClamped}
              y1={0}
              x2={dotXClamped}
              y2={CURVE_H}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 3"
              className="text-foreground/20"
            />
            <circle
              cx={dotXClamped}
              cy={dotY}
              r={6}
              fill={saturated ? "#ef4444" : "#22c55e"}
              stroke="white"
              strokeWidth={2}
            />
          </svg>
          <p className="mt-2 text-center text-xs text-muted">
            slope here:{" "}
            <span
              className={
                saturated ? "font-semibold text-red-500" : "text-foreground"
              }
            >
              {slope.toFixed(3)}
            </span>
            {saturated && " — nearly flat, so learning barely moves it"}
          </p>
        </div>

        {/* Output vs target + readouts */}
        <div className="flex flex-col justify-center gap-3">
          <Readout label="Output" value={out} color="#3b82f6" />
          <div className="relative h-6 rounded-full bg-foreground/5">
            <div
              className="absolute top-0 h-6 rounded-full bg-blue-500/30"
              style={{ width: toPct(out) }}
            />
            <div
              className="absolute top-[-4px] h-8 w-[2px] bg-emerald-500"
              style={{ left: toPct(target) }}
            />
          </div>
          <Readout label="Target" value={target} color="#22c55e" />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-muted">
              Error: <span className="font-mono text-foreground">{Math.abs(error).toFixed(3)}</span>
            </span>
            <span className="text-muted">
              Steps taken: <span className="font-mono text-foreground">{steps}</span>
            </span>
          </div>
          {lastDelta !== null && (
            <p className="text-xs text-muted">
              Last step moved the output by{" "}
              <span
                className={
                  Math.abs(lastDelta) < 0.002
                    ? "font-semibold text-red-500"
                    : "font-semibold text-emerald-600"
                }
              >
                {lastDelta >= 0 ? "+" : ""}
                {lastDelta.toFixed(4)}
              </span>
              {Math.abs(lastDelta) < 0.002 && " — stuck!"}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4">
        <SliderControl
          label="Target"
          value={target}
          min={0}
          max={1}
          step={0.01}
          onChange={setTarget}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => step(1)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
          >
            Take one learning step
          </button>
          <button
            onClick={() => step(20)}
            className="rounded-lg border border-widget-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Take 20 steps
          </button>
          {showActivationToggle && (
            <div className="ml-auto inline-flex overflow-hidden rounded-lg border border-widget-border text-sm">
              {(["sigmoid", "relu"] as Activation[]).map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAct(a);
                    setLastDelta(null);
                  }}
                  className={`px-3 py-2 font-medium capitalize transition-colors ${
                    act === a
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-foreground/5"
                  }`}
                >
                  {a === "relu" ? "ReLU" : a}
                </button>
              ))}
            </div>
          )}
        </div>
        {initPresets && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Start it with:</span>
            <button
              onClick={() => applyPreset(initPresets.bad)}
              className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              Bad initialization
            </button>
            <button
              onClick={() => applyPreset(initPresets.good)}
              className="rounded-md border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10"
            >
              Good initialization
            </button>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}

function Readout({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-mono text-foreground">{value.toFixed(3)}</span>
    </div>
  );
}
