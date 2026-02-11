"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import chickenData from "./models/chicken.json";
import shibaData from "./models/shiba.json";

const SVG_SIZE = 420;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const BASE_SCALE = 80;

// --- Types ---

interface Face3D {
  verts: number[];
  color: string;
}

interface Model3D {
  label: string;
  attribution: string;
  vertices: [number, number, number][];
  faces: Face3D[];
}

// --- Load external models from JSON ---

function loadCompactModel(
  data: { label: string; v: number[][]; f: { v: number[]; c: string }[] },
  attribution: string,
): Model3D {
  return {
    label: data.label,
    attribution,
    vertices: data.v as [number, number, number][],
    faces: data.f.map((f) => ({ verts: f.v, color: f.c })),
  };
}

type CompactData = { label: string; v: number[][]; f: { v: number[]; c: string }[] };

const CHICKEN = loadCompactModel(chickenData as CompactData, "Chicken by jeremy [CC-BY] via Poly Pizza");
const SHIBA = loadCompactModel(shibaData as CompactData, "Shiba Inu by Pat Siefring [CC-BY] via Poly Pizza");

const MODELS: Record<string, Model3D> = {
  chicken: CHICKEN,
  shiba: SHIBA,
};

type ModelId = keyof typeof MODELS;

// --- Math helpers ---

const cos = Math.cos;
const sin = Math.sin;
const DEG = Math.PI / 180;

