"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

type GateType = "NAND" | "AND" | "OR" | "NOT" | "XOR";

interface Gate {
  id: string;
  type: GateType;
  inputs: [string, string]; // IDs of input sources ("A", "B", or gate IDs)
  output: number;
}

const GATE_FN: Record<GateType, (a: number, b: number) => number> = {
  NAND: (a, b) => (a && b ? 0 : 1),
  AND: (a, b) => (a && b ? 1 : 0),
  OR: (a, b) => (a || b ? 1 : 0),
  NOT: (a, _b) => (a ? 0 : 1),
  XOR: (a, b) => (a !== b ? 1 : 0),
};

const CHALLENGES = [
  {
    name: "AND from NAND",
    target: [0, 0, 0, 1],
    hint: "NAND(A,B) gives the opposite of AND. How do you flip a bit?",
    nandOnly: true,
  },
  {
    name: "OR from NAND",
    target: [0, 1, 1, 1],
    hint: "NOT(A) = NAND(A,A). DeMorgan: OR(A,B) = NAND(NOT(A), NOT(B))",
    nandOnly: true,
  },
  {
    name: "XOR from NAND",
    target: [0, 1, 1, 0],
    hint: "XOR needs 4 NAND gates. Think about what makes XOR special.",
    nandOnly: true,
  },
  {
    name: "NOT from NAND",
    target: [1, 1, 0, 0], // NOT(A), ignoring B
    hint: "NAND(A,A) = NOT(A). Feed the same input to both.",
    nandOnly: true,
  },
];

function evaluateCircuit(
  gates: Gate[],
  inputA: number,
  inputB: number
): Map<string, number> {
  const values = new Map<string, number>();
  values.set("A", inputA);
  values.set("B", inputB);

  // Topological evaluation (simple: just iterate since gates reference prior gates)
  for (const gate of gates) {
    const a = values.get(gate.inputs[0]) ?? 0;
    const b = values.get(gate.inputs[1]) ?? 0;
    values.set(gate.id, GATE_FN[gate.type](a, b));
  }

  return values;
}

