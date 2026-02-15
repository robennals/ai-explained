"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

// --- Layout constants ---
const CHART_WIDTH = 500;
const CHART_HEIGHT = 280;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };
const PLOT_W = CHART_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

const BAR_CHART_WIDTH = 500;
const BAR_CHART_HEIGHT = 120;
const BAR_MARGIN = { top: 10, right: 20, bottom: 30, left: 50 };
const BAR_PLOT_W = BAR_CHART_WIDTH - BAR_MARGIN.left - BAR_MARGIN.right;
const BAR_PLOT_H = BAR_CHART_HEIGHT - BAR_MARGIN.top - BAR_MARGIN.bottom;

// --- Data ---
const TRAIN_POINTS: [number, number][] = [
  [-2.8, -0.2], [-2.4, -0.8], [-2.0, -1.1], [-1.6, -0.8], [-1.2, -0.9],
  [-0.8, -0.6], [-0.4, -0.2], [0.0, 0.3], [0.4, 0.5], [0.8, 0.9],
  [1.2, 1.1], [1.6, 0.8], [2.0, 0.7], [2.4, 0.4],
];

const TEST_POINTS: [number, number][] = [
  [-2.6, -0.5], [-1.0, -0.7], [-0.2, 0.1], [0.6, 0.7], [1.4, 1.0], [2.2, 0.6],
];

const X_MIN = -3.2;
const X_MAX = 2.8;
const Y_MIN = -2.5;
const Y_MAX = 2.5;

function trueFn(x: number): number {
  return Math.sin(x);
}

// --- Linear algebra helpers ---

/** Build Vandermonde matrix: row i has [1, x_i, x_i^2, ..., x_i^(degree)] */
function vandermonde(xs: number[], degree: number): number[][] {
  return xs.map((x) => {
    const row: number[] = [];
    let v = 1;
    for (let d = 0; d <= degree; d++) {
      row.push(v);
      v *= x;
    }
    return row;
  });
}

/** Transpose a matrix */
function transpose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const T: number[][] = Array.from({ length: cols }, () => new Array(rows));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

/** Multiply two matrices */
function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B[0].length;
  const p = B.length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < p; k++) {
      const aik = A[i][k];
      for (let j = 0; j < n; j++) {
        C[i][j] += aik * B[k][j];
      }
    }
  }
  return C;
}

/** Multiply matrix by column vector */
function matvec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

/** Solve Ax = b via Gaussian elimination with partial pivoting */
function solve(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Augmented matrix
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }
    if (maxRow !== col) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
    }

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-14) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = Math.abs(M[i][i]) > 1e-14 ? sum / M[i][i] : 0;
  }
  return x;
}

/**
 * Ridge regression: solve (A^T A + lambda * I) w = A^T y
 * Returns polynomial coefficients [w0, w1, ..., w_degree]
 */
function ridgeRegression(
  xs: number[],
  ys: number[],
  degree: number,
  lambda: number,
): number[] {
  const A = vandermonde(xs, degree);
  const AT = transpose(A);
  const ATA = matmul(AT, A);
  const ATy = matvec(AT, ys);

  // Add lambda to diagonal
  for (let i = 0; i < ATA.length; i++) {
    ATA[i][i] += lambda;
  }

  return solve(ATA, ATy);
}

/** Evaluate polynomial at x given coefficients */
function evalPoly(coeffs: number[], x: number): number {
  let result = 0;
  let xPow = 1;
  for (const c of coeffs) {
    result += c * xPow;
    xPow *= x;
  }
  return result;
}

/** Mean squared error */
function mse(
  xs: number[],
  ys: number[],
  coeffs: number[],
): number {
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    const diff = ys[i] - evalPoly(coeffs, xs[i]);
    sum += diff * diff;
  }
  return sum / xs.length;
}

