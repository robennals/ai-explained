"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 400;
const GRID_SIZE = 50;
const STEP_DELAY = 80;
const N_STEPS = 50;
const LEARNING_RATE = 0.05;

// Loss function: elliptical bowl
function lossFn(x: number, y: number): number {
  return (x - 0.3) ** 2 + 2 * (y + 0.2) ** 2;
}

// Range for our coordinate system
const X_MIN = -1;
const X_MAX = 1;
const Y_MIN = -1;
const Y_MAX = 1;

// Max loss for color scaling
const MAX_LOSS = 2.5;

function coordToSvg(cx: number, cy: number): { sx: number; sy: number } {
  const sx = ((cx - X_MIN) / (X_MAX - X_MIN)) * SVG_WIDTH;
  const sy = ((Y_MAX - cy) / (Y_MAX - Y_MIN)) * SVG_HEIGHT; // flip y
  return { sx, sy };
}

function svgToCoord(sx: number, sy: number): { cx: number; cy: number } {
  const cx = X_MIN + (sx / SVG_WIDTH) * (X_MAX - X_MIN);
  const cy = Y_MAX - (sy / SVG_HEIGHT) * (Y_MAX - Y_MIN); // flip y
  return { cx, cy };
}

// Generate heatmap rects
function generateHeatmap(): { x: number; y: number; w: number; h: number; color: string }[] {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const cellW = SVG_WIDTH / GRID_SIZE;
  const cellH = SVG_HEIGHT / GRID_SIZE;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const sx = i * cellW + cellW / 2;
      const sy = j * cellH + cellH / 2;
      const { cx, cy } = svgToCoord(sx, sy);
      const loss = lossFn(cx, cy);
      const t = Math.min(loss / MAX_LOSS, 1);

      // Blue (low loss) to white (high loss)
      const r = Math.round(59 + t * 196);
      const g = Math.round(130 + t * 125);
      const b = Math.round(246 + t * 9);
      const color = `rgb(${r},${g},${b})`;

      rects.push({ x: i * cellW, y: j * cellH, w: cellW + 0.5, h: cellH + 0.5, color });
    }
  }
  return rects;
}

// Numerical gradient
function lossGradient(x: number, y: number): { dx: number; dy: number } {
  const h = 0.001;
  const dx = (lossFn(x + h, y) - lossFn(x - h, y)) / (2 * h);
  const dy = (lossFn(x, y + h) - lossFn(x, y - h)) / (2 * h);
  return { dx, dy };
}

interface PathPoint {
  x: number;
  y: number;
  loss: number;
}

const HEATMAP_DATA = generateHeatmap();

