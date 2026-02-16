"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

// Target function: a cubic the kid CAN match exactly
function targetFn(x: number): number {
  return 0.2 + 0.7 * x - 0.15 * x * x - 0.25 * x * x * x;
}

// Model: polynomial y = a + b*x + c*x^2 + d*x^3
function modelFn(x: number, a: number, b: number, c: number, d: number): number {
  return a + b * x + c * x * x + d * x * x * x;
}

// Exact coefficients for the target curve
const BEST_FIT = { a: 0.2, b: 0.7, c: -0.15, d: -0.25 };
const X_MIN = -2;
const X_MAX = 2;
const SAMPLE_COUNT = 100;
const SVG_WIDTH = 500;
const SVG_HEIGHT = 300;
const PADDING = 30;

// Fixed Y range based on target function + generous margin for the model
const Y_MIN = -2;
const Y_MAX = 2;

function xToSvg(x: number): number {
  return PADDING + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_WIDTH - 2 * PADDING);
}

function yToSvg(y: number): number {
  return (
    SVG_HEIGHT -
    PADDING -
    ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_HEIGHT - 2 * PADDING)
  );
}

function generatePath(fn: (x: number) => number): string {
  const points: string[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const x = X_MIN + (i / SAMPLE_COUNT) * (X_MAX - X_MIN);
    const y = fn(x);
    const sx = xToSvg(x);
    const sy = yToSvg(y);
    points.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
  }
  return points.join(" ");
}

export function ParameterPlayground() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(0);

  const resetParams = useCallback(() => {
    setA(0);
    setB(0);
    setC(0);
    setD(0);
  }, []);

  const { targetPath, modelPath, error } = useMemo(() => {
    const tPath = generatePath(targetFn);
    const mPath = generatePath((x) => modelFn(x, a, b, c, d));

    // Mean squared error
    let mse = 0;
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const x = X_MIN + (i / SAMPLE_COUNT) * (X_MAX - X_MIN);
      const diff = targetFn(x) - modelFn(x, a, b, c, d);
      mse += diff * diff;
    }
    mse /= SAMPLE_COUNT + 1;

    return { targetPath: tPath, modelPath: mPath, error: mse };
  }, [a, b, c, d]);

  const revealBestFit = () => {
    setA(BEST_FIT.a);
    setB(BEST_FIT.b);
    setC(BEST_FIT.c);
    setD(BEST_FIT.d);
  };

  return (
    <WidgetContainer
      title="Parameter Playground"
      description="Tune 4 parameters to match the target curve"
      onReset={resetParams}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5">
          <span className="text-xs font-medium text-muted">Error:</span>
          <span
            className={`font-mono text-sm font-bold ${
              error < 0.01
                ? "text-success"
                : error < 0.1
                  ? "text-warning"
                  : "text-error"
            }`}
          >
            {error.toFixed(4)}
          </span>
        </div>
        {error < 0.01 && (
          <span className="text-xs font-medium text-success">Great fit!</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="mb-4 w-full rounded-lg border border-border bg-surface"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={`h-${f}`}
            x1={PADDING}
            y1={PADDING + f * (SVG_HEIGHT - 2 * PADDING)}
            x2={SVG_WIDTH - PADDING}
            y2={PADDING + f * (SVG_HEIGHT - 2 * PADDING)}
            stroke="currentColor"
            strokeOpacity={0.07}
          />
        ))}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={`v-${f}`}
            x1={PADDING + f * (SVG_WIDTH - 2 * PADDING)}
            y1={PADDING}
            x2={PADDING + f * (SVG_WIDTH - 2 * PADDING)}
            y2={SVG_HEIGHT - PADDING}
            stroke="currentColor"
            strokeOpacity={0.07}
          />
        ))}
        {/* Clip path to keep model curve inside the chart area */}
        <defs>
          <clipPath id="chart-area">
            <rect x={PADDING} y={PADDING} width={SVG_WIDTH - 2 * PADDING} height={SVG_HEIGHT - 2 * PADDING} />
          </clipPath>
        </defs>
        {/* Zero line */}
        <line
          x1={PADDING}
          y1={yToSvg(0)}
          x2={SVG_WIDTH - PADDING}
          y2={yToSvg(0)}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="4,4"
        />
        {/* Target curve */}
        <path
          d={targetPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.5}
          clipPath="url(#chart-area)"
        />
        {/* Model curve */}
        <path
          d={modelPath}
          fill="none"
          stroke="var(--color-error)"
          strokeWidth="2"
          strokeLinecap="round"
          clipPath="url(#chart-area)"
        />
        {/* Legend */}
        <line
          x1={SVG_WIDTH - 140}
          y1={20}
          x2={SVG_WIDTH - 120}
          y2={20}
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          opacity={0.5}
        />
        <text
          x={SVG_WIDTH - 115}
          y={24}
          fill="currentColor"
          fontSize="11"
          opacity={0.6}
        >
          Target
        </text>
        <line
          x1={SVG_WIDTH - 140}
          y1={36}
          x2={SVG_WIDTH - 120}
          y2={36}
          stroke="var(--color-error)"
          strokeWidth="2"
        />
        <text
          x={SVG_WIDTH - 115}
          y={40}
          fill="currentColor"
          fontSize="11"
          opacity={0.6}
        >
          Your model
        </text>
      </svg>

      <div className="mb-3 rounded-lg bg-surface p-3">
        <p className="mb-2 font-mono text-xs text-muted">
          y = <strong>a</strong> + <strong>b</strong>&middot;x +{" "}
          <strong>c</strong>&middot;x&sup2; + <strong>d</strong>&middot;x&sup3;
        </p>
        <div className="space-y-2">
          <SliderControl
            label="a"
            value={a}
            min={-2}
            max={2}
            step={0.01}
            onChange={setA}
          />
          <SliderControl
            label="b"
            value={b}
            min={-2}
            max={2}
            step={0.01}
            onChange={setB}
          />
          <SliderControl
            label="c"
            value={c}
            min={-2}
            max={2}
            step={0.01}
            onChange={setC}
          />
          <SliderControl
            label="d"
            value={d}
            min={-2}
            max={2}
            step={0.01}
            onChange={setD}
          />
        </div>
      </div>

      <button
        onClick={revealBestFit}
        className="rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
      >
        Reveal best fit
      </button>
    </WidgetContainer>
  );
}
