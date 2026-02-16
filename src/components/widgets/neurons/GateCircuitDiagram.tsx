"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

// A real 2-bit adder: two full adders chained together (10 gates).
// Adds two 2-bit numbers (A1 A0) + (B1 B0) = (Cout S1 S0).
//
// Full adder:
//   XOR1 = A XOR B
//   XOR2 = XOR1 XOR Cin  → Sum
//   AND1 = A AND B
//   AND2 = XOR1 AND Cin
//   OR1  = AND1 OR AND2  → Cout

const W = 680;
const H = 300;
const GW = 46;
const GH = 24;

// Gate colors
const FILL: Record<string, string> = {
  AND: "#f0fdf4",
  OR: "#f0f4ff",
  XOR: "#fef9ee",
};
const STROKE: Record<string, string> = {
  AND: "#10b981",
  OR: "#3b82f6",
  XOR: "#f59e0b",
};
const TEXT_CLS: Record<string, string> = {
  AND: "fill-success",
  OR: "fill-accent",
  XOR: "fill-warning",
};

interface Gate {
  id: string;
  type: "AND" | "OR" | "XOR";
  x: number;
  y: number;
}

interface Wire {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

// Full adder 0 (low bit) — left half
const FA0_X = 140;
const FA0_Y = 60;
// Full adder 1 (high bit) — right half
const FA1_X = 400;
const FA1_Y = 60;

function faGates(baseX: number, baseY: number, prefix: string): Gate[] {
  return [
    { id: `${prefix}-xor1`, type: "XOR", x: baseX, y: baseY },
    { id: `${prefix}-xor2`, type: "XOR", x: baseX + 100, y: baseY },
    { id: `${prefix}-and1`, type: "AND", x: baseX, y: baseY + 70 },
    { id: `${prefix}-and2`, type: "AND", x: baseX + 100, y: baseY + 70 },
    { id: `${prefix}-or`,   type: "OR",  x: baseX + 100, y: baseY + 140 },
  ];
}

const gates: Gate[] = [
  ...faGates(FA0_X, FA0_Y, "fa0"),
  ...faGates(FA1_X, FA1_Y, "fa1"),
];

function gateById(id: string): Gate {
  return gates.find((g) => g.id === id)!;
}

// Internal wires within a full adder
function faWires(prefix: string): Wire[] {
  const xor1 = gateById(`${prefix}-xor1`);
  const xor2 = gateById(`${prefix}-xor2`);
  const and1 = gateById(`${prefix}-and1`);
  const and2 = gateById(`${prefix}-and2`);
  const or   = gateById(`${prefix}-or`);
  return [
    // XOR1 → XOR2
    { from: { x: xor1.x + GW / 2, y: xor1.y }, to: { x: xor2.x - GW / 2, y: xor2.y } },
    // XOR1 → AND2
    { from: { x: xor1.x + GW / 2, y: xor1.y }, to: { x: and2.x - GW / 2, y: and2.y } },
    // AND1 → OR
    { from: { x: and1.x + GW / 2, y: and1.y }, to: { x: or.x - GW / 2, y: or.y - 8 } },
    // AND2 → OR
    { from: { x: and2.x, y: and2.y + GH / 2 }, to: { x: or.x, y: or.y - GH / 2 } },
  ];
}

// Carry chain: FA0 carry out → FA1 carry in
const fa0Or = gateById("fa0-or");
const fa1Xor2 = gateById("fa1-xor2");
const fa1And2 = gateById("fa1-and2");

const carryWires: Wire[] = [
  // FA0 OR → FA1 XOR2 (carry in)
  { from: { x: fa0Or.x + GW / 2, y: fa0Or.y }, to: { x: fa1Xor2.x - GW / 2, y: fa1Xor2.y } },
  // FA0 OR → FA1 AND2 (carry in)
  { from: { x: fa0Or.x + GW / 2, y: fa0Or.y }, to: { x: fa1And2.x - GW / 2, y: fa1And2.y } },
];

const allWires: Wire[] = [
  ...faWires("fa0"),
  ...faWires("fa1"),
  ...carryWires,
];

// Input positions
const INPUT_X = 30;
const inputs = [
  { label: "A0", y: FA0_Y - 16 },
  { label: "B0", y: FA0_Y + 16 },
  { label: "A1", y: FA1_Y - 16 },
  { label: "B1", y: FA1_Y + 16 },
];

export function GateCircuitDiagram() {
  return (
    <WidgetContainer
      title="Gates Wired Together: A 2-Bit Adder"
      description="10 logic gates that add two 2-bit numbers. For example: 3 + 2 = 5, or in binary: 11 + 10 = 101."
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Full adder labels */}
        <rect
          x={FA0_X - GW / 2 - 14}
          y={FA0_Y - GH / 2 - 24}
          width={120 + GW + 28}
          height={170 + GH + 16}
          rx={8}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <text
          x={FA0_X + 50}
          y={FA0_Y - GH / 2 - 30}
          textAnchor="middle"
          className="fill-muted text-[9px] font-semibold pointer-events-none select-none"
        >
          Full Adder (low bit)
        </text>

        <rect
          x={FA1_X - GW / 2 - 14}
          y={FA1_Y - GH / 2 - 24}
          width={120 + GW + 28}
          height={170 + GH + 16}
          rx={8}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <text
          x={FA1_X + 50}
          y={FA1_Y - GH / 2 - 30}
          textAnchor="middle"
          className="fill-muted text-[9px] font-semibold pointer-events-none select-none"
        >
          Full Adder (high bit)
        </text>

        {/* Input wires */}
        {/* A0, B0 → FA0 XOR1 and AND1 */}
        <line x1={INPUT_X + 20} y1={inputs[0].y} x2={FA0_X - GW / 2} y2={FA0_Y - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={INPUT_X + 20} y1={inputs[1].y} x2={FA0_X - GW / 2} y2={FA0_Y + 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={INPUT_X + 20} y1={inputs[0].y} x2={FA0_X - GW / 2} y2={FA0_Y + 70 - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={INPUT_X + 20} y1={inputs[1].y} x2={FA0_X - GW / 2} y2={FA0_Y + 70 + 6} stroke="#d1d5db" strokeWidth="1" />

        {/* A1, B1 → FA1 XOR1 and AND1 */}
        <line x1={INPUT_X + 20} y1={inputs[2].y} x2={FA1_X - GW / 2} y2={FA1_Y - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={INPUT_X + 20} y1={inputs[3].y} x2={FA1_X - GW / 2} y2={FA1_Y + 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={INPUT_X + 20} y1={inputs[2].y} x2={FA1_X - GW / 2} y2={FA1_Y + 70 - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={INPUT_X + 20} y1={inputs[3].y} x2={FA1_X - GW / 2} y2={FA1_Y + 70 + 6} stroke="#d1d5db" strokeWidth="1" />

        {/* Input labels */}
        {inputs.map((inp) => (
          <g key={inp.label}>
            <circle cx={INPUT_X + 10} cy={inp.y} r={4} fill="#d1d5db" />
            <text
              x={INPUT_X - 2}
              y={inp.y + 4}
              textAnchor="end"
              className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
            >
              {inp.label}
            </text>
          </g>
        ))}

        {/* Carry-in label (grounded to 0) */}
        <text
          x={FA0_X + 100 - GW / 2 - 10}
          y={FA0_Y + 4}
          textAnchor="end"
          className="fill-muted text-[8px] pointer-events-none select-none"
        >
          0
        </text>
        <text
          x={FA0_X + 100 - GW / 2 - 10}
          y={FA0_Y + 74}
          textAnchor="end"
          className="fill-muted text-[8px] pointer-events-none select-none"
        >
          0
        </text>

        {/* Internal wires */}
        {allWires.map((w, i) => {
          const midX = (w.from.x + w.to.x) / 2;
          return (
            <path
              key={i}
              d={`M ${w.from.x} ${w.from.y} C ${midX} ${w.from.y}, ${midX} ${w.to.y}, ${w.to.x} ${w.to.y}`}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1"
            />
          );
        })}

        {/* Output wires and labels */}
        {/* S0 from FA0 XOR2 */}
        <line
          x1={gateById("fa0-xor2").x + GW / 2}
          y1={gateById("fa0-xor2").y}
          x2={W - 30}
          y2={gateById("fa0-xor2").y}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <circle cx={W - 28} cy={gateById("fa0-xor2").y} r={4} fill="#d1d5db" />
        <text
          x={W - 16}
          y={gateById("fa0-xor2").y + 4}
          className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
        >
          S0
        </text>

        {/* S1 from FA1 XOR2 */}
        <line
          x1={gateById("fa1-xor2").x + GW / 2}
          y1={gateById("fa1-xor2").y}
          x2={W - 30}
          y2={gateById("fa1-xor2").y}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <circle cx={W - 28} cy={gateById("fa1-xor2").y} r={4} fill="#d1d5db" />
        <text
          x={W - 16}
          y={gateById("fa1-xor2").y + 4}
          className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
        >
          S1
        </text>

        {/* Cout from FA1 OR */}
        <line
          x1={gateById("fa1-or").x + GW / 2}
          y1={gateById("fa1-or").y}
          x2={W - 30}
          y2={gateById("fa1-or").y}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <circle cx={W - 28} cy={gateById("fa1-or").y} r={4} fill="#d1d5db" />
        <text
          x={W - 16}
          y={gateById("fa1-or").y + 4}
          className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
        >
          Cout
        </text>

        {/* Gates */}
        {gates.map((g) => (
          <g key={g.id}>
            <rect
              x={g.x - GW / 2}
              y={g.y - GH / 2}
              width={GW}
              height={GH}
              rx={6}
              fill={FILL[g.type]}
              stroke={STROKE[g.type]}
              strokeWidth="1.5"
            />
            <text
              x={g.x}
              y={g.y + 4}
              textAnchor="middle"
              className={`${TEXT_CLS[g.type]} text-[9px] font-bold pointer-events-none select-none`}
            >
              {g.type}
            </text>
          </g>
        ))}

        {/* Carry label on the chain wire */}
        <text
          x={(fa0Or.x + GW / 2 + fa1Xor2.x - GW / 2) / 2}
          y={fa0Or.y - 8}
          textAnchor="middle"
          className="fill-muted text-[8px] pointer-events-none select-none"
        >
          carry
        </text>
      </svg>
    </WidgetContainer>
  );
}
