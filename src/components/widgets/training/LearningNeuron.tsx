"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import {
  activate,
  activateDerivative,
  learningStep,
  type Activation,
} from "./neuronMath";

// Learning rate kept modest so a ReLU neuron converges toward its target
// without overshooting into its dead (negative) zone.
const LR = 0.2;
const CURVE_W = 280;
const CURVE_H = 140;
const Z_RANGE = 6;

// How much output range the target bar shows for each activation. Sigmoid can
// only ever output 0..1; ReLU is unbounded, so we show a wider range.
function trackMaxFor(act: Activation): number {
  return act === "relu" ? 6 : 1;
}
function targetMaxFor(act: Activation): number {
  return act === "relu" ? 5.5 : 1;
}

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
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const z = w + b;
  const out = activate(z, act);
  const slope = activateDerivative(z, act);
  const error = out - target;
  const saturated = Math.abs(slope) < 0.03;

  const trackMax = trackMaxFor(act);
  const targetMax = targetMaxFor(act);

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

  const applyPreset = useCallback((p: { w: number; b: number }) => {
    setW(p.w);
    setB(p.b);
    setSteps(0);
    setLastDelta(null);
  }, []);

  const changeActivation = useCallback((a: Activation) => {
    setAct(a);
    setLastDelta(null);
    // Sigmoid can't represent a target above 1; pull it back in range.
    setTarget((t) => Math.min(t, targetMaxFor(a)));
  }, []);

  const setTargetFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const frac = (clientX - rect.left) / rect.width;
      const v = Math.max(0, Math.min(targetMax, frac * trackMax));
      setTarget(Number(v.toFixed(3)));
    },
    [trackMax, targetMax],
  );

  // Activation curve, y-scaled so an unbounded ReLU stays inside the box.
  const { curvePath, yMax } = useMemo(() => {
    const raw: number[] = [];
    let ymax = 1;
    for (let i = 0; i <= 60; i++) {
      const zi = -Z_RANGE + (2 * Z_RANGE * i) / 60;
      const a = activate(zi, act);
      raw.push(a);
      if (a > ymax) ymax = a;
    }
    const pts = raw.map((a, i) => {
      const px = (i / 60) * CURVE_W;
      const py = CURVE_H - (a / ymax) * (CURVE_H - 20) - 10;
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    });
    return { curvePath: pts.join(" "), yMax: ymax };
  }, [act]);

  const dotX = Math.max(
    0,
    Math.min(CURVE_W, ((z + Z_RANGE) / (2 * Z_RANGE)) * CURVE_W),
  );
  const dotY = CURVE_H - Math.min(out / yMax, 1) * (CURVE_H - 20) - 10;

  const pct = (v: number) =>
    `${Math.max(0, Math.min(1, v / trackMax)) * 100}%`;

  return (
    <WidgetContainer title={title} description={description} onReset={reset}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activation curve with operating point */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted">
            Where the neuron sits on its activation curve
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
              x1={dotX}
              y1={0}
              x2={dotX}
              y2={CURVE_H}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 3"
              className="text-foreground/20"
            />
            <circle
              cx={dotX}
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

        {/* Interactive output vs target bar */}
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted">
              Output vs target — click or drag to set the target
            </span>
            <span className="font-mono text-[10px] text-muted">
              0 – {trackMax}
            </span>
          </div>
          <div className="relative mb-6 mt-7">
            <div
              ref={trackRef}
              onPointerDown={(e) => {
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                setTargetFromClientX(e.clientX);
              }}
              onPointerMove={(e) => {
                if (dragging.current) setTargetFromClientX(e.clientX);
              }}
              onPointerUp={() => {
                dragging.current = false;
              }}
              className="relative h-11 cursor-pointer select-none rounded-lg bg-foreground/5"
            >
              {/* output fill */}
              <div
                className="pointer-events-none absolute left-0 top-0 h-full rounded-lg bg-blue-500/25"
                style={{ width: pct(out) }}
              />
              {/* target marker: line + label above + drag handle */}
              <div
                className="pointer-events-none absolute top-0 h-full w-[2px] bg-emerald-500"
                style={{ left: pct(target) }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-emerald-600">
                  target
                </span>
                <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-emerald-500 bg-white" />
              </div>
              {/* output marker: line + label below (not draggable) */}
              <div
                className="pointer-events-none absolute top-0 h-full w-[2px] bg-blue-500"
                style={{ left: pct(out) }}
              >
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-blue-600">
                  output
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="output" value={out} color="#3b82f6" />
            <Stat label="target" value={target} color="#22c55e" />
            <Stat label="error" value={Math.abs(error)} />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              Steps taken:{" "}
              <span className="font-mono text-foreground">{steps}</span>
            </span>
            {lastDelta !== null && (
              <span className="text-muted">
                last step:{" "}
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
                {Math.abs(lastDelta) < 0.002 && " (stuck)"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
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
                onClick={() => changeActivation(a)}
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
    </WidgetContainer>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-md bg-foreground/5 py-2">
      <div className="font-mono text-sm text-foreground">{value.toFixed(3)}</div>
      <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted">
        {color && (
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </div>
    </div>
  );
}
