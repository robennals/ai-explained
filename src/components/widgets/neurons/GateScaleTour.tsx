"use client";

import { useState, useCallback, useRef, type ReactNode, type RefObject } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { useSvgFontSize } from "../shared/useSvgScale";

// A tour from one logic gate to billions. Readers aren't expected to follow the
// wiring: the point is that everything is built from the same simple gates.

const W = 600;
const H = 250;
const GATE_W = 56;
const GATE_H = 28;
const NODE_R = 13;

type FontSize = (designPx: number) => number;

// How much bigger than designed things are drawn: 1 on desktop, more on phones,
// where text grows to stay readable. Boxes and circles grow by the same amount
// so the text still fits inside them.
function scaleOf(fontSize: FontSize): number {
  return fontSize(12) / 12;
}

interface Point {
  x: number;
  y: number;
}

function Gate({ x, y, label, fontSize }: { x: number; y: number; label: string; fontSize: FontSize }) {
  const k = scaleOf(fontSize);
  return (
    <g>
      <rect x={x - (GATE_W * k) / 2} y={y - (GATE_H * k) / 2} width={GATE_W * k} height={GATE_H * k} rx={6} fill="#fef9ee" stroke="#f59e0b" strokeWidth={2} />
      <text x={x} y={y + fontSize(12) * 0.35} textAnchor="middle" fontSize={fontSize(12)} className="fill-warning font-bold select-none">
        {label}
      </text>
    </g>
  );
}

// An input or output bit. Inputs can be tapped to flip between 0 and 1.
function Node({
  x,
  y,
  label,
  value,
  fontSize,
  output,
  onToggle,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  fontSize: FontSize;
  output?: boolean;
  onToggle?: () => void;
}) {
  const color = output ? "#10b981" : "#3b82f6";
  const r = NODE_R * scaleOf(fontSize);
  return (
    <g
      className={onToggle ? "cursor-pointer" : undefined}
      onClick={onToggle}
      role={onToggle ? "button" : undefined}
      aria-label={onToggle ? `${label}: ${value}. Tap to flip.` : undefined}
    >
      {/* Invisible, larger tap area, so the target is big enough on a phone */}
      {onToggle && <circle cx={x} cy={y} r={r + 9} fill="transparent" />}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={value ? (output ? "#dcfce7" : "#dbeafe") : "white"}
        stroke={value ? color : "#d1d5db"}
        strokeWidth={2}
      />
      <text x={x} y={y + fontSize(12) * 0.37} textAnchor="middle" fontSize={fontSize(12)} className="fill-foreground font-bold font-mono select-none pointer-events-none">
        {value}
      </text>
      <text x={x} y={y - r - 6} textAnchor="middle" fontSize={fontSize(11)} className="fill-foreground font-semibold select-none pointer-events-none">
        {label}
      </text>
    </g>
  );
}

// A wire, lit blue when it carries a 1
function Wire({ from, to, on }: { from: Point; to: Point; on: number }) {
  return <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={on ? "#3b82f6" : "#d1d5db"} strokeWidth={on ? 2.5 : 1.5} />;
}

// Wire from a node or gate's right side into the top (port 0) or bottom (port 1) of a gate's left side
// Phones: the 2-digit adder's rows are spread apart by the same scale, so the
// bigger boxes, circles and labels don't run into each other.
const ADDER_TOP = 30;
function spreadY(y: number, k: number): number {
  return ADDER_TOP + (y - ADDER_TOP) * k;
}

// k is the drawing scale from scaleOf.
function into(gate: Point, port: 0 | 1, k: number): Point {
  return { x: gate.x - (GATE_W * k) / 2, y: gate.y + (port === 0 ? -8 : 8) * k };
}
function outOfGate(gate: Point, k: number): Point {
  return { x: gate.x + (GATE_W * k) / 2, y: gate.y };
}
function outOfNode(node: Point, k: number): Point {
  return { x: node.x + NODE_R * k, y: node.y };
}
function intoNode(node: Point, k: number): Point {
  return { x: node.x - NODE_R * k, y: node.y };
}

// Input bits the reader can flip by tapping. flip(key) returns a click handler for that bit.
function useBits<K extends string>(initial: Record<K, number>) {
  const [bits, setBits] = useState(initial);
  const flip = (key: K) => () => setBits((prev) => ({ ...prev, [key]: prev[key] ? 0 : 1 }));
  return { bits, flip };
}

