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
  { name: "Bear",     emoji: "🐻", big: 0.90, scary: 0.85, hairy: 0.80, cuddly: 0.50, fast: 0.40, fat: 0.75 },
  { name: "Rabbit",   emoji: "🐰", big: 0.10, scary: 0.02, hairy: 0.60, cuddly: 0.95, fast: 0.70, fat: 0.15 },
  { name: "Shark",    emoji: "🦈", big: 0.80, scary: 0.95, hairy: 0.00, cuddly: 0.00, fast: 0.75, fat: 0.20 },
  { name: "Mouse",    emoji: "🐭", big: 0.02, scary: 0.05, hairy: 0.30, cuddly: 0.40, fast: 0.60, fat: 0.10 },
  { name: "Eagle",    emoji: "🦅", big: 0.35, scary: 0.60, hairy: 0.05, cuddly: 0.02, fast: 0.95, fat: 0.05 },
  { name: "Elephant", emoji: "🐘", big: 0.98, scary: 0.30, hairy: 0.05, cuddly: 0.40, fast: 0.15, fat: 0.95 },
  { name: "Snake",    emoji: "🐍", big: 0.20, scary: 0.85, hairy: 0.00, cuddly: 0.02, fast: 0.50, fat: 0.05 },
  { name: "Cat",      emoji: "🐱", big: 0.15, scary: 0.30, hairy: 0.75, cuddly: 0.85, fast: 0.70, fat: 0.25 },
  { name: "Dog",      emoji: "🐕", big: 0.45, scary: 0.20, hairy: 0.70, cuddly: 0.90, fast: 0.55, fat: 0.45 },
];

const SVG_W = 600;
const PAD_L = 30;
const PAD_R = 30;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const EMOJI_SIZE = 16;
const MIN_SPACING = 18; // minimum px between emoji centers before stacking
const ROW_HEIGHT = 24; // vertical spacing between stacked rows

export function Vector1DExplorer() {
  const [prop, setProp] = useState<Property>("big");

  const handleReset = useCallback(() => setProp("big"), []);

  // Sort animals by current property value, assign vertical rows to avoid overlap
  const sorted = [...ANIMALS]
    .map((a) => ({ ...a, x: PAD_L + a[prop] * PLOT_W }))
    .sort((a, b) => a.x - b.x);

  // Greedily assign rows: place each animal in the lowest row where it doesn't overlap
  const rows: number[] = []; // x position of the rightmost edge in each row
  const animalRows: { animal: (typeof sorted)[number]; row: number }[] = [];
  for (const a of sorted) {
    let placed = false;
    for (let r = 0; r < rows.length; r++) {
      if (a.x - rows[r] >= MIN_SPACING) {
        rows[r] = a.x;
        animalRows.push({ animal: a, row: r });
        placed = true;
        break;
      }
    }
    if (!placed) {
      animalRows.push({ animal: a, row: rows.length });
      rows.push(a.x);
    }
  }

  const maxRow = Math.max(0, ...animalRows.map((a) => a.row));
  const LINE_Y = 30 + maxRow * ROW_HEIGHT + EMOJI_SIZE + 12;
  const SVG_H = LINE_Y + 32;

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
        {animalRows.map(({ animal, row }) => {
          const emojiY = LINE_Y - 16 - row * ROW_HEIGHT;
          return (
            <g key={animal.name}>
              {/* Dashed line from emoji down to axis */}
              <line x1={animal.x} y1={emojiY + 4} x2={animal.x} y2={LINE_Y} stroke="var(--color-accent)" strokeWidth={1} strokeOpacity={0.25} strokeDasharray="2 2" />
              {/* Dot on line */}
              <circle cx={animal.x} cy={LINE_Y} r={3.5} fill="var(--color-accent)" />
              {/* Emoji */}
              <text x={animal.x} y={emojiY} textAnchor="middle" fontSize={EMOJI_SIZE}>
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
