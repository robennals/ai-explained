"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useIsPhone } from "../shared/useMediaQuery";
import { useSvgFontSize } from "../shared/useSvgScale";

// A real 2-bit adder: A (2 digits) + B (2 digits) = sum (3 digits), built from 7 gates.

type GateType = "AND" | "OR" | "XOR";

type InputId = "a2s" | "a1s" | "b2s" | "b1s";
type GateId = "and2s" | "xor2s" | "carry1s" | "sum1s" | "carryIn2s" | "sum2s" | "carry4s";
type SignalId = InputId | GateId;

interface DigitSpec<Id> {
  id: Id;
  // What this digit is worth: 1, 2, or 4
  worth: number;
  y: number;
}

// Each digit is drawn as a square cell
const CELL = 32;

// Each number's digits are a column of touching cells, biggest digit on top
const A_DIGITS: DigitSpec<InputId>[] = [
  { id: "a2s", worth: 2, y: 95 },
  { id: "a1s", worth: 1, y: 95 + CELL },
];
const B_DIGITS: DigitSpec<InputId>[] = [
  { id: "b2s", worth: 2, y: 262 },
  { id: "b1s", worth: 1, y: 262 + CELL },
];
const INPUT_DIGITS = [...A_DIGITS, ...B_DIGITS];

const SUM_DIGITS: DigitSpec<GateId>[] = [
  { id: "carry4s", worth: 4, y: 180 },
  { id: "sum2s", worth: 2, y: 180 + CELL },
  { id: "sum1s", worth: 1, y: 180 + 2 * CELL },
];

interface GateSpec {
  id: GateId;
  type: GateType;
  // Which column of gates this sits in, left to right
  column: 0 | 1 | 2;
  y: number;
  // [top input, bottom input]; each input gets a straight wire into the gate
  inputs: [SignalId, SignalId];
}

// Listed so every gate comes after the gates feeding it
const GATES: GateSpec[] = [
  { id: "and2s", type: "AND", column: 0, y: 85, inputs: ["a2s", "b2s"] },
  { id: "xor2s", type: "XOR", column: 0, y: 165, inputs: ["a2s", "b2s"] },
  { id: "carry1s", type: "AND", column: 0, y: 245, inputs: ["a1s", "b1s"] },
  { id: "sum1s", type: "XOR", column: 0, y: 320, inputs: ["a1s", "b1s"] },
  { id: "carryIn2s", type: "AND", column: 1, y: 165, inputs: ["xor2s", "carry1s"] },
  { id: "sum2s", type: "XOR", column: 1, y: 245, inputs: ["xor2s", "carry1s"] },
  { id: "carry4s", type: "OR", column: 2, y: 115, inputs: ["and2s", "carryIn2s"] },
];

// Layout
const H = 345;
const GATE_W = 56;
const GATE_H = 30;
const PORT_OFFSET = 8;

// Horizontal positions. WIDE spreads the circuit out; COMPACT (phones) squeezes
// it so the cells and text stay big enough to read and tap.
interface Layout {
  W: number;
  inX: number;
  gateX: [number, number, number];
  outX: number;
}
const WIDE: Layout = { W: 720, inX: 95, gateX: [250, 390, 510], outX: 640 };
const COMPACT: Layout = { W: 460, inX: 40, gateX: [140, 245, 335], outX: 405 };

function applyGate(type: GateType, p: number, q: number): number {
  switch (type) {
    case "AND":
      return p & q;
    case "OR":
      return p | q;
    case "XOR":
      return p ^ q;
  }
}

function evaluate(a: number, b: number): (id: SignalId) => number {
  const values = new Map<SignalId, number>([
    ["a2s", (a >> 1) & 1],
    ["a1s", a & 1],
    ["b2s", (b >> 1) & 1],
    ["b1s", b & 1],
  ]);
  for (const gate of GATES) {
    values.set(gate.id, applyGate(gate.type, values.get(gate.inputs[0]) ?? 0, values.get(gate.inputs[1]) ?? 0));
  }
  return (id) => values.get(id) ?? 0;
}

