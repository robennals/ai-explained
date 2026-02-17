"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/** Sigmoid activation */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function isApproxSigmoid(v: number): boolean {
  return (v > 0 && v < 0.005) || (v > 0.995 && v < 1);
}

function outputLabel(v: number): string {
  if (v >= 0.9) return "Definitely true";
  if (v >= 0.65) return "Probably true";
  if (v > 0.35) return "Uncertain";
  if (v > 0.1) return "Probably false";
  return "Definitely false";
}

function outputColor(v: number): string {
  if (v <= 0.5) {
    const t = v / 0.5;
    const r = Math.round(239 + (160 - 239) * t);
    const g = Math.round(68 + (160 - 68) * t);
    const b = Math.round(68 + (160 - 68) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (v - 0.5) / 0.5;
    const r = Math.round(160 + (16 - 160) * t);
    const g = Math.round(160 + (185 - 160) * t);
    const b = Math.round(160 + (129 - 160) * t);
    return `rgb(${r},${g},${b})`;
  }
}

const INPUT_COMBOS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

type GateName = "AND" | "OR" | "NOT (A)" | "NAND";
type ActiveGate = GateName | "Custom";

const GATE_NAMES: GateName[] = ["AND", "OR", "NOT (A)", "NAND"];


const GATE_CHECKS: Record<GateName, number[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  "NOT (A)": [1, 1, 0, 0],
  NAND: [1, 1, 1, 0],
};

const GATE_SOLUTIONS: Record<GateName, { w1: number; w2: number; bias: number }> = {
  AND: { w1: 10, w2: 10, bias: -15 },
  OR: { w1: 10, w2: 10, bias: -5 },
  "NOT (A)": { w1: -10, w2: 0, bias: 5 },
  NAND: { w1: -10, w2: -10, bias: 15 },
};

// Layout constants
const W = 680;
const H = 370;
const IN_X = 55;
const IN_A_Y = 65;
const IN_B_Y = 270;
const SUM_X = 290;
const SUM_Y = 160;
const ACT_X = 450;
const ACT_Y = 160;
const ACT_W = 110;
const ACT_H = 75;
const OUT_X = 610;
const OUT_Y = 160;

function interpretInput(v: number): string {
  if (v >= 0.9) return "true";
  if (v >= 0.65) return "probably true";
  if (v > 0.35) return "unsure";
  if (v > 0.1) return "probably false";
  return "false";
}

function interpretWeight(v: number): string {
  const a = Math.abs(v);
  if (a < 1) return "ignored";
  if (v > 0) return a >= 8 ? "strongly for" : "weakly for";
  return a >= 8 ? "strongly against" : "weakly against";
}

function interpretBias(v: number): string {
  const a = Math.abs(v);
  if (a < 1) return "neutral";
  if (v > 0) return a >= 10 ? "strongly on" : "leans on";
  return a >= 10 ? "strongly off" : "leans off";
}

// Small inline slider rendered via foreignObject
function MiniSlider({
  x,
  y,
  value,
  min,
  max,
  step,
  onChange,
  label,
  interpret,
  showValue = true,
  width = 80,
}: {
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  interpret?: (v: number) => string;
  showValue?: boolean;
  width?: number;
}) {
  return (
    <foreignObject x={x - width / 2} y={y} width={width} height={80} style={{ overflow: "visible" }}>
      <div className="flex flex-col items-center" style={{ overflow: "visible" }}>
        {label && (
          <div className="text-[12px] font-bold text-foreground whitespace-nowrap leading-none">
            {label}
          </div>
        )}
        {showValue && (
          <div className="font-mono font-bold text-foreground text-[14px] leading-none">
            {value.toFixed(1)}
          </div>
        )}
        <div className="w-full py-px">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-accent"
          />
        </div>
        {interpret && (
          <div className="font-bold text-foreground text-[10px] leading-none whitespace-nowrap">
            {interpret(value)}
          </div>
        )}
      </div>
    </foreignObject>
  );
}

export function NeuronPlayground() {
  const [inputA, setInputA] = useState(1.0);
  const [inputB, setInputB] = useState(0.0);
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0);
  const [bias, setBias] = useState(0);
  const [, setIsAnimating] = useState(false);
  const [animatingTo, setAnimatingTo] = useState<GateName | null>(null);
  const animRef = useRef<number>(0);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setInputA(1.0);
    setInputB(0.0);
    setW1(0);
    setW2(0);
    setBias(0);
    setIsAnimating(false);
    setAnimatingTo(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const weightedSum = w1 * inputA + w2 * inputB + bias;
  const output = sigmoid(weightedSum);
  const prodA = w1 * inputA;
  const prodB = w2 * inputB;

  // Arrow endpoints
  const aStart = { x: IN_X + 22, y: IN_A_Y };
  const aEnd = { x: SUM_X - 28, y: SUM_Y };
  const bStart = { x: IN_X + 22, y: IN_B_Y };
  const bEnd = { x: SUM_X - 28, y: SUM_Y };

  const waX = 155;
  const waT = (waX - aStart.x) / (aEnd.x - aStart.x);
  const waY = aStart.y + waT * (aEnd.y - aStart.y);

  const wbX = 155;
  const wbT = (wbX - bStart.x) / (bEnd.x - bStart.x);
  const wbY = bStart.y + wbT * (bEnd.y - bStart.y);

  // Sigmoid curve path
  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    const pL = ACT_X - ACT_W / 2 + 8;
    const pR = ACT_X + ACT_W / 2 - 8;
    const pT = ACT_Y - ACT_H / 2 + 8;
    const pB = ACT_Y + ACT_H / 2 - 8;
    for (let i = 0; i <= 100; i++) {
      const xv = -10 + 20 * (i / 100);
      const yv = sigmoid(xv);
      pts.push(
        `${i === 0 ? "M" : "L"}${(pL + (i / 100) * (pR - pL)).toFixed(1)},${(pB - yv * (pB - pT)).toFixed(1)}`
      );
    }
    return pts.join(" ");
  }, []);

  // Operating point on sigmoid
  const opFrac = Math.max(0, Math.min(1, (weightedSum + 10) / 20));
  const pL = ACT_X - ACT_W / 2 + 8;
  const pR = ACT_X + ACT_W / 2 - 8;
  const pT = ACT_Y - ACT_H / 2 + 8;
  const pB = ACT_Y + ACT_H / 2 - 8;
  const opSx = pL + opFrac * (pR - pL);
  const opSy = pB - output * (pB - pT);

  // Truth table
  const truthTable = useMemo(
    () =>
      INPUT_COMBOS.map(([a, b]) => {
        const z = w1 * a + w2 * b + bias;
        return { a, b, output: sigmoid(z) };
      }),
    [w1, w2, bias]
  );

  // Derive the matched gate purely from the truth table
  const matchedGate: ActiveGate = useMemo(() => {
    for (const name of GATE_NAMES) {
      const expected = GATE_CHECKS[name];
      const matches = expected.every((exp, i) => {
        const out = truthTable[i].output;
        return exp === 1 ? out > 0.8 : out < 0.2;
      });
      if (matches) return name;
    }
    return "Custom";
  }, [truthTable]);

  // Targets to show in truth table: use animatingTo during animation, matchedGate otherwise
  const displayedGate: ActiveGate = animatingTo ?? matchedGate;
  const gateTargets: number[] | null = displayedGate === "Custom" ? null : GATE_CHECKS[displayedGate];

  // Animate weights to a gate's solution
  const selectGate = useCallback((name: GateName) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setAnimatingTo(name);

    const startW1 = w1;
    const startW2 = w2;
    const startBias = bias;
    const target = GATE_SOLUTIONS[name];
    const duration = 60; // frames
    let step = 0;
    setIsAnimating(true);

    const animate = () => {
      step++;
      const t = Math.min(1, step / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      setW1(startW1 + (target.w1 - startW1) * ease);
      setW2(startW2 + (target.w2 - startW2) * ease);
      setBias(startBias + (target.bias - startBias) * ease);

      if (t >= 1) {
        setIsAnimating(false);
        setAnimatingTo(null);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [w1, w2, bias]);

  return (
    <WidgetContainer
      title="Neurons as Smooth Logic"
      description="Click each gate to see a neuron smoothly shift its weights to compute it."
      onReset={reset}
    >
      {/* Gate selector */}
      <div className="flex gap-1 mb-4 justify-center flex-wrap">
        {GATE_NAMES.map((name) => {
          const active = animatingTo ? animatingTo === name : matchedGate === name;
          return (
            <button
              key={name}
              onClick={() => selectGate(name)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                active
                  ? "bg-accent text-white"
                  : "bg-foreground/[0.05] text-muted hover:text-foreground"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="mb-2 text-center font-mono text-sm text-foreground">
        output = sigmoid(weight<sub>A</sub> &times; input<sub>A</sub> + weight<sub>B</sub> &times; input<sub>B</sub> + bias)
      </div>

      {/* Interactive neuron diagram */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label="Interactive neuron diagram"
      >
        <defs>
          <marker
            id="np-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* === INPUT A === */}
        <text
          x={IN_X}
          y={IN_A_Y - 26}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Input A
        </text>
        <circle
          cx={IN_X}
          cy={IN_A_Y}
          r={20}
          fill="#f0f4ff"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <text
          x={IN_X}
          y={IN_A_Y + 5}
          textAnchor="middle"
          className="fill-accent text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {inputA.toFixed(1)}
        </text>
        <MiniSlider
          x={IN_X}
          y={IN_A_Y + 16}
          value={inputA}
          min={0}
          max={1}
          step={0.1}
          onChange={setInputA}
          label=""
          interpret={interpretInput}
          showValue={false}
        />

        {/* === INPUT B === */}
        <text
          x={IN_X}
          y={IN_B_Y - 26}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Input B
        </text>
        <circle
          cx={IN_X}
          cy={IN_B_Y}
          r={20}
          fill="#f0f4ff"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <text
          x={IN_X}
          y={IN_B_Y + 5}
          textAnchor="middle"
          className="fill-accent text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {inputB.toFixed(1)}
        </text>
        <MiniSlider
          x={IN_X}
          y={IN_B_Y + 16}
          value={inputB}
          min={0}
          max={1}
          step={0.1}
          onChange={setInputB}
          label=""
          interpret={interpretInput}
          showValue={false}
        />

        {/* === ARROW A → SUM === */}
        <line
          x1={aStart.x}
          y1={aStart.y}
          x2={aEnd.x}
          y2={aEnd.y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#np-arrow)"
        />
        <line
          x1={waX}
          y1={waY}
          x2={waX}
          y2={waY + 4}
          stroke="#9ca3af"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />
        <MiniSlider
          x={waX}
          y={waY + 4}
          value={w1}
          min={-15}
          max={15}
          step={0.1}
          onChange={setW1}
          label="Weight A"
          interpret={interpretWeight}
          width={90}
        />
        <text
          x={230}
          y={aStart.y + 0.82 * (aEnd.y - aStart.y) - 8}
          textAnchor="middle"
          className="fill-muted text-[9px] font-mono pointer-events-none select-none"
        >
          = {prodA.toFixed(1)}
        </text>

        {/* === ARROW B → SUM === */}
        <line
          x1={bStart.x}
          y1={bStart.y}
          x2={bEnd.x}
          y2={bEnd.y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#np-arrow)"
        />
        <line
          x1={wbX}
          y1={wbY}
          x2={wbX}
          y2={wbY + 4}
          stroke="#9ca3af"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />
        <MiniSlider
          x={wbX}
          y={wbY + 4}
          value={w2}
          min={-15}
          max={15}
          step={0.1}
          onChange={setW2}
          label="Weight B"
          interpret={interpretWeight}
          width={90}
        />
        <text
          x={230}
          y={bStart.y + 0.82 * (bEnd.y - bStart.y) + 14}
          textAnchor="middle"
          className="fill-muted text-[9px] font-mono pointer-events-none select-none"
        >
          = {prodB.toFixed(1)}
        </text>

        {/* === SUM NODE === */}
        <text
          x={SUM_X}
          y={SUM_Y - 32}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Sum
        </text>
        <circle
          cx={SUM_X}
          cy={SUM_Y}
          r={26}
          fill="#fef9ee"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <text
          x={SUM_X}
          y={SUM_Y + 5}
          textAnchor="middle"
          className="fill-warning text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {weightedSum.toFixed(1)}
        </text>

        {/* === BIAS === */}
        <line
          x1={SUM_X}
          y1={SUM_Y + 40}
          x2={SUM_X}
          y2={SUM_Y + 28}
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="3,2"
          markerEnd="url(#np-arrow)"
        />
        <MiniSlider
          x={SUM_X}
          y={SUM_Y + 40}
          value={bias}
          min={-20}
          max={20}
          step={0.1}
          onChange={setBias}
          label="Bias"
          interpret={interpretBias}
          width={90}
        />

        {/* === SUM → ACTIVATION === */}
        <line
          x1={SUM_X + 28}
          y1={SUM_Y}
          x2={ACT_X - ACT_W / 2 - 4}
          y2={ACT_Y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#np-arrow)"
        />

        {/* === ACTIVATION FUNCTION BOX === */}
        <rect
          x={ACT_X - ACT_W / 2}
          y={ACT_Y - ACT_H / 2}
          width={ACT_W}
          height={ACT_H}
          rx={10}
          fill="#f0fdf4"
          stroke="#10b981"
          strokeWidth="2"
        />
        <text
          x={ACT_X}
          y={ACT_Y - ACT_H / 2 - 6}
          textAnchor="middle"
          className="fill-success text-[9px] font-semibold uppercase tracking-wider pointer-events-none select-none"
        >
          Activation
        </text>
        <path d={sigmoidPath} fill="none" stroke="#10b981" strokeWidth="2" />
        <line
          x1={opSx}
          y1={pB}
          x2={opSx}
          y2={opSy}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.6}
        />
        <line
          x1={pL}
          y1={opSy}
          x2={opSx}
          y2={opSy}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.6}
        />
        <circle
          cx={opSx}
          cy={opSy}
          r={5}
          fill="#f59e0b"
          stroke="white"
          strokeWidth="1.5"
        />

        {/* === ACTIVATION → OUTPUT === */}
        <line
          x1={ACT_X + ACT_W / 2 + 2}
          y1={ACT_Y}
          x2={OUT_X - 26}
          y2={OUT_Y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#np-arrow)"
        />

        {/* === OUTPUT NODE === */}
        <text
          x={OUT_X}
          y={OUT_Y - 30}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Output
        </text>
        <circle
          cx={OUT_X}
          cy={OUT_Y}
          r={24}
          fill={outputColor(output)}
          stroke={outputColor(output)}
          strokeWidth="2"
        />
        <text
          x={OUT_X}
          y={OUT_Y + 5}
          textAnchor="middle"
          className="fill-white text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {output.toFixed(2)}
        </text>
        {isApproxSigmoid(output) && (
          <text
            x={OUT_X}
            y={OUT_Y + 18}
            textAnchor="middle"
            className="fill-white/70 text-[8px] pointer-events-none select-none"
          >
            approx
          </text>
        )}
        <text
          x={OUT_X}
          y={OUT_Y + 40}
          textAnchor="middle"
          className="fill-foreground text-[11px] font-medium pointer-events-none select-none"
        >
          {outputLabel(output)}
        </text>
      </svg>

      {/* Truth table */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-foreground mb-2">
          Input Combinations
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted">
                  A
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-muted">
                  B
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-muted">
                  Output
                </th>
                {gateTargets && (
                  <>
                    <th className="px-2 py-1.5 text-left font-medium text-muted">
                      Target
                    </th>
                    <th className="px-2 py-1.5 text-center font-medium text-muted">
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {truthTable.map(({ a, b, output: out }, i) => {
                const isActive = inputA === a && inputB === b;
                const target = gateTargets ? gateTargets[i] : null;
                const correct =
                  target !== null
                    ? target === 1
                      ? out > 0.8
                      : out < 0.2
                    : false;
                return (
                  <tr
                    key={i}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-accent/10"
                        : "hover:bg-foreground/5"
                    }`}
                    onClick={() => {
                      setInputA(a);
                      setInputB(b);
                    }}
                  >
                    <td className="px-2 py-1.5 font-mono">{a}</td>
                    <td className="px-2 py-1.5 font-mono">{b}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col items-start">
                        <span
                          className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                          style={{ background: outputColor(out) }}
                        >
                          {out.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-muted h-3 leading-3">
                          {isApproxSigmoid(out) ? "approx" : ""}
                        </span>
                      </div>
                    </td>
                    {target !== null && (
                      <>
                        <td className="px-2 py-1.5">
                          <span
                            className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                            style={{ background: outputColor(target) }}
                          >
                            {target}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {correct ? (
                            <span className="text-success font-bold">&#10003;</span>
                          ) : (
                            <span className="text-error font-bold">&#10007;</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetContainer>
  );
}
