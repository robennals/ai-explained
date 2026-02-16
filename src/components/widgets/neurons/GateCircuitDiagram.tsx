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
//
// Layout: vertical stacking, FA0 on top, FA1 below.
// Carry flows downward from FA0 to FA1.

const W = 340;
const H = 240;
const GW = 36;
const GH = 18;

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

// Full adder 0 (low bit) — top
const FA0_X = 130;
const FA0_Y = 35;
// Full adder 1 (high bit) — bottom
const FA1_X = 130;
const FA1_Y = 145;
// Horizontal offset between first and second column of gates
const COL2 = 60;

const ROW2 = 30; // vertical gap between gate rows
const ROW3 = 60; // vertical gap to OR gate

function faGates(baseX: number, baseY: number, prefix: string): Gate[] {
  return [
    { id: `${prefix}-xor1`, type: "XOR", x: baseX, y: baseY },
    { id: `${prefix}-xor2`, type: "XOR", x: baseX + COL2, y: baseY },
    { id: `${prefix}-and1`, type: "AND", x: baseX, y: baseY + ROW2 },
    { id: `${prefix}-and2`, type: "AND", x: baseX + COL2, y: baseY + ROW2 },
    { id: `${prefix}-or`,   type: "OR",  x: baseX + COL2, y: baseY + ROW3 },
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
function faWires(prefix: string): Array<{ d: string }> {
  const xor1 = gateById(`${prefix}-xor1`);
  const xor2 = gateById(`${prefix}-xor2`);
  const and1 = gateById(`${prefix}-and1`);
  const and2 = gateById(`${prefix}-and2`);
  const or   = gateById(`${prefix}-or`);

  const xor1R = xor1.x + GW / 2;
  const xor2L = xor2.x - GW / 2;
  const and2L = and2.x - GW / 2;
  const and1R = and1.x + GW / 2;
  const orL   = or.x - GW / 2;

  return [
    // XOR1 → XOR2
    { d: `M${xor1R},${xor1.y} C${(xor1R + xor2L) / 2},${xor1.y} ${(xor1R + xor2L) / 2},${xor2.y} ${xor2L},${xor2.y}` },
    // XOR1 → AND2
    { d: `M${xor1R},${xor1.y} C${(xor1R + and2L) / 2},${xor1.y} ${(xor1R + and2L) / 2},${and2.y} ${and2L},${and2.y}` },
    // AND1 → OR
    { d: `M${and1R},${and1.y} C${(and1R + orL) / 2},${and1.y} ${(and1R + orL) / 2},${or.y - 8} ${orL},${or.y - 8}` },
    // AND2 → OR (straight down)
    { d: `M${and2.x},${and2.y + GH / 2} L${or.x},${or.y - GH / 2}` },
  ];
}

// Input positions — each pair near its own adder
const INPUT_X = 42;
const inputs = [
  { label: "A₀", x: INPUT_X, y: FA0_Y - 12 },
  { label: "B₀", x: INPUT_X, y: FA0_Y + 12 },
  { label: "A₁", x: INPUT_X, y: FA1_Y - 12 },
  { label: "B₁", x: INPUT_X, y: FA1_Y + 12 },
];

// Output positions
const OUT_X = 290;

export function GateCircuitDiagram() {
  const fa0xor1 = gateById("fa0-xor1");
  const fa0and1 = gateById("fa0-and1");
  const fa1xor1 = gateById("fa1-xor1");
  const fa1and1 = gateById("fa1-and1");
  const fa0xor2 = gateById("fa0-xor2");
  const fa1xor2 = gateById("fa1-xor2");
  const fa0or   = gateById("fa0-or");
  const fa1or   = gateById("fa1-or");

  // Carry routing: L-shaped path on right side
  const carryStartX = fa0or.x + GW / 2;
  const carryStartY = fa0or.y;
  const carryRunX = fa0or.x + GW / 2 + 20; // vertical run x
  const fa1xor2L = fa1xor2.x - GW / 2;
  const fa1and2 = gateById("fa1-and2");
  const fa1and2L = fa1and2.x - GW / 2;

  return (
    <WidgetContainer
      title="A Circuit Made of Gates"
      description="10 logic gates wired together to add two small numbers."
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <marker
            id="carry-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Input wires: A0, B0 → FA0 XOR1 and AND1 */}
        <line x1={inputs[0].x + 4} y1={inputs[0].y} x2={fa0xor1.x - GW / 2} y2={fa0xor1.y - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={inputs[1].x + 4} y1={inputs[1].y} x2={fa0xor1.x - GW / 2} y2={fa0xor1.y + 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={inputs[0].x + 4} y1={inputs[0].y} x2={fa0and1.x - GW / 2} y2={fa0and1.y - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={inputs[1].x + 4} y1={inputs[1].y} x2={fa0and1.x - GW / 2} y2={fa0and1.y + 6} stroke="#d1d5db" strokeWidth="1" />

        {/* Input wires: A1, B1 → FA1 XOR1 and AND1 */}
        <line x1={inputs[2].x + 4} y1={inputs[2].y} x2={fa1xor1.x - GW / 2} y2={fa1xor1.y - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={inputs[3].x + 4} y1={inputs[3].y} x2={fa1xor1.x - GW / 2} y2={fa1xor1.y + 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={inputs[2].x + 4} y1={inputs[2].y} x2={fa1and1.x - GW / 2} y2={fa1and1.y - 6} stroke="#d1d5db" strokeWidth="1" />
        <line x1={inputs[3].x + 4} y1={inputs[3].y} x2={fa1and1.x - GW / 2} y2={fa1and1.y + 6} stroke="#d1d5db" strokeWidth="1" />

        {/* Input labels and dots */}
        {inputs.map((inp) => (
          <g key={inp.label}>
            <circle cx={inp.x} cy={inp.y} r={4} fill="#d1d5db" />
            <text
              x={inp.x - 10}
              y={inp.y + 4}
              textAnchor="end"
              className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
            >
              {inp.label}
            </text>
          </g>
        ))}

        {/* Carry-in labels (grounded to 0) for FA0 XOR2 and AND2 */}
        <text
          x={fa0xor2.x - GW / 2 - 6}
          y={fa0xor2.y - 6}
          textAnchor="end"
          className="fill-muted text-[8px] pointer-events-none select-none"
        >
          0
        </text>
        <text
          x={gateById("fa0-and2").x - GW / 2 - 6}
          y={gateById("fa0-and2").y - 6}
          textAnchor="end"
          className="fill-muted text-[8px] pointer-events-none select-none"
        >
          0
        </text>

        {/* Internal wires */}
        {[...faWires("fa0"), ...faWires("fa1")].map((w, i) => (
          <path
            key={i}
            d={w.d}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1"
          />
        ))}

        {/* Carry chain: FA0 OR → FA1 XOR2 and AND2 via L-shaped routing */}
        {/* Horizontal stub from FA0 OR to the vertical run */}
        <line x1={carryStartX} y1={carryStartY} x2={carryRunX} y2={carryStartY} stroke="#d1d5db" strokeWidth="1" />
        {/* Vertical run down to FA1 AND2 level (with arrow) */}
        <line x1={carryRunX} y1={carryStartY} x2={carryRunX} y2={fa1and2.y} stroke="#d1d5db" strokeWidth="1" markerEnd="url(#carry-arrow)" />
        {/* Branch left to FA1 XOR2 */}
        <line x1={carryRunX} y1={fa1xor2.y} x2={fa1xor2L} y2={fa1xor2.y} stroke="#d1d5db" strokeWidth="1" />
        {/* Branch left to FA1 AND2 */}
        <line x1={carryRunX} y1={fa1and2.y} x2={fa1and2L} y2={fa1and2.y} stroke="#d1d5db" strokeWidth="1" />
        {/* Junction dots where branches meet the vertical run */}
        <circle cx={carryRunX} cy={fa1xor2.y} r={2} fill="#d1d5db" />
        <circle cx={carryRunX} cy={fa1and2.y} r={2} fill="#d1d5db" />

        {/* Carry label */}
        <text
          x={carryRunX + 8}
          y={(carryStartY + fa1xor2.y) / 2 + 3}
          className="fill-muted text-[8px] pointer-events-none select-none"
        >
          carry
        </text>

        {/* Output wires and labels */}
        {/* S0 from FA0 XOR2 */}
        <line
          x1={fa0xor2.x + GW / 2}
          y1={fa0xor2.y}
          x2={OUT_X}
          y2={fa0xor2.y}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <circle cx={OUT_X + 2} cy={fa0xor2.y} r={4} fill="#d1d5db" />
        <text
          x={OUT_X + 14}
          y={fa0xor2.y + 4}
          className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
        >
          S₀
        </text>

        {/* S1 from FA1 XOR2 */}
        <line
          x1={fa1xor2.x + GW / 2}
          y1={fa1xor2.y}
          x2={OUT_X}
          y2={fa1xor2.y}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <circle cx={OUT_X + 2} cy={fa1xor2.y} r={4} fill="#d1d5db" />
        <text
          x={OUT_X + 14}
          y={fa1xor2.y + 4}
          className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
        >
          S₁
        </text>

        {/* Cout from FA1 OR */}
        <line
          x1={fa1or.x + GW / 2}
          y1={fa1or.y}
          x2={OUT_X}
          y2={fa1or.y}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <circle cx={OUT_X + 2} cy={fa1or.y} r={4} fill="#d1d5db" />
        <text
          x={OUT_X + 14}
          y={fa1or.y + 4}
          className="fill-foreground text-[10px] font-semibold pointer-events-none select-none"
        >
          C out
        </text>

        {/* Gates (rendered last so they appear on top of wires) */}
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
      </svg>
    </WidgetContainer>
  );
}
