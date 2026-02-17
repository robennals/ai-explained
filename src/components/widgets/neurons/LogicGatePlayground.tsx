"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

type GateType = "AND" | "OR" | "NOT";

function computeGate(gate: GateType, a: number, b: number): number {
  switch (gate) {
    case "AND":
      return a & b;
    case "OR":
      return a | b;
    case "NOT":
      return a === 0 ? 1 : 0;
  }
}

const GATE_DESCRIPTIONS: Record<GateType, string> = {
  AND: "Both inputs must be 1",
  OR: "At least one input must be 1",
  NOT: "Flips Input A (Input B is ignored)",
};

// Layout constants — mirrors the neuron diagram layout
const W = 500;
const H = 220;
const IN_X = 60;
const IN_A_Y = 60;
const IN_B_Y = 160;
const GATE_X = 250;
const GATE_Y = 110;
const GATE_W = 90;
const GATE_H = 50;
const OUT_X = 440;
const OUT_Y = 110;
const NODE_R = 24;

const GATE_TABS: { id: GateType; label: string }[] = [
  { id: "AND", label: "AND" },
  { id: "OR", label: "OR" },
  { id: "NOT", label: "NOT" },
];

export function LogicGatePlayground() {
  const [gate, setGate] = useState<GateType>("AND");
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);

  const output = computeGate(gate, inputA, inputB);

  const reset = useCallback(() => {
    setGate("AND");
    setInputA(0);
    setInputB(0);
  }, []);

  // Truth table rows
  const truthRows = useMemo(
    () =>
      [0, 1]
        .flatMap((a) => [0, 1].map((b) => ({ a, b })))
        .map(({ a, b }) => ({
          a,
          b,
          out: computeGate(gate, a, b),
          active: a === inputA && b === inputB,
        })),
    [gate, inputA, inputB]
  );

  const showB = gate !== "NOT";

  return (
    <WidgetContainer
      title="Logic Gates"
      description="Click the inputs to toggle them. Switch between gates with the tabs."
      onReset={reset}
    >
      <WidgetTabs tabs={GATE_TABS} activeTab={gate} onTabChange={setGate} />

      <div className="text-center text-xs text-muted mb-3">
        {GATE_DESCRIPTIONS[gate]}
      </div>

      {/* SVG diagram — same layout as neuron diagrams */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-lg mx-auto"
        aria-label="Logic gate diagram"
      >
        <defs>
          <marker
            id="lg-arrow"
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
          y={(showB ? IN_A_Y : GATE_Y) - NODE_R - 8}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Input A
        </text>
        <g
          className="cursor-pointer"
          onClick={() => setInputA(inputA === 0 ? 1 : 0)}
        >
          <circle
            cx={IN_X}
            cy={showB ? IN_A_Y : GATE_Y}
            r={NODE_R}
            fill={inputA === 1 ? "#dbeafe" : "#f9fafb"}
            stroke={inputA === 1 ? "#3b82f6" : "#d1d5db"}
            strokeWidth="2"
          />
          <text
            x={IN_X}
            y={(showB ? IN_A_Y : GATE_Y) + 6}
            textAnchor="middle"
            className="fill-foreground text-[18px] font-bold font-mono pointer-events-none select-none"
          >
            {inputA}
          </text>
        </g>

        {/* === INPUT B === */}
        {showB && (
          <>
            <text
              x={IN_X}
              y={IN_B_Y - NODE_R - 8}
              textAnchor="middle"
              className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
            >
              Input B
            </text>
            <g
              className="cursor-pointer"
              onClick={() => setInputB(inputB === 0 ? 1 : 0)}
            >
              <circle
                cx={IN_X}
                cy={IN_B_Y}
                r={NODE_R}
                fill={inputB === 1 ? "#dbeafe" : "#f9fafb"}
                stroke={inputB === 1 ? "#3b82f6" : "#d1d5db"}
                strokeWidth="2"
              />
              <text
                x={IN_X}
                y={IN_B_Y + 6}
                textAnchor="middle"
                className="fill-foreground text-[18px] font-bold font-mono pointer-events-none select-none"
              >
                {inputB}
              </text>
            </g>
          </>
        )}

        {/* === ARROWS: inputs → gate === */}
        <line
          x1={IN_X + NODE_R + 2}
          y1={showB ? IN_A_Y : GATE_Y}
          x2={GATE_X - GATE_W / 2 - 4}
          y2={GATE_Y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#lg-arrow)"
        />
        {showB && (
          <line
            x1={IN_X + NODE_R + 2}
            y1={IN_B_Y}
            x2={GATE_X - GATE_W / 2 - 4}
            y2={GATE_Y}
            stroke="#9ca3af"
            strokeWidth="1.5"
            markerEnd="url(#lg-arrow)"
          />
        )}

        {/* === GATE BOX === */}
        <rect
          x={GATE_X - GATE_W / 2}
          y={GATE_Y - GATE_H / 2}
          width={GATE_W}
          height={GATE_H}
          rx={10}
          fill="#fef9ee"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <text
          x={GATE_X}
          y={GATE_Y + 6}
          textAnchor="middle"
          className="fill-warning text-[16px] font-bold pointer-events-none select-none"
        >
          {gate}
        </text>

        {/* === ARROW: gate → output === */}
        <line
          x1={GATE_X + GATE_W / 2 + 2}
          y1={GATE_Y}
          x2={OUT_X - NODE_R - 4}
          y2={OUT_Y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#lg-arrow)"
        />

        {/* === OUTPUT NODE === */}
        <text
          x={OUT_X}
          y={OUT_Y - NODE_R - 8}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Output
        </text>
        <circle
          cx={OUT_X}
          cy={OUT_Y}
          r={NODE_R}
          fill={output === 1 ? "#dcfce7" : "#fef2f2"}
          stroke={output === 1 ? "#10b981" : "#ef4444"}
          strokeWidth="2"
        />
        <text
          x={OUT_X}
          y={OUT_Y + 6}
          textAnchor="middle"
          className={`text-[18px] font-bold font-mono pointer-events-none select-none ${
            output === 1 ? "fill-success" : "fill-error"
          }`}
        >
          {output}
        </text>
      </svg>

      {/* Truth table below */}
      <div className="mt-4 flex justify-center">
        <div className="min-w-[200px]">
          <div className="text-xs font-semibold text-foreground mb-2">
            Truth Table
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted">
                  A
                </th>
                {showB && (
                  <th className="px-2 py-1.5 text-left font-medium text-muted">
                    B
                  </th>
                )}
                <th className="px-2 py-1.5 text-left font-medium text-muted">
                  {gate}
                </th>
              </tr>
            </thead>
            <tbody>
              {truthRows
                .filter((row) => showB || row.b === 0)
                .map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      row.active
                        ? "bg-accent/10"
                        : "hover:bg-foreground/5"
                    }`}
                    onClick={() => {
                      setInputA(row.a);
                      if (showB) setInputB(row.b);
                    }}
                  >
                    <td className="px-2 py-1.5 font-mono">{row.a}</td>
                    {showB && (
                      <td className="px-2 py-1.5 font-mono">{row.b}</td>
                    )}
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex h-5 min-w-[2rem] items-center justify-center rounded text-[10px] font-bold text-white px-1 ${
                          row.out === 1 ? "bg-success" : "bg-error"
                        }`}
                      >
                        {row.out}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </WidgetContainer>
  );
}