function OneGate({ fontSize }: { fontSize: FontSize }) {
  const k = scaleOf(fontSize);
  const {
    bits: { a, b },
    flip,
  } = useBits({ a: 1, b: 0 });
  const result = a & b;
  const pa = { x: 130, y: 85 };
  const pb = { x: 130, y: 175 };
  const g = { x: 300, y: 130 };
  const out = { x: 470, y: 130 };
  return (
    <>
      <Wire from={outOfNode(pa, k)} to={into(g, 0, k)} on={a} />
      <Wire from={outOfNode(pb, k)} to={into(g, 1, k)} on={b} />
      <Wire from={outOfGate(g, k)} to={intoNode(out, k)} on={result} />
      <Gate {...g} label="AND" fontSize={fontSize} />
      <Node {...pa} label="raining?" value={a} fontSize={fontSize} onToggle={flip("a")} />
      <Node {...pb} label="going out?" value={b} fontSize={fontSize} onToggle={flip("b")} />
      <Node {...out} label="need umbrella?" value={result} fontSize={fontSize} output />
    </>
  );
}

function HalfAdder({ fontSize }: { fontSize: FontSize }) {
  const k = scaleOf(fontSize);
  const {
    bits: { a, b },
    flip,
  } = useBits({ a: 1, b: 0 });
  const sum = a ^ b;
  const carry = a & b;
  const pa = { x: 130, y: 85 };
  const pb = { x: 130, y: 175 };
  const xor = { x: 300, y: 85 };
  const and = { x: 300, y: 175 };
  const pSum = { x: 470, y: 85 };
  const pCarry = { x: 470, y: 175 };
  return (
    <>
      {[xor, and].flatMap((g) => [
        <Wire key={`a${g.y}`} from={outOfNode(pa, k)} to={into(g, 0, k)} on={a} />,
        <Wire key={`b${g.y}`} from={outOfNode(pb, k)} to={into(g, 1, k)} on={b} />,
      ])}
      <Wire from={outOfGate(xor, k)} to={intoNode(pSum, k)} on={sum} />
      <Wire from={outOfGate(and, k)} to={intoNode(pCarry, k)} on={carry} />
      <Gate {...xor} label="XOR" fontSize={fontSize} />
      <Gate {...and} label="AND" fontSize={fontSize} />
      <Node {...pa} label="digit A" value={a} fontSize={fontSize} onToggle={flip("a")} />
      <Node {...pb} label="digit B" value={b} fontSize={fontSize} onToggle={flip("b")} />
      <Node {...pSum} label="sum digit" value={sum} fontSize={fontSize} output />
      <Node {...pCarry} label="carry digit" value={carry} fontSize={fontSize} output />
    </>
  );
}

