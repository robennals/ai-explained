"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
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

function outputColorRGB(v: number): [number, number, number] {
  if (v <= 0.5) {
    const t = v / 0.5;
    return [
      Math.round(239 + (160 - 239) * t),
      Math.round(68 + (160 - 68) * t),
      Math.round(68 + (160 - 68) * t),
    ];
  } else {
    const t = (v - 0.5) / 0.5;
    return [
      Math.round(160 + (16 - 160) * t),
      Math.round(160 + (185 - 160) * t),
      Math.round(160 + (129 - 160) * t),
    ];
  }
}

const INPUT_COMBOS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

type GateName = "AND" | "OR" | "NOT (A)" | "NAND";
type ChallengeName = GateName | "XOR";

const GATE_CHECKS: Record<GateName, number[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  "NOT (A)": [1, 1, 0, 0],
  NAND: [1, 1, 1, 0],
};

const XOR_TARGETS = [0, 1, 1, 0];

function bceLoss(output: number, target: number): number {
  const eps = 1e-7;
  const o = Math.max(eps, Math.min(1 - eps, output));
  return -(target * Math.log(o) + (1 - target) * Math.log(1 - o));
}

function computeGradients(
  w1: number,
  w2: number,
  bias: number,
  targets: number[]
): { dW1: number; dW2: number; dBias: number } {
  let dW1 = 0,
    dW2 = 0,
    dBias = 0;
  for (let i = 0; i < 4; i++) {
    const [a, b] = INPUT_COMBOS[i];
    const z = w1 * a + w2 * b + bias;
    const out = sigmoid(z);
    const dLdz = out - targets[i];
    dW1 += dLdz * a;
    dW2 += dLdz * b;
    dBias += dLdz;
  }
  return { dW1, dW2, dBias };
}

