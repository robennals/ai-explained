"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const SVG_WIDTH = 600;
const SVG_HEIGHT = 420;
const CX = SVG_WIDTH / 2;
const CY = SVG_HEIGHT / 2 + 30;
const SCALE = 280;
const GRID_N = 30;
const STEP_DELAY = 150;
const REVERT_DELAY = 400;
const LEARNING_RATE = 0.05;
const RANDOM_STEP_SIZE = 0.15;
const CONVERGE_LOSS = 0.02;

// Fixed tilt so "down" is always down
const ROT_X = 0.55;

// Coordinate range
const C_MIN = -1;
const C_MAX = 1;

// Loss: elliptical bowl
function lossFn(x: number, y: number): number {
  return (x - 0.3) ** 2 + 2 * (y + 0.2) ** 2;
}

// Numerical gradient
function lossGradient(x: number, y: number): { dx: number; dy: number } {
  const h = 0.001;
  const dx = (lossFn(x + h, y) - lossFn(x - h, y)) / (2 * h);
  const dy = (lossFn(x, y + h) - lossFn(x, y - h)) / (2 * h);
  return { dx, dy };
}

const MAX_LOSS = 2.5;
const SURFACE_HEIGHT = 0.8;

function project(
  x: number, y: number, z: number,
  rotY: number
): [number, number, number] {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const rx = x * cosY + z * sinY;
  const rz = -x * sinY + z * cosY;
  const cosX = Math.cos(ROT_X), sinX = Math.sin(ROT_X);
  const ry = y * cosX - rz * sinX;
  const rz2 = y * sinX + rz * cosX;
  return [CX + rx * SCALE, CY - ry * SCALE, rz2];
}

// Map (cx, cy) in [-1,1] to 3D coords where y = loss height
function coordTo3D(cx: number, cy: number): [number, number, number] {
  const loss = lossFn(cx, cy);
  const t = Math.min(loss / MAX_LOSS, 1);
  const x3d = (cx - C_MIN) / (C_MAX - C_MIN) - 0.5;
  const z3d = (cy - C_MIN) / (C_MAX - C_MIN) - 0.5;
  const y3d = -0.5 + t * SURFACE_HEIGHT;
  return [x3d, y3d, z3d];
}

// Color for loss value
function lossColor(loss: number): string {
  const t = Math.min(loss / MAX_LOSS, 1);
  const r = Math.round(59 + t * 196);
  const g = Math.round(130 + t * 125);
  const b = Math.round(246 + t * 9);
  return `rgb(${r},${g},${b})`;
}

interface MeshQuad {
  pts: [number, number, number][];
  avgDepth: number;
  color: string;
  avgLoss: number;
}

interface PathPoint {
  x: number;
  y: number;
  loss: number;
}