function TwoDigitAdder({ fontSize }: { fontSize: FontSize }) {
  const k = scaleOf(fontSize);
  const { bits, flip } = useBits({ a2: 1, b2: 0, a1: 1, b1: 1 });
  const and2v = bits.a2 & bits.b2;
  const xor2v = bits.a2 ^ bits.b2;
  const carry1v = bits.a1 & bits.b1;
  const sum1v = bits.a1 ^ bits.b1;
  const carryIn2v = xor2v & carry1v;
  const sum2v = xor2v ^ carry1v;
  const carry4v = and2v | carryIn2v;

  const a2 = { x: 70, y: spreadY(45, k) };
  const b2 = { x: 70, y: spreadY(105, k) };
  const a1 = { x: 70, y: spreadY(165, k) };
  const b1 = { x: 70, y: spreadY(225, k) };
  const and2 = { x: 210, y: spreadY(45, k) };
  const xor2 = { x: 210, y: spreadY(110, k) };
  const carry1 = { x: 210, y: spreadY(170, k) };
  const sum1 = { x: 210, y: spreadY(228, k) };
  const carryIn2 = { x: 340, y: spreadY(110, k) };
  const sum2 = { x: 340, y: spreadY(170, k) };
  const carry4 = { x: 440, y: spreadY(70, k) };
  const four = { x: 540, y: spreadY(70, k) };
  const two = { x: 540, y: spreadY(160, k) };
  const one = { x: 540, y: spreadY(228, k) };
  const wires: [Point, Point, number][] = [
    [outOfNode(a2, k), into(and2, 0, k), bits.a2],
    [outOfNode(b2, k), into(and2, 1, k), bits.b2],
    [outOfNode(a2, k), into(xor2, 0, k), bits.a2],
    [outOfNode(b2, k), into(xor2, 1, k), bits.b2],
    [outOfNode(a1, k), into(carry1, 0, k), bits.a1],
    [outOfNode(b1, k), into(carry1, 1, k), bits.b1],
    [outOfNode(a1, k), into(sum1, 0, k), bits.a1],
    [outOfNode(b1, k), into(sum1, 1, k), bits.b1],
    [outOfGate(xor2, k), into(carryIn2, 0, k), xor2v],
    [outOfGate(carry1, k), into(carryIn2, 1, k), carry1v],
    [outOfGate(xor2, k), into(sum2, 0, k), xor2v],
    [outOfGate(carry1, k), into(sum2, 1, k), carry1v],
    [outOfGate(and2, k), into(carry4, 0, k), and2v],
    [outOfGate(carryIn2, k), into(carry4, 1, k), carryIn2v],
    [outOfGate(carry4, k), intoNode(four, k), carry4v],
    [outOfGate(sum2, k), intoNode(two, k), sum2v],
    [outOfGate(sum1, k), intoNode(one, k), sum1v],
  ];
  const gates: [Point, string][] = [
    [and2, "AND"],
    [xor2, "XOR"],
    [carry1, "AND"],
    [sum1, "XOR"],
    [carryIn2, "AND"],
    [sum2, "XOR"],
    [carry4, "OR"],
  ];
  return (
    <>
      {wires.map(([from, to, on], i) => (
        <Wire key={i} from={from} to={to} on={on} />
      ))}
      {gates.map(([p, label], i) => (
        <Gate key={i} {...p} label={label} fontSize={fontSize} />
      ))}
      <Node {...a2} label="A 2s" value={bits.a2} fontSize={fontSize} onToggle={flip("a2")} />
      <Node {...b2} label="B 2s" value={bits.b2} fontSize={fontSize} onToggle={flip("b2")} />
      <Node {...a1} label="A 1s" value={bits.a1} fontSize={fontSize} onToggle={flip("a1")} />
      <Node {...b1} label="B 1s" value={bits.b1} fontSize={fontSize} onToggle={flip("b1")} />
      <Node {...four} label="sum 4s" value={carry4v} fontSize={fontSize} output />
      <Node {...two} label="sum 2s" value={sum2v} fontSize={fontSize} output />
      <Node {...one} label="sum 1s" value={sum1v} fontSize={fontSize} output />
    </>
  );
}

// A block standing for one small circuit, drawn as a box of tiny gates
function GateBlock({ x, y, w, h, gates }: { x: number; y: number; w: number; h: number; gates: number }) {
  const cols = Math.ceil(Math.sqrt((gates * w) / h));
  const rows = Math.ceil(gates / cols);
  const cellW = (w - 8) / cols;
  const cellH = (h - 8) / rows;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="white" stroke="#9ca3af" strokeWidth={1.5} />
      {Array.from({ length: gates }, (_, i) => (
        <rect
          key={i}
          x={x + 4 + (i % cols) * cellW + cellW * 0.15}
          y={y + 4 + Math.floor(i / cols) * cellH + cellH * 0.15}
          width={cellW * 0.7}
          height={cellH * 0.7}
          rx={1}
          fill="#fde68a"
          stroke="#f59e0b"
          strokeWidth={0.6}
        />
      ))}
    </g>
  );
}

function EightDigitAdder({ fontSize }: { fontSize: FontSize }) {
  const blockW = 52;
  const gap = 14;
  const startX = (W - (8 * blockW + 7 * gap)) / 2;
  const y = 95;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const x = startX + i * (blockW + gap);
        return (
          <g key={i}>
            <line x1={x + blockW / 2 - 8} y1={50} x2={x + blockW / 2 - 8} y2={y} stroke="#9ca3af" strokeWidth={1.5} />
            <line x1={x + blockW / 2 + 8} y1={50} x2={x + blockW / 2 + 8} y2={y} stroke="#9ca3af" strokeWidth={1.5} />
            <line x1={x + blockW / 2} y1={y + 50} x2={x + blockW / 2} y2={y + 85} stroke="#9ca3af" strokeWidth={1.5} />
            {i < 7 && (
              <line x1={x + blockW + gap} y1={y + 25} x2={x + blockW} y2={y + 25} stroke="#f59e0b" strokeWidth={1.5} />
            )}
            <GateBlock x={x} y={y} w={blockW} h={50} gates={5} />
          </g>
        );
      })}
      <text x={W / 2} y={38} textAnchor="middle" fontSize={fontSize(11)} className="fill-foreground font-semibold select-none">
        8 digits of A and 8 digits of B come in
      </text>
      <text x={W / 2} y={y + 105} textAnchor="middle" fontSize={fontSize(11)} className="fill-foreground font-semibold select-none">
        The sum comes out, with each block passing its carry to the next
      </text>
    </>
  );
}

