"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface WordPoint {
  word: string;
  category: "animal" | "vehicle" | "instrument" | "food" | "object" | "both";
  alive: number;
  size: number;
  dangerous: number;
  animalness: number;
  foodness: number;
}

// Fewer items with positions carefully spread to avoid label overlap.
// Each preset uses a subset of these.
const ALL_WORDS: WordPoint[] = [
  // Animals
  { word: "ant",       category: "animal", alive: 9,   size: 0.5, dangerous: 0.3, animalness: 9.5, foodness: 0.3 },
  { word: "cat",       category: "animal", alive: 8.5, size: 3,   dangerous: 1.5, animalness: 9,   foodness: 0.3 },
  { word: "dog",       category: "animal", alive: 8.5, size: 4.5, dangerous: 2.5, animalness: 9,   foodness: 0.5 },
  { word: "horse",     category: "animal", alive: 9,   size: 7,   dangerous: 2,   animalness: 9.5, foodness: 0.5 },
  { word: "bear",      category: "animal", alive: 9,   size: 8,   dangerous: 8.5, animalness: 9,   foodness: 0.5 },
  { word: "shark",     category: "animal", alive: 7.5, size: 7.5, dangerous: 9,   animalness: 9,   foodness: 1 },
  { word: "elephant",  category: "animal", alive: 9,   size: 9.5, dangerous: 3.5, animalness: 9.5, foodness: 0.3 },

  // Foods
  { word: "bread",     category: "food", alive: 0.5, size: 2,   dangerous: 0,   animalness: 0.3, foodness: 9 },
  { word: "pizza",     category: "food", alive: 0.5, size: 2.5, dangerous: 0,   animalness: 0.3, foodness: 8.5 },
  { word: "cake",      category: "food", alive: 0.5, size: 3.5, dangerous: 0,   animalness: 0.3, foodness: 9 },
  { word: "apple",     category: "food", alive: 1.5, size: 1,   dangerous: 0,   animalness: 0.3, foodness: 8 },

  // Vehicles
  { word: "bicycle",   category: "vehicle", alive: 0.5, size: 3,   dangerous: 1,   animalness: 0.3, foodness: 0.3 },
  { word: "car",       category: "vehicle", alive: 0.5, size: 5.5, dangerous: 4,   animalness: 0.3, foodness: 0.3 },
  { word: "truck",     category: "vehicle", alive: 0.5, size: 8,   dangerous: 5,   animalness: 0.3, foodness: 0.3 },
  { word: "airplane",  category: "vehicle", alive: 0.5, size: 9.5, dangerous: 6.5, animalness: 0.3, foodness: 0.3 },

  // Instruments
  { word: "flute",     category: "instrument", alive: 0.5, size: 1,   dangerous: 0, animalness: 0.3, foodness: 0.3 },
  { word: "guitar",    category: "instrument", alive: 0.5, size: 3.5, dangerous: 0, animalness: 0.3, foodness: 0.3 },
  { word: "piano",     category: "instrument", alive: 0.5, size: 6.5, dangerous: 0, animalness: 0.3, foodness: 0.3 },

  // Objects
  { word: "knife",     category: "object", alive: 0.5, size: 1.5, dangerous: 7,   animalness: 0.3, foodness: 0.3 },
  { word: "gun",       category: "object", alive: 0.5, size: 1.5, dangerous: 10,  animalness: 0.3, foodness: 0.3 },

  // Both animal AND food (only for Venn preset)
  { word: "chicken",   category: "both", alive: 7, size: 3,   dangerous: 0.5, animalness: 8,   foodness: 9 },
  { word: "salmon",    category: "both", alive: 7, size: 2.5, dangerous: 0.3, animalness: 6.5, foodness: 8 },
  { word: "lamb",      category: "both", alive: 8, size: 4.5, dangerous: 0.5, animalness: 8.5, foodness: 7 },
];

type PresetId = "alive-size" | "size-danger" | "animal-food";

interface PresetDef {
  id: PresetId;
  label: string;
  xKey: keyof WordPoint;
  yKey: keyof WordPoint;
  xLabel: string;
  yLabel: string;
  description: string;
  filter?: (w: WordPoint) => boolean;
}

