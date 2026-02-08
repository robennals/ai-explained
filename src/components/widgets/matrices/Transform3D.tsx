"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_SIZE = 420;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const BASE_SCALE = 80;

// --- 3D Model definitions ---

interface Face3D {
  verts: number[];
  color: string;
}

interface Model3D {
  label: string;
  vertices: [number, number, number][];
  faces: Face3D[];
}

// Procedurally generate a UV sphere
function generateSphere(latSegs: number, lonSegs: number): Model3D {
  const vertices: [number, number, number][] = [];
  const faces: Face3D[] = [];
  const bandColors = ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd"];

  for (let lat = 0; lat <= latSegs; lat++) {
    const theta = (lat / latSegs) * Math.PI;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    for (let lon = 0; lon <= lonSegs; lon++) {
      const phi = (lon / lonSegs) * 2 * Math.PI;
      vertices.push([sinT * Math.cos(phi), cosT, sinT * Math.sin(phi)]);
    }
  }

  for (let lat = 0; lat < latSegs; lat++) {
    for (let lon = 0; lon < lonSegs; lon++) {
      const a = lat * (lonSegs + 1) + lon;
      const b = a + lonSegs + 1;
      const color = bandColors[(lat + lon) % bandColors.length];
      if (lat > 0) faces.push({ verts: [a, b, b + 1], color });
      if (lat < latSegs - 1) faces.push({ verts: [a, b + 1, a + 1], color });
    }
  }

  return { label: "Sphere", vertices, faces };
}

const SPHERE = generateSphere(8, 12);

const MODELS: Record<string, Model3D> = {
  cube: {
    label: "Cube",
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ],
    faces: [
      { verts: [0, 3, 2, 1], color: "#3b82f6" },
      { verts: [4, 5, 6, 7], color: "#2563eb" },
      { verts: [0, 4, 7, 3], color: "#60a5fa" },
      { verts: [1, 2, 6, 5], color: "#1d4ed8" },
      { verts: [3, 7, 6, 2], color: "#93c5fd" },
      { verts: [0, 1, 5, 4], color: "#1e40af" },
    ],
  },
  pyramid: {
    label: "Pyramid",
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1],
      [0, 1.2, 0],
    ],
    faces: [
      { verts: [0, 1, 2, 3], color: "#1e40af" },
      { verts: [0, 4, 1], color: "#f59e0b" },
      { verts: [1, 4, 2], color: "#d97706" },
      { verts: [2, 4, 3], color: "#f59e0b" },
      { verts: [3, 4, 0], color: "#d97706" },
    ],
  },
  diamond: {
    label: "Diamond",
    vertices: [
      [1, 0, 0], [-1, 0, 0],
      [0, 1.3, 0], [0, -1.3, 0],
      [0, 0, 1], [0, 0, -1],
    ],
    faces: [
      { verts: [0, 2, 4], color: "#06b6d4" },
      { verts: [0, 4, 3], color: "#0891b2" },
      { verts: [0, 3, 5], color: "#06b6d4" },
      { verts: [0, 5, 2], color: "#0891b2" },
      { verts: [1, 4, 2], color: "#22d3ee" },
      { verts: [1, 3, 4], color: "#67e8f9" },
      { verts: [1, 5, 3], color: "#22d3ee" },
      { verts: [1, 2, 5], color: "#67e8f9" },
    ],
  },
  house: {
    label: "House",
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, 0, -1], [-1, 0, -1],
      [-1, -1, 1], [1, -1, 1], [1, 0, 1], [-1, 0, 1],
      [0, 0.8, -1], [0, 0.8, 1],
    ],
    faces: [
      // Front wall (triangulated pentagon)
      { verts: [0, 1, 2], color: "#fbbf24" },
      { verts: [0, 2, 8], color: "#fbbf24" },
      { verts: [0, 8, 3], color: "#fbbf24" },
      // Back wall
      { verts: [5, 4, 7], color: "#f59e0b" },
      { verts: [5, 7, 9], color: "#f59e0b" },
      { verts: [5, 9, 6], color: "#f59e0b" },
      // Left wall
      { verts: [4, 0, 3, 7], color: "#d97706" },
      // Right wall
      { verts: [1, 5, 6, 2], color: "#b45309" },
      // Floor
      { verts: [4, 5, 1, 0], color: "#78350f" },
      // Left roof
      { verts: [3, 8, 9, 7], color: "#ef4444" },
      // Right roof
      { verts: [8, 2, 6, 9], color: "#dc2626" },
    ],
  },
  sphere: SPHERE,
};

