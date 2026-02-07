"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_WIDTH = 260;
const SVG_HEIGHT = 180;
const PADDING = 28;

// Plot range
const X_MIN = -2;
const X_MAX = 4;
const Y_MIN = -8;
const Y_MAX = 10;

// Target function: y = 2x − 3
const TARGET_A = 2;
const TARGET_B = -3;

// Word numbers for parsing
const WORD_TO_NUM: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// Parse "times <number> plus/minus <number>" → { a, b } or null
function parseExpression(text: string): { a: number; b: number } | null {
  let s = text.trim().toLowerCase();

  for (const [word, num] of Object.entries(WORD_TO_NUM)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, "g"), String(num));
  }

  const m = s.match(/times\s+(-?[\d.]+)\s+(plus|minus)\s+(-?[\d.]+)/);
  if (!m) return null;

  const a = parseFloat(m[1]);
  const sign = m[2] === "plus" ? 1 : -1;
  const b = sign * parseFloat(m[3]);
  if (isNaN(a) || isNaN(b)) return null;
  return { a, b };
}

// Mean squared error over the plotted range
function computeError(a: number, b: number): number {
  let sum = 0;
  const n = 50;
  for (let i = 0; i <= n; i++) {
    const x = X_MIN + (X_MAX - X_MIN) * (i / n);
    const diff = (a * x + b) - (TARGET_A * x + TARGET_B);
    sum += diff * diff;
  }
  return sum / (n + 1);
}

// SVG coordinate helpers
function xToSvg(x: number): number {
  return PADDING + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_WIDTH - 2 * PADDING);
}
function yToSvg(y: number): number {
  return SVG_HEIGHT - PADDING - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_HEIGHT - 2 * PADDING);
}

function linePath(a: number, b: number): string {
  const pts: string[] = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + (X_MAX - X_MIN) * (i / steps);
    const y = Math.max(Y_MIN - 1, Math.min(Y_MAX + 1, a * x + b));
    pts.push(`${i === 0 ? "M" : "L"}${xToSvg(x).toFixed(1)},${yToSvg(y).toFixed(1)}`);
  }
  return pts.join(" ");
}

function Graph({
  currentA,
  currentB,
  valid,
}: {
  currentA: number | null;
  currentB: number | null;
  valid: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full rounded-lg border border-border bg-surface"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Axes */}
      <line
        x1={xToSvg(X_MIN)} y1={yToSvg(0)}
        x2={xToSvg(X_MAX)} y2={yToSvg(0)}
        stroke="currentColor" strokeWidth="1" opacity={0.15}
      />
      <line
        x1={xToSvg(0)} y1={yToSvg(Y_MIN)}
        x2={xToSvg(0)} y2={yToSvg(Y_MAX)}
        stroke="currentColor" strokeWidth="1" opacity={0.15}
      />

      {/* Target line (dashed) */}
      <path
        d={linePath(TARGET_A, TARGET_B)}
        fill="none"
        stroke="var(--color-success)"
        strokeWidth="2"
        strokeDasharray="6,3"
      />

      {/* Current line */}
      {valid && currentA !== null && currentB !== null && (
        <path
          d={linePath(currentA, currentB)}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
        />
      )}

      {/* Legend */}
      <line x1={SVG_WIDTH - 85} y1={14} x2={SVG_WIDTH - 65} y2={14}
        stroke="var(--color-success)" strokeWidth="2" strokeDasharray="4,2" />
      <text x={SVG_WIDTH - 62} y={17} fontSize="9" fill="currentColor" opacity={0.5}>
        Target
      </text>
      <line x1={SVG_WIDTH - 85} y1={26} x2={SVG_WIDTH - 65} y2={26}
        stroke="var(--color-accent)" strokeWidth="2" />
      <text x={SVG_WIDTH - 62} y={29} fontSize="9" fill="currentColor" opacity={0.5}>
        Yours
      </text>
    </svg>
  );
}

function formatFn(a: number, b: number, decimals = 0): string {
  const aStr = decimals > 0 ? a.toFixed(decimals) : String(a);
  const sign = b >= 0 ? "+" : "\u2212";
  const bStr = decimals > 0 ? Math.abs(b).toFixed(decimals) : String(Math.abs(b));
  return `y = ${aStr}x ${sign} ${bStr}`;
}

export function ModelComparison() {
  // Text mode
  const [text, setText] = useState("times four plus two");
  const parsed = parseExpression(text);
  const textError = parsed ? computeError(parsed.a, parsed.b) : null;

  // Slider mode
  const [sliderA, setSliderA] = useState(4);
  const [sliderB, setSliderB] = useState(2);
  const sliderError = computeError(sliderA, sliderB);

  const reset = useCallback(() => {
    setText("times four plus two");
    setSliderA(4);
    setSliderB(2);
  }, []);

  return (
    <WidgetContainer
      title="Text vs. Sliders: Why Representation Matters"
      description={`Match the dashed target line: ${formatFn(TARGET_A, TARGET_B)}`}
      onReset={reset}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* ── Text mode ── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-foreground">
            Edit text (non-smooth)
          </span>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-foreground dark:bg-gray-900"
            spellCheck={false}
          />

          <div className="flex items-center gap-2 text-xs text-muted min-h-[20px]">
            {parsed ? (
              <>
                <span>{formatFn(parsed.a, parsed.b)}</span>
                <span className="ml-auto">
                  Error:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {textError!.toFixed(2)}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-[var(--color-error)]">
                Can&apos;t parse &mdash; try &ldquo;times 3 minus 1&rdquo;
              </span>
            )}
          </div>

          {textError !== null && textError < 0.05 && (
            <span className="text-xs font-bold text-success">Matched!</span>
          )}

          <Graph
            currentA={parsed?.a ?? null}
            currentB={parsed?.b ?? null}
            valid={parsed !== null}
          />
        </div>

        {/* ── Slider mode ── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-foreground">
            Drag sliders (smooth)
          </span>

          <div className="flex flex-col gap-2 rounded-md border border-border bg-white px-3 py-2.5 dark:bg-gray-900">
            <label className="flex items-center gap-2 text-xs text-muted">
              <span className="w-14 shrink-0 font-medium">Multiply</span>
              <input
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={sliderA}
                onChange={(e) => setSliderA(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-sm font-bold text-foreground">
                {sliderA.toFixed(1)}
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <span className="w-14 shrink-0 font-medium">Add</span>
              <input
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={sliderB}
                onChange={(e) => setSliderB(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-sm font-bold text-foreground">
                {sliderB.toFixed(1)}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted min-h-[20px]">
            <span>{formatFn(sliderA, sliderB, 1)}</span>
            <span className="ml-auto">
              Error:{" "}
              <span className="font-mono font-bold text-foreground">
                {sliderError.toFixed(2)}
              </span>
            </span>
          </div>

          {sliderError < 0.05 && (
            <span className="text-xs font-bold text-success">Matched!</span>
          )}

          <Graph currentA={sliderA} currentB={sliderB} valid={true} />
        </div>
      </div>
    </WidgetContainer>
  );
}