const PRESETS: PresetDef[] = [
  {
    id: "alive-size",
    label: "Categories",
    xKey: "alive",
    yKey: "size",
    xLabel: "Not alive  \u2190  \u2192  Alive",
    yLabel: "Small  \u2190  \u2192  Big",
    description: "Animals cluster in the upper right (alive + various sizes). Vehicles sit on the left (not alive). With two dimensions, elephant separates from both mouse (size) and truck (aliveness).",
    filter: (w) => w.category !== "both",
  },
  {
    id: "size-danger",
    label: "Size \u00d7 Danger",
    xKey: "size",
    yKey: "dangerous",
    xLabel: "Small  \u2190  \u2192  Big",
    yLabel: "Safe  \u2190  \u2192  Dangerous",
    description: "Two continuous properties. Bear and shark are big AND dangerous. Knife and gun are small but deadly. Most food and instruments are small and safe.",
    filter: (w) => w.category !== "both",
  },
  {
    id: "animal-food",
    label: "Animal or Food?",
    xKey: "animalness",
    yKey: "foodness",
    xLabel: "Not an animal  \u2190  \u2192  Animal",
    yLabel: "Not a food  \u2190  \u2192  Food",
    description: "Chicken, salmon, and lamb are BOTH animals AND food \u2014 they appear in the overlap region. One axis per category lets us represent things that belong to two categories at once.",
    filter: (w) => w.category === "animal" || w.category === "food" || w.category === "both",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  animal: "#22c55e",
  vehicle: "#3b82f6",
  instrument: "#f97316",
  food: "#ef4444",
  object: "#8b5cf6",
  both: "#a855f7",
};

const CATEGORY_LABELS: Record<string, string> = {
  animal: "Animals",
  vehicle: "Vehicles",
  instrument: "Instruments",
  food: "Food",
  object: "Other",
  both: "Animal + Food",
};

const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function Simple2DScatter() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
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

  const preset = PRESETS[presetIdx];
  const isVenn = preset.id === "animal-food";

  const resetState = useCallback(() => {
    setPresetIdx(0);
    setHoveredWord(null);
  }, []);

  const plotW = dims.width - MARGIN.left - MARGIN.right;
  const plotH = dims.height - MARGIN.top - MARGIN.bottom;

  const xScale = (v: number) => MARGIN.left + (v / 10) * plotW;
  const yScale = (v: number) => dims.height - MARGIN.bottom - (v / 10) * plotH;

  // For Venn diagram, compute ellipse positions
  const vennCenters = useMemo(() => {
    if (!isVenn) return null;
    const xs = (v: number) => MARGIN.left + (v / 10) * plotW;
    const ys = (v: number) => dims.height - MARGIN.bottom - (v / 10) * plotH;
    return {
      animal: { cx: xs(7), cy: ys(3), rx: plotW * 0.3, ry: plotH * 0.38 },
      food: { cx: xs(3), cy: ys(7), rx: plotW * 0.3, ry: plotH * 0.38 },
    };
  }, [isVenn, plotW, plotH, dims.height]);

  const visibleWords = useMemo(() => {
    const filter = preset.filter ?? (() => true);
    return ALL_WORDS.filter(filter);
  }, [preset]);

  // Which categories to show in legend
  const visibleCategories = useMemo(() => {
    const cats = new Set(visibleWords.map((w) => w.category));
    return Array.from(cats);
  }, [visibleWords]);

  return (
    <WidgetContainer
      title="Two Dimensions of Meaning"
      description="Plot words using two properties at once. Toggle between views to see different ways two dimensions organize meaning."
      onReset={resetState}
    >
      {/* Preset buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setPresetIdx(i); setHoveredWord(null); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              i === presetIdx
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-3">
        {visibleCategories.map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
            <span className="text-[10px] text-muted">{CATEGORY_LABELS[cat]}</span>
          </div>
        ))}
      </div>

      <div ref={containerRef}>
        <svg
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
                stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.4}
              />
              <line
                x1={MARGIN.left} y1={yScale(v)}
                x2={dims.width - MARGIN.right} y2={yScale(v)}
                stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.4}
              />
            </g>
          ))}

          {/* Venn diagram ellipses */}
          {vennCenters && (
            <>
              <ellipse
                cx={vennCenters.animal.cx} cy={vennCenters.animal.cy}
                rx={vennCenters.animal.rx} ry={vennCenters.animal.ry}
                fill="#22c55e" fillOpacity={0.07}
                stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.5}
              />
              <text
                x={vennCenters.animal.cx + vennCenters.animal.rx * 0.5}
                y={vennCenters.animal.cy + vennCenters.animal.ry * 0.85}
                textAnchor="middle"
                className="text-[12px] font-medium pointer-events-none select-none"
                fill="#22c55e" opacity={0.6}
              >
                Animals
              </text>
              <ellipse
                cx={vennCenters.food.cx} cy={vennCenters.food.cy}
                rx={vennCenters.food.rx} ry={vennCenters.food.ry}
                fill="#ef4444" fillOpacity={0.07}
                stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.5}
              />
              <text
                x={vennCenters.food.cx - vennCenters.food.rx * 0.5}
                y={vennCenters.food.cy - vennCenters.food.ry * 0.85}
                textAnchor="middle"
                className="text-[12px] font-medium pointer-events-none select-none"
                fill="#ef4444" opacity={0.6}
              >
                Food
              </text>
            </>
          )}

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
            {preset.xLabel}
          </text>
          <text
            x={12}
            y={dims.height / 2}
            textAnchor="middle"
            className="fill-muted text-[11px] font-medium"
            transform={`rotate(-90, 12, ${dims.height / 2})`}
          >
            {preset.yLabel}
          </text>

          {/* Data points */}
          {visibleWords.map((entry) => {
            const cx = xScale(entry[preset.xKey] as number);
            const cy = yScale(entry[preset.yKey] as number);
            const color = CATEGORY_COLORS[entry.category];
            const isHovered = hoveredWord === entry.word;
            const dimmed = hoveredWord !== null && !isHovered;

            return (
              <g
                key={entry.word}
                onMouseEnter={() => setHoveredWord(entry.word)}
                onMouseLeave={() => setHoveredWord(null)}
                className="cursor-default"
              >
                {/* Invisible hit target */}
                <circle cx={cx} cy={cy} r={12} fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 5}
                  fill={color}
                  stroke={isHovered ? "var(--color-foreground)" : "white"}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={dimmed ? 0.25 : 1}
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  className={`text-[11px] pointer-events-none select-none ${isHovered ? "font-bold" : "font-medium"}`}
                  fill={isHovered ? "var(--color-foreground)" : color}
                  opacity={dimmed ? 0.25 : 1}
                >
                  {entry.word}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 rounded-lg bg-surface p-3 text-xs text-muted">
        {preset.description}
      </div>
    </WidgetContainer>
  );
}