function computeTotalLoss(w1: number, w2: number, bias: number, targets: number[]): number {
  let total = 0;
  for (let i = 0; i < 4; i++) {
    const [a, b] = INPUT_COMBOS[i];
    const out = sigmoid(w1 * a + w2 * b + bias);
    total += bceLoss(out, targets[i]);
  }
  return total;
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

// Compact MiniSlider for SVG
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

const CANVAS_SIZE = 280;

export function NeuronGeometry() {
  const [w1, setW1] = useState(5.0);
  const [w2, setW2] = useState(5.0);
  const [bias, setBias] = useState(-4.0);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeName | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [xorFailed, setXorFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ w1: 5, w2: 5, bias: -4, step: 0 });

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setW1(5.0);
    setW2(5.0);
    setBias(-4.0);
    setClickPos(null);
    setActiveChallenge(null);
    setIsOptimizing(false);
    setXorFailed(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  // Render heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = CANVAS_SIZE;
    const imageData = ctx.createImageData(size, size);
    const res = 2;
    for (let py = 0; py < size; py += res) {
      for (let px = 0; px < size; px += res) {
        const x = px / (size - 1);
        const y = 1 - py / (size - 1); // y=1 at top
        const out = sigmoid(w1 * x + w2 * y + bias);
        const [r, g, b] = outputColorRGB(out);
        for (let dy = 0; dy < res && py + dy < size; dy++) {
          for (let dx = 0; dx < res && px + dx < size; dx++) {
            const idx = ((py + dy) * size + (px + dx)) * 4;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [w1, w2, bias]);

  // Compute decision boundary line (w1*x + w2*y + bias = 0)
  const boundaryLine = useMemo(() => {
    // Find two points where w1*x + w2*y + bias = 0 intersects [0,1]²
    const pts: { x: number; y: number }[] = [];
    if (Math.abs(w2) > 0.001) {
      // y = -(w1*x + bias) / w2
      const yAtX0 = -(w1 * 0 + bias) / w2;
      const yAtX1 = -(w1 * 1 + bias) / w2;
      if (yAtX0 >= 0 && yAtX0 <= 1) pts.push({ x: 0, y: yAtX0 });
      if (yAtX1 >= 0 && yAtX1 <= 1) pts.push({ x: 1, y: yAtX1 });
    }
    if (Math.abs(w1) > 0.001) {
      // x = -(w2*y + bias) / w1
      const xAtY0 = -(w2 * 0 + bias) / w1;
      const xAtY1 = -(w2 * 1 + bias) / w1;
      if (xAtY0 > 0 && xAtY0 < 1) pts.push({ x: xAtY0, y: 0 });
      if (xAtY1 > 0 && xAtY1 < 1) pts.push({ x: xAtY1, y: 1 });
    }
    if (pts.length >= 2) {
      return {
        x1: pts[0].x * CANVAS_SIZE,
        y1: (1 - pts[0].y) * CANVAS_SIZE,
        x2: pts[1].x * CANVAS_SIZE,
        y2: (1 - pts[1].y) * CANVAS_SIZE,
      };
    }
    return null;
  }, [w1, w2, bias]);

  const challengeTargets: number[] | null = useMemo(() => {
    if (!activeChallenge) return null;
    if (activeChallenge === "XOR") return XOR_TARGETS;
    return GATE_CHECKS[activeChallenge];
  }, [activeChallenge]);

  const gatesSolved = useMemo(() => {
    const solved: Record<string, boolean> = {};
    for (const [name, expected] of Object.entries(GATE_CHECKS)) {
      solved[name] = expected.every((exp, i) => {
        const [a, b] = INPUT_COMBOS[i];
        const out = sigmoid(w1 * a + w2 * b + bias);
        return exp === 1 ? out > 0.8 : out < 0.2;
      });
    }
    return solved;
  }, [w1, w2, bias]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const x = Math.max(0, Math.min(1, px / rect.width));
      const y = Math.max(0, Math.min(1, 1 - py / rect.height));
      setClickPos({ x, y });
    },
    []
  );

  const activateChallenge = useCallback((name: ChallengeName) => {
    setActiveChallenge(name);
    setIsOptimizing(false);
    setXorFailed(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const startOptimize = useCallback(() => {
    if (!challengeTargets) return;
    if (isOptimizing) {
      setIsOptimizing(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    setIsOptimizing(true);
    setXorFailed(false);
    stateRef.current = { w1, w2, bias, step: 0 };

    const targets = challengeTargets;
    const isXor = activeChallenge === "XOR";
    const maxSteps = isXor ? 200 : 500;

    const animate = () => {
      const s = stateRef.current;
      const lr = 2;
      const grads = computeGradients(s.w1, s.w2, s.bias, targets);
      s.w1 = Math.max(-15, Math.min(15, s.w1 - lr * grads.dW1));
      s.w2 = Math.max(-15, Math.min(15, s.w2 - lr * grads.dW2));
      s.bias = Math.max(-20, Math.min(20, s.bias - lr * grads.dBias));
      s.step++;

      setW1(s.w1);
      setW2(s.w2);
      setBias(s.bias);

      const loss = computeTotalLoss(s.w1, s.w2, s.bias, targets);
      if (!isXor && loss < 0.2) {
        setIsOptimizing(false);
        return;
      }
      if (s.step >= maxSteps) {
        setIsOptimizing(false);
        if (isXor) setXorFailed(true);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isOptimizing, w1, w2, bias, challengeTargets, activeChallenge]);

  // Compute neuron output for click position
  const clickInput = clickPos ?? { x: 0.5, y: 0.5 };
  const weightedSum = w1 * clickInput.x + w2 * clickInput.y + bias;
  const output = sigmoid(weightedSum);

  const prodA = w1 * clickInput.x;
  const prodB = w2 * clickInput.y;

  // Neuron diagram layout — matches NeuronPlayground exactly
  const DW = 680;
  const DH = 370;
  const INX = 55;
  const INA_Y = 65;
  const INB_Y = 270;
  const SUMX = 290;
  const SUMY = 160;
  const ACTX = 450;
  const ACTY = 160;
  const ACTW = 110;
  const ACTH = 75;
  const OUTX = 610;
  const OUTY = 160;

  // Arrow endpoints
  const aStart = { x: INX + 22, y: INA_Y };
  const aEnd = { x: SUMX - 28, y: SUMY };
  const bStart = { x: INX + 22, y: INB_Y };
  const bEnd = { x: SUMX - 28, y: SUMY };

  // Weight slider attachment points
  const waX = 155;
  const waT = (waX - aStart.x) / (aEnd.x - aStart.x);
  const waY = aStart.y + waT * (aEnd.y - aStart.y);
  const wbX = 155;
  const wbT = (wbX - bStart.x) / (bEnd.x - bStart.x);
  const wbY = bStart.y + wbT * (bEnd.y - bStart.y);

  // Sigmoid curve path
  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    const pL = ACTX - ACTW / 2 + 8;
    const pR = ACTX + ACTW / 2 - 8;
    const pT = ACTY - ACTH / 2 + 8;
    const pB = ACTY + ACTH / 2 - 8;
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
  const pL = ACTX - ACTW / 2 + 8;
  const pR = ACTX + ACTW / 2 - 8;
  const pT = ACTY - ACTH / 2 + 8;
  const pB = ACTY + ACTH / 2 - 8;
  const opSx = pL + opFrac * (pR - pL);
  const opSy = pB - output * (pB - pT);

  return (
    <WidgetContainer
      title="Neurons as Geometry"
      description="A single neuron divides 2D space with a straight line."
      onReset={reset}
    >
      {/* Row 1: Neuron diagram — full width, matching NeuronPlayground layout */}
      <svg
        viewBox={`0 0 ${DW} ${DH}`}
        className="w-full"
        aria-label="Interactive neuron diagram"
      >
        <defs>
          <marker id="ng-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* === INPUT A === */}
        <text x={INX} y={INA_Y - 26} textAnchor="middle" className="fill-foreground text-[12px] font-bold pointer-events-none select-none">
          Input A
        </text>
        <circle cx={INX} cy={INA_Y} r={20} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
        <text x={INX} y={INA_Y + 5} textAnchor="middle" className="fill-accent text-[14px] font-bold font-mono pointer-events-none select-none">
          {clickInput.x.toFixed(1)}
        </text>

        {/* === INPUT B === */}
        <text x={INX} y={INB_Y - 26} textAnchor="middle" className="fill-foreground text-[12px] font-bold pointer-events-none select-none">
          Input B
        </text>
        <circle cx={INX} cy={INB_Y} r={20} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
        <text x={INX} y={INB_Y + 5} textAnchor="middle" className="fill-accent text-[14px] font-bold font-mono pointer-events-none select-none">
          {clickInput.y.toFixed(1)}
        </text>

        {/* === ARROW A → SUM === */}
        <line x1={aStart.x} y1={aStart.y} x2={aEnd.x} y2={aEnd.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ng-arrow)" />
        <line x1={waX} y1={waY} x2={waX} y2={waY + 4} stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="2,2" />
        <MiniSlider x={waX} y={waY + 4} value={w1} min={-15} max={15} step={0.1} onChange={setW1} label="Weight" interpret={interpretWeight} width={90} />
        <text x={230} y={aStart.y + 0.82 * (aEnd.y - aStart.y) - 8} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">
          = {prodA.toFixed(1)}
        </text>

        {/* === ARROW B → SUM === */}
        <line x1={bStart.x} y1={bStart.y} x2={bEnd.x} y2={bEnd.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ng-arrow)" />
        <line x1={wbX} y1={wbY} x2={wbX} y2={wbY + 4} stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="2,2" />
        <MiniSlider x={wbX} y={wbY + 4} value={w2} min={-15} max={15} step={0.1} onChange={setW2} label="Weight" interpret={interpretWeight} width={90} />
        <text x={230} y={bStart.y + 0.82 * (bEnd.y - bStart.y) + 14} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">
          = {prodB.toFixed(1)}
        </text>

        {/* === SUM NODE === */}
        <text x={SUMX} y={SUMY - 32} textAnchor="middle" className="fill-foreground text-[12px] font-bold pointer-events-none select-none">
          Sum
        </text>
        <circle cx={SUMX} cy={SUMY} r={26} fill="#fef9ee" stroke="#f59e0b" strokeWidth="2" />
        <text x={SUMX} y={SUMY + 5} textAnchor="middle" className="fill-warning text-[14px] font-bold font-mono pointer-events-none select-none">
          {weightedSum.toFixed(1)}
        </text>

        {/* === BIAS === */}
        <line x1={SUMX} y1={SUMY + 40} x2={SUMX} y2={SUMY + 28} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#ng-arrow)" />
        <MiniSlider x={SUMX} y={SUMY + 40} value={bias} min={-20} max={20} step={0.1} onChange={setBias} label="Bias" interpret={interpretBias} width={90} />

        {/* === SUM → ACTIVATION === */}
        <line x1={SUMX + 28} y1={SUMY} x2={ACTX - ACTW / 2 - 4} y2={ACTY} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ng-arrow)" />

        {/* === ACTIVATION FUNCTION BOX === */}
        <rect x={ACTX - ACTW / 2} y={ACTY - ACTH / 2} width={ACTW} height={ACTH} rx={10} fill="#f0fdf4" stroke="#10b981" strokeWidth="2" />
        <text x={ACTX} y={ACTY - ACTH / 2 - 6} textAnchor="middle" className="fill-success text-[9px] font-semibold uppercase tracking-wider pointer-events-none select-none">
          Activation
        </text>
        <path d={sigmoidPath} fill="none" stroke="#10b981" strokeWidth="2" />
        {/* Operating point crosshairs */}
        <line x1={opSx} y1={pB} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
        <line x1={pL} y1={opSy} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
        <circle cx={opSx} cy={opSy} r={5} fill="#f59e0b" stroke="white" strokeWidth="1.5" />

        {/* === ACTIVATION → OUTPUT === */}
        <line x1={ACTX + ACTW / 2 + 2} y1={ACTY} x2={OUTX - 26} y2={OUTY} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ng-arrow)" />

        {/* === OUTPUT NODE === */}
        <text x={OUTX} y={OUTY - 30} textAnchor="middle" className="fill-foreground text-[12px] font-bold pointer-events-none select-none">
          Output
        </text>
        <circle cx={OUTX} cy={OUTY} r={24} fill={outputColor(output)} stroke={outputColor(output)} strokeWidth="2" />
        <text x={OUTX} y={OUTY + 5} textAnchor="middle" className="fill-white text-[14px] font-bold font-mono pointer-events-none select-none">
          {output.toFixed(2)}
        </text>
        <text x={OUTX} y={OUTY + 40} textAnchor="middle" className="fill-foreground text-[11px] font-medium pointer-events-none select-none">
          {output >= 0.9 ? "Definitely true" : output >= 0.65 ? "Probably true" : output > 0.35 ? "Uncertain" : output > 0.1 ? "Probably false" : "Definitely false"}
        </text>
      </svg>

      {/* Row 2: Canvas + Challenges side by side */}
      <div className="mt-4 flex flex-col sm:flex-row gap-5 items-start">
        {/* 2D Canvas */}
        <div className="flex-shrink-0">
          <div className="text-xs font-medium text-muted mb-1">
            Output across input space (click to probe)
          </div>
          <div
            className="relative rounded-lg overflow-hidden border border-border cursor-crosshair"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onClick={handleCanvasClick}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="block"
            />
            <svg
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Decision boundary */}
              {boundaryLine && (
                <line
                  x1={boundaryLine.x1}
                  y1={boundaryLine.y1}
                  x2={boundaryLine.x2}
                  y2={boundaryLine.y2}
                  stroke="white"
                  strokeWidth={2}
                  strokeDasharray="6,4"
                  opacity={0.9}
                />
              )}
              {/* Challenge dots at corners */}
              {challengeTargets &&
                INPUT_COMBOS.map(([a, b], i) => {
                  const cx = a * (CANVAS_SIZE - 20) + 10;
                  const cy = (1 - b) * (CANVAS_SIZE - 20) + 10;
                  const target = challengeTargets[i];
                  const neuronOut = sigmoid(w1 * a + w2 * b + bias);
                  const correct = target === 1 ? neuronOut > 0.8 : neuronOut < 0.2;
                  return (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={12} fill={target === 1 ? "#10b981" : "#ef4444"} opacity={0.9} />
                      <circle cx={cx} cy={cy} r={12} fill="none" stroke="white" strokeWidth={2} />
                      {correct && (
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                          &#10003;
                        </text>
                      )}
                    </g>
                  );
                })}
              {/* Click position marker */}
              {clickPos && (
                <circle
                  cx={clickPos.x * CANVAS_SIZE}
                  cy={(1 - clickPos.y) * CANVAS_SIZE}
                  r={5}
                  fill={outputColor(output)}
                  stroke="white"
                  strokeWidth={2}
                />
              )}
              {/* Axis labels */}
              <text x={CANVAS_SIZE / 2} y={CANVAS_SIZE - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity={0.7}>
                Input A →
              </text>
              <text x={8} y={CANVAS_SIZE / 2} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity={0.7} transform={`rotate(-90, 8, ${CANVAS_SIZE / 2})`}>
                Input B →
              </text>
            </svg>
          </div>
        </div>

        {/* Challenges panel */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground mb-2">
            Challenges
          </div>
          <div className="text-xs text-muted mb-3">
            Can you find weights that make the neuron compute each gate? Select one and adjust the sliders above, or hit Optimize.
          </div>
          <div className="flex flex-col gap-2">
            {(["AND", "OR", "NOT (A)", "NAND"] as GateName[]).map((gate) => (
              <button
                key={gate}
                onClick={() => activateChallenge(gate)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  gatesSolved[gate]
                    ? "bg-success/10 text-success border border-success/30"
                    : activeChallenge === gate
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10 border border-transparent"
                }`}
              >
                {gatesSolved[gate] ? "✓ " : activeChallenge === gate ? "▸ " : "○ "}
                {gate}
              </button>
            ))}
            <button
              onClick={() => activateChallenge("XOR")}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeChallenge === "XOR"
                  ? "bg-error/10 text-error border border-error/30"
                  : "bg-foreground/5 text-error/60 hover:text-error border border-transparent"
              }`}
            >
              {activeChallenge === "XOR" ? "▸ " : "○ "}XOR
            </button>
          </div>

          {activeChallenge && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={startOptimize}
                className={`w-full px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                  isOptimizing
                    ? "bg-error text-white hover:bg-error/80"
                    : "bg-accent text-white hover:bg-accent/80"
                }`}
              >
                {isOptimizing ? "Stop Optimizing" : "Optimize"}
              </button>
              {xorFailed && (
                <div className="text-sm font-medium text-error text-center py-1">
                  Can&apos;t solve it — the boundary is always a straight line!
                </div>
              )}
              {!xorFailed && activeChallenge !== "XOR" && gatesSolved[activeChallenge] && (
                <div className="text-sm font-medium text-success text-center py-1">
                  Solved!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
