"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

// --- Deterministic data generation ---

// Fixed training points (14) and test points (6) sampled from sin(x) + noise
// Pre-generated so the widget is fully reproducible.
const TRAINING_DATA: { x: number; y: number }[] = [
  { x: -2.8, y: -0.10 },
  { x: -2.3, y: -0.58 },
  { x: -1.9, y: -1.15 },
  { x: -1.5, y: -0.82 },
  { x: -1.1, y: -0.72 },
  { x: -0.7, y: -0.84 },
  { x: -0.4, y: -0.20 },
  { x: 0.0, y: 0.15 },
  { x: 0.3, y: 0.45 },
  { x: 0.7, y: 0.49 },
  { x: 1.1, y: 1.10 },
  { x: 1.5, y: 0.80 },
  { x: 2.0, y: 1.12 },
  { x: 2.5, y: 0.42 },
];

const TEST_DATA: { x: number; y: number }[] = [
  { x: -2.5, y: -0.40 },
  { x: -1.2, y: -1.05 },
  { x: -0.1, y: -0.22 },
  { x: 0.9, y: 0.90 },
  { x: 1.7, y: 1.20 },
  { x: 2.3, y: 0.60 },
];

// --- Linear algebra helpers ---

/** Build a Vandermonde matrix: row i = [1, x_i, x_i^2, ..., x_i^degree] */
function vandermonde(xs: number[], degree: number): number[][] {
  return xs.map((x) => {
    const row: number[] = [];
    let val = 1;
    for (let d = 0; d <= degree; d++) {
      row.push(val);
      val *= x;
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
function matMul(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const C: number[][] = Array.from({ length: rowsA }, () =>
    new Array(colsB).fill(0)
  );
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      for (let j = 0; j < colsB; j++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

/** Multiply matrix by column vector, return column vector as flat array */
function matVecMul(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

/**
 * Solve a symmetric positive-definite system Ax = b via Cholesky decomposition.
 * Falls back gracefully if the matrix is near-singular.
 */
function solveSymmetric(A: number[][], b: number[]): number[] {
  const n = A.length;

  // Cholesky: A = L L^T
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        const diag = A[i][i] - sum;
        L[i][j] = diag > 0 ? Math.sqrt(diag) : 1e-10;
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j];
      }
    }
  }

  // Forward substitution: L y = b
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let k = 0; k < i; k++) sum += L[i][k] * y[k];
    y[i] = (b[i] - sum) / L[i][i];
  }

  // Back substitution: L^T x = y
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let k = i + 1; k < n; k++) sum += L[k][i] * x[k];
    x[i] = (y[i] - sum) / L[i][i];
  }

  return x;
}

/**
 * Fit a polynomial of given degree to data points using least-squares.
 * Returns the coefficients [c0, c1, c2, ...] where y = c0 + c1*x + c2*x^2 + ...
 */
function fitPolynomial(
  data: { x: number; y: number }[],
  degree: number
): number[] {
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);

  const A = vandermonde(xs, degree);
  const At = transpose(A);
  const AtA = matMul(At, A);

  // Add small regularization for numerical stability
  const reg = 1e-10;
  for (let i = 0; i < AtA.length; i++) {
    AtA[i][i] += reg;
  }

  const Atb = matVecMul(At, ys);
  return solveSymmetric(AtA, Atb);
}

/** Evaluate polynomial at a given x, clamped to [-5, 5] */
function evalPolynomial(coeffs: number[], x: number): number {
  let val = 0;
  let xPow = 1;
  for (let i = 0; i < coeffs.length; i++) {
    val += coeffs[i] * xPow;
    xPow *= x;
  }
  return Math.max(-5, Math.min(5, val));
}

/** Compute mean squared error */
function mse(
  data: { x: number; y: number }[],
  coeffs: number[]
): number {
  const sum = data.reduce((acc, { x, y }) => {
    const pred = evalPolynomial(coeffs, x);
    return acc + (pred - y) ** 2;
  }, 0);
  return sum / data.length;
}

