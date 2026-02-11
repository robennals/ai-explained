"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_SIZE = 440;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const BASE_SCALE = 70;

// Generate 4D hypercube (tesseract) vertices: all combinations of ±1
const VERTS_4D: [number, number, number, number][] = [];
for (let x = -1; x <= 1; x += 2) {
  for (let y = -1; y <= 1; y += 2) {
    for (let z = -1; z <= 1; z += 2) {
      for (let w = -1; w <= 1; w += 2) {
        VERTS_4D.push([x, y, z, w]);
      }
    }
  }
}

// Edges: pairs differing in exactly one coordinate
// Also track which dimension the edge spans
const EDGES_4D: [number, number, number][] = []; // [v1, v2, axis]
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let diffCount = 0;
    let diffAxis = 0;
    for (let k = 0; k < 4; k++) {
      if (VERTS_4D[i][k] !== VERTS_4D[j][k]) {
        diffCount++;
        diffAxis = k;
      }
    }
    if (diffCount === 1) {
      EDGES_4D.push([i, j, diffAxis]);
    }
  }
}

const EDGE_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#a855f7"]; // X, Y, Z, W
const PLANE_OPTIONS = [
  { value: "XW", label: "XW plane", desc: "Rotate X into W" },
  { value: "YW", label: "YW plane", desc: "Rotate Y into W" },
  { value: "ZW", label: "ZW plane", desc: "Rotate Z into W" },
  { value: "XY", label: "XY plane", desc: "Ordinary 2D rotation" },
  { value: "XZ", label: "XZ plane", desc: "Rotate X into Z" },
  { value: "YZ", label: "YZ plane", desc: "Rotate Y into Z" },
];

function rotate4D(
  v: [number, number, number, number],
  plane: string,
  angle: number
): [number, number, number, number] {
  const [x, y, z, w] = v;
  const co = Math.cos(angle),
    si = Math.sin(angle);
  switch (plane) {
    case "XY":
      return [x * co - y * si, x * si + y * co, z, w];
    case "XZ":
      return [x * co - z * si, y, x * si + z * co, w];
    case "XW":
      return [x * co - w * si, y, z, x * si + w * co];
    case "YZ":
      return [x, y * co - z * si, y * si + z * co, w];
    case "YW":
      return [x, y * co - w * si, z, y * si + w * co];
    case "ZW":
      return [x, y, z * co - w * si, z * si + w * co];
    default:
      return [x, y, z, w];
  }
}

function project4Dto2D(
  v: [number, number, number, number]
): { x: number; y: number; depth: number } {
  const [x, y, z, w] = v;

  // 4D → 3D perspective projection
  const wDist = 3;
  const s4 = wDist / (wDist + w);
  let x3 = x * s4;
  let y3 = y * s4;
  let z3 = z * s4;

  // Apply fixed 3D viewing rotation
  const viewRx = 0.4;
  const viewRy = 0.6;

  // Rotate around X
  const cxr = Math.cos(viewRx),
    sxr = Math.sin(viewRx);
  const y3r = y3 * cxr - z3 * sxr;
  const z3r = y3 * sxr + z3 * cxr;
  y3 = y3r;
  z3 = z3r;

  // Rotate around Y
  const cyr = Math.cos(viewRy),
    syr = Math.sin(viewRy);
  const x3r = x3 * cyr + z3 * syr;
  const z3r2 = -x3 * syr + z3 * cyr;
  x3 = x3r;
  z3 = z3r2;

  // 3D → 2D perspective
  const zDist = 5;
  const s3 = zDist / (zDist + z3);

  return {
    x: CX + x3 * s3 * BASE_SCALE,
    y: CY - y3 * s3 * BASE_SCALE,
    depth: z3 + w * 0.3,
  };
}

