"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface WordPoint {
  word: string;
  category: "animal" | "vehicle" | "instrument" | "food" | "object";
  size: number;
  dangerous: number;
}

// For the Venn preset, a separate small dataset with hand-tuned positions.
interface VennPoint {
  word: string;
  category: "animal" | "food" | "both";
  vennX: number; // 0 = pure food, 5 = both, 10 = pure animal
  vennY: number; // size: 0 = small, 10 = big
}

// For the four-category preset.
interface QuadPoint {
  word: string;
  category: "pet" | "predator" | "household" | "weapon" | "multi";
  quadX: number; // 0 = dangerous, 10 = safe
  quadY: number; // 0 = non-living, 10 = living
}

const VENN_WORDS: VennPoint[] = [
  // Pure animals — right side (x=7-9.5), various sizes
  { word: "ant",       category: "animal", vennX: 8,   vennY: 0.5 },
  { word: "cat",       category: "animal", vennX: 9,   vennY: 2.5 },
  { word: "dog",       category: "animal", vennX: 7.5, vennY: 4 },
  { word: "horse",     category: "animal", vennX: 9,   vennY: 7 },
  { word: "elephant",  category: "animal", vennX: 8,   vennY: 9.5 },

  // Pure foods — left side (x=0.5-3), various sizes
  { word: "grape",     category: "food", vennX: 1.5, vennY: 0.5 },
  { word: "apple",     category: "food", vennX: 2.5, vennY: 1.5 },
  { word: "bread",     category: "food", vennX: 1,   vennY: 3 },
  { word: "cake",      category: "food", vennX: 2,   vennY: 4 },
  { word: "pizza",     category: "food", vennX: 1.5, vennY: 5.5 },

  // Both animal AND food — middle (x=4-6), various sizes
  { word: "shrimp",    category: "both", vennX: 4.5, vennY: 1 },
  { word: "chicken",   category: "both", vennX: 5.5, vennY: 3 },
  { word: "salmon",    category: "both", vennX: 4.5, vennY: 3.5 },
  { word: "duck",      category: "both", vennX: 5.5, vennY: 4.5 },
  { word: "lamb",      category: "both", vennX: 5,   vennY: 6 },
];

const SCATTER_WORDS: WordPoint[] = [
  // Animals
  { word: "ant",       category: "animal", size: 0.5, dangerous: 0.3 },
  { word: "cat",       category: "animal", size: 3,   dangerous: 1.5 },
  { word: "dog",       category: "animal", size: 4.5, dangerous: 2.5 },
  { word: "horse",     category: "animal", size: 7,   dangerous: 2 },
  { word: "bear",      category: "animal", size: 8,   dangerous: 8.5 },
  { word: "shark",     category: "animal", size: 7.5, dangerous: 9 },
  { word: "elephant",  category: "animal", size: 9.5, dangerous: 3.5 },

  // Foods
  { word: "bread",     category: "food", size: 2,   dangerous: 0 },
  { word: "pizza",     category: "food", size: 2.5, dangerous: 0 },
  { word: "cake",      category: "food", size: 3.5, dangerous: 0 },
  { word: "apple",     category: "food", size: 1,   dangerous: 0 },

  // Vehicles
  { word: "bicycle",   category: "vehicle", size: 3,   dangerous: 1 },
  { word: "car",       category: "vehicle", size: 5.5, dangerous: 4 },
  { word: "truck",     category: "vehicle", size: 8,   dangerous: 5 },
  { word: "airplane",  category: "vehicle", size: 9.5, dangerous: 6.5 },

  // Instruments
  { word: "flute",     category: "instrument", size: 1,   dangerous: 0 },
  { word: "guitar",    category: "instrument", size: 3.5, dangerous: 0 },
  { word: "piano",     category: "instrument", size: 6.5, dangerous: 0 },

  // Objects
  { word: "knife",     category: "object", size: 1.5, dangerous: 7 },
  { word: "gun",       category: "object", size: 1.5, dangerous: 10 },
];