/** The true underlying function */
function trueFunction(x: number): number {
  return Math.sin(x);
}

// --- SVG chart constants ---

const CHART_WIDTH = 560;
const CHART_HEIGHT = 300;
const CHART_PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

const PLOT_X_MIN = -3.2;
const PLOT_X_MAX = 3.2;
const PLOT_Y_MIN = -2;
const PLOT_Y_MAX = 2;

const COLORS = {
  train: "#3b82f6",
  test: "#f97316",
  curve: "#8b5cf6",
  trueFn: "#9ca3af",
};

function toSvgX(x: number): number {
  const t = (x - PLOT_X_MIN) / (PLOT_X_MAX - PLOT_X_MIN);
  return CHART_PADDING.left + t * (CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right);
}

function toSvgY(y: number): number {
  const t = (y - PLOT_Y_MIN) / (PLOT_Y_MAX - PLOT_Y_MIN);
  return CHART_HEIGHT - CHART_PADDING.bottom - t * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
}

// --- Loss bar chart constants ---

const BAR_WIDTH = 560;

// --- Component ---

export function OverfittingPlayground() {
  const [complexity, setComplexity] = useState(3);

  const handleReset = useCallback(() => {
    setComplexity(3);
  }, []);

  const coeffs = useMemo(
    () => fitPolynomial(TRAINING_DATA, complexity),
    [complexity]
  );

  const trainLoss = useMemo(() => mse(TRAINING_DATA, coeffs), [coeffs]);
  const testLoss = useMemo(() => mse(TEST_DATA, coeffs), [coeffs]);

  // Generate curve path
  const curvePath = useMemo(() => {
    const steps = 200;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = PLOT_X_MIN + (i / steps) * (PLOT_X_MAX - PLOT_X_MIN);
      const y = evalPolynomial(coeffs, x);
      const sx = toSvgX(x);
      const sy = toSvgY(Math.max(PLOT_Y_MIN, Math.min(PLOT_Y_MAX, y)));
      points.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return points.join(" ");
  }, [coeffs]);

  // Generate true function path
  const truePath = useMemo(() => {
    const steps = 200;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = PLOT_X_MIN + (i / steps) * (PLOT_X_MAX - PLOT_X_MIN);
      const y = trueFunction(x);
      const sx = toSvgX(x);
      const sy = toSvgY(y);
      points.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return points.join(" ");
  }, []);

  // Status label
  const statusLabel = useMemo(() => {
    if (complexity <= 1) return "Underfitting";
    if (complexity <= 5) return "Good fit";
    if (complexity <= 9) return "Starting to overfit";
    return "Overfitting!";
  }, [complexity]);

  const statusColor = useMemo(() => {
    if (complexity <= 1) return "#ef4444";
    if (complexity <= 5) return "#22c55e";
    if (complexity <= 9) return "#f59e0b";
    return "#ef4444";
  }, [complexity]);

  // Loss bar chart scaling: cap display at 2.0 for readability
  const maxLossDisplay = 2.0;
  const barAreaWidth = BAR_WIDTH - 120;
  const trainBarWidth = Math.min(trainLoss / maxLossDisplay, 1) * barAreaWidth;
  const testBarWidth = Math.min(testLoss / maxLossDisplay, 1) * barAreaWidth;

  return (
    <WidgetContainer
      title="Overfitting Playground"
      description="Increase model complexity and watch what happens to training vs. test performance"
      onReset={handleReset}
    >
      <div className="space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SliderControl
              label="Complexity"
              value={complexity}
              min={1}
              max={15}
              step={1}
              onChange={setComplexity}
              formatValue={(v) => `${v}`}
            />
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Scatter plot */}
        <div className="overflow-x-auto rounded-lg bg-surface">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full"
            style={{ maxHeight: 320 }}
          >
            {/* Grid lines */}
            {[-1, 0, 1].map((y) => (
              <line
                key={`grid-y-${y}`}
                x1={CHART_PADDING.left}
                y1={toSvgY(y)}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={toSvgY(y)}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
            ))}
            {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
              <line
                key={`grid-x-${x}`}
                x1={toSvgX(x)}
                y1={CHART_PADDING.top}
                x2={toSvgX(x)}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
            ))}

            {/* Axis labels */}
            {[-2, -1, 0, 1, 2].map((y) => (
              <text
                key={`label-y-${y}`}
                x={CHART_PADDING.left - 8}
                y={toSvgY(y) + 4}
                textAnchor="end"
                className="fill-current opacity-30"
                fontSize={10}
              >
                {y}
              </text>
            ))}
            {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
              <text
                key={`label-x-${x}`}
                x={toSvgX(x)}
                y={CHART_HEIGHT - CHART_PADDING.bottom + 16}
                textAnchor="middle"
                className="fill-current opacity-30"
                fontSize={10}
              >
                {x}
              </text>
            ))}

            {/* True function (dashed) */}
            <path
              d={truePath}
              fill="none"
              stroke={COLORS.trueFn}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              opacity={0.5}
            />

            {/* Fitted curve */}
            <path
              d={curvePath}
              fill="none"
              stroke={COLORS.curve}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Test points (draw first so training points appear on top) */}
            {TEST_DATA.map((d, i) => (
              <circle
                key={`test-${i}`}
                cx={toSvgX(d.x)}
                cy={toSvgY(d.y)}
                r={5}
                fill={COLORS.test}
                stroke="white"
                strokeWidth={1.5}
                opacity={0.9}
              />
            ))}

            {/* Training points */}
            {TRAINING_DATA.map((d, i) => (
              <circle
                key={`train-${i}`}
                cx={toSvgX(d.x)}
                cy={toSvgY(d.y)}
                r={5}
                fill={COLORS.train}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 pb-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.train }}
              />
              Training data
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.test }}
              />
              Test data
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.curve }}
              />
              Fitted model
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4"
                style={{
                  backgroundColor: COLORS.trueFn,
                  opacity: 0.5,
                }}
              />
              True function
            </span>
          </div>
        </div>

        {/* Loss bars */}
        <div className="rounded-lg bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Mean Squared Error
          </p>
          <div className="space-y-2.5">
            {/* Training loss bar */}
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right text-xs font-medium text-muted">
                Train
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-foreground/5">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${(trainBarWidth / barAreaWidth) * 100}%`,
                    backgroundColor: COLORS.train,
                    opacity: 0.8,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center font-mono text-[11px] font-bold text-foreground/70">
                  {trainLoss < 0.001 ? "<0.001" : trainLoss.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Test loss bar */}
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right text-xs font-medium text-muted">
                Test
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-foreground/5">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${(testBarWidth / barAreaWidth) * 100}%`,
                    backgroundColor: COLORS.test,
                    opacity: 0.8,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center font-mono text-[11px] font-bold text-foreground/70">
                  {testLoss < 0.001
                    ? "<0.001"
                    : testLoss > 10
                      ? testLoss.toFixed(1)
                      : testLoss.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation text */}
          <div className="mt-3 rounded-lg bg-accent/5 p-3">
            <p className="text-xs leading-relaxed text-foreground/70">
              {complexity <= 1 && (
                <>
                  <strong>Underfitting:</strong> A degree-{complexity} polynomial
                  is too simple to capture the true pattern. Both training and
                  test errors are high.
                </>
              )}
              {complexity > 1 && complexity <= 5 && (
                <>
                  <strong>Good fit:</strong> The model captures the underlying
                  pattern without memorizing noise. Training and test errors are
                  both low.
                </>
              )}
              {complexity > 5 && complexity <= 9 && (
                <>
                  <strong>Caution:</strong> The model is starting to fit the noise
                  in the training data. Notice the test error creeping up while
                  training error keeps dropping.
                </>
              )}
              {complexity > 9 && (
                <>
                  <strong>Overfitting:</strong> The model memorizes every training
                  point (near-zero training error) but performs terribly on unseen
                  test data. The wiggly curve reveals it learned noise, not the
                  true pattern.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