function rotateXVec(v: [number, number, number], a: number): [number, number, number] {
  const c = cos(a), s = sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

function rotateYVec(v: [number, number, number], a: number): [number, number, number] {
  const c = cos(a), s = sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function rotateZVec(v: [number, number, number], a: number): [number, number, number] {
  const c = cos(a), s = sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}

/** Build rotation matrix from Euler angles (degrees) */
function rotationMatrix(rx: number, ry: number, rz: number): number[][] {
  let e1: [number, number, number] = [1, 0, 0];
  let e2: [number, number, number] = [0, 1, 0];
  let e3: [number, number, number] = [0, 0, 1];
  const ax = rx * DEG, ay = ry * DEG, az = rz * DEG;
  e1 = rotateXVec(e1, ax); e2 = rotateXVec(e2, ax); e3 = rotateXVec(e3, ax);
  e1 = rotateYVec(e1, ay); e2 = rotateYVec(e2, ay); e3 = rotateYVec(e3, ay);
  e1 = rotateZVec(e1, az); e2 = rotateZVec(e2, az); e3 = rotateZVec(e3, az);
  return [
    [e1[0], e2[0], e3[0]],
    [e1[1], e2[1], e3[1]],
    [e1[2], e2[2], e3[2]],
  ];
}

/** Build scale matrix */
function scaleMatrix(sx: number, sy: number, sz: number): number[][] {
  return [[sx, 0, 0], [0, sy, 0], [0, 0, sz]];
}

/** Build shear matrix: shear axis `a` by `amount` in direction `d` */
function shearMatrix(plane: string, amount: number): number[][] {
  const m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  // plane names: XY means "shear X by Y" (m[0][1]), etc.
  if (plane === "XY") m[0][1] = amount;
  else if (plane === "XZ") m[0][2] = amount;
  else if (plane === "YX") m[1][0] = amount;
  else if (plane === "YZ") m[1][2] = amount;
  else if (plane === "ZX") m[2][0] = amount;
  else if (plane === "ZY") m[2][1] = amount;
  return m;
}

// --- Projection & lighting ---

const VIEW_RX = 0.45;
const VIEW_RY = 0.65;

function viewRotate(v: [number, number, number]): [number, number, number] {
  let p = rotateXVec(v, VIEW_RX);
  p = rotateYVec(p, VIEW_RY);
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

// --- Operation types ---

type OpType = "rotate" | "scale" | "shear" | "flatten" | null;

// --- Component ---

export function Transform3D() {
  const [matrix, setMatrix] = useState<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  const [modelId, setModelId] = useState<ModelId>("chicken");
  const [activeOp, setActiveOp] = useState<OpType>(null);

  // Operation-specific state
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const [scX, setScX] = useState(1);
  const [scY, setScY] = useState(1);
  const [scZ, setScZ] = useState(1);
  const [shearPlane, setShearPlane] = useState("XY");
  const [shearAmt, setShearAmt] = useState(0);
  const [flattenAxis, setFlattenAxis] = useState("Y");

  const model = MODELS[modelId];

  const handleReset = useCallback(() => {
    setMatrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    setActiveOp(null);
  }, []);

  const updateCell = useCallback(
    (r: number, c: number, value: number) => {
      setActiveOp(null); // close operation panel when editing directly
      setMatrix((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = value;
        return next;
      });
    },
    [],
  );

  const openOp = useCallback((op: OpType) => {
    if (activeOp === op) {
      setActiveOp(null);
      return;
    }
    setActiveOp(op);
    // Reset operation params and set matrix to that operation's default
    if (op === "rotate") {
      setRotX(0); setRotY(0); setRotZ(0);
      setMatrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    } else if (op === "scale") {
      setScX(1); setScY(1); setScZ(1);
      setMatrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    } else if (op === "shear") {
      setShearPlane("XY"); setShearAmt(0);
      setMatrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    } else if (op === "flatten") {
      setFlattenAxis("Y");
      setMatrix([[1, 0, 0], [0, 0, 0], [0, 0, 1]]);
    }
  }, [activeOp]);

  // Operation slider handlers that update the matrix
  const updateRotation = useCallback((rx: number, ry: number, rz: number) => {
    setRotX(rx); setRotY(ry); setRotZ(rz);
    setMatrix(rotationMatrix(rx, ry, rz));
  }, []);

  const updateScale = useCallback((sx: number, sy: number, sz: number) => {
    setScX(sx); setScY(sy); setScZ(sz);
    setMatrix(scaleMatrix(sx, sy, sz));
  }, []);

  const updateShear = useCallback((plane: string, amount: number) => {
    setShearPlane(plane); setShearAmt(amount);
    setMatrix(shearMatrix(plane, amount));
  }, []);

  const updateFlatten = useCallback((axis: string) => {
    setFlattenAxis(axis);
    const m: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    if (axis === "X") m[0][0] = 0;
    else if (axis === "Y") m[1][1] = 0;
    else if (axis === "Z") m[2][2] = 0;
    setMatrix(m);
  }, []);

  // Transform vertices, then apply view rotation
  const viewVerts = useMemo(
    () => model.vertices.map((v) => viewRotate(applyMatrix3(v, matrix))),
    [matrix, model],
  );

  const projected = useMemo(
    () => viewVerts.map((v) => projectToSVG(v)),
    [viewVerts],
  );

  const sortedFaces = useMemo(() => {
    return model.faces
      .map((face, idx) => {
        const pts3D = face.verts.map((i) => viewVerts[i]);
        const pts2D = face.verts.map((i) => projected[i]);
        const avgDepth = pts3D.reduce((s, p) => s + p[2], 0) / pts3D.length;
        const edge1 = [
          pts3D[1][0] - pts3D[0][0], pts3D[1][1] - pts3D[0][1], pts3D[1][2] - pts3D[0][2],
        ];
        const edge2 = [
          pts3D[2][0] - pts3D[0][0], pts3D[2][1] - pts3D[0][1], pts3D[2][2] - pts3D[0][2],
        ];
        const normal = cross(edge1, edge2);
        const brightness = computeBrightness(normal);
        const fillColor = adjustColor(face.color, brightness);
        return { idx, avgDepth, pts2D, fillColor };
      })
      .sort((a, b) => a.avgDepth - b.avgDepth);
  }, [viewVerts, projected, model]);

  const axisEnds = useMemo(
    () =>
      ([
        [1.5, 0, 0], [0, 1.5, 0], [0, 0, 1.5],
      ] as [number, number, number][]).map((v) =>
        projectToSVG(viewRotate(applyMatrix3(v, matrix))),
      ),
    [matrix],
  );

  const origin = projectToSVG(viewRotate(applyMatrix3([0, 0, 0], matrix)));
  const AXIS_COLORS = ["#ef4444", "#22c55e", "#3b82f6"];
  const AXIS_LABELS = ["X", "Y", "Z"];
  const modelIds = Object.keys(MODELS) as ModelId[];

  return (
    <WidgetContainer
      title="3D Matrix Transformation"
      description="Nine numbers control where three basis vectors land — and all of 3D space follows"
      onReset={handleReset}
    >
      {/* Model selector */}
      {modelIds.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">Model:</span>
          {modelIds.map((id) => (
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
      )}

      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full"
        style={{ maxHeight: 380 }}
      >
        <defs>
          {AXIS_COLORS.map((color, i) => (
            <marker key={i} id={`arrow${i}`} viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>

        {sortedFaces.map(({ idx, pts2D, fillColor }) => (
          <polygon
            key={`face-${idx}`}
            points={pts2D.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={fillColor}
            stroke="#0002"
            strokeWidth={0.5}
          />
        ))}

        {axisEnds.map((end, i) => (
          <g key={`ax${i}`}>
            <line x1={origin.x} y1={origin.y} x2={end.x} y2={end.y}
              stroke={AXIS_COLORS[i]} strokeWidth={2.5} opacity={0.9}
              markerEnd={`url(#arrow${i})`} />
            <text x={end.x + 6} y={end.y - 6} fill={AXIS_COLORS[i]} fontSize={12} fontWeight="bold">
              {AXIS_LABELS[i]}
            </text>
          </g>
        ))}
      </svg>

      {/* Matrix display */}
      <div className="my-3 flex justify-center">
        <div className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm">
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span className="text-lg leading-none text-muted">[</span>
              <span className="w-12 text-center font-semibold text-red-500">{matrix[r][0].toFixed(2)}</span>
              <span className="w-12 text-center font-semibold text-green-600">{matrix[r][1].toFixed(2)}</span>
              <span className="w-12 text-center font-semibold text-blue-500">{matrix[r][2].toFixed(2)}</span>
              <span className="text-lg leading-none text-muted">]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Basis vector slider boxes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "where X lands", col: 0, border: "border-red-400", bg: "bg-red-500/5", text: "text-red-500", textSub: "text-red-400", accent: "#ef4444" },
          { label: "where Y lands", col: 1, border: "border-green-500", bg: "bg-green-500/5", text: "text-green-600", textSub: "text-green-500", accent: "#22c55e" },
          { label: "where Z lands", col: 2, border: "border-blue-500", bg: "bg-blue-500/5", text: "text-blue-500", textSub: "text-blue-400", accent: "#3b82f6" },
        ].map(({ label, col, border, bg, text, textSub, accent }) => (
          <div key={col} className={`rounded-lg border-2 ${border} ${bg} p-2`}>
            <div className={`mb-1 text-[10px] font-semibold ${text}`}>{label}</div>
            {["x", "y", "z"].map((axis, r) => (
              <div key={axis} className="flex items-center gap-1.5">
                <span className={`w-3 shrink-0 text-[10px] font-medium ${textSub}`}>{axis}</span>
                <input
                  type="range" min={-2} max={2} step={0.01}
                  value={matrix[r][col]}
                  onChange={(e) => updateCell(r, col, parseFloat(e.target.value))}
                  className="h-1 flex-1"
                  style={{ accentColor: accent }}
                />
                <span className={`w-9 shrink-0 text-right font-mono text-[10px] font-bold ${text}`}>
                  {matrix[r][col].toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Operation buttons */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {([
          { op: "rotate" as OpType, label: "Rotate" },
          { op: "scale" as OpType, label: "Scale" },
          { op: "shear" as OpType, label: "Shear" },
          { op: "flatten" as OpType, label: "Flatten" },
        ]).map(({ op, label }) => (
          <button
            key={op}
            onClick={() => openOp(op)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeOp === op
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={handleReset}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          Identity
        </button>
      </div>

      {/* Expandable operation panels */}
      {activeOp === "rotate" && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 text-xs font-semibold text-accent">Rotation</div>
          {[
            { label: "X", value: rotX, color: "#ef4444", set: (v: number) => updateRotation(v, rotY, rotZ) },
            { label: "Y", value: rotY, color: "#22c55e", set: (v: number) => updateRotation(rotX, v, rotZ) },
            { label: "Z", value: rotZ, color: "#3b82f6", set: (v: number) => updateRotation(rotX, rotY, v) },
          ].map(({ label, value, color, set }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 text-[10px] font-bold" style={{ color }}>{label}</span>
              <input type="range" min={-180} max={180} step={1} value={value}
                onChange={(e) => set(parseFloat(e.target.value))}
                className="h-1 flex-1" style={{ accentColor: color }} />
              <span className="w-10 text-right font-mono text-[10px] font-bold text-muted">
                {value.toFixed(0)}&deg;
              </span>
            </div>
          ))}
        </div>
      )}

      {activeOp === "scale" && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 text-xs font-semibold text-accent">Scale</div>
          {[
            { label: "X", value: scX, color: "#ef4444", set: (v: number) => updateScale(v, scY, scZ) },
            { label: "Y", value: scY, color: "#22c55e", set: (v: number) => updateScale(scX, v, scZ) },
            { label: "Z", value: scZ, color: "#3b82f6", set: (v: number) => updateScale(scX, scY, v) },
          ].map(({ label, value, color, set }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 text-[10px] font-bold" style={{ color }}>{label}</span>
              <input type="range" min={-2} max={3} step={0.01} value={value}
                onChange={(e) => set(parseFloat(e.target.value))}
                className="h-1 flex-1" style={{ accentColor: color }} />
              <span className="w-10 text-right font-mono text-[10px] font-bold text-muted">
                {value.toFixed(2)}&times;
              </span>
            </div>
          ))}
        </div>
      )}

      {activeOp === "shear" && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 text-xs font-semibold text-accent">Shear</div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {["XY", "XZ", "YX", "YZ", "ZX", "ZY"].map((p) => (
              <button key={p} onClick={() => updateShear(p, shearAmt)}
                className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                  shearPlane === p ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
                }`}>
                {p[0]} by {p[1]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted">Amount</span>
            <input type="range" min={-2} max={2} step={0.01} value={shearAmt}
              onChange={(e) => updateShear(shearPlane, parseFloat(e.target.value))}
              className="h-1 flex-1" />
            <span className="w-10 text-right font-mono text-[10px] font-bold text-muted">
              {shearAmt.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {activeOp === "flatten" && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 text-xs font-semibold text-accent">Flatten (collapse an axis)</div>
          <div className="flex gap-2">
            {[
              { axis: "X", color: "#ef4444" },
              { axis: "Y", color: "#22c55e" },
              { axis: "Z", color: "#3b82f6" },
            ].map(({ axis, color }) => (
              <button key={axis} onClick={() => updateFlatten(axis)}
                className={`flex-1 rounded-md border py-2 text-sm font-bold transition-colors ${
                  flattenAxis === axis
                    ? "border-accent bg-accent/10"
                    : "border-border text-muted hover:bg-surface"
                }`}
                style={{ color }}>
                Flatten {axis}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="mt-2 text-center text-[10px] text-muted">
        {model.attribution}
      </div>
    </WidgetContainer>
  );
}