const QUAD_WORDS: QuadPoint[] = [
  // Pets — top-right (safe + living)
  { word: "cat",       category: "pet",      quadX: 8,   quadY: 8 },
  { word: "rabbit",    category: "pet",      quadX: 9,   quadY: 7.5 },
  { word: "goldfish",  category: "pet",      quadX: 8.5, quadY: 9 },
  { word: "hamster",   category: "pet",      quadX: 9.5, quadY: 8.5 },

  // Predators — top-left (dangerous + living)
  { word: "shark",     category: "predator", quadX: 1,   quadY: 8 },
  { word: "wolf",      category: "predator", quadX: 2,   quadY: 9 },
  { word: "snake",     category: "predator", quadX: 1.5, quadY: 7 },

  // Household objects — bottom-right (safe + non-living)
  { word: "pillow",    category: "household", quadX: 9,   quadY: 2 },
  { word: "book",      category: "household", quadX: 8,   quadY: 1.5 },
  { word: "lamp",      category: "household", quadX: 8.5, quadY: 1 },

  // Weapons — bottom-left (dangerous + non-living)
  { word: "sword",     category: "weapon",   quadX: 1.5, quadY: 2 },
  { word: "gun",       category: "weapon",   quadX: 1,   quadY: 1.5 },
  { word: "bomb",      category: "weapon",   quadX: 0.5, quadY: 1 },

  // Overlaps — pet ↔ predator (top center)
  { word: "dog",       category: "multi",    quadX: 6,   quadY: 7.5 },
  { word: "horse",     category: "multi",    quadX: 5.5, quadY: 9 },
  { word: "bee",       category: "multi",    quadX: 4,   quadY: 8 },

  // Overlaps — household ↔ weapon (bottom center)
  { word: "knife",     category: "multi",    quadX: 4.5, quadY: 2 },
  { word: "car",       category: "multi",    quadX: 5.5, quadY: 1.5 },
];

type PresetId = "size-danger" | "animal-food" | "four-categories";

interface PresetDef {
  id: PresetId;
  label: string;
  description: string;
}

