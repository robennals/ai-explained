"use client";

import { useState, useCallback, useMemo, useRef } from "react";
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
    const b = Math.round(160 + (16 - 160) * t);
    return `rgb(${r},${g},${b})`;
  }
}

/** Color based on loss value: green=low loss, red=high loss */
function lossColor(loss: number): string {
  // BCE: loss 0 → green, loss >= 2 → red
  const t = Math.max(0, Math.min(1, 1 - loss / 2));
  if (t <= 0.5) {
    const s = t / 0.5;
    const r = Math.round(239 + (160 - 239) * s);
    const g = Math.round(68 + (160 - 68) * s);
    const b = Math.round(68 + (160 - 68) * s);
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.5) / 0.5;
    const r = Math.round(160 + (16 - 160) * s);
    const g = Math.round(160 + (185 - 160) * s);
    const b = Math.round(160 + (129 - 160) * s);
    return `rgb(${r},${g},${b})`;
  }
}

type GateName = "AND" | "OR" | "NOT(A)" | "NAND" | "NOR";

const GATES: { name: GateName; targets: number[]; badWeights: { wA: number; wB: number; bias: number } }[] = [
  { name: "AND", targets: [0, 0, 0, 1], badWeights: { wA: 1, wB: -2, bias: 1 } },
  { name: "OR", targets: [0, 1, 1, 1], badWeights: { wA: -1, wB: -1, bias: 2 } },
  { name: "NOT(A)", targets: [1, 1, 0, 0], badWeights: { wA: 2, wB: 1, bias: -1 } },
  { name: "NAND", targets: [1, 1, 1, 0], badWeights: { wA: 1, wB: 1, bias: -3 } },
  { name: "NOR", targets: [1, 0, 0, 0], badWeights: { wA: 1, wB: 1, bias: 1 } },
];

const INPUT_COMBOS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

function computeOutput(a: number, b: number, wA: number, wB: number, bias: number): number {
  return sigmoid(wA * a + wB * b + bias);
}

/** Binary cross-entropy loss for a single sample (clamped to avoid log(0)) */
function bceLoss(output: number, target: number): number {
  const eps = 1e-7;
  const o = Math.max(eps, Math.min(1 - eps, output));
  return -(target * Math.log(o) + (1 - target) * Math.log(1 - o));
}

function computeTotalLoss(wA: number, wB: number, bias: number, targets: number[]): number {
  let total = 0;
  for (let i = 0; i < 4; i++) {
    const [a, b] = INPUT_COMBOS[i];
    const out = computeOutput(a, b, wA, wB, bias);
    total += bceLoss(out, targets[i]);
  }
  return total;
}

function computeGradients(
  wA: number,
  wB: number,
  bias: number,
  targets: number[]
): { dWA: number; dWB: number; dBias: number } {
  let dWA = 0,
    dWB = 0,
    dBias = 0;
  // BCE + sigmoid gradient w.r.t. z = (output - target)
  for (let i = 0; i < 4; i++) {
    const [a, b] = INPUT_COMBOS[i];
    const z = wA * a + wB * b + bias;
    const out = sigmoid(z);
    const dLdz = out - targets[i];
    dWA += dLdz * a;
    dWB += dLdz * b;
    dBias += dLdz;
  }
  return { dWA, dWB, dBias };
}

// Loss curve: sweep one parameter, hold others fixed
function computeLossCurve(
  param: "wA" | "wB" | "bias",
  wA: number,
  wB: number,
  bias: number,
  targets: number[],
  steps: number = 80
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = -10 + (20 * i) / steps;
    const curWA = param === "wA" ? v : wA;
    const curWB = param === "wB" ? v : wB;
    const curBias = param === "bias" ? v : bias;
    points.push({ x: v, y: computeTotalLoss(curWA, curWB, curBias, targets) });
  }
  return points;
}