export function HigherDimensions() {
  const [plane, setPlane] = useState("XW");
  const [isAnimating, setIsAnimating] = useState(true);
  const angleRef = useRef(0);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number>(0);

  const handleReset = useCallback(() => {
    setPlane("XW");
    setIsAnimating(true);
    angleRef.current = 0;
    setAngle(0);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastTime = 0;
    const animate = (time: number) => {
      if (lastTime) {
        const dt = time - lastTime;
        angleRef.current += dt * 0.001; // radians per second
      }
      lastTime = time;
      setAngle(angleRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isAnimating]);

  // Transform all vertices
  const projectedVerts = useMemo(() => {
    return VERTS_4D.map((v) => {
      const rotated = rotate4D(v, plane, angle);
      return project4Dto2D(rotated);
    });
  }, [plane, angle]);

  // Sort edges by depth
  const sortedEdges = useMemo(() => {
    return [...EDGES_4D]
      .map(([i, j, axis]) => ({
        i,
        j,
        axis,
        avgDepth: (projectedVerts[i].depth + projectedVerts[j].depth) / 2,
      }))
      .sort((a, b) => a.avgDepth - b.avgDepth);
  }, [projectedVerts]);

  return (
    <WidgetContainer
      title="Rotation in Four Dimensions"
      description="A tesseract — the 4D equivalent of a cube — projected to your screen"
      onReset={handleReset}
    >
      {/* Dimension comparison table */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-1.5 text-left font-medium text-muted">
                Dim
              </th>
              <th className="px-3 py-1.5 text-left font-medium text-muted">
                Matrix
              </th>
              <th className="px-3 py-1.5 text-left font-medium text-muted">
                Entries
              </th>
              <th className="px-3 py-1.5 text-left font-medium text-muted">
                Rotation planes
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            <tr className="border-b border-border/50">
              <td className="px-3 py-1">2D</td>
              <td className="px-3 py-1">2&times;2</td>
              <td className="px-3 py-1">4</td>
              <td className="px-3 py-1">1</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="px-3 py-1">3D</td>
              <td className="px-3 py-1">3&times;3</td>
              <td className="px-3 py-1">9</td>
              <td className="px-3 py-1">3</td>
            </tr>
            <tr className="border-b border-border/50 bg-accent/5 font-semibold">
              <td className="px-3 py-1">4D</td>
              <td className="px-3 py-1">4&times;4</td>
              <td className="px-3 py-1">16</td>
              <td className="px-3 py-1">6</td>
            </tr>
            <tr>
              <td className="px-3 py-1 text-muted">768D</td>
              <td className="px-3 py-1 text-muted">768&times;768</td>
              <td className="px-3 py-1 text-muted">589,824</td>
              <td className="px-3 py-1 text-muted">294,528</td>
            </tr>
          </tbody>
        </table>
      </div>

      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full"
        style={{ maxHeight: 400 }}
      >
        {/* Edges sorted by depth */}
        {sortedEdges.map(({ i, j, axis, avgDepth }) => {
          const opacity = 0.15 + 0.65 * Math.max(0, Math.min(1, (avgDepth + 3) / 6));
          const v1 = projectedVerts[i];
          const v2 = projectedVerts[j];
          return (
            <line
              key={`${i}-${j}`}
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke={EDGE_COLORS[axis]}
              strokeWidth={1.8}
              opacity={Math.max(0.1, Math.min(0.9, opacity))}
            />
          );
        })}

        {/* Vertices */}
        {projectedVerts.map((v, i) => {
          const opacity = 0.2 + 0.6 * Math.max(0, Math.min(1, (v.depth + 3) / 6));
          return (
            <circle
              key={i}
              cx={v.x}
              cy={v.y}
              r={2.5}
              fill="#1a1a2e"
              opacity={Math.max(0.1, Math.min(0.9, opacity))}
            />
          );
        })}

        {/* Legend */}
        {[
          ["X", EDGE_COLORS[0]],
          ["Y", EDGE_COLORS[1]],
          ["Z", EDGE_COLORS[2]],
          ["W", EDGE_COLORS[3]],
        ].map(([label, color], i) => (
          <g key={label} transform={`translate(${15 + i * 50}, ${SVG_SIZE - 18})`}>
            <line x1={0} y1={0} x2={16} y2={0} stroke={color} strokeWidth={2.5} />
            <text x={20} y={4} fontSize={11} fill={color} fontWeight="600">
              {label}
            </text>
          </g>
        ))}
      </svg>

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted">Rotation plane:</span>
        {PLANE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setPlane(opt.value);
              angleRef.current = 0;
              setAngle(0);
            }}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              plane === opt.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-surface hover:text-foreground"
            }`}
            title={opt.desc}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {isAnimating ? "Pause" : "Play"}
        </button>
        <span className="text-xs text-muted">
          {plane.includes("W")
            ? "Watch the inner and outer cubes swap \u2014 that\u2019s 4D rotation!"
            : "This looks like an ordinary 3D rotation"}
        </span>
      </div>
    </WidgetContainer>
  );
}
