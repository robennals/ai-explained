"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";

// --- Constants ---
const SVG_WIDTH = 500;
const SVG_HEIGHT = 400;
const GRID_SIZE = 50;
const COORD_MIN = -1.5;
const COORD_MAX = 1.5;
const COORD_RANGE = COORD_MAX - COORD_MIN;
const MAX_STEPS = 60;
const STEP_DELAY_MS = 80;

// Loss chart dimensions
const CHART_WIDTH = 500;
const CHART_HEIGHT = 120;
const CHART_PAD = 30;

// --- Loss function ---
// Elliptical quadratic: minimum near (0.3, -0.2)
function loss(x: number, y: number): number {
  return 0.5 * (x - 0.3) ** 2 + 2 * (y + 0.2) ** 2;
}

// Numerical gradient
function gradient(x: number, y: number): [number, number] {
  const h = 0.001;
  const dx = (loss(x + h, y) - loss(x - h, y)) / (2 * h);
  const dy = (loss(x, y + h) - loss(x, y - h)) / (2 * h);
  return [dx, dy];
}

// --- Coordinate mapping ---
function coordToSvg(v: number): number {
  return ((v - COORD_MIN) / COORD_RANGE) * SVG_WIDTH;
}

function svgToCoord(sv: number, size: number): number {
  return COORD_MIN + (sv / size) * COORD_RANGE;
}

// --- Color scale: blue (low loss) to white (high loss) ---
function lossToColor(l: number): string {
  const maxLoss = 5;
  const t = Math.min(l / maxLoss, 1); // 0 = low, 1 = high
  // Interpolate from deep blue to white
  const r = Math.round(30 + t * 225);
  const g = Math.round(60 + t * 195);
  const b_ch = Math.round(180 + t * 75);
  return `rgb(${r},${g},${b_ch})`;
}

// Precompute contour levels
const CONTOUR_LEVELS = [0.05, 0.15, 0.4, 0.8, 1.4, 2.2, 3.2, 4.5];

interface Point {
  x: number;
  y: number;
  loss: number;
}

