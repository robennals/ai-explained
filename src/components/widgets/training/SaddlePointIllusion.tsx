"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_THETA = 0.3; // Y-axis rotation — hides the saddle
const INITIAL_PHI = 0.8; // X-axis rotation — tilts toward viewer

const GRID_MIN = -1.5;
const GRID_MAX = 1.5;
const GRID_STEP = 0.15;
const SCALE = 80;
const CX = 250; // SVG center x
const CY = 200; // SVG center y
const SVG_WIDTH = 500;
const SVG_HEIGHT = 420;

/* How far (in radians) the user must drag before we consider the
   saddle "revealed". A little past 45 degrees of total rotation. */
const REVEAL_THRESHOLD = 0.8;

/* ------------------------------------------------------------------ */
/*  Grid generation                                                    */
/* ------------------------------------------------------------------ */

interface Point3D {
  x: number;
  y: number;
  z: number;
}

function buildGrid(): Point3D[][] {
  const rows: Point3D[][] = [];
  for (let yi = GRID_MIN; yi <= GRID_MAX + 1e-9; yi += GRID_STEP) {
    const row: Point3D[] = [];
    for (let xi = GRID_MIN; xi <= GRID_MAX + 1e-9; xi += GRID_STEP) {
      row.push({ x: xi, y: yi, z: xi * xi - yi * yi });
    }
    rows.push(row);
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/*  3D → 2D projection                                                 */
/* ------------------------------------------------------------------ */

function project(
  p: Point3D,
  theta: number,
  phi: number,
): { sx: number; sy: number; depth: number } {
  // Rotate around Y axis first
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x1 = p.x * cosT + p.z * sinT;
  const y1 = p.y;
  const z1 = -p.x * sinT + p.z * cosT;

  // Then rotate around X axis
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  return {
    sx: CX + x2 * SCALE,
    sy: CY - y2 * SCALE, // SVG y is inverted
    depth: z2,
  };
}

/* ------------------------------------------------------------------ */
/*  Color by original z value                                          */
/* ------------------------------------------------------------------ */

function colorForZ(z: number): string {
  // z ranges roughly from -2.25 to 2.25 for our grid
  const t = Math.max(-1, Math.min(1, z / 2.25)); // normalise to [-1, 1]
  if (t > 0.05) {
    // positive z → red
    const intensity = Math.min(1, t);
    const r = Math.round(180 + 75 * intensity);
    const g = Math.round(80 * (1 - intensity));
    const b = Math.round(80 * (1 - intensity));
    return `rgb(${r},${g},${b})`;
  }
  if (t < -0.05) {
    // negative z → blue
    const intensity = Math.min(1, -t);
    const r = Math.round(80 * (1 - intensity));
    const g = Math.round(80 * (1 - intensity));
    const b = Math.round(180 + 75 * intensity);
    return `rgb(${r},${g},${b})`;
  }
  // near zero → green
  return "rgb(60,180,90)";
}

/* Average z of two points, used to colour connecting segments. */
function segmentColor(a: Point3D, b: Point3D): string {
  return colorForZ((a.z + b.z) / 2);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SaddlePointIllusion() {
  const [theta, setTheta] = useState(INITIAL_THETA);
  const [phi, setPhi] = useState(INITIAL_PHI);
  const [hasRotated, setHasRotated] = useState(false);
  const dragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const grid = useMemo(() => buildGrid(), []);

  /* Has the user rotated enough to see the saddle shape? */
  const saddleRevealed =
    Math.abs(theta - INITIAL_THETA) + Math.abs(phi - INITIAL_PHI) >
    REVEAL_THRESHOLD;

  /* ------ drag helpers ------ */

  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current || !lastPos.current) return;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    lastPos.current = { x: clientX, y: clientY };
    setTheta((prev) => prev + dx * 0.008);
    setPhi((prev) => prev + dy * 0.008);
    setHasRotated(true);
  }, []);

  const endDrag = useCallback(() => {
    dragging.current = false;
    lastPos.current = null;
  }, []);

  /* ------ mouse events ------ */
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    },
    [startDrag],
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY),
    [moveDrag],
  );
  const onMouseUp = useCallback(() => endDrag(), [endDrag]);
  const onMouseLeave = useCallback(() => endDrag(), [endDrag]);

  /* ------ touch events ------ */
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    [startDrag],
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    [moveDrag],
  );
  const onTouchEnd = useCallback(() => endDrag(), [endDrag]);

  /* ------ reset ------ */
  const handleReset = useCallback(() => {
    setTheta(INITIAL_THETA);
    setPhi(INITIAL_PHI);
    setHasRotated(false);
  }, []);

  /* ------ build SVG lines ------ */
  const lines = useMemo(() => {
    const segs: {
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      depth: number;
    }[] = [];

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const p = grid[r][c];
        const proj = project(p, theta, phi);

        // horizontal line to next column
        if (c + 1 < grid[r].length) {
          const q = grid[r][c + 1];
          const projQ = project(q, theta, phi);
          segs.push({
            key: `h-${r}-${c}`,
            x1: proj.sx,
            y1: proj.sy,
            x2: projQ.sx,
            y2: projQ.sy,
            color: segmentColor(p, q),
            depth: (proj.depth + projQ.depth) / 2,
          });
        }

        // vertical line to next row
        if (r + 1 < grid.length) {
          const q = grid[r + 1][c];
          const projQ = project(q, theta, phi);
          segs.push({
            key: `v-${r}-${c}`,
            x1: proj.sx,
            y1: proj.sy,
            x2: projQ.sx,
            y2: projQ.sy,
            color: segmentColor(p, q),
            depth: (proj.depth + projQ.depth) / 2,
          });
        }
      }
    }

    // Sort by depth so farther segments are drawn first (painter's algorithm)
    segs.sort((a, b) => a.depth - b.depth);
    return segs;
  }, [grid, theta, phi]);

  /* ------ render ------ */

  return (
    <WidgetContainer
      title="The Saddle Point Illusion"
      description="This surface looks like a trap. Drag to rotate and discover the escape route."
      onReset={handleReset}
    >
      <div className="flex flex-col items-center gap-4">
        {/* SVG surface */}
        <div className="relative">
          <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="cursor-grab select-none active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Background */}
            <rect
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              rx={8}
              fill="var(--color-surface, #111)"
              opacity={0.5}
            />

            {/* Wireframe */}
            {lines.map((seg) => (
              <line
                key={seg.key}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={seg.color}
                strokeWidth={1}
                opacity={0.75}
              />
            ))}

            {/* "Drag to rotate" hint */}
            {!hasRotated && (
              <text
                x={CX}
                y={SVG_HEIGHT - 24}
                textAnchor="middle"
                fill="var(--color-muted, #999)"
                fontSize={13}
                fontFamily="sans-serif"
              >
                Drag to rotate
              </text>
            )}

            {/* Reveal message */}
            {saddleRevealed && (
              <text
                x={CX}
                y={SVG_HEIGHT - 24}
                textAnchor="middle"
                fill="rgb(60,180,90)"
                fontSize={13}
                fontWeight={600}
                fontFamily="sans-serif"
              >
                It&apos;s a saddle point &mdash; not a trap!
              </text>
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="w-full max-w-md rounded-lg border border-widget-border bg-surface/60 px-4 py-3 text-sm leading-relaxed text-muted">
          <div className="mb-1.5 font-medium text-foreground">
            Why saddle points aren&apos;t traps in high dimensions
          </div>
          <div className="space-y-1">
            <div>
              In <span className="font-semibold text-foreground">2D</span>:
              ~50% of critical points are true minima
            </div>
            <div>
              In <span className="font-semibold text-foreground">100D</span>:
              fewer than{" "}
              <span className="font-semibold text-foreground">
                1 in 10<sup>30</sup>
              </span>{" "}
              critical points is a true minimum
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
