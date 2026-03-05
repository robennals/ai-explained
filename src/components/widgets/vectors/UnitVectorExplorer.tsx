"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "./VectorCard";
import { ANIMAL_DOMAIN } from "./vectorData";

const ANIMAL_PROPS = ANIMAL_DOMAIN.properties;

function normalizeToUnit(values: number[], changedIdx: number, newVal: number): number[] {
  const result = [...values];
  result[changedIdx] = newVal;

  const changedSq = newVal * newVal;
  const budget = 1 - changedSq;

  if (budget <= 0) {
    // Changed dimension uses all the budget
    return result.map((_, i) => i === changedIdx ? (newVal > 0 ? 1 : 0) : 0);
  }

  // Sum of squares of other dimensions
  const otherSumSq = result.reduce((s, v, i) => i === changedIdx ? s : s + v * v, 0);

  if (otherSumSq < 0.0001) {
    // Other dimensions are all zero — distribute budget equally
    const each = Math.sqrt(budget / (result.length - 1));
    return result.map((v, i) => i === changedIdx ? newVal : each);
  }

  // Scale other dimensions proportionally
  const scale = Math.sqrt(budget / otherSumSq);
  return result.map((v, i) => i === changedIdx ? newVal : v * scale);
}

export function UnitVectorExplorer() {
  const [name, setName] = useState("Dragopus");
  const [values, setValues] = useState(() => {
    const v = Math.sqrt(1 / ANIMAL_PROPS.length);
    return ANIMAL_PROPS.map(() => v);
  });

  const handleSlider = useCallback((idx: number, newVal: number) => {
    setValues(prev => normalizeToUnit(prev, idx, newVal));
  }, []);

  const handleReset = useCallback(() => {
    setName("Dragopus");
    const v = Math.sqrt(1 / ANIMAL_PROPS.length);
    setValues(ANIMAL_PROPS.map(() => v));
  }, []);

  const sumSq = values.reduce((s, v) => s + v * v, 0);

  return (
    <WidgetContainer
      title="Unit Vectors"
      description="A unit vector has magnitude 1 — the standard size for a vector"
      onReset={handleReset}
    >
      <p className="text-sm text-muted mb-3">
        Design your own animal! Drag any slider to change a property. The other properties automatically scale down so the vector stays a unit vector — the sum of squares always equals 1.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 items-start">
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-foreground/10 bg-foreground/[0.02] px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Name your animal..."
          />
          {ANIMAL_PROPS.map((prop, i) => (
            <SliderControl
              key={prop}
              label={prop}
              value={values[i]}
              min={0}
              max={0.99}
              step={0.01}
              onChange={(v) => handleSlider(i, v)}
            />
          ))}
        </div>
        <div className="space-y-3">
          <VectorCard
            name={name || "???"}
            emoji="🐾"
            properties={ANIMAL_PROPS}
            values={values}
            barColor="#8b5cf6"
            animate={false}
          />
          <div className="rounded-lg bg-foreground/[0.03] p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Sum of squares</div>
            <div className="font-mono text-sm">
              {values.map((v, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted"> + </span>}
                  {v.toFixed(2)}²
                </span>
              ))}
            </div>
            <div className="font-mono text-sm mt-1">
              = {values.map((v, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted"> + </span>}
                  {(v * v).toFixed(2)}
                </span>
              ))}
            </div>
            <div className="font-mono text-sm font-bold mt-1" style={{ color: Math.abs(sumSq - 1) < 0.02 ? "#22c55e" : "#f59e0b" }}>
              = {sumSq.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