function GateBox({
  gate,
  values,
  onRemove,
  onChangeInput,
  availableSources,
}: {
  gate: Gate;
  values: Map<string, number>;
  onRemove: () => void;
  onChangeInput: (idx: 0 | 1, source: string) => void;
  availableSources: string[];
}) {
  const output = values.get(gate.id) ?? 0;

  return (
    <div className="relative rounded-lg border border-border bg-white p-3">
      <button
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white"
      >
        ×
      </button>
      <div className="mb-2 text-center">
        <span className="rounded bg-foreground/10 px-2 py-0.5 font-mono text-xs font-bold">
          {gate.type}
        </span>
        <span className="ml-2 text-[10px] text-muted">({gate.id})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="space-y-1">
          {[0, 1].map((idx) => (
            <select
              key={idx}
              value={gate.inputs[idx as 0 | 1]}
              onChange={(e) =>
                onChangeInput(idx as 0 | 1, e.target.value)
              }
              className="w-16 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]"
            >
              {availableSources.map((src) => (
                <option key={src} value={src}>
                  {src} ({values.get(src) ?? "?"})
                </option>
              ))}
            </select>
          ))}
        </div>
        <span className="text-muted">→</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-bold ${
            output ? "bg-accent text-white" : "bg-foreground/10 text-muted"
          }`}
        >
          {output}
        </span>
      </div>
    </div>
  );
}

export function LogicGateBuilder() {
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);
  const [gates, setGates] = useState<Gate[]>([]);
  const [nextId, setNextId] = useState(1);

  const values = useMemo(
    () => evaluateCircuit(gates, inputA, inputB),
    [gates, inputA, inputB]
  );

  const availableSources = useMemo(
    () => ["A", "B", ...gates.map((g) => g.id)],
    [gates]
  );

  const addGate = useCallback(
    (type: GateType) => {
      const id = `G${nextId}`;
      setGates((prev) => [
        ...prev,
        { id, type, inputs: ["A", "B"], output: 0 },
      ]);
      setNextId((n) => n + 1);
    },
    [nextId]
  );

  const removeGate = useCallback((id: string) => {
    setGates((prev) => {
      const filtered = prev.filter((g) => g.id !== id);
      // Reset any inputs that referenced the removed gate
      return filtered.map((g) => ({
        ...g,
        inputs: g.inputs.map((inp) => (inp === id ? "A" : inp)) as [
          string,
          string
        ],
      }));
    });
  }, []);

  const changeInput = useCallback(
    (gateId: string, inputIdx: 0 | 1, source: string) => {
      setGates((prev) =>
        prev.map((g) => {
          if (g.id !== gateId) return g;
          const newInputs = [...g.inputs] as [string, string];
          newInputs[inputIdx] = source;
          return { ...g, inputs: newInputs };
        })
      );
    },
    []
  );

  const handleReset = useCallback(() => {
    setInputA(0);
    setInputB(0);
    setGates([]);
    setNextId(1);
  }, []);

  // Check challenges
  const finalOutput =
    gates.length > 0 ? values.get(gates[gates.length - 1].id) ?? 0 : 0;

  const currentTruthTable = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ].map(([a, b]) => {
    const v = evaluateCircuit(gates, a, b);
    return gates.length > 0 ? v.get(gates[gates.length - 1].id) ?? 0 : 0;
  });

  const allNand = gates.every((g) => g.type === "NAND");

  return (
    <WidgetContainer
      title="Logic Gate Builder"
      description="Wire together gates from NAND. Challenge: build AND, OR, XOR using only NAND gates."
      onReset={handleReset}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gate palette + inputs */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setInputA((v) => (v ? 0 : 1))}
              className={`flex-1 rounded-lg py-2 text-center font-mono text-sm font-bold transition-colors ${
                inputA
                  ? "bg-accent text-white"
                  : "bg-foreground/10 text-muted"
              }`}
            >
              A = {inputA}
            </button>
            <button
              onClick={() => setInputB((v) => (v ? 0 : 1))}
              className={`flex-1 rounded-lg py-2 text-center font-mono text-sm font-bold transition-colors ${
                inputB
                  ? "bg-accent text-white"
                  : "bg-foreground/10 text-muted"
              }`}
            >
              B = {inputB}
            </button>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">
              Add gate:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["NAND", "AND", "OR", "NOT", "XOR"] as GateType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => addGate(type)}
                    className="rounded-md bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="rounded-lg bg-surface p-3">
            <p className="font-mono text-sm">
              Final output:{" "}
              <span className="font-bold">
                {gates.length > 0 ? finalOutput : "—"}
              </span>
            </p>
          </div>

          {/* Truth table */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">
              Circuit truth table:
            </p>
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1 font-semibold text-muted">A</th>
                  <th className="px-2 py-1 font-semibold text-muted">B</th>
                  <th className="px-2 py-1 font-semibold text-muted">Out</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [0, 0],
                  [0, 1],
                  [1, 0],
                  [1, 1],
                ].map(([a, b], i) => (
                  <tr key={`${a}-${b}`} className="border-b border-border/50">
                    <td className="px-2 py-1 font-mono">{a}</td>
                    <td className="px-2 py-1 font-mono">{b}</td>
                    <td className="px-2 py-1 font-mono font-bold">
                      {gates.length > 0 ? currentTruthTable[i] : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gate canvas */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">
            Circuit ({gates.length} gate{gates.length !== 1 && "s"}):
          </p>
          {gates.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-xs text-muted">
                Add gates using the buttons on the left
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {gates.map((gate) => (
                <GateBox
                  key={gate.id}
                  gate={gate}
                  values={values}
                  onRemove={() => removeGate(gate.id)}
                  onChangeInput={(idx, src) =>
                    changeInput(gate.id, idx, src)
                  }
                  availableSources={availableSources.filter(
                    (s) => s !== gate.id
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Challenges */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Challenges (NAND only)
          </p>
          {CHALLENGES.map((ch) => {
            const solved =
              gates.length > 0 &&
              allNand &&
              currentTruthTable.every((v, i) => v === ch.target[i]);
            return (
              <div
                key={ch.name}
                className={`rounded-lg border p-2.5 ${
                  solved
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-white"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className={solved ? "text-success" : "text-muted"}>
                    {solved ? "\u2713" : "\u25CB"}
                  </span>
                  <span className="font-medium">{ch.name}</span>
                </div>
                <p className="mt-0.5 pl-5 text-[10px] text-muted">
                  Target: [{ch.target.join(", ")}]
                </p>
                {!solved && (
                  <p className="mt-1 pl-5 text-[10px] italic text-muted">
                    {ch.hint}
                  </p>
                )}
              </div>
            );
          })}

          <div className="mt-4 rounded-lg bg-accent/5 p-3">
            <p className="text-xs leading-relaxed text-foreground/70">
              <strong>Why NAND matters:</strong> Any boolean function can be
              built from NAND gates alone. This means one simple component —
              repeated and wired differently — can compute{" "}
              <em>anything</em>. Sound familiar? That&apos;s exactly what a
              neural network does: many copies of one simple unit (the neuron),
              wired together.
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