type ModelId = keyof typeof MODELS;

// --- Presets (expressed as basis vectors) ---

interface Preset3D {
  label: string;
  e1: [number, number, number];
  e2: [number, number, number];
  e3: [number, number, number];
}

const cos = Math.cos;
const sin = Math.sin;
const a45 = Math.PI / 4;

const PRESETS_3D: Preset3D[] = [
  { label: "Identity", e1: [1, 0, 0], e2: [0, 1, 0], e3: [0, 0, 1] },
  {
    label: "Rot X 45\u00b0",
    e1: [1, 0, 0],
    e2: [0, cos(a45), sin(a45)],
    e3: [0, -sin(a45), cos(a45)],
  },
  {
    label: "Rot Y 45\u00b0",
    e1: [cos(a45), 0, -sin(a45)],
    e2: [0, 1, 0],
    e3: [sin(a45), 0, cos(a45)],
  },
  {
    label: "Rot Z 45\u00b0",
    e1: [cos(a45), sin(a45), 0],
    e2: [-sin(a45), cos(a45), 0],
    e3: [0, 0, 1],
  },
  { label: "Scale 1.5\u00d7", e1: [1.5, 0, 0], e2: [0, 1.5, 0], e3: [0, 0, 1.5] },
  { label: "Flatten Y", e1: [1, 0, 0], e2: [0, 0, 0], e3: [0, 0, 1] },
  { label: "Shear XY", e1: [1, 0, 0], e2: [0.5, 1, 0], e3: [0, 0, 1] },
];

// --- Projection & lighting ---

