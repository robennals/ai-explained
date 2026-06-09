"use client";

import { useState, useCallback } from "react";
import { VectorCard } from "../vectors/VectorCard";
import { ANIMAL_DOMAIN } from "../vectors/vectorData";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";

const DEFAULT_ANIMAL = "Cat";

const animalOptions = ANIMAL_DOMAIN.items.map((item) => ({
  value: item.name,
  label: `${item.emoji} ${item.name}`,
}));

export function VectorOrientation() {
  const [animalName, setAnimalName] = useState(DEFAULT_ANIMAL);

  const resetToDefaults = useCallback(() => {
    setAnimalName(DEFAULT_ANIMAL);
  }, []);

  const item = ANIMAL_DOMAIN.items.find((it) => it.name === animalName)!;
  const properties = ANIMAL_DOMAIN.properties;

  return (
    <WidgetContainer
      title="One Vector, Two Ways"
      description="The same list of numbers, written as a column or as a row."
      onReset={resetToDefaults}
    >
      {/* Animal selector */}
      <div className="mb-6">
        <SelectControl
          label="Animal"
          value={animalName}
          options={animalOptions}
          onChange={setAnimalName}
        />
      </div>

      {/* Side-by-side panels */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Column form */}
        <div className="flex flex-col items-start gap-2">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">
            As a column
          </div>
          <VectorCard
            name={item.name}
            emoji={item.emoji}
            properties={properties}
            values={item.values}
          />
        </div>

        {/* Equals hint */}
        <div className="hidden sm:flex items-center self-center text-xl font-light text-muted">
          =
        </div>

        {/* Row form */}
        <div className="flex flex-col items-start gap-2">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">
            As a row
          </div>
          {/* Animal header — mirrors the VectorCard header */}
          <div className="rounded-t-lg border border-b-0 border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm font-medium text-foreground">
            {item.emoji} {item.name}
          </div>
          {/* Horizontal boxed-cell strip */}
          <div className="flex flex-wrap gap-1.5">
            {properties.map((prop, i) => (
              <div
                key={prop}
                className="flex flex-col items-center gap-0.5 rounded-md border border-border bg-surface px-2.5 py-2"
              >
                <span className="font-mono text-xs text-foreground tabular-nums">
                  {item.values[i].toFixed(2)}
                </span>
                <span className="text-[9px] text-muted leading-none">
                  {prop}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 text-xs text-muted leading-relaxed">
        Both show the same six numbers — same animal, same properties — just arranged differently.
        The column lists each property on its own line; the row spreads them left to right.
      </div>
    </WidgetContainer>
  );
}
