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

const SVG_SIZE = 350;
const PAD = 45;
const PLOT = SVG_SIZE - 2 * PAD;

function toSvgX(val: number) { return PAD + val * PLOT; }
function toSvgY(val: number) { return SVG_SIZE - PAD - val * PLOT; }

function PropTabs({ label, value, onChange }: { label: string; value: Property; onChange: (p: Property) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {PROPERTIES.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              value === p
                ? "bg-accent text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Vector2DExplorer() {
  const [xProp, setXProp] = useState<Property>("big");
  const [yProp, setYProp] = useState<Property>("scary");
  const [hovered, setHovered] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setXProp("big");
    setYProp("scary");
    setHovered(null);
  }, []);

  return (
    <WidgetContainer
      title="Vectors in 2D"
      description="Two properties place each animal as a point on a plane"
      onReset={handleReset}
    >
      <div className="mb-4 space-y-3">
        <PropTabs label="X axis" value={xProp} onChange={(p) => setXProp(p)} />
        <PropTabs label="Y axis" value={yProp} onChange={(p) => setYProp(p)} />
      </div>

      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="mx-auto w-full max-w-[400px]">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={toSvgX(t)} y1={toSvgY(0)} x2={toSvgX(t)} y2={toSvgY(1)} stroke="currentColor" strokeOpacity={0.06} />
            <line x1={toSvgX(0)} y1={toSvgY(t)} x2={toSvgX(1)} y2={toSvgY(t)} stroke="currentColor" strokeOpacity={0.06} />
            {/* X ticks */}
            <text x={toSvgX(t)} y={SVG_SIZE - PAD + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>
              {t.toFixed(2)}
            </text>
            {/* Y ticks */}
            <text x={PAD - 8} y={toSvgY(t) + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.3}>
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD} y1={toSvgY(0)} x2={PAD} y2={toSvgY(1)} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />
        <line x1={PAD} y1={toSvgY(0)} x2={toSvgX(1)} y2={toSvgY(0)} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={SVG_SIZE / 2} y={SVG_SIZE - 5} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.5} fontWeight={600}>
          {xProp.charAt(0).toUpperCase() + xProp.slice(1)}
        </text>
        <text
          x={12} y={SVG_SIZE / 2}
          textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.5} fontWeight={600}
          transform={`rotate(-90, 12, ${SVG_SIZE / 2})`}
        >
          {yProp.charAt(0).toUpperCase() + yProp.slice(1)}
        </text>

        {/* Animals */}
        {ANIMALS.map((animal) => {
          const x = toSvgX(animal[xProp]);
          const y = toSvgY(animal[yProp]);
          const isHovered = hovered === animal.name;
          return (
            <g
              key={animal.name}
              onMouseEnter={() => setHovered(animal.name)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <line x1={toSvgX(0) - x} y1={toSvgY(0) - y} x2={0} y2={0} stroke="var(--color-accent)" strokeWidth={1.5} strokeOpacity={isHovered ? 0.5 : 0.2} />
              <circle cx={0} cy={0} r={isHovered ? 7 : 5} fill="var(--color-accent)" fillOpacity={isHovered ? 1 : 0.7} />
              <text x={0} y={-10} textAnchor="middle" fontSize={16}>
                {animal.emoji}
              </text>
              {isHovered && (
                <>
                  <rect x={-28} y={8} width={56} height={16} rx={4} fill="var(--color-accent)" />
                  <text x={0} y={19} textAnchor="middle" fontSize={9} fill="white" fontWeight={600}>
                    {animal.name}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Coordinate display for hovered animal */}
      {hovered && (() => {
        const a = ANIMALS.find((a) => a.name === hovered)!;
        return (
          <div className="mt-2 text-center font-mono text-xs text-muted">
            {a.emoji} {a.name} = ({a[xProp].toFixed(2)}, {a[yProp].toFixed(2)})
          </div>
        );
      })()}
    </WidgetContainer>
  );
}
