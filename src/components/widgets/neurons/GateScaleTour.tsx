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

interface Point {
  x: number;
  y: number;
}

function Gate({ x, y, label, fontSize }: { x: number; y: number; label: string; fontSize: FontSize }) {
  return (
    <g>
      <rect x={x - GATE_W / 2} y={y - GATE_H / 2} width={GATE_W} height={GATE_H} rx={6} fill="#fef9ee" stroke="#f59e0b" strokeWidth={2} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={fontSize(12)} className="fill-warning font-bold select-none">
        {label}
      </text>
    </g>
  );
}

function Node({ x, y, label, fontSize, output }: { x: number; y: number; label: string; fontSize: FontSize; output?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={NODE_R} fill={output ? "#f0fdf4" : "#f0f4ff"} stroke={output ? "#10b981" : "#3b82f6"} strokeWidth={2} />
      <text x={x} y={y - NODE_R - 6} textAnchor="middle" fontSize={fontSize(11)} className="fill-foreground font-semibold select-none">
        {label}
      </text>
    </g>
  );
}

function Wire({ from, to }: { from: Point; to: Point }) {
  return <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#9ca3af" strokeWidth={1.5} />;
}

// Wire from a node or gate's right side into the top (port 0) or bottom (port 1) of a gate's left side
function into(gate: Point, port: 0 | 1): Point {
  return { x: gate.x - GATE_W / 2, y: gate.y + (port === 0 ? -8 : 8) };
}
function outOfGate(gate: Point): Point {
  return { x: gate.x + GATE_W / 2, y: gate.y };
}
function outOfNode(node: Point): Point {
  return { x: node.x + NODE_R, y: node.y };
}

function OneGate({ fontSize }: { fontSize: FontSize }) {
  const a = { x: 130, y: 85 };
  const b = { x: 130, y: 175 };
  const g = { x: 300, y: 130 };
  const out = { x: 470, y: 130 };
  return (
    <>
      <Wire from={outOfNode(a)} to={into(g, 0)} />
      <Wire from={outOfNode(b)} to={into(g, 1)} />
      <Wire from={outOfGate(g)} to={{ x: out.x - NODE_R, y: out.y }} />
      <Gate {...g} label="AND" fontSize={fontSize} />
      <Node {...a} label="raining?" fontSize={fontSize} />
      <Node {...b} label="going out?" fontSize={fontSize} />
      <Node {...out} label="need umbrella?" fontSize={fontSize} output />
    </>
  );
}

function HalfAdder({ fontSize }: { fontSize: FontSize }) {
  const a = { x: 130, y: 85 };
  const b = { x: 130, y: 175 };
  const xor = { x: 300, y: 85 };
  const and = { x: 300, y: 175 };
  const sum = { x: 470, y: 85 };
  const carry = { x: 470, y: 175 };
  return (
    <>
      {[xor, and].flatMap((g) => [
        <Wire key={`a${g.y}`} from={outOfNode(a)} to={into(g, 0)} />,
        <Wire key={`b${g.y}`} from={outOfNode(b)} to={into(g, 1)} />,
      ])}
      <Wire from={outOfGate(xor)} to={{ x: sum.x - NODE_R, y: sum.y }} />
      <Wire from={outOfGate(and)} to={{ x: carry.x - NODE_R, y: carry.y }} />
      <Gate {...xor} label="XOR" fontSize={fontSize} />
      <Gate {...and} label="AND" fontSize={fontSize} />
      <Node {...a} label="digit A" fontSize={fontSize} />
      <Node {...b} label="digit B" fontSize={fontSize} />
      <Node {...sum} label="sum digit" fontSize={fontSize} output />
      <Node {...carry} label="carry digit" fontSize={fontSize} output />
    </>
  );
}

function TwoDigitAdder({ fontSize }: { fontSize: FontSize }) {
  const a2 = { x: 70, y: 45 };
  const b2 = { x: 70, y: 105 };
  const a1 = { x: 70, y: 165 };
  const b1 = { x: 70, y: 225 };
  const and2 = { x: 210, y: 45 };
  const xor2 = { x: 210, y: 110 };
  const carry1 = { x: 210, y: 170 };
  const sum1 = { x: 210, y: 228 };
  const carryIn2 = { x: 340, y: 110 };
  const sum2 = { x: 340, y: 170 };
  const carry4 = { x: 440, y: 70 };
  const four = { x: 540, y: 70 };
  const two = { x: 540, y: 160 };
  const one = { x: 540, y: 228 };
  const wires: [Point, Point][] = [
    [outOfNode(a2), into(and2, 0)],
    [outOfNode(b2), into(and2, 1)],
    [outOfNode(a2), into(xor2, 0)],
    [outOfNode(b2), into(xor2, 1)],
    [outOfNode(a1), into(carry1, 0)],
    [outOfNode(b1), into(carry1, 1)],
    [outOfNode(a1), into(sum1, 0)],
    [outOfNode(b1), into(sum1, 1)],
    [outOfGate(xor2), into(carryIn2, 0)],
    [outOfGate(carry1), into(carryIn2, 1)],
    [outOfGate(xor2), into(sum2, 0)],
    [outOfGate(carry1), into(sum2, 1)],
    [outOfGate(and2), into(carry4, 0)],
    [outOfGate(carryIn2), into(carry4, 1)],
    [outOfGate(carry4), { x: four.x - NODE_R, y: four.y }],
    [outOfGate(sum2), { x: two.x - NODE_R, y: two.y }],
    [outOfGate(sum1), { x: one.x - NODE_R, y: one.y }],
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
  const nodes: [Point, string, boolean][] = [
    [a2, "A 2s", false],
    [b2, "B 2s", false],
    [a1, "A 1s", false],
    [b1, "B 1s", false],
    [four, "sum 4s", true],
    [two, "sum 2s", true],
    [one, "sum 1s", true],
  ];
  return (
    <>
      {wires.map(([from, to], i) => (
        <Wire key={i} from={from} to={to} />
      ))}
      {gates.map(([p, label], i) => (
        <Gate key={i} {...p} label={label} fontSize={fontSize} />
      ))}
      {nodes.map(([p, label, output]) => (
        <Node key={label} {...p} label={label} fontSize={fontSize} output={output} />
      ))}
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
}

const STAGES: Stage[] = [
  {
    id: "one",
    tab: "1 gate",
    gates: 1,
    title: "One gate answers one yes-or-no question",
    text: "An AND gate on its own: you need an umbrella if it's raining AND you're going outside.",
    draw: (fontSize) => <OneGate fontSize={fontSize} />,
  },
  {
    id: "two",
    tab: "2 gates",
    gates: 2,
    title: "Two gates add two 1-digit numbers",
    text: "Computers write numbers in binary, using only the digits 0 and 1. Adding two such digits takes just an XOR (the sum digit) and an AND (whether to carry a 1).",
    draw: (fontSize) => <HalfAdder fontSize={fontSize} />,
  },
  {
    id: "seven",
    tab: "7 gates",
    gates: 7,
    title: "Seven gates add two 2-digit numbers",
    text: "Two-digit binary numbers go up to 3, so this circuit can work out anything from 0 + 0 up to 3 + 3.",
    draw: (fontSize) => <TwoDigitAdder fontSize={fontSize} />,
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
  const reset = useCallback(() => setStageId(STAGES[0].id), []);
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
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={stage.title}>
        {stage.draw(fontSize)}
      </svg>
      <GateScale gates={stage.gates} fontSize={scaleFontSize} svgRef={scaleRef} />
    </WidgetContainer>
  );
}
