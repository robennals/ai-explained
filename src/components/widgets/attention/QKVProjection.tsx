"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Tiny example: 4-dim embedding → 3-dim Q, K, V via linear layers   */
/*  Framed as three single-layer neural networks (no activation)       */
/* ------------------------------------------------------------------ */

const EMBEDDING = [0.8, 0.2, -0.5, 0.3]; // "cat" embedding

// Weight matrices (each row = weights for one output neuron)
const W_Q: number[][] = [
  [ 0.5,  0.3, -0.2,  0.1],
  [-0.1,  0.6,  0.4,  0.0],
  [ 0.2, -0.3,  0.1,  0.7],
];

const W_K: number[][] = [
  [ 0.4, -0.1,  0.3,  0.2],
  [ 0.0,  0.5, -0.2,  0.4],
  [-0.3,  0.2,  0.6,  0.1],
];

const W_V: number[][] = [
  [-0.2,  0.4,  0.1,  0.5],
  [ 0.6, -0.1,  0.3, -0.2],
  [ 0.1,  0.3, -0.4,  0.3],
];

function linearLayer(weights: number[][], input: number[]): number[] {
  return weights.map((row) => row.reduce((sum, w, i) => sum + w * input[i], 0));
}

function fmt(n: number): string {
  const s = n.toFixed(2);
  return n >= 0 ? "\u2006" + s : s;
}

/* Colors */
const COLORS = {
  q: "#ef4444",
  k: "#3b82f6",
  v: "#10b981",
  emb: "#8b5cf6",
};

/* ------------------------------------------------------------------ */
/*  Selection: either an output neuron or an input neuron              */
/* ------------------------------------------------------------------ */

type Selection =
  | { kind: "output"; group: "q" | "k" | "v"; idx: number }
  | { kind: "input"; idx: number };

const DEFAULT_SELECTED: Selection = { kind: "output", group: "q", idx: 0 };

/** Does this connection touch the current selection? */
function isConnectionHighlighted(sel: Selection | null, groupId: string, outputIdx: number, inputIdx: number): boolean {
  if (!sel) return false;
  if (sel.kind === "output") return sel.group === groupId && sel.idx === outputIdx;
  if (sel.kind === "input") return sel.idx === inputIdx;
  return false;
}

/* ------------------------------------------------------------------ */
/*  SVG diagram                                                        */
/* ------------------------------------------------------------------ */

const SVG_W = 540;
const SVG_H = 310;