function rotateX(v: [number, number, number], a: number): [number, number, number] {
  const c = cos(a), s = sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

function rotateY(v: [number, number, number], a: number): [number, number, number] {
  const c = cos(a), s = sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

const VIEW_RX = 0.45;
const VIEW_RY = 0.65;

function viewRotate(v: [number, number, number]): [number, number, number] {
  let p = rotateX(v, VIEW_RX);
  p = rotateY(p, VIEW_RY);
  return p;
}

function projectToSVG(v: [number, number, number]): { x: number; y: number; depth: number } {
  const perspective = 6;
  const s = perspective / (perspective + v[2]);
  return {
    x: CX + v[0] * s * BASE_SCALE,
    y: CY - v[1] * s * BASE_SCALE,
    depth: v[2],
  };
}

function applyMatrix3(v: [number, number, number], m: number[][]): [number, number, number] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function cross(a: number[], b: number[]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function vecLen(v: number[]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

const LIGHT_DIR: [number, number, number] = [0.3, 0.8, -0.5];
const LIGHT_LEN = vecLen(LIGHT_DIR);

function computeBrightness(normal: [number, number, number]): number {
  const nLen = vecLen(normal);
  if (nLen < 0.0001) return 0.5;
  const dot = (normal[0] * LIGHT_DIR[0] + normal[1] * LIGHT_DIR[1] + normal[2] * LIGHT_DIR[2]) / (nLen * LIGHT_LEN);
  return 0.35 + 0.65 * Math.abs(dot);
}

function adjustColor(hex: string, brightness: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r * brightness));
  const ng = Math.min(255, Math.round(g * brightness));
  const nb = Math.min(255, Math.round(b * brightness));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

// --- Component ---

export function Transform3D() {
  // Matrix stored as rows, columns are basis vectors:
  // col 0 = ê₁ (where X goes), col 1 = ê₂ (where Y goes), col 2 = ê₃ (where Z goes)
  const [matrix, setMatrix] = useState<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  const [modelId, setModelId] = useState<ModelId>("cube");

  const model = MODELS[modelId];

  const handleReset = useCallback(() => {
    setMatrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  }, []);

  const updateCell = useCallback(
    (r: number, c: number, value: number) => {
      setMatrix((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = value;
        return next;
      });
    },
    []
  );

  // Transform vertices, then apply view rotation
  const viewVerts = useMemo(
    () =>
      model.vertices.map((v) => {
        const tv = applyMatrix3(v, matrix);
        return viewRotate(tv);
      }),
    [matrix, model]
  );

  // Project to SVG
  const projected = useMemo(
    () => viewVerts.map((v) => projectToSVG(v)),
    [viewVerts]
  );

  // Original (ghost) wireframe
  const origProjected = useMemo(() => {
    // Compute edges from faces for wireframe
    const edgeSet = new Set<string>();
    const edges: [number, number][] = [];
    for (const face of model.faces) {
      for (let i = 0; i < face.verts.length; i++) {
        const a = face.verts[i];
        const b = face.verts[(i + 1) % face.verts.length];
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([a, b]);
        }
      }
    }
    const verts = model.vertices.map((v) => projectToSVG(viewRotate(v)));
    return { verts, edges };
  }, [model]);

  // Compute face render data (sorted back-to-front)
  const sortedFaces = useMemo(() => {
    return model.faces
      .map((face) => {
        const pts3D = face.verts.map((i) => viewVerts[i]);
        const pts2D = face.verts.map((i) => projected[i]);
        const avgDepth = pts3D.reduce((s, p) => s + p[2], 0) / pts3D.length;

        // Face normal from first two edges
        const e1 = [
          pts3D[1][0] - pts3D[0][0],
          pts3D[1][1] - pts3D[0][1],
          pts3D[1][2] - pts3D[0][2],
        ];
        const e2 = [
          pts3D[2][0] - pts3D[0][0],
          pts3D[2][1] - pts3D[0][1],
          pts3D[2][2] - pts3D[0][2],
        ];
        const normal = cross(e1, e2);
        const brightness = computeBrightness(normal);
        const fillColor = adjustColor(face.color, brightness);

        return { face, avgDepth, pts2D, fillColor };
      })
      .sort((a, b) => a.avgDepth - b.avgDepth);
  }, [viewVerts, projected, model]);

  // Axis arrows
  const axisEnds = useMemo(
    () =>
      ([
        [1.5, 0, 0],
        [0, 1.5, 0],
        [0, 0, 1.5],
      ] as [number, number, number][]).map((v) =>
        projectToSVG(viewRotate(applyMatrix3(v, matrix)))
      ),
    [matrix]
  );

  const origin = projectToSVG(viewRotate(applyMatrix3([0, 0, 0], matrix)));

  const AXIS_COLORS = ["#ef4444", "#22c55e", "#3b82f6"];
  const AXIS_LABELS = ["X", "Y", "Z"];

  return (
    <WidgetContainer
      title="3D Matrix Transformation"
      description="Nine numbers control where three basis vectors land — and all of 3D space follows"
      onReset={handleReset}
    >
      {/* Model selector */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">Model:</span>
        {(Object.keys(MODELS) as ModelId[]).map((id) => (
          <button
            key={id}
            onClick={() => setModelId(id)}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              modelId === id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {MODELS[id].label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full"
        style={{ maxHeight: 380 }}
      >
        {/* Original wireframe (faint ghost) */}
        {origProjected.edges.map(([i, j], idx) => (
          <line
            key={`orig-${idx}`}
            x1={origProjected.verts[i].x}
            y1={origProjected.verts[i].y}
            x2={origProjected.verts[j].x}
            y2={origProjected.verts[j].y}
            stroke="#d1d5db"
            strokeWidth={0.8}
            opacity={0.25}
          />
        ))}

        {/* Transformed filled faces sorted by depth */}
        {sortedFaces.map(({ face, pts2D, fillColor }, idx) => {
          const points = pts2D.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <polygon
              key={`face-${idx}`}
              points={points}
              fill={fillColor}
              stroke="#0002"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Axis arrows */}
        {axisEnds.map((end, i) => (
          <g key={`ax${i}`}>
            <line
              x1={origin.x}
              y1={origin.y}
              x2={end.x}
              y2={end.y}
              stroke={AXIS_COLORS[i]}
              strokeWidth={2}
              opacity={0.8}
            />
            <text
              x={end.x + 6}
              y={end.y - 6}
              fill={AXIS_COLORS[i]}
              fontSize={12}
              fontWeight="bold"
            >
              {AXIS_LABELS[i]}
            </text>
          </g>
        ))}
      </svg>

      {/* Matrix display with colored columns */}
      <div className="my-3 flex justify-center">
        <div className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm">
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span className="text-lg leading-none text-muted">[</span>
              <span className="w-12 text-center font-semibold text-red-500">
                {matrix[r][0].toFixed(2)}
              </span>
              <span className="w-12 text-center font-semibold text-green-600">
                {matrix[r][1].toFixed(2)}
              </span>
              <span className="w-12 text-center font-semibold text-blue-500">
                {matrix[r][2].toFixed(2)}
              </span>
              <span className="text-lg leading-none text-muted">]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three colored basis-vector slider boxes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* ê₁ (red) — where X-axis lands */}
        <div className="rounded-lg border-2 border-red-400 bg-red-500/5 p-2">
          <div className="mb-1 text-[10px] font-semibold text-red-500">
            &#x00ea;&#x0302;&#x2081; &mdash; where X lands
          </div>
          {["x", "y", "z"].map((axis, r) => (
            <div key={axis} className="flex items-center gap-1.5">
              <span className="w-3 shrink-0 text-[10px] font-medium text-red-400">{axis}</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={matrix[r][0]}
                onChange={(e) => updateCell(r, 0, parseFloat(e.target.value))}
                className="h-1 flex-1"
                style={{ accentColor: "#ef4444" }}
              />
              <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-red-500">
                {matrix[r][0].toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* ê₂ (green) — where Y-axis lands */}
        <div className="rounded-lg border-2 border-green-500 bg-green-500/5 p-2">
          <div className="mb-1 text-[10px] font-semibold text-green-600">
            &#x00ea;&#x0302;&#x2082; &mdash; where Y lands
          </div>
          {["x", "y", "z"].map((axis, r) => (
            <div key={axis} className="flex items-center gap-1.5">
              <span className="w-3 shrink-0 text-[10px] font-medium text-green-500">{axis}</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={matrix[r][1]}
                onChange={(e) => updateCell(r, 1, parseFloat(e.target.value))}
                className="h-1 flex-1"
                style={{ accentColor: "#22c55e" }}
              />
              <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-green-600">
                {matrix[r][1].toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* ê₃ (blue) — where Z-axis lands */}
        <div className="rounded-lg border-2 border-blue-500 bg-blue-500/5 p-2">
          <div className="mb-1 text-[10px] font-semibold text-blue-500">
            &#x00ea;&#x0302;&#x2083; &mdash; where Z lands
          </div>
          {["x", "y", "z"].map((axis, r) => (
            <div key={axis} className="flex items-center gap-1.5">
              <span className="w-3 shrink-0 text-[10px] font-medium text-blue-400">{axis}</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.01}
                value={matrix[r][2]}
                onChange={(e) => updateCell(r, 2, parseFloat(e.target.value))}
                className="h-1 flex-1"
                style={{ accentColor: "#3b82f6" }}
              />
              <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-blue-500">
                {matrix[r][2].toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {PRESETS_3D.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setMatrix([
                [preset.e1[0], preset.e2[0], preset.e3[0]],
                [preset.e1[1], preset.e2[1], preset.e3[1]],
                [preset.e1[2], preset.e2[2], preset.e3[2]],
              ]);
            }}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </WidgetContainer>
  );
}