const PRESETS: PresetDef[] = [
  {
    id: "size-danger",
    label: "Size \u00d7 Danger",
    description: "Two continuous properties. Bear and shark are big AND dangerous. Knife and gun are small but deadly. Most food and instruments are small and safe.",
  },
  {
    id: "animal-food",
    label: "Animal or Food?",
    description: "Chicken, salmon, and lamb are BOTH animals AND food \u2014 they sit in the overlap. Two dimensions let us represent overlapping categories, like a Venn diagram.",
  },
  {
    id: "four-categories",
    label: "Four Categories",
    description: "Two axes create four quadrants: pets, predators, household objects, and weapons. Items near the boundaries \u2014 like dogs or knives \u2014 belong to multiple categories at once.",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  animal: "#22c55e",
  vehicle: "#3b82f6",
  instrument: "#f97316",
  food: "#ef4444",
  object: "#8b5cf6",
  both: "#a855f7",
  pet: "#22c55e",
  predator: "#ef4444",
  household: "#3b82f6",
  weapon: "#f97316",
  multi: "#a855f7",
};

const CATEGORY_LABELS: Record<string, string> = {
  animal: "Animals",
  vehicle: "Vehicles",
  instrument: "Instruments",
  food: "Food",
  object: "Other",
  both: "Animal + Food",
  pet: "Pets",
  predator: "Predators",
  household: "Household",
  weapon: "Weapons",
  multi: "Multiple",
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
  const isQuad = preset.id === "four-categories";

  const resetState = useCallback(() => {
    setPresetIdx(0);
    setHoveredWord(null);
  }, []);

  const plotW = dims.width - MARGIN.left - MARGIN.right;
  const plotH = dims.height - MARGIN.top - MARGIN.bottom;

  const xScale = (v: number) => MARGIN.left + (v / 10) * plotW;
  const yScale = (v: number) => dims.height - MARGIN.bottom - (v / 10) * plotH;

  // Which categories to show in legend
  const visibleCategories = isQuad
    ? ["pet", "predator", "household", "weapon", "multi"]
    : isVenn
      ? ["animal", "food", "both"]
      : ["animal", "vehicle", "instrument", "food", "object"];

  const plotTop = MARGIN.top;
  const plotBottom = dims.height - MARGIN.bottom;

  // Build the list of data points for rendering
  const points: { word: string; cx: number; cy: number; color: string }[] = [];
  if (isQuad) {
    for (const entry of QUAD_WORDS) {
      points.push({
        word: entry.word,
        cx: xScale(entry.quadX),
        cy: yScale(entry.quadY),
        color: CATEGORY_COLORS[entry.category],
      });
    }
  } else if (isVenn) {
    for (const entry of VENN_WORDS) {
      points.push({
        word: entry.word,
        cx: xScale(entry.vennX),
        cy: yScale(entry.vennY),
        color: CATEGORY_COLORS[entry.category],
      });
    }
  } else {
    for (const entry of SCATTER_WORDS) {
      points.push({
        word: entry.word,
        cx: xScale(entry.size),
        cy: yScale(entry.dangerous),
        color: CATEGORY_COLORS[entry.category],
      });
    }
  }

  // Axis label text
  const xLabel = isQuad
    ? "Dangerous  \u2190  \u2192  Safe"
    : isVenn
      ? "Food  \u2190  \u2192  Animal"
      : "Small  \u2190  \u2192  Big";
  const yLabel = isQuad
    ? "Non\u2011living  \u2190  \u2192  Living"
    : isVenn
      ? "Small  \u2190  \u2192  Big"
      : "Safe  \u2190  \u2192  Dangerous";

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

          {/* Venn diagram: overlapping rectangles */}
          {isVenn && (
            <>
              {/* Food region: x 0 → 6.5 */}
              <rect
                x={xScale(0)} y={plotTop}
                width={xScale(6.5) - xScale(0)} height={plotBottom - plotTop}
                fill="#ef4444" fillOpacity={0.06}
                stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.4}
                rx={4}
              />
              <text
                x={xScale(1.5)}
                y={plotTop + 16}
                textAnchor="middle"
                className="text-[12px] font-semibold pointer-events-none select-none"
                fill="#ef4444" opacity={0.5}
              >
                Food
              </text>

              {/* Animal region: x 3.5 → 10 */}
              <rect
                x={xScale(3.5)} y={plotTop}
                width={xScale(10) - xScale(3.5)} height={plotBottom - plotTop}
                fill="#22c55e" fillOpacity={0.06}
                stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.4}
                rx={4}
              />
              <text
                x={xScale(8.5)}
                y={plotTop + 16}
                textAnchor="middle"
                className="text-[12px] font-semibold pointer-events-none select-none"
                fill="#22c55e" opacity={0.5}
              >
                Animals
              </text>

              {/* Overlap label */}
              <text
                x={xScale(5)}
                y={plotBottom - 6}
                textAnchor="middle"
                className="text-[10px] font-medium pointer-events-none select-none"
                fill="#a855f7" opacity={0.6}
              >
                both
              </text>
            </>
          )}

          {/* Four-category quadrant backgrounds */}
          {isQuad && (() => {
            const midX = xScale(5);
            const midY = yScale(5);
            const quadrants = [
              { x: midX, y: plotTop, w: xScale(10) - midX, h: midY - plotTop, fill: "#22c55e", label: "Pets", lx: xScale(8.5), ly: plotTop + 16 },
              { x: xScale(0), y: plotTop, w: midX - xScale(0), h: midY - plotTop, fill: "#ef4444", label: "Predators", lx: xScale(1.5), ly: plotTop + 16 },
              { x: midX, y: midY, w: xScale(10) - midX, h: plotBottom - midY, fill: "#3b82f6", label: "Household", lx: xScale(8.5), ly: plotBottom - 8 },
              { x: xScale(0), y: midY, w: midX - xScale(0), h: plotBottom - midY, fill: "#f97316", label: "Weapons", lx: xScale(1.5), ly: plotBottom - 8 },
            ];
            return (
              <>
                {quadrants.map((q) => (
                  <g key={q.label}>
                    <rect
                      x={q.x} y={q.y} width={q.w} height={q.h}
                      fill={q.fill} fillOpacity={0.06}
                      rx={0}
                    />
                    <text
                      x={q.lx} y={q.ly}
                      textAnchor="middle"
                      className="text-[12px] font-semibold pointer-events-none select-none"
                      fill={q.fill} opacity={0.5}
                    >
                      {q.label}
                    </text>
                  </g>
                ))}
                {/* Dashed center cross */}
                <line
                  x1={midX} y1={plotTop} x2={midX} y2={plotBottom}
                  stroke="var(--color-foreground)" strokeWidth={1} strokeDasharray="6,4" opacity={0.15}
                />
                <line
                  x1={xScale(0)} y1={midY} x2={xScale(10)} y2={midY}
                  stroke="var(--color-foreground)" strokeWidth={1} strokeDasharray="6,4" opacity={0.15}
                />
              </>
            );
          })()}

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
            {xLabel}
          </text>
          <text
            x={12}
            y={dims.height / 2}
            textAnchor="middle"
            className="fill-muted text-[11px] font-medium"
            transform={`rotate(-90, 12, ${dims.height / 2})`}
          >
            {yLabel}
          </text>

          {/* Data points */}
          {points.map((pt) => {
            const isHovered = hoveredWord === pt.word;
            const dimmed = hoveredWord !== null && !isHovered;
            return (
              <g
                key={pt.word}
                onMouseEnter={() => setHoveredWord(pt.word)}
                onMouseLeave={() => setHoveredWord(null)}
                className="cursor-default"
              >
                <circle cx={pt.cx} cy={pt.cy} r={12} fill="transparent" />
                <circle
                  cx={pt.cx} cy={pt.cy}
                  r={isHovered ? 6 : 5}
                  fill={pt.color}
                  stroke={isHovered ? "var(--color-foreground)" : "white"}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={dimmed ? 0.25 : 1}
                />
                <text
                  x={pt.cx} y={pt.cy - 10}
                  textAnchor="middle"
                  className={`text-[11px] pointer-events-none select-none ${isHovered ? "font-bold" : "font-medium"}`}
                  fill={isHovered ? "var(--color-foreground)" : pt.color}
                  opacity={dimmed ? 0.25 : 1}
                >
                  {pt.word}
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
