"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "./VectorCard";
import { ANIMAL_DOMAIN } from "./vectorData";

export function AmplifiedAnimalExplorer() {
  const [animalIdx, setAnimalIdx] = useState(0);
  const [magnitude, setMagnitude] = useState(2.0);
  const animal = ANIMAL_DOMAIN.items[animalIdx];
  const amplified = animal.values.map(v => v * magnitude);

  const handleReset = useCallback(() => {
    setAnimalIdx(0);
    setMagnitude(2.0);
  }, []);

  return (
    <WidgetContainer
      title="What and How Much"
      description="A unit vector says what kind of thing; magnitude says how much"
      onReset={handleReset}
    >
      <p className="text-sm text-muted mb-3">
        Pick an animal to see its unit vector. The magnitude slider scales every dimension by the same amount — the proportions stay the same, but the vector gets bigger. We&apos;ll find this useful later, when we use vectors to <em>detect</em> animals and use the magnitude to control how sensitive our detector is.
      </p>
      <div className="flex flex-wrap gap-1 mb-3">
        {ANIMAL_DOMAIN.items.map((item, i) => (
          <button
            key={item.name}
            onClick={() => setAnimalIdx(i)}
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
              i === animalIdx
                ? "bg-blue-500 text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            {item.emoji} {item.name}
          </button>
        ))}
      </div>

      <SliderControl label="magnitude" value={magnitude} min={0.1} max={5} step={0.1} onChange={setMagnitude} />

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start mt-3">
        <VectorCard
          name={animal.name}
          emoji={animal.emoji}
          properties={ANIMAL_DOMAIN.properties}
          values={animal.values}
          barColor="#3b82f6"
          label="unit vector" labelColor="#3b82f6"
        />
        <VectorCard
          name={animal.name}
          emoji={animal.emoji}
          properties={ANIMAL_DOMAIN.properties}
          values={amplified}
          barColor="#f59e0b"
          label={`× ${magnitude.toFixed(1)}`} labelColor="#f59e0b"
          barMax={4}
          barWidth="w-32"
          animate={false}
        />
        {/* Multiplication math */}
        <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0" style={{ maxWidth: "10rem" }}>
          <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">× {magnitude.toFixed(1)}</span>
          </div>
          {ANIMAL_DOMAIN.properties.map((prop, i) => (
            <div key={prop} className="flex items-center py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]">
              <span className="font-mono text-[10px] text-muted whitespace-nowrap">
                <span className="text-blue-500">{animal.values[i].toFixed(2)}</span>
                {" × "}
                <span className="text-amber-500">{magnitude.toFixed(1)}</span>
                {" = "}
                <span className="font-semibold">{amplified[i].toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
