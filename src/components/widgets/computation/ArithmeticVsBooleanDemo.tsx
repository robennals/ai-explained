"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";

type Op = "+" | "×" | "threshold";

interface Node {
  id: string;
  label: string;
  op: Op;
  threshold: number;
}

const INITIAL_INPUTS = { a: 0.0, b: 0.0 };

function compute(a: number, b: number, ops: Node[]): number[] {
  const results: number[] = [];
  let current = a;
  for (const node of ops) {
    if (node.op === "+") {
      current = current + b;
    } else if (node.op === "×") {
      current = current * b;
    } else if (node.op === "threshold") {
      current = current >= node.threshold ? 1 : 0;
    }
    results.push(current);
  }
  return results;
}

function TruthTable({
  ops,
  hasThreshold,
}: {
  ops: Node[];
  hasThreshold: boolean;
}) {
  const inputs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  return (
    <table className="w-full text-center text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className="px-2 py-1.5 font-semibold text-muted">A</th>
          <th className="px-2 py-1.5 font-semibold text-muted">B</th>
          <th className="px-2 py-1.5 font-semibold text-muted">Output</th>
          <th className="px-2 py-1.5 font-semibold text-muted">IF/THEN?</th>
        </tr>
      </thead>
      <tbody>
        {inputs.map(([a, b]) => {
          const results = compute(a, b, ops);
          const output = results.length > 0 ? results[results.length - 1] : 0;
          const isIfThen = output === (a === 1 && b === 1 ? 1 : 0);
          return (
            <tr key={`${a}-${b}`} className="border-b border-border/50">
              <td className="px-2 py-1.5 font-mono">{a}</td>
              <td className="px-2 py-1.5 font-mono">{b}</td>
              <td className="px-2 py-1.5 font-mono font-bold">
                {typeof output === "number" ? output.toFixed(2) : output}
              </td>
              <td className="px-2 py-1.5">
                {hasThreshold ? (
                  isIfThen ? (
                    <span className="text-success font-bold">\u2713</span>
                  ) : (
                    <span className="text-error font-bold">\u2717</span>
                  )
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ArithmeticVsBooleanDemo() {
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [useThreshold, setUseThreshold] = useState(false);
  const [threshold, setThreshold] = useState(1.5);
  const [operation, setOperation] = useState<"+" | "×">("+");

  const ops: Node[] = [
    { id: "op", label: operation, op: operation, threshold: 0 },
    ...(useThreshold
      ? [
          {
            id: "thresh",
            label: `≥ ${threshold.toFixed(1)}`,
            op: "threshold" as Op,
            threshold,
          },
        ]
      : []),
  ];

  const results = compute(inputs.a, inputs.b, ops);
  const finalOutput = results.length > 0 ? results[results.length - 1] : 0;

  const handleReset = useCallback(() => {
    setInputs(INITIAL_INPUTS);
    setUseThreshold(false);
    setThreshold(1.5);
    setOperation("+");
  }, []);

  // Check if AND is achieved (output 1 only when both inputs are 1)
  const andCheck = [0, 0, 1, 1]
    .map((a, i) => {
      const b = [0, 1, 0, 1][i];
      const r = compute(a, b, ops);
      return r.length > 0 ? r[r.length - 1] : 0;
    })
    .every((v, i) => (i === 3 ? v === 1 : v === 0));

  return (
    <WidgetContainer
      title="Arithmetic vs Boolean: Can You Build AND?"
      description="Challenge: Build an AND gate using only + and ×. Then discover what you're missing."
      onReset={handleReset}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-3">
            <SliderControl
              label="Input A"
              value={inputs.a}
              min={0}
              max={1}
              step={1}
              onChange={(v) => setInputs((p) => ({ ...p, a: v }))}
              formatValue={(v) => String(v)}
            />
            <SliderControl
              label="Input B"
              value={inputs.b}
              min={0}
              max={1}
              step={1}
              onChange={(v) => setInputs((p) => ({ ...p, b: v }))}
              formatValue={(v) => String(v)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOperation("+")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                operation === "+"
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              A + B
            </button>
            <button
              onClick={() => setOperation("×")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                operation === "×"
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              A × B
            </button>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <ToggleControl
              label="Add threshold (step function)"
              checked={useThreshold}
              onChange={setUseThreshold}
            />
            {useThreshold && (
              <SliderControl
                label="Threshold"
                value={threshold}
                min={0}
                max={3}
                step={0.1}
                onChange={setThreshold}
              />
            )}
          </div>

          {/* Live computation */}
          <div className="rounded-lg bg-surface p-3">
            <p className="font-mono text-sm">
              {inputs.a} {operation} {inputs.b} = {(operation === "+" ? inputs.a + inputs.b : inputs.a * inputs.b).toFixed(1)}
              {useThreshold && (
                <>
                  {" "}
                  → {finalOutput === 1 ? "≥" : "<"} {threshold.toFixed(1)} →{" "}
                  <span className="font-bold">{finalOutput}</span>
                </>
              )}
            </p>
          </div>

          {/* Status */}
          <div
            className={`rounded-lg p-3 text-sm font-medium ${
              andCheck
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            {andCheck
              ? "You built AND! The threshold is the seed of a neuron."
              : operation === "×" && !useThreshold
                ? "A × B gives 1 only when both are 1... but also gives 0.5 × 0.5 = 0.25. Not quite boolean. Try the threshold!"
                : !useThreshold
                  ? "A + B gives 2 when both are 1. That's not AND (should be 1). Can you fix it?"
                  : "Adjust the threshold until AND works for all inputs."}
          </div>
        </div>

        {/* Truth table */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Truth Table
          </h4>
          <TruthTable ops={ops} hasThreshold={useThreshold} />

          <div className="mt-4 rounded-lg bg-accent/5 p-3">
            <p className="text-xs leading-relaxed text-foreground/70">
              {!useThreshold ? (
                <>
                  <strong>The problem:</strong> Addition and multiplication are
                  smooth and continuous — they can&apos;t produce sharp 0/1 decisions.
                  You need something that <em>thresholds</em> — that makes a
                  hard decision. Toggle on the threshold to see.
                </>
              ) : andCheck ? (
                <>
                  <strong>The insight:</strong> A weighted sum + a threshold
                  step function = a logic gate. This is exactly what a neuron
                  does: inputs × weights, sum them up, apply an activation
                  function. You just invented the fundamental unit of neural
                  networks.
                </>
              ) : (
                <>
                  <strong>Hint:</strong> For A + B, you need a threshold between
                  1 and 2 (so that a single 1 doesn&apos;t pass, but 1+1=2 does). For
                  A × B, try a threshold between 0 and 1.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
