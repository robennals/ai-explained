"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const PROPERTIES = ["big", "scary", "hairy", "cuddly", "fast", "fat"] as const;
type Property = (typeof PROPERTIES)[number];

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

const SVG_W = 600;
const SVG_H = 80;
const PAD_L = 30;
const PAD_R = 30;
const LINE_Y = 45;
const PLOT_W = SVG_W - PAD_L - PAD_R;

export function Vector1DExplorer() {
  const [prop, setProp] = useState<Property>("big");

  const handleReset = useCallback(() => setProp("big"), []);

  // Sort animals by current property to stagger labels
  const sorted = [...ANIMALS].sort((a, b) => a[prop] - b[prop]);

  return (
    <WidgetContainer
      title="Vectors in 1D"
      description="Each animal placed on a number line by a single property"
      onReset={handleReset}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {PROPERTIES.map((p) => (
          <button
            key={p}
            onClick={() => setProp(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              prop === p
                ? "bg-accent text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
        {/* Axis line */}
        <line x1={PAD_L} y1={LINE_Y} x2={SVG_W - PAD_R} y2={LINE_Y} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1.5} />
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const x = PAD_L + t * PLOT_W;
          return (
            <g key={t}>
              <line x1={x} y1={LINE_Y - 4} x2={x} y2={LINE_Y + 4} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />
              <text x={x} y={LINE_Y + 16} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.35}>
                {t.toFixed(2)}
              </text>
            </g>
          );
        })}
        {/* Axis label */}
        <text x={SVG_W / 2} y={LINE_Y + 28} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.5} fontWeight={600}>
          {prop.charAt(0).toUpperCase() + prop.slice(1)}
        </text>

        {/* Animals */}
        {sorted.map((animal) => {
          const val = animal[prop];
          const x = PAD_L + val * PLOT_W;
          return (
            <g key={animal.name} style={{ transform: `translateX(${x}px)` }}>
              {/* Dot on line */}
              <circle cx={0} cy={LINE_Y} r={4} fill="var(--color-accent)" />
              {/* Emoji label above */}
              <text x={0} y={LINE_Y - 12} textAnchor="middle" fontSize={16}>
                {animal.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-xs text-muted">
        With one dimension, animals that differ in other ways end up right next to each other.
        Try switching properties to see how the ordering changes completely.
      </p>
    </WidgetContainer>
  );
}