// Generate contour lines
function generateContours(): string[] {
  const levels = [0.05, 0.15, 0.3, 0.5, 0.8, 1.2, 1.8];
  const contours: string[] = [];

  for (const level of levels) {
    // Simple approach: draw ellipse contours for our known function
    // (x - 0.3)^2 + 2(y + 0.2)^2 = level
    // x = 0.3 + sqrt(level) * cos(t)
    // y = -0.2 + sqrt(level/2) * sin(t)
    const pts: string[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const cx = 0.3 + Math.sqrt(level) * Math.cos(t);
      const cy = -0.2 + Math.sqrt(level / 2) * Math.sin(t);
      const { sx, sy } = coordToSvg(cx, cy);
      if (sx < -10 || sx > SVG_WIDTH + 10 || sy < -10 || sy > SVG_HEIGHT + 10) continue;
      pts.push(`${pts.length === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    if (pts.length > 2) {
      contours.push(pts.join(" ") + "Z");
    }
  }
  return contours;
}

const CONTOUR_PATHS = generateContours();

export function GradientVisualization() {
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [randomPath, setRandomPath] = useState<PathPoint[]>([]);
  const [gradientPath, setGradientPath] = useState<PathPoint[]>([]);
  const [randomRunning, setRandomRunning] = useState(false);
  const [gradientRunning, setGradientRunning] = useState(false);
  const [randomSteps, setRandomSteps] = useState(0);
  const [gradientSteps, setGradientSteps] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const randomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gradientTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (randomTimerRef.current) clearInterval(randomTimerRef.current);
    if (gradientTimerRef.current) clearInterval(gradientTimerRef.current);
    setStartPoint(null);
    setRandomPath([]);
    setGradientPath([]);
    setRandomRunning(false);
    setGradientRunning(false);
    setRandomSteps(0);
    setGradientSteps(0);
  }, []);

  useEffect(() => {
    const rTimer = randomTimerRef;
    const gTimer = gradientTimerRef;
    return () => {
      if (rTimer.current) clearInterval(rTimer.current);
      if (gTimer.current) clearInterval(gTimer.current);
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (randomRunning || gradientRunning) return;
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const scaleY = SVG_HEIGHT / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      const { cx, cy } = svgToCoord(sx, sy);

      setStartPoint({ x: cx, y: cy });
      setRandomPath([{ x: cx, y: cy, loss: lossFn(cx, cy) }]);
      setGradientPath([{ x: cx, y: cy, loss: lossFn(cx, cy) }]);
      setRandomSteps(0);
      setGradientSteps(0);
    },
    [randomRunning, gradientRunning]
  );

  const runRandomWalk = useCallback(() => {
    if (!startPoint || randomRunning) return;
    setRandomRunning(true);
    let x = startPoint.x;
    let y = startPoint.y;
    let loss = lossFn(x, y);
    let step = 0;

    // Reset path to start
    setRandomPath([{ x, y, loss }]);
    setRandomSteps(0);

    randomTimerRef.current = setInterval(() => {
      // Random direction
      const angle = Math.random() * 2 * Math.PI;
      const stepSize = 0.05;
      const nx = x + Math.cos(angle) * stepSize;
      const ny = y + Math.sin(angle) * stepSize;
      const newLoss = lossFn(nx, ny);

      if (newLoss < loss) {
        x = nx;
        y = ny;
        loss = newLoss;
      }
      step++;

      setRandomPath((prev) => [...prev, { x, y, loss }]);
      setRandomSteps(step);

      if (step >= N_STEPS) {
        if (randomTimerRef.current) clearInterval(randomTimerRef.current);
        setRandomRunning(false);
      }
    }, STEP_DELAY);
  }, [startPoint, randomRunning]);

  const runGradientDescent = useCallback(() => {
    if (!startPoint || gradientRunning) return;
    setGradientRunning(true);
    let x = startPoint.x;
    let y = startPoint.y;
    let step = 0;

    // Reset path to start
    setGradientPath([{ x, y, loss: lossFn(x, y) }]);
    setGradientSteps(0);

    gradientTimerRef.current = setInterval(() => {
      const { dx, dy } = lossGradient(x, y);
      x = x - LEARNING_RATE * dx;
      y = y - LEARNING_RATE * dy;
      step++;

      setGradientPath((prev) => [...prev, { x, y, loss: lossFn(x, y) }]);
      setGradientSteps(step);

      if (step >= N_STEPS) {
        if (gradientTimerRef.current) clearInterval(gradientTimerRef.current);
        setGradientRunning(false);
      }
    }, STEP_DELAY);
  }, [startPoint, gradientRunning]);

  const randomLoss = randomPath.length > 0 ? randomPath[randomPath.length - 1].loss : null;
  const gradientLoss = gradientPath.length > 0 ? gradientPath[gradientPath.length - 1].loss : null;

  return (
    <WidgetContainer
      title="Gradient Descent vs. Random Walk"
      description="Click to set a starting point, then compare random walk vs. gradient descent"
      onReset={reset}
    >
      {/* Stats */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
          <span className="text-muted">
            Random: {randomSteps} steps
            {randomLoss !== null && (
              <span className="ml-1 font-mono font-bold text-foreground">
                (loss: {randomLoss.toFixed(4)})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-muted">
            Gradient: {gradientSteps} steps
            {gradientLoss !== null && (
              <span className="ml-1 font-mono font-bold text-foreground">
                (loss: {gradientLoss.toFixed(4)})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="mb-3 w-full cursor-crosshair rounded-lg border border-border"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleClick}
      >
        {/* Heatmap */}
        {HEATMAP_DATA.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={r.color}
          />
        ))}

        {/* Contour lines */}
        {CONTOUR_PATHS.map((d, i) => (
          <path
            key={`c-${i}`}
            d={d}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Random walk path */}
        {randomPath.map((p, i) =>
          i > 0 ? (
            <line
              key={`rp-${i}`}
              x1={coordToSvg(randomPath[i - 1].x, randomPath[i - 1].y).sx}
              y1={coordToSvg(randomPath[i - 1].x, randomPath[i - 1].y).sy}
              x2={coordToSvg(p.x, p.y).sx}
              y2={coordToSvg(p.x, p.y).sy}
              stroke="#fb923c"
              strokeWidth="2"
              opacity={0.8}
            />
          ) : null
        )}

        {/* Gradient descent path */}
        {gradientPath.map((p, i) =>
          i > 0 ? (
            <line
              key={`gp-${i}`}
              x1={coordToSvg(gradientPath[i - 1].x, gradientPath[i - 1].y).sx}
              y1={coordToSvg(gradientPath[i - 1].x, gradientPath[i - 1].y).sy}
              x2={coordToSvg(p.x, p.y).sx}
              y2={coordToSvg(p.x, p.y).sy}
              stroke="#10b981"
              strokeWidth="2"
              opacity={0.8}
            />
          ) : null
        )}

        {/* Random walk endpoint */}
        {randomPath.length > 1 && (
          <circle
            cx={coordToSvg(randomPath[randomPath.length - 1].x, randomPath[randomPath.length - 1].y).sx}
            cy={coordToSvg(randomPath[randomPath.length - 1].x, randomPath[randomPath.length - 1].y).sy}
            r={5}
            fill="#fb923c"
            stroke="white"
            strokeWidth="1.5"
          />
        )}

        {/* Gradient endpoint */}
        {gradientPath.length > 1 && (
          <circle
            cx={coordToSvg(gradientPath[gradientPath.length - 1].x, gradientPath[gradientPath.length - 1].y).sx}
            cy={coordToSvg(gradientPath[gradientPath.length - 1].x, gradientPath[gradientPath.length - 1].y).sy}
            r={5}
            fill="#10b981"
            stroke="white"
            strokeWidth="1.5"
          />
        )}

        {/* Start point */}
        {startPoint && (
          <circle
            cx={coordToSvg(startPoint.x, startPoint.y).sx}
            cy={coordToSvg(startPoint.x, startPoint.y).sy}
            r={6}
            fill="white"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}

        {/* Minimum marker */}
        <circle
          cx={coordToSvg(0.3, -0.2).sx}
          cy={coordToSvg(0.3, -0.2).sy}
          r={3}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity={0.5}
        />
      </svg>

      {!startPoint && (
        <p className="mb-3 text-xs text-muted">Click anywhere on the landscape to set a starting point.</p>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={runRandomWalk}
          disabled={!startPoint || randomRunning || gradientRunning}
          className="rounded-md bg-orange-400/10 px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-400/20 disabled:opacity-40"
        >
          {randomRunning ? "Running..." : "Random walk"}
        </button>
        <button
          onClick={runGradientDescent}
          disabled={!startPoint || randomRunning || gradientRunning}
          className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {gradientRunning ? "Running..." : "Gradient descent"}
        </button>
      </div>
    </WidgetContainer>
  );
}
