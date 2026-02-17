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
const RANDOM_STEP_SIZE = 0.6;
const CONVERGE_LOSS = 1.15;

// Animation timings (ms)
const MEASURE_DURATION = 600;
const COMPARE_DURATION = 600;
const NEXT_STEP_DELAY = 300;
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

interface FinishedStep {
  x: number;
  y: number;
  step: number;
  accepted: boolean;
}

// Animation phase for the current random step
type AnimPhase =
  | { type: "measuring"; x: number; y: number; step: number }  // ball appears, measuring line extends
  | { type: "comparing"; x: number; y: number; step: number; accepted: boolean } // showing result
  | null;

export function Gradient2DCurve() {
  const [startX, setStartX] = useState<number | null>(null);
  const [finishedSteps, setFinishedSteps] = useState<FinishedStep[]>([]);
  const [bestX, setBestX] = useState<number | null>(null);
  const [bestLoss, setBestLoss] = useState<number | null>(null);
  const [animPhase, setAnimPhase] = useState<AnimPhase>(null);
  const [gradientPath, setGradientPath] = useState<PathPoint[]>([]);
  const [randomRunning, setRandomRunning] = useState(false);
  const [gradientRunning, setGradientRunning] = useState(false);
  const [mode, setMode] = useState<"idle" | "random" | "gradient">("idle");

  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkStateRef = useRef({ bestX: 0, bestLoss: 0, stepNum: 0 });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setStartX(null);
    setFinishedSteps([]);
    setBestX(null);
    setBestLoss(null);
    setAnimPhase(null);
    setGradientPath([]);
    setRandomRunning(false);
    setGradientRunning(false);
    setMode("idle");
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (randomRunning || gradientRunning) return;
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
      setFinishedSteps([]);
      setBestX(null);
      setBestLoss(null);
      setAnimPhase(null);
      setGradientPath([{ x: clampedX, y }]);
      setMode("idle");
    },
    [randomRunning, gradientRunning]
  );

  // === Random walk with phased animation ===
  const runRandomWalk = useCallback(() => {
    if (startX === null || randomRunning) return;
    clearTimer();
    setRandomRunning(true);
    setMode("random");
    setFinishedSteps([]);
    setAnimPhase(null);

    const initLoss = lossFn(startX);
    setBestX(startX);
    setBestLoss(initLoss);
    walkStateRef.current = { bestX: startX, bestLoss: initLoss, stepNum: 0 };

    const doStep = () => {
      const { bestX: bx, bestLoss: bl } = walkStateRef.current;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const nx = bx + dir * RANDOM_STEP_SIZE;
      const clampedNx = Math.max(X_MIN + 0.1, Math.min(X_MAX - 0.1, nx));
      walkStateRef.current.stepNum++;
      const step = walkStateRef.current.stepNum;
      const ny = lossFn(clampedNx);

      // Phase 1: Measure — ball appears on curve, measurement line extends down
      setAnimPhase({ type: "measuring", x: clampedNx, y: ny, step });

      timerRef.current = setTimeout(() => {
        const accepted = ny < bl;

        // Phase 2: Compare — show accepted/rejected
        setAnimPhase({ type: "comparing", x: clampedNx, y: ny, step, accepted });

        timerRef.current = setTimeout(() => {
          // Record this step
          setFinishedSteps((prev) => [...prev, { x: clampedNx, y: ny, step, accepted }]);
          setAnimPhase(null);

          if (accepted) {
            walkStateRef.current.bestX = clampedNx;
            walkStateRef.current.bestLoss = ny;
            setBestX(clampedNx);
            setBestLoss(ny);

            if (ny <= CONVERGE_LOSS) {
              setRandomRunning(false);
              return;
            }
          }

          timerRef.current = setTimeout(doStep, NEXT_STEP_DELAY);
        }, COMPARE_DURATION);
      }, MEASURE_DURATION);
    };

    timerRef.current = setTimeout(doStep, NEXT_STEP_DELAY);
  }, [startX, randomRunning, clearTimer]);

  // === Gradient descent ===
  const runGradientDescent = useCallback(() => {
    if (startX === null || gradientRunning) return;
    setGradientRunning(true);
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
        setGradientRunning(false);
        return;
      }
      timerRef.current = setTimeout(step, GRADIENT_STEP_DELAY);
    };

    timerRef.current = setTimeout(step, GRADIENT_STEP_DELAY);
  }, [startX, gradientRunning]);

  // Derived state
  const gradPt = gradientPath.length > 0 ? gradientPath[gradientPath.length - 1] : null;
  const ballPt = mode === "gradient" && gradPt
    ? gradPt
    : startX !== null && mode === "idle"
      ? { x: startX, y: lossFn(startX) }
      : null;

  const showGradientArrow = mode !== "random" && ballPt !== null;
  const gradAtBall = ballPt ? lossGradient(ballPt.x) : 0;

  // Should we dim the curve? During random walk, the walker can't "see" the curve
  const dimCurve = mode === "random";

  return (
    <WidgetContainer
      title="Gradient: The Slope Points Downhill"
      description="Click on the curve to place a ball, then compare random steps vs. gradient descent"
      onReset={reset}
    >
      {/* Buttons */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={runRandomWalk}
          disabled={startX === null || randomRunning || gradientRunning}
          className="rounded-md bg-orange-400/10 px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-400/20 disabled:opacity-40"
        >
          {randomRunning ? "Running..." : "Random steps"}
        </button>
        <button
          onClick={runGradientDescent}
          disabled={startX === null || randomRunning || gradientRunning}
          className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {gradientRunning ? "Running..." : "Gradient descent"}
        </button>

        {/* Stats */}
        {finishedSteps.length > 0 && mode === "random" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
            <span className="text-muted">
              {finishedSteps.length} tries
              {bestLoss !== null && (
                <span className="ml-1 font-mono font-bold text-foreground">
                  (best error: {bestLoss.toFixed(2)})
                </span>
              )}
            </span>
          </div>
        )}
        {gradientPath.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-muted">
              Gradient: {gradientPath.length - 1} steps
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

        {/* Curve — dimmed during random walk to emphasise blindness */}
        <path
          d={CURVE_PATH}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={dimCurve ? 1.5 : 2.5}
          opacity={dimCurve ? 0.15 : 1}
        />

        {/* Minimum marker — hidden during random walk */}
        {!dimCurve && (
          <circle cx={xToSvg(3)} cy={yToSvg(1)} r={3} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity={0.4} />
        )}

        {/* === Random walk visualization === */}

        {/* Finished steps: small markers */}
        {finishedSteps.map((s) => {
          const sx = xToSvg(s.x);
          const sy = yToSvg(s.y);
          if (s.accepted) {
            // Accepted: solid orange dot with check
            return (
              <g key={`fs-${s.step}`}>
                <circle cx={sx} cy={sy} r={5} fill="#fb923c" stroke="white" strokeWidth="1" opacity={0.7} />
              </g>
            );
          }
          // Rejected: small X mark, faded
          return (
            <g key={`fs-${s.step}`} opacity={0.3}>
              <line x1={sx - 4} y1={sy - 4} x2={sx + 4} y2={sy + 4} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1={sx + 4} y1={sy - 4} x2={sx - 4} y2={sy + 4} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Current best position — prominent ball with measurement */}
        {bestX !== null && bestLoss !== null && mode === "random" && (
          <g>
            {/* Measurement line from best to bottom axis */}
            <line
              x1={xToSvg(bestX)}
              y1={yToSvg(bestLoss)}
              x2={xToSvg(bestX)}
              y2={PLOT_BOTTOM}
              stroke="#fb923c"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              opacity={0.5}
            />
            {/* Measurement value along the line */}
            <text
              x={xToSvg(bestX) - 8}
              y={(yToSvg(bestLoss) + PLOT_BOTTOM) / 2}
              textAnchor="end"
              fontSize="12"
              fontWeight="700"
              fill="#fb923c"
            >
              {bestLoss.toFixed(1)}
            </text>
            {/* The ball */}
            <circle
              cx={xToSvg(bestX)}
              cy={yToSvg(bestLoss)}
              r={8}
              fill="#fb923c"
              stroke="white"
              strokeWidth="2.5"
            />
            {/* "best so far" label */}
            <text
              x={xToSvg(bestX)}
              y={yToSvg(bestLoss) - 14}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#fb923c"
            >
              best so far
            </text>
          </g>
        )}

        {/* Animated current step */}
        {animPhase?.type === "measuring" && (() => {
          const sx = xToSvg(animPhase.x);
          const sy = yToSvg(animPhase.y);
          // Ball is on the curve; measurement line grows downward to the axis
          return (
            <g>
              {/* The ball */}
              <circle cx={sx} cy={sy} r={7} fill="#64748b" stroke="white" strokeWidth="2" />
              {/* Measurement line: from ball down to bottom */}
              <line x1={sx} y1={sy} x2={sx} y2={sy} stroke="#0ea5e9" strokeWidth="2" opacity={0.7}>
                <animate attributeName="y2" from={sy} to={PLOT_BOTTOM} dur={`${MEASURE_DURATION * 0.6}ms`} fill="freeze" />
              </line>
              {/* Measurement value label */}
              <text
                x={sx + 8}
                y={(sy + PLOT_BOTTOM) / 2}
                fontSize="12"
                fontWeight="700"
                fill="#0ea5e9"
                opacity="0"
              >
                {animPhase.y.toFixed(1)}
                <animate attributeName="opacity" from="0" to="1" begin={`${MEASURE_DURATION * 0.4}ms`} dur={`${MEASURE_DURATION * 0.3}ms`} fill="freeze" />
              </text>
            </g>
          );
        })()}

        {animPhase?.type === "comparing" && (() => {
          const sx = xToSvg(animPhase.x);
          const sy = yToSvg(animPhase.y);
          const color = animPhase.accepted ? "#22c55e" : "#ef4444";
          const label = animPhase.accepted ? `${animPhase.y.toFixed(1)} < ${bestLoss?.toFixed(1)} ✓` : `${animPhase.y.toFixed(1)} > ${bestLoss?.toFixed(1)} ✗`;
          return (
            <g>
              {/* Measurement line stays */}
              <line x1={sx} y1={sy} x2={sx} y2={PLOT_BOTTOM} stroke={color} strokeWidth="2" opacity={0.5} />
              {/* Ball flashes the result color */}
              <circle cx={sx} cy={sy} r={7} fill={color} stroke="white" strokeWidth="2" />
              {/* Result label */}
              <text
                x={sx + 10}
                y={sy - 4}
                fontSize="11"
                fontWeight="700"
                fill={color}
              >
                {label}
              </text>
            </g>
          );
        })()}

        {/* === Gradient descent visualization === */}

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

        {/* Ball on curve (idle + gradient modes) */}
        {ballPt && mode !== "random" && (
          <circle
            cx={xToSvg(ballPt.x)}
            cy={yToSvg(ballPt.y)}
            r={7}
            fill={mode === "gradient" ? "#10b981" : "white"}
            stroke={mode === "idle" ? "var(--color-accent)" : "white"}
            strokeWidth="2"
          />
        )}

        {/* Gradient arrow — only in idle or gradient mode */}
        {showGradientArrow && ballPt && Math.abs(gradAtBall) > 0.1 && (
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