// --- Coordinate transforms ---
function toSvgX(x: number): number {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function toSvgY(y: number): number {
  return PLOT_H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

const CURVE_STEPS = 200;

export function RegularizationSlider() {
  const [complexity, setComplexity] = useState(12);
  const [lambda, setLambda] = useState(0);

  const handleReset = useCallback(() => {
    setComplexity(12);
    setLambda(0);
  }, []);

  const trainXs = useMemo(() => TRAIN_POINTS.map(([x]) => x), []);
  const trainYs = useMemo(() => TRAIN_POINTS.map(([, y]) => y), []);
  const testXs = useMemo(() => TEST_POINTS.map(([x]) => x), []);
  const testYs = useMemo(() => TEST_POINTS.map(([, y]) => y), []);

  const coeffs = useMemo(
    () => ridgeRegression(trainXs, trainYs, complexity, lambda),
    [trainXs, trainYs, complexity, lambda],
  );

  const trainLoss = useMemo(() => mse(trainXs, trainYs, coeffs), [trainXs, trainYs, coeffs]);
  const testLoss = useMemo(() => mse(testXs, testYs, coeffs), [testXs, testYs, coeffs]);

  // Build fitted curve path
  const fittedPath = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i <= CURVE_STEPS; i++) {
      const x = X_MIN + (i / CURVE_STEPS) * (X_MAX - X_MIN);
      const y = evalPoly(coeffs, x);
      const clampedY = Math.max(Y_MIN, Math.min(Y_MAX, y));
      const sx = toSvgX(x);
      const sy = toSvgY(clampedY);
      parts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(2)},${sy.toFixed(2)}`);
    }
    return parts.join(" ");
  }, [coeffs]);

  // Build true function path
  const truePath = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i <= CURVE_STEPS; i++) {
      const x = X_MIN + (i / CURVE_STEPS) * (X_MAX - X_MIN);
      const y = trueFn(x);
      const sx = toSvgX(x);
      const sy = toSvgY(y);
      parts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(2)},${sy.toFixed(2)}`);
    }
    return parts.join(" ");
  }, []);

  // Weight magnitudes for bar chart
  const maxWeight = useMemo(
    () => Math.max(1, ...coeffs.map((c) => Math.abs(c))),
    [coeffs],
  );

  // Y-axis ticks for scatter plot
  const yTicks = [-2, -1, 0, 1, 2];
  const xTicks = [-3, -2, -1, 0, 1, 2];

  return (
    <WidgetContainer
      title="Regularization Explorer"
      description="See how L2 regularization tames overfitting by penalizing large weights"
      onReset={handleReset}
    >
      <div className="space-y-5">
        {/* Sliders */}
        <div className="space-y-3">
          <SliderControl
            label="Complexity"
            value={complexity}
            min={1}
            max={15}
            step={1}
            onChange={setComplexity}
            formatValue={(v) => `${v}`}
          />
          <SliderControl
            label="Reg. (λ)"
            value={lambda}
            min={0}
            max={2}
            step={0.01}
            onChange={setLambda}
            formatValue={(v) => v.toFixed(2)}
          />
        </div>

        {/* Scatter plot with fitted curve */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Horizontal grid lines */}
              {yTicks.map((tick) => {
                const y = toSvgY(tick);
                return (
                  <g key={`y-${tick}`}>
                    <line
                      x1={0} y1={y} x2={PLOT_W} y2={y}
                      stroke="currentColor" strokeOpacity={0.07} strokeWidth={1}
                    />
                    <text
                      x={-8} y={y}
                      textAnchor="end" dominantBaseline="middle"
                      className="fill-muted" fontSize={10}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* X-axis ticks */}
              {xTicks.map((tick) => {
                const x = toSvgX(tick);
                return (
                  <g key={`x-${tick}`}>
                    <line
                      x1={x} y1={PLOT_H} x2={x} y2={PLOT_H + 5}
                      stroke="currentColor" strokeOpacity={0.2} strokeWidth={1}
                    />
                    <text
                      x={x} y={PLOT_H + 18}
                      textAnchor="middle" className="fill-muted" fontSize={10}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Axis labels */}
              <text
                x={PLOT_W / 2} y={PLOT_H + 34}
                textAnchor="middle" className="fill-muted" fontSize={11} fontWeight={500}
              >
                x
              </text>
              <text
                x={-PLOT_H / 2} y={-36}
                textAnchor="middle" className="fill-muted" fontSize={11} fontWeight={500}
                transform="rotate(-90)"
              >
                y
              </text>

              {/* Axes */}
              <line
                x1={0} y1={0} x2={0} y2={PLOT_H}
                stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
              />
              <line
                x1={0} y1={PLOT_H} x2={PLOT_W} y2={PLOT_H}
                stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
              />

              {/* True function (faint dashed) */}
              <path
                d={truePath}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />

              {/* Fitted curve */}
              <path
                d={fittedPath}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                strokeLinejoin="round"
              />

              {/* Training points (blue) */}
              {TRAIN_POINTS.map(([x, y], i) => (
                <circle
                  key={`train-${i}`}
                  cx={toSvgX(x)}
                  cy={toSvgY(y)}
                  r={4}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}

              {/* Test points (orange) */}
              {TEST_POINTS.map(([x, y], i) => (
                <circle
                  key={`test-${i}`}
                  cx={toSvgX(x)}
                  cy={toSvgY(y)}
                  r={4}
                  fill="#f97316"
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}

              {/* Legend */}
              <g transform={`translate(${PLOT_W - 150}, 4)`}>
                <rect
                  x={-6} y={-4} width={156} height={56} rx={4}
                  fill="white" fillOpacity={0.85}
                  stroke="currentColor" strokeOpacity={0.1}
                />
                <circle cx={6} cy={8} r={4} fill="#3b82f6" />
                <text x={16} y={12} fontSize={10} className="fill-foreground">
                  Training data
                </text>
                <circle cx={6} cy={24} r={4} fill="#f97316" />
                <text x={16} y={28} fontSize={10} className="fill-foreground">
                  Test data
                </text>
                <line
                  x1={0} y1={40} x2={12} y2={40}
                  stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5}
                  strokeDasharray="4,3"
                />
                <text x={16} y={44} fontSize={10} className="fill-foreground">
                  True function (sin x)
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Weight magnitude bar chart */}
        <div>
          <div className="mb-1 text-xs font-medium text-muted">
            Coefficient magnitudes
          </div>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${BAR_CHART_WIDTH} ${BAR_CHART_HEIGHT}`}
              className="w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform={`translate(${BAR_MARGIN.left},${BAR_MARGIN.top})`}>
                {/* Baseline */}
                <line
                  x1={0} y1={BAR_PLOT_H} x2={BAR_PLOT_W} y2={BAR_PLOT_H}
                  stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
                />

                {/* Y-axis label */}
                <text
                  x={-8} y={0}
                  textAnchor="end" dominantBaseline="hanging"
                  className="fill-muted" fontSize={9}
                >
                  |w|
                </text>

                {/* Max magnitude reference line */}
                <line
                  x1={0} y1={0} x2={BAR_PLOT_W} y2={0}
                  stroke="currentColor" strokeOpacity={0.05} strokeWidth={1}
                />
                <text
                  x={-8} y={0}
                  textAnchor="end" dominantBaseline="middle"
                  className="fill-muted" fontSize={8}
                >
                  {maxWeight > 100 ? maxWeight.toExponential(0) : maxWeight.toFixed(1)}
                </text>

                {/* Bars */}
                {coeffs.map((c, i) => {
                  const barWidth = Math.max(
                    1,
                    (BAR_PLOT_W / (complexity + 1)) * 0.7,
                  );
                  const gap = BAR_PLOT_W / (complexity + 1);
                  const x = i * gap + (gap - barWidth) / 2;
                  const magnitude = Math.abs(c);
                  const normalizedH = maxWeight > 0
                    ? (magnitude / maxWeight) * BAR_PLOT_H
                    : 0;
                  const barH = Math.max(0.5, Math.min(normalizedH, BAR_PLOT_H));

                  // Color: interpolate from blue (small) to red (large)
                  const t = maxWeight > 0 ? magnitude / maxWeight : 0;
                  const r = Math.round(59 + t * (220 - 59));
                  const g = Math.round(130 + t * (38 - 130));
                  const b = Math.round(246 + t * (38 - 246));

                  return (
                    <g key={`bar-${i}`}>
                      <rect
                        x={x}
                        y={BAR_PLOT_H - barH}
                        width={barWidth}
                        height={barH}
                        fill={`rgb(${r},${g},${b})`}
                        rx={1}
                      />
                      <text
                        x={x + barWidth / 2}
                        y={BAR_PLOT_H + 12}
                        textAnchor="middle"
                        className="fill-muted"
                        fontSize={8}
                      >
                        {i === 0
                          ? "x\u2070"
                          : i === 1
                            ? "x\u00b9"
                            : i === 2
                              ? "x\u00b2"
                              : i === 3
                                ? "x\u00b3"
                                : `x${superscript(i)}`}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Loss display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Training Loss
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-blue-600">
              {trainLoss > 99 ? trainLoss.toExponential(1) : trainLoss.toFixed(4)}
            </div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              Test Loss
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-orange-600">
              {testLoss > 99 ? testLoss.toExponential(1) : testLoss.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="rounded-lg bg-accent/5 p-3">
          <p className="text-xs leading-relaxed text-foreground/70">
            <strong>Key insight:</strong> Without regularization, high-degree
            polynomials produce enormous coefficients that chase every noise
            point perfectly (low train loss) but generalize terribly (high test
            loss). Adding L2 regularization penalizes large weights, forcing the
            model to find simpler, smoother solutions — even when given the
            freedom of many parameters.
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}

/** Convert a number to Unicode superscript characters */
function superscript(n: number): string {
  const digits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  return String(n)
    .split("")
    .map((d) => digits[parseInt(d, 10)])
    .join("");
}
