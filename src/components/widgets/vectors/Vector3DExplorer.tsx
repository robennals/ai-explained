"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const PROPERTIES = ["big", "scary", "hairy", "cuddly", "fast", "fat"] as const;
type Property = (typeof PROPERTIES)[number];

interface Animal {
  name: string;
  emoji: string;
  big: number;
  scary: number;
  hairy: number;
  cuddly: number;
  fast: number;
  fat: number;
}

const ANIMALS: Animal[] = [
  { name: "Bear",     emoji: "🐻", big: 0.85, scary: 0.90, hairy: 0.80, cuddly: 0.75, fast: 0.50, fat: 0.70 },
  { name: "Rabbit",   emoji: "🐰", big: 0.10, scary: 0.05, hairy: 0.70, cuddly: 0.95, fast: 0.60, fat: 0.20 },
  { name: "Shark",    emoji: "🦈", big: 0.75, scary: 0.95, hairy: 0.00, cuddly: 0.02, fast: 0.70, fat: 0.30 },
  { name: "Mouse",    emoji: "🐭", big: 0.05, scary: 0.10, hairy: 0.40, cuddly: 0.60, fast: 0.50, fat: 0.15 },
  { name: "Eagle",    emoji: "🦅", big: 0.40, scary: 0.50, hairy: 0.10, cuddly: 0.05, fast: 0.95, fat: 0.10 },
  { name: "Elephant", emoji: "🐘", big: 0.98, scary: 0.40, hairy: 0.10, cuddly: 0.35, fast: 0.30, fat: 0.85 },
  { name: "Snake",    emoji: "🐍", big: 0.30, scary: 0.80, hairy: 0.00, cuddly: 0.05, fast: 0.40, fat: 0.10 },
  { name: "Cat",      emoji: "🐱", big: 0.15, scary: 0.15, hairy: 0.70, cuddly: 0.85, fast: 0.65, fat: 0.30 },
  { name: "Dog",      emoji: "🐕", big: 0.40, scary: 0.25, hairy: 0.65, cuddly: 0.90, fast: 0.60, fat: 0.40 },
];

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const SCALE = 170;

function project(x: number, y: number, z: number, rotY: number, rotX: number): [number, number, number] {
  // Center values to -0.5..0.5
  const cx = x - 0.5, cy = y - 0.5, cz = z - 0.5;
  // Rotate around Y axis
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const rx = cx * cosY + cz * sinY;
  const rz = -cx * sinY + cz * cosY;
  // Rotate around X axis
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const ry = cy * cosX - rz * sinX;
  const rz2 = cy * sinX + rz * cosX;
  // Simple orthographic projection
  return [CX + rx * SCALE, CY - ry * SCALE, rz2];
}

function PropTabs({ label, value, onChange, color }: { label: string; value: Property; onChange: (p: Property) => void; color: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {PROPERTIES.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              value === p
                ? "bg-accent text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Vector3DExplorer() {
  const [xProp, setXProp] = useState<Property>("big");
  const [yProp, setYProp] = useState<Property>("scary");
  const [zProp, setZProp] = useState<Property>("hairy");
  const [rotY, setRotY] = useState(0.6);
  const [rotX, setRotX] = useState(0.4);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleReset = useCallback(() => {
    setXProp("big");
    setYProp("scary");
    setZProp("hairy");
    setRotY(0.6);
    setRotX(0.4);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setRotY((r) => r + dx * 0.01);
      setRotX((r) => Math.max(-1.2, Math.min(1.2, r + dy * 0.01)));
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);

  // Project axes
  const axes = [
    { label: xProp, from: [0, 0.5, 0.5] as [number, number, number], to: [1, 0.5, 0.5] as [number, number, number], color: "#ef4444" },
    { label: yProp, from: [0.5, 0, 0.5] as [number, number, number], to: [0.5, 1, 0.5] as [number, number, number], color: "#22c55e" },
    { label: zProp, from: [0.5, 0.5, 0] as [number, number, number], to: [0.5, 0.5, 1] as [number, number, number], color: "#3b82f6" },
  ];

  const projectedAnimals = ANIMALS.map((a) => {
    const [sx, sy, sz] = project(a[xProp], a[yProp], a[zProp], rotY, rotX);
    return { ...a, sx, sy, sz };
  }).sort((a, b) => a.sz - b.sz); // draw back-to-front

  return (
    <WidgetContainer
      title="Vectors in 3D"
      description="Three properties place animals in a 3D space — drag to rotate"
      onReset={handleReset}
    >
      <div className="mb-4 space-y-3">
        <PropTabs label="X axis" value={xProp} onChange={(p) => setXProp(p)} color="#ef4444" />
        <PropTabs label="Y axis" value={yProp} onChange={(p) => setYProp(p)} color="#22c55e" />
        <PropTabs label="Z axis" value={zProp} onChange={(p) => setZProp(p)} color="#3b82f6" />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto w-full max-w-[480px] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Axes */}
        {axes.map((axis) => {
          const [fx, fy] = project(...axis.from, rotY, rotX);
          const [tx, ty] = project(...axis.to, rotY, rotX);
          return (
            <g key={axis.label}>
              <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={axis.color} strokeWidth={1.5} strokeOpacity={0.4} />
              <text x={tx} y={ty - 6} textAnchor="middle" fontSize={10} fill={axis.color} fontWeight={600}>
                {axis.label.charAt(0).toUpperCase() + axis.label.slice(1)}
              </text>
            </g>
          );
        })}

        {/* Animals (back to front) */}
        {projectedAnimals.map((a) => (
          <g key={a.name}>
            <circle cx={a.sx} cy={a.sy} r={5} fill="var(--color-accent)" fillOpacity={0.7} />
            <text x={a.sx} y={a.sy - 8} textAnchor="middle" fontSize={14}>
              {a.emoji}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-2 text-center text-xs text-muted">
        Drag to rotate. Three dimensions capture more distinctions, but our animal vectors have six properties — they really live in 6D space.
      </p>
    </WidgetContainer>
  );
}
