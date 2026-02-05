"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { SelectControl } from "../shared/SelectControl";

type FuzzyOp = "AND" | "OR" | "NOT" | "NAND" | "custom";

function fuzzyCompute(op: FuzzyOp, a: number, b: number): number {
  switch (op) {
    case "AND":
      return Math.min(a, b);
    case "OR":
      return Math.max(a, b);
    case "NOT":
      return 1 - a;
    case "NAND":
      return 1 - Math.min(a, b);
    case "custom":
      return a * b; // product t-norm
  }
}

function Gauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-32 w-6 rounded-full bg-foreground/5 overflow-hidden">
        <div
          className="absolute bottom-0 w-full rounded-full transition-all duration-200"
          style={{
            height: `${value * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="font-mono text-xs font-bold">{value.toFixed(2)}</span>
      <span className="text-[10px] text-muted">{label}</span>
    </div>
  );
}

function ChallengeCard({
  title,
  description,
  solved,
}: {
  title: string;
  description: string;
  solved: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 text-xs ${
        solved
          ? "border-success/30 bg-success/5"
          : "border-border bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={solved ? "text-success" : "text-muted"}>
          {solved ? "\u2713" : "\u25CB"}
        </span>
        <span className="font-medium">{title}</span>
      </div>
      <p className="mt-0.5 pl-5 text-muted">{description}</p>
    </div>
  );
}

export function FuzzyLogicPlayground() {
  const [a, setA] = useState(0.7);
  const [b, setB] = useState(0.3);
  const [selectedOps, setSelectedOps] = useState<FuzzyOp[]>(["AND", "OR", "NOT"]);

  const results = selectedOps.map((op) => ({
    op,
    value: fuzzyCompute(op, a, b),
  }));

  // Challenges
  const andResult = fuzzyCompute("AND", a, b);
  const orResult = fuzzyCompute("OR", a, b);
  const majorityVote =
    a > 0.5 && b > 0.5
      ? andResult > 0.5
      : a > 0.5 || b > 0.5
        ? orResult > 0.5
        : false;

  const handleReset = useCallback(() => {
    setA(0.7);
    setB(0.3);
    setSelectedOps(["AND", "OR", "NOT"]);
  }, []);

  const opColors: Record<FuzzyOp, string> = {
    AND: "#3b82f6",
    OR: "#8b5cf6",
    NOT: "#ef4444",
    NAND: "#f59e0b",
    custom: "#10b981",
  };

  return (
    <WidgetContainer
      title="Fuzzy Logic Playground"
      description="Continuous inputs (0.0–1.0): AND = min, OR = max, NOT = 1-x. This is what a neuron will turn out to be."
      onReset={handleReset}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <SliderControl
            label="Input A"
            value={a}
            min={0}
            max={1}
            step={0.01}
            onChange={setA}
          />
          <SliderControl
            label="Input B"
            value={b}
            min={0}
            max={1}
            step={0.01}
            onChange={setB}
          />

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted">Operations:</p>
            <div className="flex flex-wrap gap-2">
              {(["AND", "OR", "NOT", "NAND", "custom"] as FuzzyOp[]).map(
                (op) => (
                  <button
                    key={op}
                    onClick={() =>
                      setSelectedOps((prev) =>
                        prev.includes(op)
                          ? prev.filter((o) => o !== op)
                          : [...prev, op]
                      )
                    }
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      selectedOps.includes(op)
                        ? "text-white"
                        : "bg-surface text-muted hover:text-foreground"
                    }`}
                    style={
                      selectedOps.includes(op)
                        ? { backgroundColor: opColors[op] }
                        : undefined
                    }
                  >
                    {op === "custom" ? "A×B" : op}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Visual gauges */}
          <div className="flex items-end justify-center gap-6 rounded-lg bg-surface p-4">
            <Gauge value={a} label="A" color="#6b7280" />
            <Gauge value={b} label="B" color="#6b7280" />
            <div className="mx-2 h-px w-4 bg-border" />
            {results.map(({ op, value }) => (
              <Gauge
                key={op}
                value={value}
                label={op === "custom" ? "A×B" : op}
                color={opColors[op]}
              />
            ))}
          </div>

          {/* Formulas */}
          <div className="space-y-1 rounded-lg bg-surface p-3">
            {results.map(({ op, value }) => (
              <p key={op} className="font-mono text-xs">
                {op === "AND" && (
                  <>
                    AND(A, B) = min({a.toFixed(2)}, {b.toFixed(2)}) ={" "}
                    <strong>{value.toFixed(2)}</strong>
                  </>
                )}
                {op === "OR" && (
                  <>
                    OR(A, B) = max({a.toFixed(2)}, {b.toFixed(2)}) ={" "}
                    <strong>{value.toFixed(2)}</strong>
                  </>
                )}
                {op === "NOT" && (
                  <>
                    NOT(A) = 1 - {a.toFixed(2)} ={" "}
                    <strong>{value.toFixed(2)}</strong>
                  </>
                )}
                {op === "NAND" && (
                  <>
                    NAND(A, B) = 1 - min({a.toFixed(2)}, {b.toFixed(2)}) ={" "}
                    <strong>{value.toFixed(2)}</strong>
                  </>
                )}
                {op === "custom" && (
                  <>
                    A × B = {a.toFixed(2)} × {b.toFixed(2)} ={" "}
                    <strong>{value.toFixed(2)}</strong>
                  </>
                )}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Challenges
          </h4>
          <ChallengeCard
            title="Both inputs high"
            description="Set both A and B above 0.8 and check AND"
            solved={a > 0.8 && b > 0.8 && selectedOps.includes("AND")}
          />
          <ChallengeCard
            title="One high, one low"
            description="Set A > 0.8, B < 0.2. Compare AND vs OR"
            solved={
              a > 0.8 &&
              b < 0.2 &&
              selectedOps.includes("AND") &&
              selectedOps.includes("OR")
            }
          />
          <ChallengeCard
            title="The 'maybe' zone"
            description="Set both inputs to ~0.5. Notice how fuzzy logic handles uncertainty"
            solved={a > 0.4 && a < 0.6 && b > 0.4 && b < 0.6}
          />
          <ChallengeCard
            title="Compare AND vs A×B"
            description="Enable both AND and A×B. They're similar but not identical!"
            solved={selectedOps.includes("AND") && selectedOps.includes("custom")}
          />

          <div className="mt-4 rounded-lg bg-accent/5 p-3">
            <p className="text-xs leading-relaxed text-foreground/70">
              <strong>The connection to neurons:</strong> A neuron computes a
              weighted sum of inputs, then applies a smooth threshold (activation
              function). Fuzzy AND/OR are doing something very similar — combining
              inputs in a nonlinear way. The difference? A neuron{" "}
              <em>learns its own combination rule</em> instead of using a
              hand-coded min/max.
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
