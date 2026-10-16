"use client";

// Pieces shared by the neuron playgrounds' phone layout, where the sliders sit
// in a panel under a compact diagram.

/** A weight or bias value drawn as a small chip on the diagram (phones).
 * Tapping it selects the matching slider; it's highlighted while selected. */
export function ValueChip({
  x,
  y,
  text,
  label,
  active,
  onSelect,
}: {
  x: number;
  y: number;
  text: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  const w = text.length * 8 + 10;
  return (
    <g className="cursor-pointer select-none" role="button" aria-label={`Adjust ${label}`} onClick={onSelect}>
      {/* Taller invisible tap area than the 20-unit chip. */}
      <rect x={x - w / 2 - 4} y={y - 18} width={w + 8} height={36} fill="transparent" />
      <rect
        x={x - w / 2}
        y={y - 10}
        width={w}
        height={20}
        rx={10}
        fill={active ? "#dbeafe" : "white"}
        stroke={active ? "#3b82f6" : "#d1d5db"}
        strokeWidth={active ? 2 : 1}
      />
      <text x={x} y={y + 4.5} textAnchor="middle" className="fill-foreground text-[13px] font-bold font-mono pointer-events-none">
        {text}
      </text>
    </g>
  );
}

/** The five things the reader can adjust in a single-neuron playground. */
export type NeuronParam = "inputA" | "inputB" | "w1" | "w2" | "bias";
