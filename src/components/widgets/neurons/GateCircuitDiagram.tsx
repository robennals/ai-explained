"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

// Abstract gate network — gives the visual impression of many gates wired
// together without implying the reader should understand the circuit.

const W = 480;
const H = 180;
const GW = 34;
const GH = 18;

const GATE_TYPES = ["AND", "OR", "XOR", "NOT"] as const;
type GateType = (typeof GATE_TYPES)[number];

const FILL: Record<string, string> = {
  AND: "#f0fdf4",
  OR: "#f0f4ff",
  XOR: "#fef9ee",
  NOT: "#fef2f2",
};
const STROKE: Record<string, string> = {
  AND: "#10b981",
  OR: "#3b82f6",
  XOR: "#f59e0b",
  NOT: "#ef4444",
};
const TEXT_CLS: Record<string, string> = {
  AND: "fill-success",
  OR: "fill-accent",
  XOR: "fill-warning",
  NOT: "fill-error",
};

// Deterministic pseudo-random from seed
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// Layout: columns of gates, wired together left-to-right
const layers = [4, 6, 5, 4, 2];
const NUM_INPUTS = 5;
const NUM_OUTPUTS = 3;

interface GateNode {
  x: number;
  y: number;
  type: GateType;
}

const rand = seededRand(42);

function buildGates(): GateNode[] {
  const nodes: GateNode[] = [];
  const totalCols = layers.length;
  const colSpacing = (W - 120) / totalCols;
  const startX = 70;

  for (let col = 0; col < totalCols; col++) {
    const count = layers[col];
    const x = startX + col * colSpacing;
    const totalH = count * 28;
    const baseY = (H - totalH) / 2 + 14;
    for (let i = 0; i < count; i++) {
      const y = baseY + i * 28;
      const type = GATE_TYPES[Math.floor(rand() * GATE_TYPES.length)];
      nodes.push({ x, y, type });
    }
  }
  return nodes;
}

const gates = buildGates();

// Build connections: each gate connects to 1-2 gates in the next column
function buildWires(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const wires: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  let offset = 0;

  // Input dots to first column
  const firstCol = layers[0];
  const firstColNodes = gates.slice(0, firstCol);
  const inputSpacing = (H - 40) / (NUM_INPUTS - 1);
  for (let i = 0; i < NUM_INPUTS; i++) {
    const iy = 20 + i * inputSpacing;
    // Connect to 1-2 nearby gates
    const targets = firstColNodes
      .map((g, idx) => ({ g, idx, dist: Math.abs(g.y - iy) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, Math.floor(rand() * 2) + 1);
    for (const t of targets) {
      wires.push({ x1: 30, y1: iy, x2: t.g.x - GW / 2, y2: t.g.y });
    }
  }

  // Between gate columns
  for (let col = 0; col < layers.length - 1; col++) {
    const fromCount = layers[col];
    const toCount = layers[col + 1];
    const fromNodes = gates.slice(offset, offset + fromCount);
    const toNodes = gates.slice(offset + fromCount, offset + fromCount + toCount);

    for (const from of fromNodes) {
      const numConn = Math.floor(rand() * 2) + 1;
      const targets = toNodes
        .map((g) => ({ g, dist: Math.abs(g.y - from.y) + rand() * 20 }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, numConn);
      for (const t of targets) {
        wires.push({
          x1: from.x + GW / 2,
          y1: from.y,
          x2: t.g.x - GW / 2,
          y2: t.g.y,
        });
      }
    }
    offset += fromCount;
  }

  // Last column to output dots
  const lastCol = layers[layers.length - 1];
  const lastColNodes = gates.slice(gates.length - lastCol);
  const outputSpacing = (H - 60) / Math.max(1, NUM_OUTPUTS - 1);
  for (let i = 0; i < NUM_OUTPUTS; i++) {
    const oy = 30 + i * outputSpacing;
    const source = lastColNodes[Math.min(i, lastColNodes.length - 1)];
    wires.push({
      x1: source.x + GW / 2,
      y1: source.y,
      x2: W - 30,
      y2: oy,
    });
  }

  return wires;
}

const wires = buildWires();

// Input/output dot positions
const inputDots = Array.from({ length: NUM_INPUTS }, (_, i) => ({
  y: 20 + i * ((H - 40) / (NUM_INPUTS - 1)),
}));
const outputDots = Array.from({ length: NUM_OUTPUTS }, (_, i) => ({
  y: 30 + i * ((H - 60) / Math.max(1, NUM_OUTPUTS - 1)),
}));

export function GateCircuitDiagram() {
  return (
    <WidgetContainer
      title="Gates Wired Together"
      description="Wire enough gates together and you can compute anything."
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Wires */}
        {wires.map((w, i) => {
          const midX = (w.x1 + w.x2) / 2;
          return (
            <path
              key={i}
              d={`M${w.x1},${w.y1} C${midX},${w.y1} ${midX},${w.y2} ${w.x2},${w.y2}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Input dots */}
        {inputDots.map((d, i) => (
          <circle key={`in-${i}`} cx={28} cy={d.y} r={3} fill="#d1d5db" />
        ))}

        {/* Output dots */}
        {outputDots.map((d, i) => (
          <circle key={`out-${i}`} cx={W - 28} cy={d.y} r={3} fill="#d1d5db" />
        ))}

        {/* Gates */}
        {gates.map((g, i) => (
          <g key={i}>
            <rect
              x={g.x - GW / 2}
              y={g.y - GH / 2}
              width={GW}
              height={GH}
              rx={4}
              fill={FILL[g.type]}
              stroke={STROKE[g.type]}
              strokeWidth="1"
            />
            <text
              x={g.x}
              y={g.y + 3.5}
              textAnchor="middle"
              className={`${TEXT_CLS[g.type]} text-[7px] font-bold pointer-events-none select-none`}
            >
              {g.type}
            </text>
          </g>
        ))}
      </svg>
    </WidgetContainer>
  );
}
