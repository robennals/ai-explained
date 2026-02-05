"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const PANEL_WIDTH = 240;
const PANEL_HEIGHT = 160;
const PADDING = 20;
const N_POINTS = 50;
const N_BINS = 8; // shared resolution for binary + step models

// Target function
function targetFn(x: number): number {
  return Math.sin(2 * Math.PI * x) * 0.4 + 0.5;
}

// Sample points for error calculation
const SAMPLE_XS = Array.from({ length: N_POINTS }, (_, i) => i / (N_POINTS - 1));
const TARGET_YS = SAMPLE_XS.map(targetFn);

// --- Model 1: Binary bits (0 or 1 per bin) ---
function binaryModel(bits: number[], x: number): number {
  const idx = Math.min(Math.floor(x * bits.length), bits.length - 1);
  return bits[idx];
}

function mutateBinary(bits: number[]): number[] {
  const next = [...bits];
  const idx = Math.floor(Math.random() * next.length);
  next[idx] = next[idx] === 0 ? 1 : 0;
  return next;
}

// --- Model 2: Step function (continuous heights per bin) ---
function stepModel(heights: number[], x: number): number {
  const idx = Math.min(Math.floor(x * heights.length), heights.length - 1);
  return heights[idx];
}

function mutateSteps(heights: number[]): number[] {
  const next = [...heights];
  const idx = Math.floor(Math.random() * next.length);
  next[idx] = Math.max(0, Math.min(1, next[idx] + (Math.random() - 0.5) * 0.1));
  return next;
}

// --- Model 3: Polynomial with continuous coefficients ---
// Use Chebyshev-like basis scaled to [0,1] for better conditioning
const N_POLY = 8;

function polyModel(coeffs: number[], x: number): number {
  // Simple polynomial: sum of c_i * x^i
  // but we scale x to [-1,1] for better numerical behavior
  const t = 2 * x - 1;
  let y = 0;
  let ti = 1;
  for (let i = 0; i < coeffs.length; i++) {
    y += coeffs[i] * ti;
    ti *= t;
  }
  return y;
}

function mutatePoly(coeffs: number[]): number[] {
  const next = [...coeffs];
  const idx = Math.floor(Math.random() * next.length);
  // Small perturbations — the smooth landscape means even tiny changes are useful
  next[idx] += (Math.random() - 0.5) * 0.04;
  return next;
}

// --- Error ---
function mse(modelFn: (x: number) => number): number {
  let sum = 0;
  for (let i = 0; i < SAMPLE_XS.length; i++) {
    const diff = modelFn(SAMPLE_XS[i]) - TARGET_YS[i];
    sum += diff * diff;
  }
  return sum / SAMPLE_XS.length;
}

// --- SVG helpers ---
function xToSvg(x: number): number {
  return PADDING + x * (PANEL_WIDTH - 2 * PADDING);
}

function yToSvg(y: number): number {
  return PANEL_HEIGHT - PADDING - y * (PANEL_HEIGHT - 2 * PADDING);
}

function generatePath(fn: (x: number) => number): string {
  const pts: string[] = [];
  for (let i = 0; i < N_POINTS; i++) {
    const x = i / (N_POINTS - 1);
    const y = fn(x);
    const clampedY = Math.max(-0.2, Math.min(1.2, y));
    pts.push(`${i === 0 ? "M" : "L"}${xToSvg(x).toFixed(1)},${yToSvg(clampedY).toFixed(1)}`);
  }
  return pts.join(" ");
}

interface ModelState {
  params: number[];
  error: number;
  steps: number;
}

function ModelPanel({
  title,
  modelFn: mFn,
  state,
}: {
  title: string;
  modelFn: (params: number[], x: number) => number;
  state: ModelState;
}) {
  const targetPath = generatePath(targetFn);
  const modelPath = generatePath((x) => mFn(state.params, x));
  const errorColor =
    state.error < 0.01
      ? "text-success"
      : state.error < 0.05
        ? "text-warning"
        : "text-error";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-foreground">{title}</span>
      <svg
        viewBox={`0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}`}
        className="w-full rounded-lg border border-border bg-surface"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id={`clip-${title.replace(/\s/g, "")}`}>
            <rect x={PADDING} y={0} width={PANEL_WIDTH - 2 * PADDING} height={PANEL_HEIGHT} />
          </clipPath>
        </defs>
        <path
          d={targetPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          opacity={0.5}
          clipPath={`url(#clip-${title.replace(/\s/g, "")})`}
        />
        <path
          d={modelPath}
          fill="none"
          stroke="var(--color-error)"
          strokeWidth="1.5"
          clipPath={`url(#clip-${title.replace(/\s/g, "")})`}
        />
      </svg>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          Error: <span className={`font-mono font-bold ${errorColor}`}>{state.error.toFixed(4)}</span>
        </span>
      </div>
    </div>
  );
}

