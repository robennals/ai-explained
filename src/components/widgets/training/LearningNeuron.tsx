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
const CURVE_W = 360;
const CURVE_H = 200;
const Z_RANGE = 6;
const LANE = 30; // width of the target-drag lane on the right
const PLOT_W = CURVE_W - LANE;

// Highest target the neuron can be asked to reach for each activation. Sigmoid
// can only output 0..1; ReLU is unbounded, so it gets a wider range.
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
  const svgRef = useRef<SVGSVGElement>(null);
  const dragMode = useRef<null | "target" | "point">(null);

  const z = w + b;
  const out = activate(z, act);
  const slope = activateDerivative(z, act);
  const error = out - target;
  const saturated = Math.abs(slope) < 0.03;
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
    setTarget((t) => Math.min(t, targetMaxFor(a)));
  }, []);

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
      const px = (i / 60) * PLOT_W;
      const py = CURVE_H - (a / ymax) * (CURVE_H - 20) - 10;
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    });
    return { curvePath: pts.join(" "), yMax: ymax };
  }, [act]);

  const yForOutput = useCallback(
    (v: number) =>
      CURVE_H - Math.max(0, Math.min(v / yMax, 1)) * (CURVE_H - 20) - 10,
    [yMax],
  );

  const dotX = Math.max(
    0,
    Math.min(PLOT_W, ((z + Z_RANGE) / (2 * Z_RANGE)) * PLOT_W),
  );
  const dotY = yForOutput(out);
  const targetY = yForOutput(target);

  const setTargetFromClientY = useCallback(
    (clientY: number) => {
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const yView = ((clientY - rect.top) / rect.height) * CURVE_H;
      const v = ((CURVE_H - 10 - yView) / (CURVE_H - 20)) * yMax;
      setTarget(Number(Math.max(0, Math.min(targetMax, v)).toFixed(3)));
    },
    [yMax, targetMax],
  );

  // Click/drag anywhere on the plot to move the neuron's operating point.
  const setPointFromClientX = useCallback((clientX: number) => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xView = ((clientX - rect.left) / rect.width) * CURVE_W;
    const frac = Math.max(0, Math.min(1, xView / PLOT_W));
    const zi = frac * (2 * Z_RANGE) - Z_RANGE;
    setW(Number(zi.toFixed(3)));
    setB(0);
    setLastDelta(null);
  }, []);

  const startTargetDrag = useCallback(
    (e: React.PointerEvent) => {
      dragMode.current = "target";
      svgRef.current?.setPointerCapture(e.pointerId);
      setTargetFromClientY(e.clientY);
    },
    [setTargetFromClientY],
  );

  const startPointDrag = useCallback(
    (e: React.PointerEvent) => {
      dragMode.current = "point";
      svgRef.current?.setPointerCapture(e.pointerId);
      setPointFromClientX(e.clientX);
    },
    [setPointFromClientX],
  );

  const showError = Math.abs(dotY - targetY) > 4;

  return (
    <WidgetContainer title={title} description={description} onReset={reset}>
      <p className="mb-2 text-xs font-medium text-muted">
        The blue dot is the neuron&apos;s output. Click anywhere on the graph to
        move it. Drag the green line on the right to set the target. The red gap
        is the error.
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
        className="w-full touch-none select-none rounded-lg border border-widget-border bg-surface"
        onPointerMove={(e) => {
          if (dragMode.current === "target") setTargetFromClientY(e.clientY);
          else if (dragMode.current === "point") setPointFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          dragMode.current = null;
        }}
      >
        {/* plot click/drag capture */}
        <rect
          x={0}
          y={0}
          width={PLOT_W}
          height={CURVE_H}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onPointerDown={startPointDrag}
        />

        {/* decorative layer — clicks pass through to the capture rect */}
        <g style={{ pointerEvents: "none" }}>
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
            className="text-foreground/15"
          />
          <line
            x1={0}
            y1={targetY}
            x2={CURVE_W}
            y2={targetY}
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <text x={6} y={targetY - 5} fontSize={11} fill="#22c55e">
            target
          </text>
          {showError && (
            <>
              <line
                x1={dotX}
                y1={dotY}
                x2={dotX}
                y2={targetY}
                stroke="#ef4444"
                strokeWidth={3}
              />
              <text
                x={dotX + 6}
                y={(dotY + targetY) / 2}
                fontSize={11}
                fill="#ef4444"
              >
                error
              </text>
            </>
          )}
          <circle
            cx={dotX}
            cy={dotY}
            r={6}
            fill={saturated ? "#ef4444" : "#3b82f6"}
            stroke="white"
            strokeWidth={2}
          />
          <text
            x={dotX + 8}
            y={dotY + (dotY < targetY ? -8 : 14)}
            fontSize={11}
            fill="#3b82f6"
          >
            output
          </text>
          <line
            x1={PLOT_W}
            y1={0}
            x2={PLOT_W}
            y2={CURVE_H}
            stroke="currentColor"
            strokeWidth={1}
            className="text-foreground/10"
          />
        </g>

        {/* right-hand target drag lane */}
        <rect
          x={PLOT_W}
          y={0}
          width={LANE}
          height={CURVE_H}
          fill="transparent"
          style={{ cursor: "ns-resize" }}
          onPointerDown={startTargetDrag}
        />
        <circle
          cx={PLOT_W + LANE / 2}
          cy={targetY}
          r={8}
          fill="#22c55e"
          stroke="white"
          strokeWidth={2}
          style={{ cursor: "ns-resize" }}
          onPointerDown={startTargetDrag}
        />
      </svg>

      <p className="mt-2 text-center text-xs text-muted">
        slope here:{" "}
        <span
          className={saturated ? "font-semibold text-red-500" : "text-foreground"}
        >
          {slope.toFixed(3)}
        </span>
        {saturated && " — nearly flat, so learning barely moves it"}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="output" value={out} color="#3b82f6" />
        <Stat label="target" value={target} color="#22c55e" />
        <Stat label="error" value={Math.abs(error)} color="#ef4444" />
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
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
        <span className="text-xs text-muted">
          Steps: <span className="font-mono text-foreground">{steps}</span>
          {lastDelta !== null && (
            <>
              {" · last step "}
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
            </>
          )}
        </span>
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
