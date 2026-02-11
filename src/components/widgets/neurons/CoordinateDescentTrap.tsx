"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

// Loss function: f(x,y) = (x + y - 4)² + k*(x - y)²
// k=50 makes a very narrow valley tilted at 45°. Minimum at (2, 2).
// Coordinate descent zigzags along the valley with negligible progress per cycle.
const K = 50;

function loss(x: number, y: number): number {
  return (x + y - 4) ** 2 + K * (x - y) ** 2;
}

function gradient(x: number, y: number): [number, number] {
  const dfdx = 2 * (x + y - 4) + 2 * K * (x - y);
  const dfdy = 2 * (x + y - 4) - 2 * K * (x - y);
  return [dfdx, dfdy];
}

// Coordinate descent: analytical conditional minimum along one axis
// ∂f/∂x = 0 → x = (4 + (K-1)*y) / (1+K)
// ∂f/∂y = 0 → y = (4 + (K-1)*x) / (1+K)
function coordDescentStepX(y: number): number {
  return (4 + (K - 1) * y) / (1 + K);
}

function coordDescentStepY(x: number): number {
  return (4 + (K - 1) * x) / (1 + K);
}

const RANGE: [number, number] = [-4, 8];
const START: [number, number] = [-3, 5];
const CANVAS_W = 320;
const CANVAS_H = 320;
const PAD_L = 36;
const PAD_B = 24;
const PLOT_W = CANVAS_W - PAD_L;
const PLOT_H = CANVAS_H - PAD_B;

function toCanvasX(v: number): number {
  return PAD_L + ((v - RANGE[0]) / (RANGE[1] - RANGE[0])) * PLOT_W;
}

function toCanvasY(v: number): number {
  return (CANVAS_H - PAD_B) - ((v - RANGE[0]) / (RANGE[1] - RANGE[0])) * PLOT_H;
}

type Point = [number, number];

type Mode = "coord" | "grad" | "both" | null;