function ProjectionDiagram({
  embedding,
  qVec,
  kVec,
  vVec,
  selected,
  onSelect,
}: {
  embedding: number[];
  qVec: number[];
  kVec: number[];
  vVec: number[];
  selected: Selection | null;
  onSelect: (s: Selection | null) => void;
}) {
  const inX = 100;
  const outX = 455;

  const inputDim = embedding.length;
  const outputDim = qVec.length;

  const inSpacing = 42;
  const inStartY = SVG_H / 2 - ((inputDim - 1) * inSpacing) / 2;

  const groups = [
    { id: "q" as const, label: "Query", color: COLORS.q, vec: qVec, weights: W_Q, centerY: 55 },
    { id: "k" as const, label: "Key",   color: COLORS.k, vec: kVec, weights: W_K, centerY: SVG_H / 2 },
    { id: "v" as const, label: "Value", color: COLORS.v, vec: vVec, weights: W_V, centerY: SVG_H - 55 },
  ];

  const outSpacing = 28;

  const hasSelection = selected !== null;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxWidth: 540 }}>
      {/* Three output groups — connections first, then nodes on top */}
      {groups.map((group) => {
        const groupOutStartY = group.centerY - ((outputDim - 1) * outSpacing) / 2;

        return (
          <g key={`conns-${group.label}`}>
            {group.weights.map((row, j) => {
              const oy = groupOutStartY + j * outSpacing;

              return row.map((w, i) => {
                const iy = inStartY + i * inSpacing;
                const absW = Math.abs(w);
                const highlighted = isConnectionHighlighted(selected, group.id, j, i);

                // Base: all connections clearly visible. Highlighted: bolder + labels.
                let lineOpacity: number;
                let lineWidth: number;
                if (highlighted) {
                  lineOpacity = Math.max(0.5, absW * 0.9);
                  lineWidth = Math.max(1.5, absW * 5);
                } else if (hasSelection) {
                  lineOpacity = Math.max(0.08, absW * 0.15);
                  lineWidth = Math.max(0.5, absW * 2);
                } else {
                  lineOpacity = Math.max(0.1, absW * 0.4);
                  lineWidth = Math.max(0.5, absW * 3);
                }

                // Position weight label along the connection line
                const t = 0.35;
                const labelX = inX + 18 + (outX - 18 - inX - 18) * t;
                const labelY = iy + (oy - iy) * t - 5;

                return (
                  <g key={`conn-${group.label}-${i}-${j}`}>
                    <line
                      x1={inX + 18}
                      y1={iy}
                      x2={outX - 18}
                      y2={oy}
                      stroke={group.color}
                      strokeWidth={lineWidth}
                      opacity={lineOpacity}
                      strokeDasharray={w < 0 ? "3,2" : undefined}
                      style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
                    />
                    {highlighted && (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight="bold"
                        fill={group.color}
                      >
                        {w >= 0 ? "+" : ""}{w.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              });
            })}
          </g>
        );
      })}

      {/* Input embedding nodes (clickable) */}
      {embedding.map((val, i) => {
        const y = inStartY + i * inSpacing;
        const isThisSelected = selected?.kind === "input" && selected.idx === i;
        const isFaded = hasSelection && !isThisSelected && selected?.kind === "input";

        return (
          <g
            key={`in-${i}`}
            onClick={() => onSelect(isThisSelected ? null : { kind: "input", idx: i })}
            className="cursor-pointer"
          >
            <circle
              cx={inX}
              cy={y}
              r={18}
              fill={isThisSelected ? COLORS.emb : "#f5f3ff"}
              stroke={COLORS.emb}
              strokeWidth={isThisSelected ? 2.5 : 1.5}
              opacity={isFaded ? 0.4 : 1}
              style={{ transition: "opacity 0.2s" }}
            />
            <text
              x={inX}
              y={y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill={isThisSelected ? "white" : COLORS.emb}
              opacity={isFaded ? 0.4 : 1}
              style={{ transition: "opacity 0.2s" }}
            >
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* Group label to the left, matching the Query/Key/Value labels on the right */}
      <text
        x={inX - 24}
        y={SVG_H / 2 + 4}
        textAnchor="end"
        fontSize={11}
        fontWeight="bold"
        fill={COLORS.emb}
        opacity={hasSelection && selected?.kind === "output" ? 0.4 : 1}
        style={{ transition: "opacity 0.2s" }}
      >
        Input
      </text>
      <text
        x={inX - 24}
        y={SVG_H / 2 + 16}
        textAnchor="end"
        fontSize={11}
        fontWeight="bold"
        fill={COLORS.emb}
        opacity={hasSelection && selected?.kind === "output" ? 0.4 : 1}
        style={{ transition: "opacity 0.2s" }}
      >
        Embedding
      </text>

      {/* Output nodes (clickable) and group labels */}
      {groups.map((group) => {
        const groupOutStartY = group.centerY - ((outputDim - 1) * outSpacing) / 2;

        return (
          <g key={`nodes-${group.label}`}>
            {group.vec.map((val, j) => {
              const oy = groupOutStartY + j * outSpacing;
              const isThisSelected = selected?.kind === "output" && selected.group === group.id && selected.idx === j;
              const isFaded = hasSelection && !isThisSelected && !(selected?.kind === "input");

              return (
                <g
                  key={`out-${group.label}-${j}`}
                  onClick={() => onSelect(isThisSelected ? null : { kind: "output", group: group.id, idx: j })}
                  className="cursor-pointer"
                  opacity={isFaded ? 0.4 : 1}
                  style={{ transition: "opacity 0.2s" }}
                >
                  <circle
                    cx={outX}
                    cy={oy}
                    r={16}
                    fill={isThisSelected ? group.color : "white"}
                    stroke={group.color}
                    strokeWidth={isThisSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={outX}
                    y={oy + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="bold"
                    fill={isThisSelected ? "white" : group.color}
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Group label */}
            <text
              x={outX + 24}
              y={group.centerY + 4}
              fontSize={11}
              fontWeight="bold"
              fill={group.color}
              opacity={hasSelection && selected?.kind === "output" && selected.group !== group.id ? 0.4 : 1}
              style={{ transition: "opacity 0.2s" }}
            >
              {group.label}
            </text>
          </g>
        );
      })}

      {/* Annotation */}
      <text x={SVG_W / 2} y={SVG_H - 2} textAnchor="middle" fontSize={9} fill="#9ca3af" fontStyle="italic">
        Click any node to see its connections — weighted sums, no activation function
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export function QKVProjection() {
  const [selected, setSelected] = useState<Selection | null>(DEFAULT_SELECTED);

  const handleReset = useCallback(() => {
    setSelected(DEFAULT_SELECTED);
  }, []);

  const embedding = EMBEDDING;
  const qVec = useMemo(() => linearLayer(W_Q, embedding), [embedding]);
  const kVec = useMemo(() => linearLayer(W_K, embedding), [embedding]);
  const vVec = useMemo(() => linearLayer(W_V, embedding), [embedding]);

  return (
    <WidgetContainer
      title="Where Q, K, V Come From"
      description="Each token's embedding is fed through three single-layer networks (one per vector) — just weighted sums, no activation function."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Diagram */}
        <div className="rounded-lg border border-border bg-surface px-2 py-4">
          <ProjectionDiagram
            embedding={embedding}
            qVec={qVec}
            kVec={kVec}
            vVec={vVec}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* Weighted sum breakdown when an output neuron is selected */}
        {selected?.kind === "output" && (() => {
          const allWeights = { q: W_Q, k: W_K, v: W_V };
          const allVecs = { q: qVec, k: kVec, v: vVec };
          const labels = { q: "Query", k: "Key", v: "Value" };
          const colors = { q: COLORS.q, k: COLORS.k, v: COLORS.v };
          const weights = allWeights[selected.group][selected.idx];
          const result = allVecs[selected.group][selected.idx];

          return (
            <div className="rounded-lg border px-4 py-3" style={{ borderColor: colors[selected.group] + "40" }}>
              <div className="mb-2 text-xs font-bold" style={{ color: colors[selected.group] }}>
                {labels[selected.group]} neuron {selected.idx + 1}: weighted sum
              </div>
              <div className="font-mono text-xs leading-relaxed text-foreground">
                {weights.map((w, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-muted"> + </span>}
                    <span style={{ color: colors[selected.group] }}>{w >= 0 && i > 0 ? "+" : ""}{w.toFixed(1)}</span>
                    <span className="text-muted">{"\u00d7"}</span>
                    <span style={{ color: COLORS.emb }}>{embedding[i].toFixed(1)}</span>
                  </span>
                ))}
                <span className="text-muted"> = </span>
                <span className="font-bold" style={{ color: colors[selected.group] }}>{result.toFixed(2)}</span>
              </div>
            </div>
          );
        })()}

        {/* Info when an input is selected */}
        {selected?.kind === "input" && (
          <div className="rounded-lg border px-4 py-3" style={{ borderColor: COLORS.emb + "40" }}>
            <div className="mb-2 text-xs font-bold" style={{ color: COLORS.emb }}>
              Embedding dimension {selected.idx + 1}: value {embedding[selected.idx].toFixed(1)}
            </div>
            <div className="text-xs text-foreground">
              This input connects to every output neuron in all three networks, each with its own learned weight.
              The weight labels show how much this input contributes to each output.
            </div>
          </div>
        )}

        {/* Numerical breakdown */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            { label: "Query", id: "q" as const, color: COLORS.q, vec: qVec },
            { label: "Key", id: "k" as const, color: COLORS.k, vec: kVec },
            { label: "Value", id: "v" as const, color: COLORS.v, vec: vVec },
          ]).map((item) => (
            <div
              key={item.label}
              className="rounded-lg border px-3 py-2"
              style={{
                borderColor: item.color + (selected?.kind === "output" && selected.group === item.id ? "80" : "40"),
                backgroundColor: selected?.kind === "output" && selected.group === item.id ? item.color + "08" : undefined,
              }}
            >
              <div className="mb-1 text-xs font-bold" style={{ color: item.color }}>
                {item.label}
              </div>
              <div className="font-mono text-xs text-foreground">
                [{item.vec.map((v) => fmt(v)).join(", ")}]
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