export function Gradient3DSurface() {
  const [rotY, setRotY] = useState(0.6);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const [clickPoint, setClickPoint] = useState<{ x: number; y: number } | null>(null);
  const [randomPath, setRandomPath] = useState<PathPoint[]>([]);
  const [gradientPath, setGradientPath] = useState<PathPoint[]>([]);
  const [randomRunning, setRandomRunning] = useState(false);
  const [gradientRunning, setGradientRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRotY(0.6);
    setClickPoint(null);
    setRandomPath([]);
    setGradientPath([]);
    setRandomRunning(false);
    setGradientRunning(false);
  }, []);

  useEffect(() => {
    const timer = timerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Drag to rotate (Y axis only — preserves "down")
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    lastPos.current = { x: e.clientX };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.current.x;
      lastPos.current = { x: e.clientX };
      setRotY((r) => r + dx * 0.01);
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);

  // Click to set start point
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

      // Find closest grid point by un-projecting: brute-force search
      let bestDist = Infinity;
      let bestCx = 0, bestCy = 0;
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        for (let j = 0; j <= steps; j++) {
          const cx = C_MIN + (i / steps) * (C_MAX - C_MIN);
          const cy = C_MIN + (j / steps) * (C_MAX - C_MIN);
          const [px, py] = project(...coordTo3D(cx, cy), rotY);
          const d = (px - sx) ** 2 + (py - sy) ** 2;
          if (d < bestDist) {
            bestDist = d;
            bestCx = cx;
            bestCy = cy;
          }
        }
      }

      if (bestDist > 2500) return; // too far from surface

      setClickPoint({ x: bestCx, y: bestCy });
      const loss = lossFn(bestCx, bestCy);
      setRandomPath([{ x: bestCx, y: bestCy, loss }]);
      setGradientPath([{ x: bestCx, y: bestCy, loss }]);
    },
    [rotY, randomRunning, gradientRunning]
  );

  const runRandomWalk = useCallback(() => {
    if (!clickPoint || randomRunning) return;
    setRandomRunning(true);
    let x = clickPoint.x;
    let y = clickPoint.y;
    let loss = lossFn(x, y);

    setRandomPath([{ x, y, loss }]);

    const step = () => {
      // Random direction
      const angle = Math.random() * 2 * Math.PI;
      const nx = x + Math.cos(angle) * RANDOM_STEP_SIZE;
      const ny = y + Math.sin(angle) * RANDOM_STEP_SIZE;
      const newLoss = lossFn(nx, ny);
      const inBounds = nx >= C_MIN && nx <= C_MAX && ny >= C_MIN && ny <= C_MAX;

      if (inBounds && newLoss < loss) {
        // Good step — accept it
        x = nx;
        y = ny;
        loss = newLoss;
        setRandomPath((prev) => [...prev, { x, y, loss }]);

        if (loss <= CONVERGE_LOSS) {
          setRandomRunning(false);
          return;
        }
        timerRef.current = setTimeout(step, STEP_DELAY);
      } else {
        // Bad step — show it, then revert
        const badX = inBounds ? nx : x;
        const badY = inBounds ? ny : y;
        const badLoss = inBounds ? newLoss : loss;
        setRandomPath((prev) => [...prev, { x: badX, y: badY, loss: badLoss }]);

        timerRef.current = setTimeout(() => {
          setRandomPath((prev) => [...prev, { x, y, loss }]);
          timerRef.current = setTimeout(step, STEP_DELAY);
        }, REVERT_DELAY);
      }
    };

    timerRef.current = setTimeout(step, STEP_DELAY);
  }, [clickPoint, randomRunning]);

  const runGradientDescent = useCallback(() => {
    if (!clickPoint || gradientRunning) return;
    setGradientRunning(true);
    let x = clickPoint.x;
    let y = clickPoint.y;

    setGradientPath([{ x, y, loss: lossFn(x, y) }]);

    timerRef.current = setInterval(() => {
      const { dx, dy } = lossGradient(x, y);
      x = Math.max(C_MIN, Math.min(C_MAX, x - LEARNING_RATE * dx));
      y = Math.max(C_MIN, Math.min(C_MAX, y - LEARNING_RATE * dy));
      const loss = lossFn(x, y);

      setGradientPath((prev) => [...prev, { x, y, loss }]);

      if (loss <= CONVERGE_LOSS) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGradientRunning(false);
      }
    }, STEP_DELAY);
  }, [clickPoint, gradientRunning]);

  // Build mesh quads
  const meshQuads = useMemo(() => {
    const quads: MeshQuad[] = [];
    for (let i = 0; i < GRID_N; i++) {
      for (let j = 0; j < GRID_N; j++) {
        const cx0 = C_MIN + (i / GRID_N) * (C_MAX - C_MIN);
        const cx1 = C_MIN + ((i + 1) / GRID_N) * (C_MAX - C_MIN);
        const cy0 = C_MIN + (j / GRID_N) * (C_MAX - C_MIN);
        const cy1 = C_MIN + ((j + 1) / GRID_N) * (C_MAX - C_MIN);

        const p0 = coordTo3D(cx0, cy0);
        const p1 = coordTo3D(cx1, cy0);
        const p2 = coordTo3D(cx1, cy1);
        const p3 = coordTo3D(cx0, cy1);

        const avgLoss = (lossFn(cx0, cy0) + lossFn(cx1, cy0) + lossFn(cx1, cy1) + lossFn(cx0, cy1)) / 4;

        quads.push({
          pts: [p0, p1, p2, p3],
          avgDepth: 0,
          color: lossColor(avgLoss),
          avgLoss,
        });
      }
    }
    return quads;
  }, []);

  // Project and sort quads
  const projectedQuads = useMemo(() => {
    return meshQuads.map((q) => {
      const projected = q.pts.map((p) => project(p[0], p[1], p[2], rotY));
      const avgDepth = projected.reduce((s, p) => s + p[2], 0) / 4;
      return { ...q, projected, avgDepth };
    }).sort((a, b) => a.avgDepth - b.avgDepth);
  }, [meshQuads, rotY]);

  // Project paths
  const projRandomPath = randomPath.map((p) => {
    const [sx, sy] = project(...coordTo3D(p.x, p.y), rotY);
    return { sx, sy };
  });
  const projGradientPath = gradientPath.map((p) => {
    const [sx, sy] = project(...coordTo3D(p.x, p.y), rotY);
    return { sx, sy };
  });

  // Project click point and gradient arrow
  const projClick = clickPoint
    ? (() => {
        const [sx, sy] = project(...coordTo3D(clickPoint.x, clickPoint.y), rotY);
        return { sx, sy };
      })()
    : null;

  // Gradient arrow at click point
  const gradArrow = clickPoint
    ? (() => {
        const { dx, dy } = lossGradient(clickPoint.x, clickPoint.y);
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < 0.05) return null;
        const arrowStep = 0.15;
        const nx = clickPoint.x - arrowStep * (dx / mag);
        const ny = clickPoint.y - arrowStep * (dy / mag);
        const [sx, sy] = project(...coordTo3D(clickPoint.x, clickPoint.y), rotY);
        const [ex, ey] = project(...coordTo3D(nx, ny), rotY);
        const angle = Math.atan2(ey - sy, ex - sx);
        const headLen = 8;
        const h1x = ex - headLen * Math.cos(angle - 0.4);
        const h1y = ey - headLen * Math.sin(angle - 0.4);
        const h2x = ex - headLen * Math.cos(angle + 0.4);
        const h2y = ey - headLen * Math.sin(angle + 0.4);
        return { sx, sy, ex, ey, h1x, h1y, h2x, h2y };
      })()
    : null;

  const randomLoss = randomPath.length > 0 ? randomPath[randomPath.length - 1].loss : null;
  const gradientLoss = gradientPath.length > 0 ? gradientPath[gradientPath.length - 1].loss : null;

  return (
    <WidgetContainer
      title="Gradient Descent in Higher Dimensions"
      description="Click the surface to set a starting point. Blue = low error, white = high error. Drag or use the slider to rotate."
      onReset={reset}
    >
      {/* Rotate slider */}
      <div className="mb-3">
        <SliderControl
          label="Rotate"
          value={rotY}
          min={-1.5}
          max={2.5}
          step={0.01}
          onChange={setRotY}
          formatValue={(v) => `${Math.round((v * 180) / Math.PI)}°`}
        />
      </div>

      {/* Buttons and stats */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={runRandomWalk}
          disabled={!clickPoint || randomRunning || gradientRunning}
          className="rounded-md bg-orange-400/10 px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-400/20 disabled:opacity-40"
        >
          {randomRunning ? "Running..." : "Random steps"}
        </button>
        <button
          onClick={runGradientDescent}
          disabled={!clickPoint || randomRunning || gradientRunning}
          className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {gradientRunning ? "Running..." : "Gradient descent"}
        </button>

        {randomPath.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
            <span className="text-muted">
              Random: {randomPath.length - 1} steps
              {randomLoss !== null && (
                <span className="ml-1 font-mono font-bold text-foreground">
                  (loss: {randomLoss.toFixed(4)})
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
              {gradientLoss !== null && (
                <span className="ml-1 font-mono font-bold text-foreground">
                  (loss: {gradientLoss.toFixed(4)})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full cursor-crosshair rounded-lg border border-border touch-none"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        {/* Surface mesh */}
        {projectedQuads.map((q, i) => {
          const pts = q.projected.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          return (
            <polygon
              key={i}
              points={pts}
              fill={q.color}
              stroke={q.color}
              strokeWidth="0.5"
              opacity={0.85}
            />
          );
        })}

        {/* Wireframe overlay */}
        {projectedQuads.map((q, i) => {
          const pts = q.projected.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          return (
            <polygon
              key={`w-${i}`}
              points={pts}
              fill="none"
              stroke="white"
              strokeWidth="0.3"
              opacity={0.15}
            />
          );
        })}

        {/* Random walk path */}
        {projRandomPath.map((p, i) =>
          i > 0 ? (
            <line
              key={`rp-${i}`}
              x1={projRandomPath[i - 1].sx} y1={projRandomPath[i - 1].sy}
              x2={p.sx} y2={p.sy}
              stroke="#fb923c" strokeWidth="2" opacity={0.8}
            />
          ) : null
        )}

        {/* Gradient descent path */}
        {projGradientPath.map((p, i) =>
          i > 0 ? (
            <line
              key={`gp-${i}`}
              x1={projGradientPath[i - 1].sx} y1={projGradientPath[i - 1].sy}
              x2={p.sx} y2={p.sy}
              stroke="#10b981" strokeWidth="2" opacity={0.8}
            />
          ) : null
        )}

        {/* Random walk endpoint */}
        {projRandomPath.length > 1 && (
          <circle
            cx={projRandomPath[projRandomPath.length - 1].sx}
            cy={projRandomPath[projRandomPath.length - 1].sy}
            r={5} fill="#fb923c" stroke="white" strokeWidth="1.5"
          />
        )}

        {/* Gradient endpoint */}
        {projGradientPath.length > 1 && (
          <circle
            cx={projGradientPath[projGradientPath.length - 1].sx}
            cy={projGradientPath[projGradientPath.length - 1].sy}
            r={5} fill="#10b981" stroke="white" strokeWidth="1.5"
          />
        )}

        {/* Gradient arrow */}
        {gradArrow && (
          <g>
            <line x1={gradArrow.sx} y1={gradArrow.sy} x2={gradArrow.ex} y2={gradArrow.ey} stroke="#e11d48" strokeWidth="2.5" />
            <line x1={gradArrow.ex} y1={gradArrow.ey} x2={gradArrow.h1x} y2={gradArrow.h1y} stroke="#e11d48" strokeWidth="2.5" />
            <line x1={gradArrow.ex} y1={gradArrow.ey} x2={gradArrow.h2x} y2={gradArrow.h2y} stroke="#e11d48" strokeWidth="2.5" />
            <text
              x={gradArrow.ex + 8}
              y={gradArrow.ey - 6}
              fontSize="10"
              fontWeight="600"
              fill="#e11d48"
            >
              gradient
            </text>
          </g>
        )}

        {/* Start point */}
        {projClick && (
          <circle
            cx={projClick.sx} cy={projClick.sy}
            r={6} fill="white" stroke="var(--color-foreground)" strokeWidth="2"
          />
        )}

        {/* Empty state */}
        {!clickPoint && (
          <text
            x={SVG_WIDTH / 2} y={SVG_HEIGHT - 20}
            textAnchor="middle" fill="currentColor" fontSize="13" opacity={0.3}
          >
            Click the surface to set a starting point
          </text>
        )}
      </svg>

    </WidgetContainer>
  );
}