export function CoordinateDescentTrap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coordPath, setCoordPath] = useState<Point[]>([]);
  const [gradPath, setGradPath] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState<Mode>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draw heatmap on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = ctx.createImageData(CANVAS_W, CANVAS_H);
    // Sample loss values across the plot to find a good max for color scaling
    let maxLoss = 0;
    for (let py = 0; py < CANVAS_H; py++) {
      for (let px = PAD_L; px < CANVAS_W; px++) {
        const x = RANGE[0] + ((px - PAD_L) / PLOT_W) * (RANGE[1] - RANGE[0]);
        const y = RANGE[0] + (((CANVAS_H - PAD_B) - py) / PLOT_H) * (RANGE[1] - RANGE[0]);
        const l = loss(x, y);
        if (l > maxLoss) maxLoss = l;
      }
    }

    for (let py = 0; py < CANVAS_H; py++) {
      for (let px = 0; px < CANVAS_W; px++) {
        const idx = (py * CANVAS_W + px) * 4;
        if (px < PAD_L || py > CANVAS_H - PAD_B) {
          // Axis area — transparent
          img.data[idx] = 255;
          img.data[idx + 1] = 255;
          img.data[idx + 2] = 255;
          img.data[idx + 3] = 0;
          continue;
        }
        const x = RANGE[0] + ((px - PAD_L) / PLOT_W) * (RANGE[1] - RANGE[0]);
        const y = RANGE[0] + (((CANVAS_H - PAD_B) - py) / PLOT_H) * (RANGE[1] - RANGE[0]);
        const l = loss(x, y);
        const t = Math.min(1, Math.pow(l / maxLoss, 0.35)); // power < 0.5 for more contrast near minimum
        // Dark blue (low) → Teal → Yellow → White (high)
        let r: number, g: number, b: number;
        if (t < 0.33) {
          const s = t / 0.33;
          r = Math.round(10 + s * 20);
          g = Math.round(30 + s * 100);
          b = Math.round(120 + s * 60);
        } else if (t < 0.66) {
          const s = (t - 0.33) / 0.33;
          r = Math.round(30 + s * 200);
          g = Math.round(130 + s * 100);
          b = Math.round(180 - s * 120);
        } else {
          const s = (t - 0.66) / 0.34;
          r = Math.round(230 + s * 25);
          g = Math.round(230 + s * 25);
          b = Math.round(60 + s * 195);
        }
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setCoordPath([]);
    setGradPath([]);
    setIsAnimating(null);
    if (animRef.current) clearTimeout(animRef.current);
  }, []);

  const startCoordDescent = useCallback(() => {
    if (isAnimating) {
      setIsAnimating(null);
      if (animRef.current) clearTimeout(animRef.current);
      return;
    }
    setCoordPath([START]);
    setGradPath([]);
    setIsAnimating("coord");

    const path: Point[] = [START];
    let step = 0;
    let optimizeX = true;

    const animate = () => {
      const prev = path[path.length - 1];
      let next: Point;
      if (optimizeX) {
        next = [coordDescentStepX(prev[1]), prev[1]];
      } else {
        next = [prev[0], coordDescentStepY(prev[0])];
      }
      optimizeX = !optimizeX;
      step++;
      path.push(next);
      setCoordPath([...path]);

      if (loss(next[0], next[1]) < 0.05 || step >= 60) {
        setIsAnimating(null);
        return;
      }
      animRef.current = setTimeout(animate, 80);
    };

    animRef.current = setTimeout(animate, 80);
  }, [isAnimating]);

  const startGradDescent = useCallback(() => {
    if (isAnimating) {
      setIsAnimating(null);
      if (animRef.current) clearTimeout(animRef.current);
      return;
    }
    setGradPath([START]);
    setCoordPath([]);
    setIsAnimating("grad");

    const path: Point[] = [START];
    let step = 0;
    const lr = 0.009; // tuned for k=50

    const animate = () => {
      const prev = path[path.length - 1];
      const [dx, dy] = gradient(prev[0], prev[1]);
      const next: Point = [prev[0] - lr * dx, prev[1] - lr * dy];
      step++;
      path.push(next);
      setGradPath([...path]);

      if (loss(next[0], next[1]) < 0.05 || step >= 60) {
        setIsAnimating(null);
        return;
      }
      animRef.current = setTimeout(animate, 80);
    };

    animRef.current = setTimeout(animate, 80);
  }, [isAnimating]);

  const startBoth = useCallback(() => {
    if (isAnimating) {
      setIsAnimating(null);
      if (animRef.current) clearTimeout(animRef.current);
      return;
    }
    setCoordPath([START]);
    setGradPath([START]);
    setIsAnimating("both");

    const cPath: Point[] = [START];
    const gPath: Point[] = [START];
    let step = 0;
    let optimizeX = true;
    const lr = 0.009;
    let coordDone = false;
    let gradDone = false;

    const animate = () => {
      if (!coordDone) {
        const prev = cPath[cPath.length - 1];
        let next: Point;
        if (optimizeX) {
          next = [coordDescentStepX(prev[1]), prev[1]];
        } else {
          next = [prev[0], coordDescentStepY(prev[0])];
        }
        optimizeX = !optimizeX;
        cPath.push(next);
        if (loss(next[0], next[1]) < 0.05) coordDone = true;
      }

      if (!gradDone) {
        const prev = gPath[gPath.length - 1];
        const [dx, dy] = gradient(prev[0], prev[1]);
        const next: Point = [prev[0] - lr * dx, prev[1] - lr * dy];
        gPath.push(next);
        if (loss(next[0], next[1]) < 0.05) gradDone = true;
      }

      step++;
      setCoordPath([...cPath]);
      setGradPath([...gPath]);

      if ((coordDone && gradDone) || step >= 60) {
        setIsAnimating(null);
        return;
      }
      animRef.current = setTimeout(animate, 80);
    };

    animRef.current = setTimeout(animate, 80);
  }, [isAnimating]);

  // SVG path from points
  const toSvgPath = (points: Point[]): string => {
    if (points.length === 0) return "";
    return points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${toCanvasX(p[0]).toFixed(1)},${toCanvasY(p[1]).toFixed(1)}`
      )
      .join(" ");
  };

  // Current loss values
  const coordLoss =
    coordPath.length > 0
      ? loss(coordPath[coordPath.length - 1][0], coordPath[coordPath.length - 1][1])
      : null;
  const gradLoss =
    gradPath.length > 0
      ? loss(gradPath[gradPath.length - 1][0], gradPath[gradPath.length - 1][1])
      : null;

  const ticks = [-2, 0, 2, 4, 6, 8];

  return (
    <WidgetContainer
      title="The Coordinate Descent Trap"
      description="Why you must optimize all parameters together."
      onReset={reset}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative"
          style={{ width: CANVAS_W, height: CANVAS_H }}
        >
          {/* Heatmap canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="absolute inset-0 rounded-lg"
          />
          {/* SVG overlay */}
          <svg
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="absolute inset-0"
            width={CANVAS_W}
            height={CANVAS_H}
          >
            {/* Axis labels */}
            <text
              x={PAD_L + PLOT_W / 2}
              y={CANVAS_H - 2}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
            >
              Parameter 1
            </text>
            <text
              x={8}
              y={(CANVAS_H - PAD_B) / 2}
              textAnchor="middle"
              transform={`rotate(-90, 8, ${(CANVAS_H - PAD_B) / 2})`}
              className="fill-foreground text-[10px] font-medium"
            >
              Parameter 2
            </text>
            {/* Tick marks */}
            {ticks.map((t) => (
              <g key={`tick-${t}`}>
                <line
                  x1={toCanvasX(t)}
                  y1={CANVAS_H - PAD_B}
                  x2={toCanvasX(t)}
                  y2={CANVAS_H - PAD_B + 4}
                  stroke="#666"
                  strokeWidth={0.5}
                />
                <text
                  x={toCanvasX(t)}
                  y={CANVAS_H - PAD_B + 14}
                  textAnchor="middle"
                  className="fill-muted text-[8px]"
                >
                  {t}
                </text>
                <line
                  x1={PAD_L}
                  y1={toCanvasY(t)}
                  x2={PAD_L - 4}
                  y2={toCanvasY(t)}
                  stroke="#666"
                  strokeWidth={0.5}
                />
                <text
                  x={PAD_L - 6}
                  y={toCanvasY(t) + 3}
                  textAnchor="end"
                  className="fill-muted text-[8px]"
                >
                  {t}
                </text>
              </g>
            ))}

            {/* Minimum marker */}
            <circle
              cx={toCanvasX(2)}
              cy={toCanvasY(2)}
              r={5}
              fill="none"
              stroke="white"
              strokeWidth={1.5}
              strokeDasharray="3,2"
            />
            <text
              x={toCanvasX(2) + 8}
              y={toCanvasY(2) + 4}
              className="fill-white text-[9px] font-bold"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              min
            </text>

            {/* Coordinate descent path */}
            {coordPath.length > 1 && (
              <path
                d={toSvgPath(coordPath)}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeLinejoin="round"
                opacity={0.9}
              />
            )}
            {coordPath.length > 0 && (
              <circle
                cx={toCanvasX(coordPath[coordPath.length - 1][0])}
                cy={toCanvasY(coordPath[coordPath.length - 1][1])}
                r={4}
                fill="#ef4444"
                stroke="white"
                strokeWidth={1.5}
              />
            )}
            {coordPath.length > 0 && (
              <circle
                cx={toCanvasX(coordPath[0][0])}
                cy={toCanvasY(coordPath[0][1])}
                r={4}
                fill="#ef4444"
                stroke="white"
                strokeWidth={1.5}
              />
            )}

            {/* Gradient descent path */}
            {gradPath.length > 1 && (
              <path
                d={toSvgPath(gradPath)}
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
                strokeLinejoin="round"
                opacity={0.9}
              />
            )}
            {gradPath.length > 0 && (
              <circle
                cx={toCanvasX(gradPath[gradPath.length - 1][0])}
                cy={toCanvasY(gradPath[gradPath.length - 1][1])}
                r={4}
                fill="#10b981"
                stroke="white"
                strokeWidth={1.5}
              />
            )}
            {gradPath.length > 0 && (
              <circle
                cx={toCanvasX(gradPath[0][0])}
                cy={toCanvasY(gradPath[0][1])}
                r={4}
                fill="#10b981"
                stroke="white"
                strokeWidth={1.5}
              />
            )}

            {/* Start marker (if no paths yet) */}
            {coordPath.length === 0 && gradPath.length === 0 && (
              <>
                <circle
                  cx={toCanvasX(START[0])}
                  cy={toCanvasY(START[1])}
                  r={5}
                  fill="white"
                  stroke="#333"
                  strokeWidth={1.5}
                />
                <text
                  x={toCanvasX(START[0]) + 8}
                  y={toCanvasY(START[1]) + 4}
                  className="fill-white text-[9px] font-bold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  start
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 text-xs font-mono">
          {coordPath.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error" />
              <span className="text-muted">
                One at a time: {coordPath.length - 1} steps, loss{" "}
                {coordLoss !== null ? coordLoss.toFixed(1) : "—"}
              </span>
            </div>
          )}
          {gradPath.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-muted">
                Together: {gradPath.length - 1} steps, loss{" "}
                {gradLoss !== null ? gradLoss.toFixed(1) : "—"}
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={startCoordDescent}
            disabled={isAnimating !== null && isAnimating !== "coord"}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isAnimating === "coord"
                ? "bg-error text-white hover:bg-error/80"
                : "bg-error/10 text-error hover:bg-error/20 disabled:opacity-40"
            }`}
          >
            {isAnimating === "coord" ? "Stop" : "One at a time"}
          </button>
          <button
            onClick={startGradDescent}
            disabled={isAnimating !== null && isAnimating !== "grad"}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isAnimating === "grad"
                ? "bg-success text-white hover:bg-success/80"
                : "bg-success/10 text-success hover:bg-success/20 disabled:opacity-40"
            }`}
          >
            {isAnimating === "grad" ? "Stop" : "Together"}
          </button>
          <button
            onClick={startBoth}
            disabled={isAnimating !== null && isAnimating !== "both"}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isAnimating === "both"
                ? "bg-accent text-white hover:bg-accent/80"
                : "bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40"
            }`}
          >
            {isAnimating === "both" ? "Stop" : "Compare both"}
          </button>
        </div>

        {/* Color scale legend */}
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <span>Low loss</span>
          <div
            className="w-24 h-2 rounded-full"
            style={{
              background:
                "linear-gradient(to right, rgb(10,30,120), rgb(30,130,180), rgb(230,230,60), rgb(255,255,255))",
            }}
          />
          <span>High loss</span>
        </div>
      </div>
    </WidgetContainer>
  );
}