// SVG loss curve panel with gradient arrow
function LossCurvePanel({
  label,
  param,
  value,
  gradient,
  onChange,
  wA,
  wB,
  bias,
  targets,
}: {
  label: string;
  param: "wA" | "wB" | "bias";
  value: number;
  gradient: number;
  onChange: (v: number) => void;
  wA: number;
  wB: number;
  bias: number;
  targets: number[];
}) {
  const W = 200;
  const H = 120;
  const pad = { top: 12, right: 10, bottom: 20, left: 10 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const curve = useMemo(
    () => computeLossCurve(param, wA, wB, bias, targets),
    [param, wA, wB, bias, targets]
  );

  const currentLoss = computeTotalLoss(
    param === "wA" ? value : wA,
    param === "wB" ? value : wB,
    param === "bias" ? value : bias,
    targets
  );

  // Cap Y-axis so the region around the current point is always visible.
  // Show up to 3x the current loss (or at least 1.0), so slopes are clear.
  const maxY = Math.max(1.0, currentLoss * 3);

  const toSvgX = (x: number) => pad.left + ((x + 10) / 20) * plotW;
  const toSvgY = (y: number) => pad.top + plotH - (Math.min(y, maxY) / maxY) * plotH;

  const pathD = curve
    .map((p, i) => `${i === 0 ? "M" : "L"}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
    .join(" ");

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="text-[11px] font-semibold text-foreground mb-1">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[200px]">
        {/* Background */}
        <rect
          x={pad.left}
          y={pad.top}
          width={plotW}
          height={plotH}
          fill="var(--color-surface, #f8fafc)"
          rx={4}
        />
        {/* Zero line */}
        <line
          x1={toSvgX(0)}
          y1={pad.top}
          x2={toSvgX(0)}
          y2={pad.top + plotH}
          stroke="#e2e8f0"
          strokeWidth={0.5}
        />
        {/* Loss curve */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />
        {/* Current value vertical line */}
        <line
          x1={toSvgX(value)}
          y1={pad.top}
          x2={toSvgX(value)}
          y2={pad.top + plotH}
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />
        {/* Current point */}
        <circle cx={toSvgX(value)} cy={toSvgY(currentLoss)} r={4} fill="#f59e0b" stroke="white" strokeWidth={1.5} />
        {/* Gradient arrow at current point — points toward lower loss */}
        {Math.abs(gradient) > 0.005 && (() => {
          const cx = toSvgX(value);
          const cy = toSvgY(currentLoss);
          // Arrow points in the direction that reduces loss (negative gradient)
          const dir = gradient > 0 ? -1 : 1;
          // Use log scale so small gradients are still visible
          const rawLen = Math.log1p(Math.abs(gradient) * 20) * 25;
          const len = Math.max(8, Math.min(50, rawLen));
          const ex = cx + dir * len;
          return (
            <>
              <line x1={cx} y1={cy} x2={ex} y2={cy} stroke="#ef4444" strokeWidth={2.5} />
              <polygon
                points={`${ex + dir * 6},${cy} ${ex - dir * 2},${cy - 5} ${ex - dir * 2},${cy + 5}`}
                fill="#ef4444"
              />
            </>
          );
        })()}
        {/* Axis labels */}
        <text x={pad.left} y={H - 2} className="fill-muted text-[8px]">
          -10
        </text>
        <text x={W - pad.right} y={H - 2} textAnchor="end" className="fill-muted text-[8px]">
          10
        </text>
      </svg>
      <div className="w-full max-w-[200px] px-1">
        <input
          type="range"
          min={-10}
          max={10}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 accent-[#f59e0b]"
        />
      </div>
      <div className="text-[11px] font-mono text-foreground mt-0.5">{value.toFixed(1)}</div>
    </div>
  );
}

// Simplified neuron diagram (read-only)
function NeuronDiagramReadonly({
  inputA,
  inputB,
  wA,
  wB,
  bias,
}: {
  inputA: number;
  inputB: number;
  wA: number;
  wB: number;
  bias: number;
}) {
  const W = 320;
  const H = 160;
  const z = wA * inputA + wB * inputB + bias;
  const out = sigmoid(z);

  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    const pL = 188;
    const pR = 248;
    const pT = 36;
    const pB = 96;
    for (let i = 0; i <= 50; i++) {
      const xv = -10 + 20 * (i / 50);
      const yv = sigmoid(xv);
      pts.push(
        `${i === 0 ? "M" : "L"}${(pL + (i / 50) * (pR - pL)).toFixed(1)},${(pB - yv * (pB - pT)).toFixed(1)}`
      );
    }
    return pts.join(" ");
  }, []);

  // Operating point
  const opFrac = Math.max(0, Math.min(1, (z + 10) / 20));
  const pL = 188;
  const pR = 248;
  const pT = 36;
  const pB = 96;
  const opSx = pL + opFrac * (pR - pL);
  const opSy = pB - out * (pB - pT);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <marker id="no-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
        </marker>
      </defs>

      {/* Input A */}
      <circle cx={30} cy={40} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth={1.5} />
      <text x={30} y={44} textAnchor="middle" className="fill-accent text-[11px] font-bold font-mono pointer-events-none select-none">
        {inputA}
      </text>
      <text x={30} y={18} textAnchor="middle" className="fill-foreground text-[9px] font-bold pointer-events-none select-none">
        A
      </text>

      {/* Input B */}
      <circle cx={30} cy={110} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth={1.5} />
      <text x={30} y={114} textAnchor="middle" className="fill-accent text-[11px] font-bold font-mono pointer-events-none select-none">
        {inputB}
      </text>
      <text x={30} y={142} textAnchor="middle" className="fill-foreground text-[9px] font-bold pointer-events-none select-none">
        B
      </text>

      {/* Arrows A → Sum */}
      <line x1={46} y1={40} x2={95} y2={66} stroke="#9ca3af" strokeWidth={1} markerEnd="url(#no-arrow)" />
      <text x={65} y={44} textAnchor="middle" className="fill-foreground text-[11px] font-bold font-mono pointer-events-none select-none">
        {wA.toFixed(1)}
      </text>

      {/* Arrows B → Sum */}
      <line x1={46} y1={110} x2={95} y2={82} stroke="#9ca3af" strokeWidth={1} markerEnd="url(#no-arrow)" />
      <text x={65} y={116} textAnchor="middle" className="fill-foreground text-[11px] font-bold font-mono pointer-events-none select-none">
        {wB.toFixed(1)}
      </text>

      {/* Sum node */}
      <circle cx={110} cy={74} r={18} fill="#fef9ee" stroke="#f59e0b" strokeWidth={1.5} />
      <text x={110} y={78} textAnchor="middle" className="fill-warning text-[10px] font-bold font-mono pointer-events-none select-none">
        {z.toFixed(1)}
      </text>

      {/* Bias arrow */}
      <line x1={110} y1={100} x2={110} y2={93} stroke="#9ca3af" strokeWidth={0.8} strokeDasharray="2,2" markerEnd="url(#no-arrow)" />
      <text x={110} y={112} textAnchor="middle" className="fill-foreground text-[11px] font-bold font-mono pointer-events-none select-none">
        {bias.toFixed(1)}
      </text>

      {/* Sum → Activation */}
      <line x1={128} y1={74} x2={182} y2={66} stroke="#9ca3af" strokeWidth={1} markerEnd="url(#no-arrow)" />

      {/* Activation box */}
      <rect x={184} y={32} width={68} height={68} rx={6} fill="#f0fdf4" stroke="#10b981" strokeWidth={1.5} />
      <text x={218} y={27} textAnchor="middle" className="fill-success text-[7px] font-semibold uppercase tracking-wider pointer-events-none select-none">
        Sigmoid
      </text>
      <path d={sigmoidPath} fill="none" stroke="#10b981" strokeWidth={1.5} />
      <circle cx={opSx} cy={opSy} r={3.5} fill="#f59e0b" stroke="white" strokeWidth={1} />

      {/* Activation → Output */}
      <line x1={254} y1={66} x2={276} y2={66} stroke="#9ca3af" strokeWidth={1} markerEnd="url(#no-arrow)" />

      {/* Output node */}
      <circle cx={296} cy={66} r={18} fill={outputColor(out)} stroke={outputColor(out)} strokeWidth={1.5} />
      <text x={296} y={70} textAnchor="middle" className="fill-white text-[11px] font-bold font-mono pointer-events-none select-none">
        {out.toFixed(2)}
      </text>
    </svg>
  );
}

export function NeuronOptimizer() {
  const defaultGate = GATES[0];
  const [gate, setGate] = useState<GateName>(defaultGate.name);
  const [wA, setWA] = useState(defaultGate.badWeights.wA);
  const [wB, setWB] = useState(defaultGate.badWeights.wB);
  const [bias, setBias] = useState(defaultGate.badWeights.bias);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ wA: 0, wB: 0, bias: 0, step: 0 });

  const gateData = GATES.find((g) => g.name === gate)!;
  const targets = gateData.targets;

  const reset = useCallback(() => {
    const g = GATES.find((g) => g.name === gate)!;
    setWA(g.badWeights.wA);
    setWB(g.badWeights.wB);
    setBias(g.badWeights.bias);
    setSelectedRow(null);
    setIsOptimizing(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, [gate]);

  const selectGate = useCallback(
    (name: GateName) => {
      const g = GATES.find((g) => g.name === name)!;
      setGate(name);
      setWA(g.badWeights.wA);
      setWB(g.badWeights.wB);
      setBias(g.badWeights.bias);
      setSelectedRow(null);
      setIsOptimizing(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    },
    []
  );

  const truthTable = useMemo(() => {
    return INPUT_COMBOS.map(([a, b], i) => {
      const out = computeOutput(a, b, wA, wB, bias);
      const target = targets[i];
      const loss = bceLoss(out, target);
      return { a, b, output: out, target, loss };
    });
  }, [wA, wB, bias, targets]);

  const totalLoss = useMemo(() => truthTable.reduce((s, r) => s + r.loss, 0), [truthTable]);

  const gradients = useMemo(() => computeGradients(wA, wB, bias, targets), [wA, wB, bias, targets]);

  const takeStep = useCallback(() => {
    const lr = 2;
    const grads = computeGradients(wA, wB, bias, targets);
    setWA(Math.max(-10, Math.min(10, wA - lr * grads.dWA)));
    setWB(Math.max(-10, Math.min(10, wB - lr * grads.dWB)));
    setBias(Math.max(-10, Math.min(10, bias - lr * grads.dBias)));
  }, [wA, wB, bias, targets]);

  const startOptimize = useCallback(() => {
    if (isOptimizing) {
      setIsOptimizing(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    setIsOptimizing(true);
    stateRef.current = { wA, wB, bias, step: 0 };

    const animate = () => {
      const s = stateRef.current;
      const lr = 2;

      // One step per frame so the user can watch the descent
      const grads = computeGradients(s.wA, s.wB, s.bias, targets);
      s.wA = Math.max(-10, Math.min(10, s.wA - lr * grads.dWA));
      s.wB = Math.max(-10, Math.min(10, s.wB - lr * grads.dWB));
      s.bias = Math.max(-10, Math.min(10, s.bias - lr * grads.dBias));
      s.step++;

      setWA(s.wA);
      setWB(s.wB);
      setBias(s.bias);

      const loss = computeTotalLoss(s.wA, s.wB, s.bias, targets);
      if (loss < 0.2 || s.step >= 500) {
        setIsOptimizing(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isOptimizing, wA, wB, bias, targets]);

  return (
    <WidgetContainer
      title="Neuron Optimizer"
      description="Pick a gate, explore the loss landscape, then optimize."
      onReset={reset}
    >
      {/* Gate selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {GATES.map((g) => (
          <button
            key={g.name}
            onClick={() => selectGate(g.name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              gate === g.name
                ? "bg-accent text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Two-panel row: truth table + neuron diagram */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Truth table */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground mb-2">Truth Table</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted">A</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted">B</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted">Output</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted">Target</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted">Loss</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {truthTable.map((row, i) => {
                  const correct = row.target === 1 ? row.output > 0.8 : row.output < 0.2;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${
                        selectedRow === i ? "bg-accent/10" : "hover:bg-foreground/5"
                      }`}
                      onClick={() => setSelectedRow(i)}
                    >
                      <td className="px-2 py-1.5 font-mono">{row.a}</td>
                      <td className="px-2 py-1.5 font-mono">{row.b}</td>
                      <td className="px-2 py-1.5 font-mono">{row.output.toFixed(2)}</td>
                      <td className="px-2 py-1.5 font-mono">{row.target}</td>
                      <td className="px-2 py-1.5">
                        <span
                          className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                          style={{ background: lossColor(row.loss) }}
                        >
                          {row.loss.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {correct ? (
                          <span className="text-success font-bold">&#10003;</span>
                        ) : (
                          <span className="text-error font-bold">&#10007;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs font-semibold">
            Total Loss:{" "}
            <span className={`font-mono ${totalLoss < 0.5 ? "text-success" : "text-foreground"}`}>
              {totalLoss.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Neuron diagram */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground mb-2">
            {selectedRow !== null
              ? `Neuron (row: A=${INPUT_COMBOS[selectedRow][0]}, B=${INPUT_COMBOS[selectedRow][1]})`
              : "Neuron"}
          </div>
          {selectedRow !== null ? (
            <NeuronDiagramReadonly
              inputA={INPUT_COMBOS[selectedRow][0]}
              inputB={INPUT_COMBOS[selectedRow][1]}
              wA={wA}
              wB={wB}
              bias={bias}
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted border border-dashed border-border rounded-lg">
              Click a row in the truth table to see the neuron in action
            </div>
          )}
        </div>
      </div>

      {/* Loss curve panels */}
      <div className="text-xs font-semibold text-foreground mb-2">
        Loss Landscape (each curve sweeps one parameter, holding the others fixed)
      </div>
      <div className="flex gap-2 mb-4">
        <LossCurvePanel
          label="Weight A"
          param="wA"
          value={wA}
          gradient={gradients.dWA}
          onChange={setWA}
          wA={wA}
          wB={wB}
          bias={bias}
          targets={targets}
        />
        <LossCurvePanel
          label="Weight B"
          param="wB"
          value={wB}
          gradient={gradients.dWB}
          onChange={setWB}
          wA={wA}
          wB={wB}
          bias={bias}
          targets={targets}
        />
        <LossCurvePanel
          label="Bias"
          param="bias"
          value={bias}
          gradient={gradients.dBias}
          onChange={setBias}
          wA={wA}
          wB={wB}
          bias={bias}
          targets={targets}
        />
      </div>

      {/* Optimize buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={takeStep}
          disabled={isOptimizing}
          className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-foreground/10 text-foreground hover:bg-foreground/20 disabled:opacity-40"
        >
          Step
        </button>
        <button
          onClick={startOptimize}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isOptimizing
              ? "bg-error text-white hover:bg-error/80"
              : "bg-accent text-white hover:bg-accent/80"
          }`}
        >
          {isOptimizing ? "Stop" : "Optimize"}
        </button>
        {totalLoss < 0.5 && (
          <span className="text-xs font-medium text-success">Converged!</span>
        )}
      </div>
    </WidgetContainer>
  );
}