function Multiplier() {
  // An 8×8 array multiplier: 64 AND gates plus 56 adders of about 5 gates each
  const rows = 8;
  const blockW = 44;
  const blockH = 22;
  return (
    <>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => (
          <GateBlock
            key={`${r}-${c}`}
            x={W / 2 - 4 * (blockW + 6) + c * (blockW + 6) - r * 12 + 40}
            y={22 + r * (blockH + 5)}
            w={blockW}
            h={blockH}
            gates={r === 0 ? 1 : 6}
          />
        ))
      )}
    </>
  );
}

function DenseGates({ count, cols, color }: { count: number; cols: number; color: string }) {
  const rows = Math.ceil(count / cols);
  const cell = Math.min((W - 40) / cols, (H - 30) / rows);
  const x0 = (W - cols * cell) / 2;
  const y0 = (H - rows * cell) / 2;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x0 + (i % cols) * cell}
          y={y0 + Math.floor(i / cols) * cell}
          width={cell * 0.75}
          height={cell * 0.75}
          fill={color}
        />
      ))}
    </>
  );
}

function PhoneChip({ fontSize }: { fontSize: FontSize }) {
  return (
    <>
      <defs>
        <pattern id="gst-chip" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#f59e0b" opacity={0.55} />
        </pattern>
      </defs>
      <rect x={W / 2 - 95} y={20} width={190} height={190} rx={6} fill="#fffbeb" stroke="#78716c" strokeWidth={3} />
      <rect x={W / 2 - 85} y={30} width={170} height={170} fill="url(#gst-chip)" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <line x1={W / 2 - 95 - 12} y1={35 + i * 14} x2={W / 2 - 95} y2={35 + i * 14} stroke="#78716c" strokeWidth={3} />
          <line x1={W / 2 + 95} y1={35 + i * 14} x2={W / 2 + 95 + 12} y2={35 + i * 14} stroke="#78716c" strokeWidth={3} />
        </g>
      ))}
      <text x={W / 2} y={235} textAnchor="middle" fontSize={fontSize(11)} className="fill-foreground font-semibold select-none">
        Far too many gates to draw: each dot here stands for about a million
      </text>
    </>
  );
}

interface Stage {
  id: string;
  tab: string;
  gates: number;
  title: string;
  text: ReactNode;
  draw: (fontSize: FontSize) => ReactNode;
  // Drawing height for a given scale (see scaleOf), when it isn't always H
  height?: (k: number) => number;
}

const STAGES: Stage[] = [
  {
    id: "one",
    tab: "1 gate",
    gates: 1,
    title: "One gate answers one yes-or-no question",
    text: "An AND gate on its own: you need an umbrella if it's raining AND you're going outside. Tap an input to flip it between 0 and 1.",
    draw: (fontSize) => <OneGate fontSize={fontSize} />,
  },
  {
    id: "two",
    tab: "2 gates",
    gates: 2,
    title: "Two gates add two 1-digit numbers",
    text: "Computers write numbers in binary, using only the digits 0 and 1. Adding two such digits takes just an XOR (the sum digit) and an AND (whether to carry a 1). Tap the inputs to try 0 + 0, 0 + 1, and 1 + 1.",
    draw: (fontSize) => <HalfAdder fontSize={fontSize} />,
  },
  {
    id: "seven",
    tab: "7 gates",
    gates: 7,
    title: "Seven gates add two 2-digit numbers",
    text: "Two-digit binary numbers go up to 3, so this circuit can work out anything from 0 + 0 up to 3 + 3. Tap the inputs to change the numbers.",
    draw: (fontSize) => <TwoDigitAdder fontSize={fontSize} />,
    height: (k) => spreadY(H, k),
  },
  {
    id: "forty",
    tab: "40 gates",
    gates: 40,
    title: "About 40 gates add two 8-digit numbers",
    text: "Chain eight small adders together, each passing its carry to the next, and you can add any two numbers up to 255.",
    draw: (fontSize) => <EightDigitAdder fontSize={fontSize} />,
  },
  {
    id: "multiply",
    tab: "350 gates",
    gates: 350,
    title: "About 350 gates multiply two 8-digit numbers",
    text: "Multiplying is lots of adding, so a multiplier is a grid of small adders: a few hundred gates in all.",
    draw: () => <Multiplier />,
  },
  {
    id: "apollo",
    tab: "5,600 gates",
    gates: 5600,
    title: "About 5,600 gates flew astronauts to the Moon",
    text: "The Apollo Guidance Computer, which steered the 1969 Moon landing, was built from about 5,600 gates, all of a single kind. Each dot below is one gate.",
    draw: () => <DenseGates count={5600} cols={112} color="#f59e0b" />,
  },
  {
    id: "phone",
    tab: "Billions",
    gates: 3e9,
    title: "Billions of gates fit in your pocket",
    text: "A modern phone chip, such as Apple's A17 Pro, packs 19 billion transistors (the tiny switches that gates are made from) into a square about a centimeter across. That works out to billions of gates.",
    draw: (fontSize) => <PhoneChip fontSize={fontSize} />,
  },
];

