"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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

// Known-good XOR solution: H1=OR, H2=NAND, Out=AND
const XOR_SOLUTION = {
  h1: { w1: 10, w2: 10, bias: -5 },   // OR
  h2: { w1: -10, w2: -10, bias: 15 },  // NAND
  out: { w1: 10, w2: 10, bias: -15 },  // AND
};

const INPUT_COMBOS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const XOR_TARGETS = [0, 1, 1, 0];

type NeuronId = "h1" | "h2" | "out";

interface NeuronWeights {
  w1: number;
  w2: number;
  bias: number;
}

// Layout constants for network diagram
const SVG_W = 500;
const SVG_H = 280;
const IN_X = 60;
const IN1_Y = 80;
const IN2_Y = 200;
const HID_X = 230;
const H1_Y = 80;
const H2_Y = 200;
const OUT_X = 400;
const OUT_Y = 140;
const NODE_R = 22;

export function TwoNeuronXOR() {
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);
  const [selected, setSelected] = useState<NeuronId>("h1");
  const [neurons, setNeurons] = useState<Record<NeuronId, NeuronWeights>>({
    h1: { w1: 0, w2: 0, bias: 0 },
    h2: { w1: 0, w2: 0, bias: 0 },
    out: { w1: 0, w2: 0, bias: 0 },
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const animRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setInputA(0);
    setInputB(0);
    setSelected("h1");
    setNeurons({
      h1: { w1: 0, w2: 0, bias: 0 },
      h2: { w1: 0, w2: 0, bias: 0 },
      out: { w1: 0, w2: 0, bias: 0 },
    });
    setIsOptimizing(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  // Compute forward pass
  const compute = useCallback(
    (a: number, b: number) => {
      const h1Out = sigmoid(neurons.h1.w1 * a + neurons.h1.w2 * b + neurons.h1.bias);
      const h2Out = sigmoid(neurons.h2.w1 * a + neurons.h2.w2 * b + neurons.h2.bias);
      const finalOut = sigmoid(neurons.out.w1 * h1Out + neurons.out.w2 * h2Out + neurons.out.bias);
      return { h1Out, h2Out, finalOut };
    },
    [neurons]
  );

  const { h1Out, h2Out, finalOut } = compute(inputA, inputB);

  // Truth table for all 4 combos
  const truthTable = useMemo(
    () =>
      INPUT_COMBOS.map(([a, b], i) => {
        const { h1Out: h1, h2Out: h2, finalOut: out } = compute(a, b);
        return { a, b, h1, h2, out, target: XOR_TARGETS[i] };
      }),
    [compute]
  );

  const allCorrect = truthTable.every(
    (row) => (row.target === 1 ? row.out > 0.8 : row.out < 0.2)
  );

  const updateNeuron = useCallback(
    (id: NeuronId, field: keyof NeuronWeights, value: number) => {
      setNeurons((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: value },
      }));
    },
    []
  );

  // Smooth animate to known-good XOR solution
  const startOptimize = useCallback(() => {
    if (isOptimizing) {
      setIsOptimizing(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    setIsOptimizing(true);
    const startNeurons = { ...neurons };
    const duration = 90;
    let step = 0;

    const animate = () => {
      step++;
      const t = Math.min(1, step / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      const lerp = (from: number, to: number) => from + (to - from) * ease;

      setNeurons({
        h1: {
          w1: lerp(startNeurons.h1.w1, XOR_SOLUTION.h1.w1),
          w2: lerp(startNeurons.h1.w2, XOR_SOLUTION.h1.w2),
          bias: lerp(startNeurons.h1.bias, XOR_SOLUTION.h1.bias),
        },
        h2: {
          w1: lerp(startNeurons.h2.w1, XOR_SOLUTION.h2.w1),
          w2: lerp(startNeurons.h2.w2, XOR_SOLUTION.h2.w2),
          bias: lerp(startNeurons.h2.bias, XOR_SOLUTION.h2.bias),
        },
        out: {
          w1: lerp(startNeurons.out.w1, XOR_SOLUTION.out.w1),
          w2: lerp(startNeurons.out.w2, XOR_SOLUTION.out.w2),
          bias: lerp(startNeurons.out.bias, XOR_SOLUTION.out.bias),
        },
      });

      if (t >= 1) {
        setIsOptimizing(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [isOptimizing, neurons]);

  const sel = neurons[selected];
  const neuronLabels: Record<NeuronId, string> = {
    h1: "Neuron 1 (hidden)",
    h2: "Neuron 2 (hidden)",
    out: "Output neuron",
  };

  // Input labels for the selected neuron's sliders
  const inputLabelsForSelected: Record<NeuronId, [string, string]> = {
    h1: ["Input A", "Input B"],
    h2: ["Input A", "Input B"],
    out: ["From N1", "From N2"],
  };

  return (
    <WidgetContainer
      title="Two Neurons Solve XOR"
      description="Click a neuron to select it and adjust its weights. Click an input to toggle it."
      onReset={reset}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Network diagram */}
        <div className="flex-1">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
            <defs>
              <marker
                id="xor-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Connections: inputs → hidden */}
            {[
              { from: { x: IN_X, y: IN1_Y }, to: { x: HID_X, y: H1_Y }, bold: selected === "h1" },
              { from: { x: IN_X, y: IN2_Y }, to: { x: HID_X, y: H1_Y }, bold: selected === "h1" },
              { from: { x: IN_X, y: IN1_Y }, to: { x: HID_X, y: H2_Y }, bold: selected === "h2" },
              { from: { x: IN_X, y: IN2_Y }, to: { x: HID_X, y: H2_Y }, bold: selected === "h2" },
            ].map((c, i) => (
              <line
                key={`ih-${i}`}
                x1={c.from.x + NODE_R}
                y1={c.from.y}
                x2={c.to.x - NODE_R}
                y2={c.to.y}
                stroke={c.bold ? "#3b82f6" : "#d1d5db"}
                strokeWidth={c.bold ? 2.5 : 1}
                markerEnd="url(#xor-arrow)"
              />
            ))}

            {/* Connections: hidden → output */}
            {[
              { from: { x: HID_X, y: H1_Y }, to: { x: OUT_X, y: OUT_Y }, bold: selected === "out" },
              { from: { x: HID_X, y: H2_Y }, to: { x: OUT_X, y: OUT_Y }, bold: selected === "out" },
            ].map((c, i) => (
              <line
                key={`ho-${i}`}
                x1={c.from.x + NODE_R}
                y1={c.from.y}
                x2={c.to.x - NODE_R}
                y2={c.to.y}
                stroke={c.bold ? "#3b82f6" : "#d1d5db"}
                strokeWidth={c.bold ? 2.5 : 1}
                markerEnd="url(#xor-arrow)"
              />
            ))}

            {/* Input nodes (clickable toggles) */}
            {[
              { y: IN1_Y, val: inputA, set: setInputA, label: "A" },
              { y: IN2_Y, val: inputB, set: setInputB, label: "B" },
            ].map((inp) => (
              <g
                key={inp.label}
                className="cursor-pointer"
                onClick={() => inp.set(inp.val === 0 ? 1 : 0)}
              >
                <circle
                  cx={IN_X}
                  cy={inp.y}
                  r={NODE_R}
                  fill={inp.val === 1 ? "#dbeafe" : "#f9fafb"}
                  stroke={inp.val === 1 ? "#3b82f6" : "#d1d5db"}
                  strokeWidth="2"
                />
                <text
                  x={IN_X}
                  y={inp.y - 8}
                  textAnchor="middle"
                  className="fill-muted text-[9px] font-semibold pointer-events-none select-none"
                >
                  {inp.label}
                </text>
                <text
                  x={IN_X}
                  y={inp.y + 7}
                  textAnchor="middle"
                  className="fill-foreground text-[14px] font-bold font-mono pointer-events-none select-none"
                >
                  {inp.val}
                </text>
              </g>
            ))}

            {/* Hidden neurons */}
            {[
              { id: "h1" as NeuronId, y: H1_Y, val: h1Out, label: "N1" },
              { id: "h2" as NeuronId, y: H2_Y, val: h2Out, label: "N2" },
            ].map((n) => (
              <g
                key={n.id}
                className="cursor-pointer"
                onClick={() => setSelected(n.id)}
              >
                <circle
                  cx={HID_X}
                  cy={n.y}
                  r={NODE_R}
                  fill={outputColor(n.val)}
                  stroke={selected === n.id ? "#3b82f6" : outputColor(n.val)}
                  strokeWidth={selected === n.id ? 3 : 2}
                />
                <text
                  x={HID_X}
                  y={n.y - 8}
                  textAnchor="middle"
                  className="fill-white text-[9px] font-semibold pointer-events-none select-none"
                >
                  {n.label}
                </text>
                <text
                  x={HID_X}
                  y={n.y + 7}
                  textAnchor="middle"
                  className="fill-white text-[12px] font-bold font-mono pointer-events-none select-none"
                >
                  {n.val.toFixed(2)}
                </text>
                {isApproxSigmoid(n.val) && (
                  <text
                    x={HID_X}
                    y={n.y + 17}
                    textAnchor="middle"
                    className="fill-white/70 text-[7px] pointer-events-none select-none"
                  >
                    approx
                  </text>
                )}
              </g>
            ))}

            {/* Output neuron */}
            <g
              className="cursor-pointer"
              onClick={() => setSelected("out")}
            >
              <circle
                cx={OUT_X}
                cy={OUT_Y}
                r={NODE_R}
                fill={outputColor(finalOut)}
                stroke={selected === "out" ? "#3b82f6" : outputColor(finalOut)}
                strokeWidth={selected === "out" ? 3 : 2}
              />
              <text
                x={OUT_X}
                y={OUT_Y - 8}
                textAnchor="middle"
                className="fill-white text-[9px] font-semibold pointer-events-none select-none"
              >
                Out
              </text>
              <text
                x={OUT_X}
                y={OUT_Y + 7}
                textAnchor="middle"
                className="fill-white text-[12px] font-bold font-mono pointer-events-none select-none"
              >
                {finalOut.toFixed(2)}
              </text>
              {isApproxSigmoid(finalOut) && (
                <text
                  x={OUT_X}
                  y={OUT_Y + 17}
                  textAnchor="middle"
                  className="fill-white/70 text-[7px] pointer-events-none select-none"
                >
                  approx
                </text>
              )}
            </g>

            {/* Layer labels */}
            <text x={IN_X} y={30} textAnchor="middle" className="fill-muted text-[10px] font-medium pointer-events-none select-none">
              Inputs
            </text>
            <text x={HID_X} y={30} textAnchor="middle" className="fill-muted text-[10px] font-medium pointer-events-none select-none">
              Hidden
            </text>
            <text x={OUT_X} y={30} textAnchor="middle" className="fill-muted text-[10px] font-medium pointer-events-none select-none">
              Output
            </text>
          </svg>

          {/* Weight sliders for selected neuron */}
          <div className="mt-2 p-3 rounded-lg bg-foreground/[0.03] border border-border">
            <div className="text-xs font-semibold text-foreground mb-2">
              {neuronLabels[selected]}
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: `Weight (${inputLabelsForSelected[selected][0]})`, field: "w1" as const, value: sel.w1 },
                { label: `Weight (${inputLabelsForSelected[selected][1]})`, field: "w2" as const, value: sel.w2 },
                { label: "Bias", field: "bias" as const, value: sel.bias },
              ].map((s) => (
                <div key={s.field} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted w-28 shrink-0">
                    {s.label}
                  </span>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={0.1}
                    value={s.value}
                    onChange={(e) =>
                      updateNeuron(selected, s.field, parseFloat(e.target.value))
                    }
                    className="flex-1 h-1.5 accent-accent"
                  />
                  <span className="text-[11px] font-mono font-bold text-foreground w-10 text-right">
                    {s.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Truth table + optimize */}
        <div className="lg:w-72">
          <div className="text-xs font-semibold text-foreground mb-2">
            XOR Truth Table
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-1.5 py-1.5 text-left font-medium text-muted">A</th>
                  <th className="px-1.5 py-1.5 text-left font-medium text-muted">B</th>
                  <th className="px-1.5 py-1.5 text-left font-medium text-muted">N1</th>
                  <th className="px-1.5 py-1.5 text-left font-medium text-muted">N2</th>
                  <th className="px-1.5 py-1.5 text-left font-medium text-muted">Out</th>
                  <th className="px-1.5 py-1.5 text-left font-medium text-muted">XOR</th>
                  <th className="px-1.5 py-1.5 text-center font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {truthTable.map((row, i) => {
                  const active = inputA === row.a && inputB === row.b;
                  const correct = row.target === 1 ? row.out > 0.8 : row.out < 0.2;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${
                        active ? "bg-accent/10" : "hover:bg-foreground/5"
                      }`}
                      onClick={() => {
                        setInputA(row.a);
                        setInputB(row.b);
                      }}
                    >
                      <td className="px-1.5 py-1.5 font-mono">{row.a}</td>
                      <td className="px-1.5 py-1.5 font-mono">{row.b}</td>
                      <td className="px-1.5 py-1.5">
                        <div className="flex flex-col items-start">
                          <span
                            className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                            style={{ background: outputColor(row.h1) }}
                          >
                            {row.h1.toFixed(2)}
                          </span>
                          <span className="text-[8px] text-muted h-3 leading-3">
                            {isApproxSigmoid(row.h1) ? "approx" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5">
                        <div className="flex flex-col items-start">
                          <span
                            className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                            style={{ background: outputColor(row.h2) }}
                          >
                            {row.h2.toFixed(2)}
                          </span>
                          <span className="text-[8px] text-muted h-3 leading-3">
                            {isApproxSigmoid(row.h2) ? "approx" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5">
                        <div className="flex flex-col items-start">
                          <span
                            className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                            style={{ background: outputColor(row.out) }}
                          >
                            {row.out.toFixed(2)}
                          </span>
                          <span className="text-[8px] text-muted h-3 leading-3">
                            {isApproxSigmoid(row.out) ? "approx" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5">
                        <span
                          className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1"
                          style={{ background: outputColor(row.target) }}
                        >
                          {row.target}
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
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

          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={startOptimize}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                isOptimizing
                  ? "bg-error text-white hover:bg-error/80"
                  : "bg-accent text-white hover:bg-accent/80"
              }`}
            >
              {isOptimizing ? "Stop" : "Optimize"}
            </button>
            {allCorrect && (
              <div className="text-[11px] font-medium text-success text-center">
                XOR solved!
              </div>
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