// Where a wire leaves a signal: the right edge of an input digit, or the right edge of a gate
function signalPosition(id: SignalId, layout: Layout): { x: number; y: number } {
  const digit = INPUT_DIGITS.find((d) => d.id === id);
  if (digit) return { x: layout.inX + CELL / 2, y: digit.y };
  const gate = GATES.find((g) => g.id === id);
  if (!gate) throw new Error(`Unknown signal ${id}`);
  return { x: layout.gateX[gate.column] + GATE_W / 2, y: gate.y };
}

function wireStyle(value: number) {
  return value ? { stroke: "#3b82f6", strokeWidth: 2.5 } : { stroke: "#d1d5db", strokeWidth: 1.5 };
}

// One number as a column of touching cells, one digit per cell, titled with the number they stand for
function DigitColumn({
  title,
  digits,
  valueOf,
  x,
  onColor,
  onToggleDigit,
  fontSize,
}: {
  title: string;
  digits: DigitSpec<SignalId>[];
  valueOf: (id: SignalId) => number;
  x: number;
  // Tint for cells holding a 1
  onColor: string;
  // When given, clicking a digit flips it; called with what that digit is worth
  onToggleDigit?: (worth: number) => void;
  fontSize: (designPx: number) => number;
}) {
  const top = digits[0].y - CELL / 2;
  const total = digits.reduce((sum, d) => sum + d.worth * valueOf(d.id), 0);
  return (
    <g>
      <text
        x={x}
        y={top - 10}
        textAnchor="middle"
        fontSize={fontSize(14)}
        className="fill-foreground font-bold pointer-events-none select-none"
      >
        {title} = {total}
      </text>
      {digits.map((d) => {
        const value = valueOf(d.id);
        return (
          <g
            key={d.id}
            className={onToggleDigit ? "cursor-pointer" : undefined}
            onClick={onToggleDigit ? () => onToggleDigit(d.worth) : undefined}
          >
            <rect
              x={x - CELL / 2}
              y={d.y - CELL / 2}
              width={CELL}
              height={CELL}
              fill={value ? onColor : "white"}
              stroke="#6b7280"
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={d.y + 6}
              textAnchor="middle"
              fontSize={fontSize(16)}
              className="fill-foreground font-bold font-mono pointer-events-none select-none"
            >
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// A binary number written as a row of touching cells, like the columns in the circuit turned sideways
function BinaryCells({ value, digits }: { value: number; digits?: number }) {
  const text = digits ? value.toString(2).padStart(digits, "0") : value.toString(2);
  return (
    <span className="inline-flex">
      {text.split("").map((digit, i) => (
        <span
          key={i}
          className="-ml-px inline-flex h-5 w-5 items-center justify-center border border-gray-500 bg-white font-mono text-xs font-bold text-foreground first:ml-0"
        >
          {digit}
        </span>
      ))}
    </span>
  );
}

// Every number this circuit can show, written in binary
function BinaryKey() {
  return (
    <div className="not-prose mx-auto mb-4 w-fit max-w-full rounded-lg border border-border px-4 py-2 text-center">
      <div className="text-xs font-semibold text-foreground">Numbers in binary</div>
      <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs text-muted">
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className="inline-flex items-center gap-1">
            <span className="font-mono">{n} =</span>
            <BinaryCells value={n} />
          </span>
        ))}
      </div>
      <div className="mx-auto mt-1 max-w-sm text-[11px] text-muted">
        Extra 0s at the front don&apos;t change a number, just as 07 is 7. In the circuit, each number&apos;s cells are
        stacked with the first digit on top.
      </div>
    </div>
  );
}

function NumberSelect({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-md border border-border bg-white px-2 font-mono text-xl font-bold text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
      >
        {[0, 1, 2, 3].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <BinaryCells value={value} digits={2} />
    </label>
  );
}

const INITIAL = { a: 3, b: 2 };

export function AdderCircuit() {
  const [a, setA] = useState(INITIAL.a);
  const [b, setB] = useState(INITIAL.b);
  const reset = useCallback(() => {
    setA(INITIAL.a);
    setB(INITIAL.b);
  }, []);

  const valueOf = evaluate(a, b);
  const layout = useIsPhone() ? COMPACT : WIDE;
  const svgRef = useRef<SVGSVGElement>(null);
  const fontSize = useSvgFontSize(svgRef, layout.W);

  return (
    <WidgetContainer
      title="A Circuit That Adds"
      description="Seven gates that add two numbers, each written as binary digits. Choose A and B, or tap their digits."
      onReset={reset}
    >
      <BinaryKey />

      <div className="mb-2 flex flex-wrap items-end justify-center gap-4">
        <NumberSelect label="A" value={a} onChange={setA} />
        <div className="pb-6 text-xl text-muted">+</div>
        <NumberSelect label="B" value={b} onChange={setB} />
        <div className="pb-6 text-xl text-muted">=</div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-muted">A + B</span>
          <span className="flex h-9 items-center font-mono text-2xl font-bold text-foreground">{a + b}</span>
          <BinaryCells value={a + b} digits={3} />
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${layout.W} ${H}`} className="w-full" aria-label="A circuit of logic gates that adds two 2-digit binary numbers">
        {/* Wires into gates */}
        {GATES.flatMap((gate) =>
          gate.inputs.map((from, port) => {
            const start = signalPosition(from, layout);
            return (
              <line
                key={`${from}-${gate.id}`}
                x1={start.x}
                y1={start.y}
                x2={layout.gateX[gate.column] - GATE_W / 2}
                y2={gate.y + (port === 0 ? -PORT_OFFSET : PORT_OFFSET)}
                {...wireStyle(valueOf(from))}
              />
            );
          })
        )}
        {/* Wires out to the sum's digits */}
        {SUM_DIGITS.map((digit) => {
          const start = signalPosition(digit.id, layout);
          return (
            <line
              key={digit.id}
              x1={start.x}
              y1={start.y}
              x2={layout.outX - CELL / 2}
              y2={digit.y}
              {...wireStyle(valueOf(digit.id))}
            />
          );
        })}

        {/* Gates */}
        {GATES.map((gate) => (
          <g key={gate.id}>
            <rect
              x={layout.gateX[gate.column] - GATE_W / 2}
              y={gate.y - GATE_H / 2}
              width={GATE_W}
              height={GATE_H}
              rx={7}
              fill={valueOf(gate.id) ? "#fef3c7" : "#fef9ee"}
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <text
              x={layout.gateX[gate.column]}
              y={gate.y + 5}
              textAnchor="middle"
              fontSize={fontSize(13)}
              className="fill-warning font-bold pointer-events-none select-none"
            >
              {gate.type}
            </text>
          </g>
        ))}

        <DigitColumn
          title="A"
          digits={A_DIGITS}
          valueOf={valueOf}
          x={layout.inX}
          fontSize={fontSize}
          onColor="#dbeafe"
          onToggleDigit={(worth) => setA((v) => v ^ worth)}
        />
        <DigitColumn
          title="B"
          digits={B_DIGITS}
          valueOf={valueOf}
          x={layout.inX}
          fontSize={fontSize}
          onColor="#dbeafe"
          onToggleDigit={(worth) => setB((v) => v ^ worth)}
        />
        <DigitColumn
          title="A + B"
          digits={SUM_DIGITS}
          valueOf={valueOf}
          x={layout.outX}
          fontSize={fontSize}
          onColor="#dcfce7"
        />
      </svg>

      <div className="mt-2 text-center text-xs text-muted">Lit wires carry a 1.</div>
    </WidgetContainer>
  );
}
