"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface Animal {
  name: string;
  emoji: string;
  big: number;
  scary: number;
  hairy: number;
  cuddly: number;
  fast: number;
  fat: number;
}

const PROPERTIES = ["big", "scary", "hairy", "cuddly", "fast", "fat"] as const;
type Property = (typeof PROPERTIES)[number];

const ANIMALS: Animal[] = [
  { name: "Bear",     emoji: "🐻", big: 0.85, scary: 0.90, hairy: 0.80, cuddly: 0.75, fast: 0.50, fat: 0.70 },
  { name: "Rabbit",   emoji: "🐰", big: 0.10, scary: 0.05, hairy: 0.70, cuddly: 0.95, fast: 0.60, fat: 0.20 },
  { name: "Shark",    emoji: "🦈", big: 0.75, scary: 0.95, hairy: 0.00, cuddly: 0.02, fast: 0.70, fat: 0.30 },
  { name: "Mouse",    emoji: "🐭", big: 0.05, scary: 0.10, hairy: 0.40, cuddly: 0.60, fast: 0.50, fat: 0.15 },
  { name: "Eagle",    emoji: "🦅", big: 0.40, scary: 0.50, hairy: 0.10, cuddly: 0.05, fast: 0.95, fat: 0.10 },
  { name: "Elephant", emoji: "🐘", big: 0.98, scary: 0.40, hairy: 0.10, cuddly: 0.35, fast: 0.30, fat: 0.85 },
  { name: "Snake",    emoji: "🐍", big: 0.30, scary: 0.80, hairy: 0.00, cuddly: 0.05, fast: 0.40, fat: 0.10 },
  { name: "Cat",      emoji: "🐱", big: 0.15, scary: 0.15, hairy: 0.70, cuddly: 0.85, fast: 0.65, fat: 0.30 },
  { name: "Dog",      emoji: "🐕", big: 0.40, scary: 0.25, hairy: 0.65, cuddly: 0.90, fast: 0.60, fat: 0.40 },
];

function PropBar({ value, highlight }: { value: number; highlight?: "match" | "diff" | "none" }) {
  const bg =
    highlight === "match" ? "bg-green-400" : highlight === "diff" ? "bg-red-400" : "bg-accent";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2.5 w-16 rounded-full bg-foreground/5">
        <div
          className={`h-2.5 rounded-full transition-all duration-200 ${bg}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[10px] text-muted">{value.toFixed(2)}</span>
    </div>
  );
}

function distance(a: Animal, b: Animal): number {
  let sum = 0;
  for (const p of PROPERTIES) {
    const d = a[p] - b[p];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** A column that fades in on mount via CSS animation. */
function AnimalColumn({
  animal,
  highlight,
}: {
  animal: Animal;
  highlight?: (prop: Property) => "match" | "diff" | "none";
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Trigger fade-in on next frame
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="min-w-[120px] transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="py-1.5 px-3 text-left text-xs font-medium text-muted border-b border-foreground/10">
        {animal.emoji} {animal.name}
      </div>
      {PROPERTIES.map((prop) => (
        <div key={prop} className="py-1.5 px-3 border-b border-foreground/5">
          <PropBar
            value={animal[prop]}
            highlight={highlight ? highlight(prop) : "none"}
          />
        </div>
      ))}
    </div>
  );
}

export function AnimalPropertyExplorer() {
  const [selected, setSelected] = useState<[number, number | null]>([0, null]);

  const handleReset = useCallback(() => {
    setSelected([0, null]);
  }, []);

  const handleClick = useCallback(
    (idx: number) => {
      setSelected(([a, b]) => {
        if (b === null) {
          return idx === a ? [a, null] : [a, idx];
        }
        if (idx === a || idx === b) return [a, b];
        return [b, idx];
      });
    },
    []
  );

  const [selA, selB] = selected;
  const animalA = ANIMALS[selA];
  const animalB = selB !== null ? ANIMALS[selB] : null;

  const dist = useMemo(
    () => (animalB ? distance(animalA, animalB) : null),
    [animalA, animalB]
  );

  function getHighlight(prop: Property): "match" | "diff" | "none" {
    if (!animalB) return "none";
    const diff = Math.abs(animalA[prop] - animalB[prop]);
    return diff < 0.2 ? "match" : "diff";
  }

  return (
    <WidgetContainer
      title="Animals as Vectors"
      description="Each animal is described by a list of numbers — a vector"
      onReset={handleReset}
    >
      {/* Animal selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ANIMALS.map((a, i) => {
          const isSel = i === selA || i === selB;
          return (
            <button
              key={a.name}
              onClick={() => handleClick(i)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isSel
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-foreground hover:bg-foreground/10"
              }`}
            >
              <span>{a.emoji}</span>
              <span>{a.name}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-muted">
        {animalB
          ? "Comparing two animals. Green bars are similar, red bars are different."
          : "Click a second animal to compare their vectors."}
      </p>

      {/* Comparison — using keys so React creates fresh columns on swap */}
      <div className="overflow-x-auto">
        <div className="flex">
          {/* Property labels column */}
          <div className="shrink-0">
            <div className="py-1.5 pr-3 text-left text-xs font-medium text-muted border-b border-foreground/10">
              Property
            </div>
            {PROPERTIES.map((prop) => (
              <div key={prop} className="py-1.5 pr-3 text-xs font-medium capitalize text-foreground border-b border-foreground/5">
                {prop}
              </div>
            ))}
          </div>

          {/* Animal A column — keyed by animal name */}
          <AnimalColumn
            key={`a-${animalA.name}`}
            animal={animalA}
            highlight={animalB ? getHighlight : undefined}
          />

          {/* Animal B column — keyed by animal name, so swaps create a fresh element */}
          {animalB && (
            <AnimalColumn
              key={`b-${animalB.name}`}
              animal={animalB}
              highlight={getHighlight}
            />
          )}
        </div>
      </div>

      {/* Vector notation */}
      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-foreground/[0.03] p-3">
          <span className="font-mono text-xs">
            {animalA.emoji} = ({PROPERTIES.map((p) => animalA[p].toFixed(2)).join(", ")})
          </span>
        </div>
        {animalB && (
          <>
            <div className="rounded-lg bg-foreground/[0.03] p-3">
              <span className="font-mono text-xs">
                {animalB.emoji} = ({PROPERTIES.map((p) => animalB[p].toFixed(2)).join(", ")})
              </span>
            </div>
            <div className="rounded-lg bg-accent/10 p-3 text-xs">
              <span className="font-medium text-accent">Distance: {dist!.toFixed(3)}</span>
              <span className="ml-2 text-muted">
                ({dist! < 0.5 ? "very similar" : dist! < 1.0 ? "somewhat similar" : "quite different"})
              </span>
            </div>
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
