"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { ToggleControl } from "../shared/ToggleControl";
import { matMul } from "./matrixMath";

const DEFAULT_A: number[][] = [
  [1, 2, 0],
  [0, 1, 1],
  [2, 0, 1],
];

const DEFAULT_B: number[][] = [
  [0, 1, 1],
  [1, 0, 2],
  [1, 1, 0],
];

function MatrixGrid({
  matrix,
  label,
  onChange,
  highlighted,
  dimmed,
}: {
  matrix: number[][];
  label: string;
  onChange?: (row: number, col: number, value: number) => void;
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-sm font-bold text-foreground">{label}</span>
      <div
        className={`rounded-lg border-2 bg-surface p-3 transition-all ${
          highlighted
            ? "border-accent"
            : dimmed
              ? "border-border opacity-40"
              : "border-border"
        }`}
      >
        <div className="flex flex-col gap-1">
          {matrix.map((row, r) => (
            <div key={r} className="flex gap-1">
              {row.map((val, c) => (
                <div key={c} className="flex items-center justify-center">
                  {onChange ? (
                    <input
                      type="number"
                      min={-2}
                      max={2}
                      step={1}
                      value={val}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (!isNaN(parsed)) {
                          onChange(r, c, Math.max(-2, Math.min(2, parsed)));
                        }
                      }}
                      className="h-8 w-10 rounded border border-border bg-background text-center font-mono text-sm font-semibold text-foreground focus:border-accent focus:outline-none"
                      aria-label={`${label} row ${r + 1} column ${c + 1}`}
                    />
                  ) : (
                    <div
                      className={`flex h-8 min-w-[2.75rem] items-center justify-center rounded border font-mono text-sm font-bold ${
                        highlighted
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : dimmed
                            ? "border-border bg-surface text-muted line-through"
                            : "border-border bg-surface text-foreground"
                      }`}
                    >
                      {val}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function updateMatrix(
  matrix: number[][],
  row: number,
  col: number,
  value: number
): number[][] {
  return matrix.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
  );
}

export function MatrixComposition() {
  const [matA, setMatA] = useState<number[][]>(DEFAULT_A);
  const [matB, setMatB] = useState<number[][]>(DEFAULT_B);
  const [activationOn, setActivationOn] = useState(false);

  const resetToDefaults = useCallback(() => {
    setMatA(DEFAULT_A);
    setMatB(DEFAULT_B);
    setActivationOn(false);
  }, []);

  const matC = matMul(matA, matB);

  const handleChangeA = useCallback((r: number, c: number, v: number) => {
    setMatA((prev) => updateMatrix(prev, r, c, v));
  }, []);

  const handleChangeB = useCallback((r: number, c: number, v: number) => {
    setMatB((prev) => updateMatrix(prev, r, c, v));
  }, []);

  return (
    <WidgetContainer
      title="Two Matrices Make One"
      description="Stack two matrix layers and they collapse into a single matrix — unless you bend the space between them."
      onReset={resetToDefaults}
    >
      {/* Matrix equation row */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <MatrixGrid
          matrix={matA}
          label="A"
          onChange={handleChangeA}
        />

        <span className="font-mono text-2xl font-bold text-muted">×</span>

        <MatrixGrid
          matrix={matB}
          label="B"
          onChange={handleChangeB}
        />

        <span className="font-mono text-2xl font-bold text-muted">=</span>

        {activationOn ? (
          <div className="flex flex-col items-center gap-1.5">
            <MatrixGrid matrix={matC} label="C" dimmed />
            <span className="rounded-full border border-error bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error">
              ✗ can&apos;t collapse
            </span>
          </div>
        ) : (
          <MatrixGrid
            matrix={matC}
            label="C"
            highlighted
          />
        )}
      </div>

      {/* Explanatory copy */}
      <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground/80">
        {activationOn ? (
          <span>
            Now you can&apos;t collapse them — the bend in between makes the two layers do something no single matrix can.
          </span>
        ) : (
          <span>
            Stack two matrix layers with nothing between them and you can always replace them with this single matrix C. Depth alone buys nothing — until you put a nonlinear bend (the activation function) between them.
          </span>
        )}
      </div>

      {/* Toggle */}
      <div className="mt-4">
        <ToggleControl
          label="Put an activation between them"
          checked={activationOn}
          onChange={setActivationOn}
        />
      </div>
    </WidgetContainer>
  );
}
