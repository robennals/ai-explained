"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function isApproxSigmoid(v: number): boolean {
  return (v > 0 && v < 0.005) || (v > 0.995 && v < 1);
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

export function NeuronFreePlay() {
  const [inputA, setInputA] = useState(0.5);
  const [inputB, setInputB] = useState(0.5);
  const [w1, setW1] = useState(5.0);
  const [w2, setW2] = useState(-3.0);
  const [bias, setBias] = useState(0);

  const reset = useCallback(() => {
    setInputA(0.5);
    setInputB(0.5);
    setW1(5.0);
    setW2(-3.0);
    setBias(0);
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

  return (
    <WidgetContainer
      title="Your First Neuron"
      description="Slide the inputs, weights, and bias to see how they affect the output."
      onReset={reset}
    >
      <div className="mb-2 text-center font-mono text-sm text-foreground">
        output = sigmoid(weight<sub>A</sub> &times; input<sub>A</sub> + weight<sub>B</sub> &times; input<sub>B</sub> + bias)
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label="Interactive neuron diagram"
      >
        <defs>
          <marker
            id="nfp-arrow"
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
          markerEnd="url(#nfp-arrow)"
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
          markerEnd="url(#nfp-arrow)"
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
          markerEnd="url(#nfp-arrow)"
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
          markerEnd="url(#nfp-arrow)"
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
          markerEnd="url(#nfp-arrow)"
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
      </svg>
    </WidgetContainer>
  );
}