export function GradientDescentVisualizer() {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [learningRate, setLearningRate] = useState(0.1);
  const [momentum, setMomentum] = useState(false);
  const [path, setPath] = useState<Point[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStartPos(null);
    setPath([]);
    setIsRunning(false);
    setLearningRate(0.1);
    setMomentum(false);
  }, []);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isRunning) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const scaleY = SVG_HEIGHT / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      const x = svgToCoord(sx, SVG_WIDTH);
      const y = svgToCoord(sy, SVG_HEIGHT);

      // Clamp to bounds
      const cx = Math.max(COORD_MIN, Math.min(COORD_MAX, x));
      const cy = Math.max(COORD_MIN, Math.min(COORD_MAX, y));

      setStartPos({ x: cx, y: cy });
      setPath([{ x: cx, y: cy, loss: loss(cx, cy) }]);
    },
    [isRunning],
  );

  const handleRun = useCallback(() => {
    if (!startPos || isRunning) return;
    setIsRunning(true);

    let cx = startPos.x;
    let cy = startPos.y;
    let vx = 0;
    let vy = 0;
    const beta = 0.9;
    const useMomentum = momentum;
    const lr = learningRate;
    const steps: Point[] = [{ x: cx, y: cy, loss: loss(cx, cy) }];
    let step = 0;

    function tick() {
      if (step >= MAX_STEPS) {
        setIsRunning(false);
        return;
      }

      const [dx, dy] = gradient(cx, cy);

      if (useMomentum) {
        vx = beta * vx + dx;
        vy = beta * vy + dy;
        cx -= lr * vx;
        cy -= lr * vy;
      } else {
        cx -= lr * dx;
        cy -= lr * dy;
      }

      step++;
      const currentLoss = loss(cx, cy);
      steps.push({ x: cx, y: cy, loss: currentLoss });
      setPath([...steps]);

      // Stop if diverged way out of bounds
      if (Math.abs(cx) > 10 || Math.abs(cy) > 10 || currentLoss > 100) {
        setIsRunning(false);
        return;
      }

      timerRef.current = setTimeout(tick, STEP_DELAY_MS);
    }

    timerRef.current = setTimeout(tick, STEP_DELAY_MS);
  }, [startPos, isRunning, momentum, learningRate]);

  // Precompute heatmap grid
  const heatmapRects = useMemo(() => {
    const rects: { x: number; y: number; color: string }[] = [];
    const cellW = SVG_WIDTH / GRID_SIZE;
    const cellH = SVG_HEIGHT / GRID_SIZE;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const px = COORD_MIN + (i + 0.5) * (COORD_RANGE / GRID_SIZE);
        const py = COORD_MIN + (j + 0.5) * (COORD_RANGE / GRID_SIZE);
        const l = loss(px, py);
        rects.push({
          x: i * cellW,
          y: j * cellH,
          color: lossToColor(l),
        });
      }
    }
    return { rects, cellW, cellH };
  }, []);

  // Contour ellipses: for loss = 0.5*(x-0.3)^2 + 2*(y+0.2)^2 = L
  // Ellipse centered at (0.3, -0.2), semi-axes: a = sqrt(2L), b = sqrt(L/2)
  const contourEllipses = useMemo(() => {
    return CONTOUR_LEVELS.map((level) => ({
      level,
      cx: coordToSvg(0.3),
      cy: coordToSvg(-0.2),
      rx: (Math.sqrt(2 * level) / COORD_RANGE) * SVG_WIDTH,
      ry: (Math.sqrt(level / 2) / COORD_RANGE) * SVG_HEIGHT,
    }));
  }, []);

  // Build descent path SVG
  const pathD = useMemo(() => {
    if (path.length < 2) return "";
    return path
      .map((p, i) => {
        const sx = coordToSvg(p.x);
        const sy = coordToSvg(p.y);
        return `${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`;
      })
      .join(" ");
  }, [path]);

  // Loss chart
  const lossChartPath = useMemo(() => {
    if (path.length < 2) return "";
    const maxLossInPath = Math.max(...path.map((p) => p.loss), 0.01);
    const xScale = (CHART_WIDTH - 2 * CHART_PAD) / Math.max(path.length - 1, 1);
    return path
      .map((p, i) => {
        const cx = CHART_PAD + i * xScale;
        const cy =
          CHART_HEIGHT -
          CHART_PAD -
          (Math.min(p.loss, maxLossInPath) / maxLossInPath) *
            (CHART_HEIGHT - 2 * CHART_PAD);
        return `${i === 0 ? "M" : "L"}${cx.toFixed(1)},${cy.toFixed(1)}`;
      })
      .join(" ");
  }, [path]);

  const maxLossInPath = useMemo(() => {
    if (path.length === 0) return 0;
    return Math.max(...path.map((p) => p.loss), 0.01);
  }, [path]);

  const currentLoss = path.length > 0 ? path[path.length - 1].loss : null;

  return (
    <WidgetContainer
      title="Gradient Descent Playground"
      description="Click to place a ball, adjust the learning rate, and watch gradient descent navigate the loss landscape"
      onReset={handleReset}
    >
      {/* Current loss display */}
      {currentLoss !== null && (
        <div className="mb-3 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5">
            <span className="text-xs font-medium text-muted">Loss:</span>
            <span
              className={`font-mono text-sm font-bold ${
                currentLoss < 0.01
                  ? "text-success"
                  : currentLoss < 0.5
                    ? "text-warning"
                    : "text-error"
              }`}
            >
              {currentLoss.toFixed(4)}
            </span>
          </div>
          {path.length > 1 && (
            <span className="text-xs text-muted">
              Step {path.length - 1}/{MAX_STEPS}
            </span>
          )}
        </div>
      )}

      {/* Loss landscape */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="mb-4 w-full cursor-crosshair rounded-lg border border-border"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleSvgClick}
      >
        {/* Heatmap grid */}
        {heatmapRects.rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={heatmapRects.cellW + 0.5}
            height={heatmapRects.cellH + 0.5}
            fill={r.color}
          />
        ))}

        {/* Contour lines */}
        {contourEllipses.map((e, i) => (
          <ellipse
            key={i}
            cx={e.cx}
            cy={e.cy}
            rx={e.rx}
            ry={e.ry}
            fill="none"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
          />
        ))}

        {/* Minimum marker */}
        <circle
          cx={coordToSvg(0.3)}
          cy={coordToSvg(-0.2)}
          r="4"
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1.5"
        />
        <circle
          cx={coordToSvg(0.3)}
          cy={coordToSvg(-0.2)}
          r="1.5"
          fill="rgba(0,0,0,0.3)"
        />

        {/* Gradient descent path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Step dots */}
        {path.map((p, i) => {
          const sx = coordToSvg(p.x);
          const sy = coordToSvg(p.y);
          // Only show within viewable range
          if (sx < -20 || sx > SVG_WIDTH + 20 || sy < -20 || sy > SVG_HEIGHT + 20)
            return null;
          return (
            <circle
              key={i}
              cx={sx}
              cy={sy}
              r={i === 0 ? 5 : 2.5}
              fill={i === 0 ? "white" : "#22c55e"}
              stroke={i === 0 ? "#22c55e" : "none"}
              strokeWidth={i === 0 ? 2 : 0}
            />
          );
        })}
      </svg>

      {/* Controls */}
      <div className="mb-4 space-y-3 rounded-lg bg-surface p-3">
        <SliderControl
          label="Learning rate"
          value={learningRate}
          min={0.001}
          max={2.0}
          step={0.001}
          onChange={setLearningRate}
          formatValue={(v) => v.toFixed(3)}
        />
        <div className="flex items-center justify-between">
          <ToggleControl
            label="Momentum (β=0.9)"
            checked={momentum}
            onChange={setMomentum}
          />
          <button
            onClick={handleRun}
            disabled={!startPos || isRunning}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              !startPos || isRunning
                ? "cursor-not-allowed bg-foreground/5 text-muted"
                : "bg-accent px-4 py-1.5 text-white hover:bg-accent-dark"
            }`}
          >
            {isRunning ? "Running..." : !startPos ? "Click landscape first" : "Run"}
          </button>
        </div>
      </div>

      {/* Loss over steps chart */}
      {path.length > 1 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">
            Loss over steps
          </span>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full rounded-lg border border-border bg-surface"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Y-axis labels */}
            <text
              x={CHART_PAD - 4}
              y={CHART_PAD + 4}
              fill="currentColor"
              fontSize="9"
              textAnchor="end"
              opacity={0.4}
            >
              {maxLossInPath.toFixed(2)}
            </text>
            <text
              x={CHART_PAD - 4}
              y={CHART_HEIGHT - CHART_PAD + 4}
              fill="currentColor"
              fontSize="9"
              textAnchor="end"
              opacity={0.4}
            >
              0
            </text>

            {/* X-axis label */}
            <text
              x={CHART_WIDTH - CHART_PAD}
              y={CHART_HEIGHT - CHART_PAD + 16}
              fill="currentColor"
              fontSize="9"
              textAnchor="end"
              opacity={0.4}
            >
              Steps
            </text>

            {/* Axis lines */}
            <line
              x1={CHART_PAD}
              y1={CHART_PAD}
              x2={CHART_PAD}
              y2={CHART_HEIGHT - CHART_PAD}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <line
              x1={CHART_PAD}
              y1={CHART_HEIGHT - CHART_PAD}
              x2={CHART_WIDTH - CHART_PAD}
              y2={CHART_HEIGHT - CHART_PAD}
              stroke="currentColor"
              strokeOpacity={0.1}
            />

            {/* Loss curve */}
            <path
              d={lossChartPath}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </WidgetContainer>
  );
}