function initBinary(): number[] {
  return Array.from({ length: N_BINS }, () => (Math.random() > 0.5 ? 1 : 0));
}
function initSteps(): number[] {
  return Array.from({ length: N_BINS }, () => 0.5);
}
function initPoly(): number[] {
  return Array.from({ length: N_POLY }, () => 0);
}

export function ModelComparison() {
  const [binary, setBinary] = useState<ModelState>(() => {
    const params = initBinary();
    return { params, error: mse((x) => binaryModel(params, x)), steps: 0 };
  });
  const [steps, setSteps] = useState<ModelState>(() => {
    const params = initSteps();
    return { params, error: mse((x) => stepModel(params, x)), steps: 0 };
  });
  const [poly, setPoly] = useState<ModelState>(() => {
    const params = initPoly();
    return { params, error: mse((x) => polyModel(params, x)), steps: 0 };
  });
  const [autoRun, setAutoRun] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAutoRun(false);
    const bp = initBinary();
    setBinary({ params: bp, error: mse((x) => binaryModel(bp, x)), steps: 0 });
    const sp = initSteps();
    setSteps({ params: sp, error: mse((x) => stepModel(sp, x)), steps: 0 });
    const pp = initPoly();
    setPoly({ params: pp, error: mse((x) => polyModel(pp, x)), steps: 0 });
  }, []);

  useEffect(() => {
    const timer = timerRef;
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const takeStep = useCallback(() => {
    // Binary: try one mutation
    setBinary((prev) => {
      const candidate = mutateBinary(prev.params);
      const newError = mse((x) => binaryModel(candidate, x));
      if (newError < prev.error) {
        return { params: candidate, error: newError, steps: prev.steps + 1 };
      }
      return { ...prev, steps: prev.steps + 1 };
    });

    // Steps: try one mutation
    setSteps((prev) => {
      const candidate = mutateSteps(prev.params);
      const newError = mse((x) => stepModel(candidate, x));
      if (newError < prev.error) {
        return { params: candidate, error: newError, steps: prev.steps + 1 };
      }
      return { ...prev, steps: prev.steps + 1 };
    });

    // Polynomial: try several mutations, keep best (smooth landscape means more are useful)
    setPoly((prev) => {
      let bestParams = prev.params;
      let bestError = prev.error;
      for (let t = 0; t < 5; t++) {
        const candidate = mutatePoly(prev.params);
        const newError = mse((x) => polyModel(candidate, x));
        if (newError < bestError) {
          bestParams = candidate;
          bestError = newError;
        }
      }
      return { params: bestParams, error: bestError, steps: prev.steps + 1 };
    });
  }, []);

  const takeNSteps = useCallback(
    (n: number) => {
      for (let i = 0; i < n; i++) takeStep();
    },
    [takeStep]
  );

  const toggleAutoRun = useCallback(() => {
    setAutoRun((prev) => {
      if (prev) {
        if (timerRef.current) clearInterval(timerRef.current);
        return false;
      } else {
        timerRef.current = setInterval(() => {
          takeStep();
        }, 50);
        return true;
      }
    });
  }, [takeStep]);

  return (
    <WidgetContainer
      title="Model Comparison"
      description="Three model types try to match the same target curve — watch how model choice affects learning"
      onReset={reset}
    >
      <div className="mb-3 flex items-center gap-3 rounded-lg bg-surface px-3 py-1.5">
        <span className="text-xs font-medium text-muted">
          Steps: <span className="font-mono font-bold text-foreground">{binary.steps}</span>
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ModelPanel
          title="Binary (8 bits)"
          modelFn={binaryModel}
          state={binary}
        />
        <ModelPanel
          title="Step function (8 steps)"
          modelFn={stepModel}
          state={steps}
        />
        <ModelPanel
          title="Polynomial (8 coeffs)"
          modelFn={polyModel}
          state={poly}
        />
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-accent opacity-50"></span> Target
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-error"></span> Model
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => takeStep()}
          disabled={autoRun}
          className="rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          Take 1 step
        </button>
        <button
          onClick={() => takeNSteps(10)}
          disabled={autoRun}
          className="rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          Take 10 steps
        </button>
        <button
          onClick={toggleAutoRun}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            autoRun
              ? "bg-error/10 text-error hover:bg-error/20"
              : "bg-accent/10 text-accent hover:bg-accent/20"
          }`}
        >
          {autoRun ? "Stop" : "Auto-run"}
        </button>
      </div>
    </WidgetContainer>
  );
}
