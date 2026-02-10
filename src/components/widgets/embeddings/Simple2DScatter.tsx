"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface WordPoint {
  word: string;
  category: "animal" | "vehicle" | "instrument" | "food" | "object";
  alive: number; // x: 0 = not alive, 10 = alive
  size: number;  // y: 0 = small, 10 = big
}

const WORDS: WordPoint[] = [
  // Animals — alive and various sizes
  { word: "ant", category: "animal", alive: 9, size: 0.5 },
  { word: "mouse", category: "animal", alive: 9, size: 1.5 },
  { word: "rabbit", category: "animal", alive: 9, size: 2.5 },
  { word: "cat", category: "animal", alive: 8.5, size: 3 },
  { word: "dog", category: "animal", alive: 8.5, size: 4 },
  { word: "deer", category: "animal", alive: 9, size: 5.5 },
  { word: "horse", category: "animal", alive: 8.5, size: 7 },
  { word: "bear", category: "animal", alive: 9, size: 8 },
  { word: "elephant", category: "animal", alive: 9, size: 9.5 },
  { word: "shark", category: "animal", alive: 8, size: 7.5 },
  { word: "snake", category: "animal", alive: 8, size: 2 },
  { word: "eagle", category: "animal", alive: 9, size: 3.5 },
  // Vehicles — not alive, various sizes
  { word: "skateboard", category: "vehicle", alive: 0.5, size: 1.5 },
  { word: "bicycle", category: "vehicle", alive: 0.5, size: 3 },
  { word: "car", category: "vehicle", alive: 0.5, size: 5.5 },
  { word: "truck", category: "vehicle", alive: 0.5, size: 8 },
  { word: "airplane", category: "vehicle", alive: 0.5, size: 9 },
  { word: "boat", category: "vehicle", alive: 0.5, size: 7 },
  // Instruments — not alive, mostly small-medium
  { word: "flute", category: "instrument", alive: 0.5, size: 1 },
  { word: "violin", category: "instrument", alive: 0.5, size: 2 },
  { word: "guitar", category: "instrument", alive: 0.5, size: 3 },
  { word: "drum", category: "instrument", alive: 0.5, size: 3.5 },
  { word: "piano", category: "instrument", alive: 0.5, size: 6.5 },
  // Food — not alive, small
  { word: "grape", category: "food", alive: 1, size: 0.5 },
  { word: "apple", category: "food", alive: 1.5, size: 1.5 },
  { word: "bread", category: "food", alive: 0.5, size: 2 },
  { word: "cake", category: "food", alive: 0.5, size: 2.5 },
  { word: "pizza", category: "food", alive: 0.5, size: 2.5 },
  { word: "watermelon", category: "food", alive: 1.5, size: 3 },
  // Objects
  { word: "coin", category: "object", alive: 0.5, size: 0.3 },
  { word: "book", category: "object", alive: 0.5, size: 1.5 },
  { word: "chair", category: "object", alive: 0.5, size: 4 },
  { word: "house", category: "object", alive: 0.5, size: 9 },
  { word: "tree", category: "object", alive: 5, size: 8 },
  { word: "flower", category: "object", alive: 5, size: 1.5 },
];

const CATEGORY_COLORS: Record<string, string> = {
  animal: "#22c55e",
  vehicle: "#3b82f6",
  instrument: "#f97316",
  food: "#ef4444",
  object: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  animal: "Animals",
  vehicle: "Vehicles",
  instrument: "Instruments",
  food: "Food",
  object: "Other",
};

export function Simple2DScatter() {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 500, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDims({ width: w, height: Math.min(w * 0.75, 450) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resetState = useCallback(() => setHoveredWord(null), []);

  const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = dims.width - MARGIN.left - MARGIN.right;
  const plotH = dims.height - MARGIN.top - MARGIN.bottom;

  const xScale = (v: number) => MARGIN.left + (v / 10) * plotW;
  const yScale = (v: number) => dims.height - MARGIN.bottom - (v / 10) * plotH;

  return (
    <WidgetContainer
      title="Two Dimensions of Meaning"
      description="The same words plotted with two properties: alive (x-axis) and size (y-axis). Categories naturally cluster."
      onReset={resetState}
    >
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
            <span className="text-[10px] text-muted">{label}</span>
          </div>
        ))}
      </div>

      <div ref={containerRef}>
        <svg
          ref={svgRef}
          width={dims.width}
          height={dims.height}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <g key={v}>
              <line
                x1={xScale(v)} y1={MARGIN.top}
                x2={xScale(v)} y2={dims.height - MARGIN.bottom}
                stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.5}
              />
              <line
                x1={MARGIN.left} y1={yScale(v)}
                x2={dims.width - MARGIN.right} y2={yScale(v)}
                stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.5}
              />
            </g>
          ))}

          {/* Axes */}
          <line
            x1={MARGIN.left} y1={dims.height - MARGIN.bottom}
            x2={dims.width - MARGIN.right} y2={dims.height - MARGIN.bottom}
            stroke="var(--color-foreground)" strokeWidth={1.5} opacity={0.3}
          />
          <line
            x1={MARGIN.left} y1={MARGIN.top}
            x2={MARGIN.left} y2={dims.height - MARGIN.bottom}
            stroke="var(--color-foreground)" strokeWidth={1.5} opacity={0.3}
          />

          {/* Axis labels */}
          <text
            x={dims.width / 2}
            y={dims.height - 5}
            textAnchor="middle"
            className="fill-muted text-[11px] font-medium"
          >
            Not alive ← → Alive
          </text>
          <text
            x={12}
            y={dims.height / 2}
            textAnchor="middle"
            className="fill-muted text-[11px] font-medium"
            transform={`rotate(-90, 12, ${dims.height / 2})`}
          >
            Small ← → Big
          </text>

          {/* Data points */}
          {WORDS.map((entry) => {
            const cx = xScale(entry.alive);
            const cy = yScale(entry.size);
            const color = CATEGORY_COLORS[entry.category];
            const isHovered = hoveredWord === entry.word;
            const r = isHovered ? 6 : 4;

            return (
              <g
                key={entry.word}
                onMouseEnter={() => setHoveredWord(entry.word)}
                onMouseLeave={() => setHoveredWord(null)}
                className="cursor-default"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  stroke={isHovered ? "var(--color-foreground)" : "white"}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={hoveredWord && !isHovered ? 0.3 : 1}
                />
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  className="text-[10px] font-medium pointer-events-none select-none"
                  fill={isHovered ? "var(--color-foreground)" : color}
                  opacity={hoveredWord && !isHovered ? 0.3 : 1}
                >
                  {entry.word}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 rounded-lg bg-surface p-3 text-xs text-muted">
        Animals cluster in the top-right (alive + various sizes). Vehicles cluster on the left (not alive).
        With two dimensions, elephant separates from both mouse (different size) and truck (different aliveness).
      </div>
    </WidgetContainer>
  );
}
