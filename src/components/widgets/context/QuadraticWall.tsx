"use client";

import { useMemo, useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { pairwiseComparisons, linearReference, formatCount } from "./cost";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const MIN_WORDS = 1;
const MAX_WORDS = 1_000_000;
const LOG_MIN = Math.log10(MIN_WORDS);
const LOG_MAX = Math.log10(MAX_WORDS);
const PER_TOKEN = 2048;
const DEFAULT_WORDS = 100;

function sliderToWords(pos: number): number {
  const log = LOG_MIN + (pos / 100) * (LOG_MAX - LOG_MIN);
  return Math.round(Math.pow(10, log));
}

function wordsToSlider(words: number): number {
  const log = Math.log10(Math.max(words, MIN_WORDS));
  return ((log - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
}

/* ------------------------------------------------------------------ */
/*  Chart geometry — log/log plot of both curves across the full      */
/*  range, with a marker at the current word count.                   */
/* ------------------------------------------------------------------ */

const CHART_WIDTH = 600;
const CHART_HEIGHT = 260;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 10;

const Y_LOG_MIN = 0; // 10^0 = 1 comparison
const Y_LOG_MAX = 2 * LOG_MAX; // n^2 at n = MAX_WORDS

function xForWords(words: number): number {
  const t = (Math.log10(words) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return PAD_LEFT + t * (CHART_WIDTH - PAD_LEFT - PAD_RIGHT);
}

function yForValue(value: number): number {
  const logV = Math.log10(Math.max(value, 1));
  const t = (logV - Y_LOG_MIN) / (Y_LOG_MAX - Y_LOG_MIN);
  return CHART_HEIGHT - PAD_BOTTOM - t * (CHART_HEIGHT - PAD_TOP - PAD_BOTTOM);
}

const SAMPLE_COUNT = 60;
const SAMPLES = Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) => {
  const log = LOG_MIN + (i / SAMPLE_COUNT) * (LOG_MAX - LOG_MIN);
  return Math.pow(10, log);
});

function pathFor(fn: (n: number) => number): string {
  return SAMPLES.map((n, i) => {
    const x = xForWords(n);
    const y = yForValue(fn(n));
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

const QUADRATIC_PATH = pathFor((n) => pairwiseComparisons(n));
const LINEAR_PATH = pathFor((n) => linearReference(n, PER_TOKEN));

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function QuadraticWall() {
  const [sliderPos, setSliderPos] = useState(wordsToSlider(DEFAULT_WORDS));

  const words = useMemo(() => sliderToWords(sliderPos), [sliderPos]);
  const quadratic = pairwiseComparisons(words);
  const linear = linearReference(words, PER_TOKEN);

  const handleReset = useCallback(() => {
    setSliderPos(wordsToSlider(DEFAULT_WORDS));
  }, []);

  const markerX = xForWords(words);
  const markerYQuadratic = yForValue(quadratic);
  const markerYLinear = yForValue(linear);

  return (
    <WidgetContainer
      title="The cost of looking at everything"
      description="Full attention compares every word to every other word."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        {/* Slider + current length */}
        <div className="flex flex-col gap-2">
          <SliderControl
            label="Words in context"
            value={sliderPos}
            min={0}
            max={100}
            step={0.1}
            onChange={setSliderPos}
            formatValue={() => formatCount(words)}
          />
          <p className="text-center font-mono text-3xl font-bold text-foreground">
            {formatCount(words)} <span className="text-sm font-medium text-muted">words</span>
          </p>
        </div>

        {/* Big number read-outs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-error">
              Full attention
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-error">
              {formatCount(quadratic)}
            </p>
            <p className="mt-0.5 text-xs text-muted">comparisons</p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Growing in a straight line
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-accent">
              {formatCount(linear)}
            </p>
            <p className="mt-0.5 text-xs text-muted">comparisons</p>
          </div>
        </div>

        {/* Chart: log-log plot of both curves, current position marked */}
        <div className="rounded-lg border border-border bg-surface p-3">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-56 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label="Chart comparing full attention cost against a linear reference as context length grows"
          >
            {/* y gridlines with big axis labels */}
            {[0, 3, 6, 9, 12].map((exp) => {
              const y = yForValue(Math.pow(10, exp));
              return (
                <g key={exp}>
                  <line
                    x1={PAD_LEFT}
                    x2={CHART_WIDTH - PAD_RIGHT}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-foreground/10"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_LEFT + 4}
                    y={y - 4}
                    className="fill-muted"
                    fontSize={12}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {formatCount(Math.pow(10, exp))}
                  </text>
                </g>
              );
            })}

            {/* Linear reference curve */}
            <path
              d={LINEAR_PATH}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={3}
            />
            {/* Quadratic curve — the wall */}
            <path
              d={QUADRATIC_PATH}
              fill="none"
              stroke="var(--color-error)"
              strokeWidth={3}
            />

            {/* Current position marker */}
            <line
              x1={markerX}
              x2={markerX}
              y1={PAD_TOP}
              y2={CHART_HEIGHT - PAD_BOTTOM}
              stroke="currentColor"
              className="text-foreground/25"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <circle cx={markerX} cy={markerYQuadratic} r={5} fill="var(--color-error)" />
            <circle cx={markerX} cy={markerYLinear} r={5} fill="var(--color-accent)" />
          </svg>
          <p className="mt-1 text-center text-xs text-muted">
            Comparisons needed, from {formatCount(MIN_WORDS)} to {formatCount(MAX_WORDS)} words
            (log scale — each gridline is 1,000&times; the one below it)
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