// Log-scale bar showing where the current circuit sits, from 1 gate to 10 billion
const SCALE_MAX_POWER = 10;
const SCALE_TICKS = [
  { power: 0, label: "1" },
  { power: 3, label: "1,000" },
  { power: 6, label: "1 million" },
  { power: 9, label: "1 billion" },
];

function GateScale({ gates, fontSize, svgRef }: { gates: number; fontSize: FontSize; svgRef: RefObject<SVGSVGElement | null> }) {
  const left = 40;
  const right = W - 40;
  const toX = (n: number) => left + (Math.log10(n) / SCALE_MAX_POWER) * (right - left);
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} 60`} className="mt-3 w-full" aria-label={`About ${gates.toLocaleString()} gates on a scale from 1 to 10 billion`}>
      <line x1={left} y1={24} x2={right} y2={24} stroke="#d1d5db" strokeWidth={4} strokeLinecap="round" />
      <line x1={left} y1={24} x2={toX(gates)} y2={24} stroke="#f59e0b" strokeWidth={4} strokeLinecap="round" />
      {STAGES.map((s) => (
        <circle key={s.id} cx={toX(s.gates)} cy={24} r={3} fill="#9ca3af" />
      ))}
      <circle cx={toX(gates)} cy={24} r={8} fill="#f59e0b" stroke="white" strokeWidth={2} />
      {SCALE_TICKS.map((t) => (
        <text
          key={t.power}
          x={left + (t.power / SCALE_MAX_POWER) * (right - left)}
          y={52}
          textAnchor="middle"
          fontSize={fontSize(11)}
          className="fill-muted select-none"
        >
          {t.label}
        </text>
      ))}
    </svg>
  );
}

export function GateScaleTour() {
  const [stageId, setStageId] = useState(STAGES[0].id);
  // Bumped by Reset, so the drawing is rebuilt and its input bits go back to their starting values
  const [resetCount, setResetCount] = useState(0);
  const reset = useCallback(() => {
    setStageId(STAGES[0].id);
    setResetCount((n) => n + 1);
  }, []);
  const stage = STAGES.find((s) => s.id === stageId) ?? STAGES[0];
  const svgRef = useRef<SVGSVGElement>(null);
  const fontSize = useSvgFontSize(svgRef, W);
  const scaleRef = useRef<SVGSVGElement>(null);
  const scaleFontSize = useSvgFontSize(scaleRef, W);

  return (
    <WidgetContainer
      title="From One Gate to Billions"
      description="Bigger jobs are just more gates, wired together. You don't need to follow the wiring."
      onReset={reset}
    >
      <WidgetTabs tabs={STAGES.map((s) => ({ id: s.id, label: s.tab }))} activeTab={stageId} onTabChange={setStageId} />
      <div className="mb-1 text-center text-sm font-semibold text-foreground">{stage.title}</div>
      <div className="mx-auto mb-2 max-w-xl text-center text-sm text-muted">{stage.text}</div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${stage.height ? stage.height(scaleOf(fontSize)) : H}`}
        className="w-full"
        aria-label={stage.title}
      >
        <g key={`${stage.id}-${resetCount}`}>{stage.draw(fontSize)}</g>
      </svg>
      <GateScale gates={stage.gates} fontSize={scaleFontSize} svgRef={scaleRef} />
    </WidgetContainer>
  );
}
