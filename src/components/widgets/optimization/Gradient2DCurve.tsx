"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 340;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 20;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 40;
const PLOT_LEFT = PADDING_LEFT;
const PLOT_RIGHT = SVG_WIDTH - PADDING_RIGHT;
const PLOT_TOP = PADDING_TOP;
const PLOT_BOTTOM = SVG_HEIGHT - PADDING_BOTTOM;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const LEARNING_RATE = 0.08;
const GRADIENT_STEP_DELAY = 100;

// Loss curve: y = (x - 3)^2 + 1
const X_MIN = -1;
const X_MAX = 7;
const Y_MIN = 0;
const Y_MAX = 18;

function lossFn(x: number): number {
  return (x - 3) ** 2 + 1;
}

function lossGradient(x: number): number {
  return 2 * (x - 3);
}

function xToSvg(x: number): number {
  return PLOT_LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function yToSvg(y: number): number {
  return PLOT_BOTTOM - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function svgToX(sx: number): number {
  return X_MIN + ((sx - PLOT_LEFT) / PLOT_W) * (X_MAX - X_MIN);
}

// Generate the curve path
function curvePath(): string {
  const pts: string[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + (i / steps) * (X_MAX - X_MIN);
    const y = lossFn(x);
    if (y > Y_MAX + 2) continue;
    const sx = xToSvg(x);
    const sy = yToSvg(y);
    pts.push(`${pts.length === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
  }
  return pts.join(" ");
}

const CURVE_PATH = curvePath();

interface PathPoint {
  x: number;
  y: number;
}

export function Gradient2DCurve() {
  const [startX, setStartX] = useState<number | null>(null);
  const [gradientPath, setGradientPath] = useState<PathPoint[]>([]);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"idle" | "gradient">("idle");

  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setStartX(null);
    setGradientPath([]);
    setRunning(false);
    setMode("idle");
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (running) return;
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const sx = (e.clientX - rect.left) * scaleX;
      const x = svgToX(sx);

      const clampedX = Math.max(X_MIN + 0.1, Math.min(X_MAX - 0.1, x));
      const y = lossFn(clampedX);
      if (y > Y_MAX) return;

      setStartX(clampedX);
      setGradientPath([{ x: clampedX, y }]);
      setMode("idle");
    },
    [running]
  );

  // === Gradient descent ===
  const runGradientDescent = useCallback(() => {
    if (startX === null || running) return;
    setRunning(true);
    setMode("gradient");
    let x = startX;

    setGradientPath([{ x, y: lossFn(x) }]);

    const step = () => {
      const grad = lossGradient(x);
      x = x - LEARNING_RATE * grad;
      x = Math.max(X_MIN, Math.min(X_MAX, x));
      const y = lossFn(x);

      setGradientPath((prev) => [...prev, { x, y }]);

      if (Math.abs(grad) < 0.05) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(step, GRADIENT_STEP_DELAY);
    };

    timerRef.current = setTimeout(step, GRADIENT_STEP_DELAY);
  }, [startX, running]);

  // Derived state
  const gradPt = gradientPath.length > 0 ? gradientPath[gradientPath.length - 1] : null;
  const ballPt = gradPt ?? (startX !== null ? { x: startX, y: lossFn(startX) } : null);
  const gradAtBall = ballPt ? lossGradient(ballPt.x) : 0;

  return (
    <WidgetContainer
      title="Gradient: The Slope Points Downhill"
      description="Click on the curve to place a ball — the red arrow is the gradient, pointing downhill"
      onReset={reset}
    >
      {/* Button */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={runGradientDescent}
          disabled={startX === null || running}
          className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {running ? "Running..." : "Run gradient descent"}
        </button>

        {/* Stats */}
        {gradientPath.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-muted">
              {gradientPath.length - 1} steps
              <span className="ml-1 font-mono font-bold text-foreground">
                (error: {gradientPath[gradientPath.length - 1].y.toFixed(2)})
              </span>
            </span>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full cursor-crosshair rounded-lg border border-border bg-surface"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleClick}
      >
        {/* Axes */}
        <line
          x1={PLOT_LEFT} y1={PLOT_BOTTOM}
          x2={PLOT_RIGHT} y2={PLOT_BOTTOM}
          stroke="currentColor" strokeWidth="1" opacity={0.2}
        />
        <line
          x1={PLOT_LEFT} y1={PLOT_TOP}
          x2={PLOT_LEFT} y2={PLOT_BOTTOM}
          stroke="currentColor" strokeWidth="1" opacity={0.2}
        />
        <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.4}>
          parameter value
        </text>
        <text x={12} y={SVG_HEIGHT / 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.4} transform={`rotate(-90, 12, ${SVG_HEIGHT / 2})`}>
          error
        </text>

        {/* Curve */}
        <path
          d={CURVE_PATH}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
        />

        {/* Minimum marker */}
        <circle cx={xToSvg(3)} cy={yToSvg(1)} r={3} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity={0.4} />

        {/* Gradient descent path */}
        {gradientPath.length > 1 && gradientPath.map((p, i) =>
          i > 0 ? (
            <line
              key={`gp-${i}`}
              x1={xToSvg(gradientPath[i - 1].x)}
              y1={yToSvg(gradientPath[i - 1].y)}
              x2={xToSvg(p.x)}
              y2={yToSvg(p.y)}
              stroke="#10b981"
              strokeWidth="2"
              opacity={0.6}
            />
          ) : null
        )}

        {/* Ball on curve */}
        {ballPt && (
          <circle
            cx={xToSvg(ballPt.x)}
            cy={yToSvg(ballPt.y)}
            r={7}
            fill={mode === "gradient" ? "#10b981" : "white"}
            stroke={mode === "idle" ? "var(--color-accent)" : "white"}
            strokeWidth="2"
          />
        )}

        {/* Gradient arrow */}
        {ballPt && Math.abs(gradAtBall) > 0.1 && (
          (() => {
            const arrowLen = 40;
            const dir = gradAtBall > 0 ? -1 : 1;
            const bx = xToSvg(ballPt.x);
            const by = yToSvg(ballPt.y);
            const dydx_svg = -gradAtBall * (PLOT_H / (Y_MAX - Y_MIN)) / (PLOT_W / (X_MAX - X_MIN));
            const tangentLen = Math.sqrt(1 + dydx_svg * dydx_svg);
            const ex = bx + dir * arrowLen / tangentLen;
            const ey = by + dir * arrowLen * dydx_svg / tangentLen;
            const angle = Math.atan2(ey - by, ex - bx);
            const headLen = 8;
            const h1x = ex - headLen * Math.cos(angle - 0.4);
            const h1y = ey - headLen * Math.sin(angle - 0.4);
            const h2x = ex - headLen * Math.cos(angle + 0.4);
            const h2y = ey - headLen * Math.sin(angle + 0.4);

            return (
              <g>
                <line x1={bx} y1={by} x2={ex} y2={ey} stroke="#e11d48" strokeWidth="2.5" />
                <line x1={ex} y1={ey} x2={h1x} y2={h1y} stroke="#e11d48" strokeWidth="2.5" />
                <line x1={ex} y1={ey} x2={h2x} y2={h2y} stroke="#e11d48" strokeWidth="2.5" />
                <text
                  x={ex + dir * 6}
                  y={ey - 8}
                  textAnchor={dir > 0 ? "start" : "end"}
                  fontSize="11"
                  fontWeight="600"
                  fill="#e11d48"
                >
                  gradient
                </text>
              </g>
            );
          })()
        )}

        {/* Empty state */}
        {startX === null && (
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill="currentColor"
            fontSize="13"
            opacity={0.3}
          >
            Click anywhere on the curve to place a ball
          </text>
        )}
      </svg>
    </WidgetContainer>
  );
}
