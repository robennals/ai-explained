"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

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

// For the four-category presets — positions are hand-tuned.
interface QuadPoint {
  word: string;
  category: "wild" | "water" | "land" | "domestic" | "multi" | "animal" | "building" | "planet" | "instrument";
  quadX: number;
  quadY: number;
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

// Four overlapping rectangles for animal categories.
// Layout:
//   Wild (TL)     |  Water (TR)       Overlap zones (2 rects only):
//   x: 0→6.5      |  x: 3.5→10        Wild∩Water:    x 3.5→6.5, y 6.5→10  (top center)
//   y: 3.5→10     |  y: 3.5→10        Wild∩Land:     x 0→3.5,   y 3.5→6.5 (left center)
//   ───────────────+──────────────     Water∩Domestic: x 6.5→10,  y 3.5→6.5 (right center)
//   Land (BL)     |  Domestic (BR)     Land∩Domestic:  x 3.5→6.5, y 0→3.5   (bottom center)
//   x: 0→6.5      |  x: 3.5→10        All four:       x 3.5→6.5, y 3.5→6.5 (center)
//   y: 0→6.5      |  y: 0→6.5
const QUAD_WORDS: QuadPoint[] = [
  // Wild ↔ Water overlap (top center) — ocean wildlife
  { word: "shark",     category: "multi",    quadX: 5,   quadY: 8.5 },
  { word: "whale",     category: "multi",    quadX: 4.5, quadY: 9.5 },
  { word: "jellyfish", category: "multi",    quadX: 5.5, quadY: 9.5 },
  { word: "seahorse",  category: "multi",    quadX: 6,   quadY: 8 },

  // Wild ↔ Land overlap (left center) — land wildlife
  { word: "wolf",      category: "multi",    quadX: 1.5, quadY: 5.5 },
  { word: "deer",      category: "multi",    quadX: 2.5, quadY: 5 },
  { word: "bear",      category: "multi",    quadX: 1.5, quadY: 4.5 },
  { word: "ant",       category: "multi",    quadX: 2.5, quadY: 6 },
  { word: "mole",      category: "multi",    quadX: 1,   quadY: 5 },

  // Water ↔ Domestic overlap (right center) — pet fish
  { word: "goldfish",  category: "multi",    quadX: 8,   quadY: 5 },

  // Land ↔ Domestic overlap (bottom center) — pets / farm animals
  { word: "cow",       category: "multi",    quadX: 5,   quadY: 2 },
  { word: "chicken",   category: "multi",    quadX: 5.5, quadY: 1 },
  { word: "cat",       category: "multi",    quadX: 4.5, quadY: 2.5 },
  { word: "hamster",   category: "multi",    quadX: 6,   quadY: 1.5 },
  { word: "rabbit",    category: "multi",    quadX: 5,   quadY: 0.5 },

  // Center — animals genuinely spanning all four categories
  { word: "frog",      category: "multi",    quadX: 4.5, quadY: 5.5 },
  { word: "duck",      category: "multi",    quadX: 5.5, quadY: 5 },
  { word: "turtle",    category: "multi",    quadX: 5,   quadY: 4.5 },
];

// Four clearly distinct, non-overlapping categories in separate quadrants.
// Each quadrant uses its own pair of meaningful axes so the positions aren't arbitrary.
//
// Animals (top-left):     x = slow→fast,     y = small→big
// Buildings (top-right):  x = old→modern,    y = short→tall
// Planets (bottom-left):  x = near→far,      y = small→big
// Instruments (bot-right): x = low→high pitch, y = small→big
//
// Within each quadrant the raw property values are mapped to the quadrant's
// 0–4.5 range, then offset to the right quadrant region.

const DISTINCT_WORDS: QuadPoint[] = [
  // Points are kept inside the axis region (well clear of quadrant edges and labels).
  // Top-left quadrant safe zone:  x 1.2–3.8,  y 6.2–8.8
  // Top-right quadrant safe zone: x 6.2–8.8,  y 6.2–8.8
  // Bot-left quadrant safe zone:  x 1.2–3.8,  y 1.2–3.8
  // Bot-right quadrant safe zone: x 6.2–8.8,  y 1.2–3.8

  // Animals (top-left): slow→fast, small→big
  { word: "ant",       category: "animal",     quadX: 1.3, quadY: 6.3 },
  { word: "cat",       category: "animal",     quadX: 2.2, quadY: 6.8 },
  { word: "dog",       category: "animal",     quadX: 2.8, quadY: 7.3 },
  { word: "horse",     category: "animal",     quadX: 3.7, quadY: 8.0 },
  { word: "elephant",  category: "animal",     quadX: 1.6, quadY: 8.7 },

  // Buildings (top-right): old→modern, short→tall
  { word: "barn",       category: "building",  quadX: 6.4, quadY: 6.3 },
  { word: "church",     category: "building",  quadX: 6.8, quadY: 7.4 },
  { word: "lighthouse", category: "building",  quadX: 7.4, quadY: 7.0 },
  { word: "house",      category: "building",  quadX: 8.0, quadY: 6.7 },
  { word: "skyscraper", category: "building",  quadX: 8.6, quadY: 8.7 },

  // Planets (bottom-left): near→far, small→big
  { word: "mercury",   category: "planet",     quadX: 1.3, quadY: 1.3 },
  { word: "venus",     category: "planet",     quadX: 1.8, quadY: 1.8 },
  { word: "mars",      category: "planet",     quadX: 2.3, quadY: 1.5 },
  { word: "saturn",    category: "planet",     quadX: 3.4, quadY: 3.2 },
  { word: "jupiter",   category: "planet",     quadX: 2.9, quadY: 3.7 },

  // Instruments (bottom-right): low→high pitch, small→big
  { word: "flute",     category: "instrument", quadX: 8.6, quadY: 1.3 },
  { word: "violin",    category: "instrument", quadX: 7.8, quadY: 1.8 },
  { word: "guitar",    category: "instrument", quadX: 7.2, quadY: 2.6 },
  { word: "drum",      category: "instrument", quadX: 6.5, quadY: 2.0 },
  { word: "piano",     category: "instrument", quadX: 6.4, quadY: 3.6 },
];

// Per-quadrant axis labels for the "four distinct" preset
const DISTINCT_AXES: {
  label: string;
  fill: string;
  xLabel: [string, string]; // [low end, high end]
  yLabel: [string, string]; // [low end, high end]
  // quadrant bounds in data space
  x1: number; x2: number; y1: number; y2: number;
}[] = [
  { label: "Animals",     fill: "#22c55e", xLabel: ["slow", "fast"],   yLabel: ["small", "big"],  x1: 0, x2: 5, y1: 5, y2: 10 },
  { label: "Buildings",   fill: "#3b82f6", xLabel: ["old", "modern"],  yLabel: ["short", "tall"], x1: 5, x2: 10, y1: 5, y2: 10 },
  { label: "Planets",     fill: "#8b5cf6", xLabel: ["near", "far"],    yLabel: ["small", "big"],  x1: 0, x2: 5, y1: 0, y2: 5 },
  { label: "Instruments", fill: "#f97316", xLabel: ["low", "high"],    yLabel: ["small", "big"],  x1: 5, x2: 10, y1: 0, y2: 5 },
];

type PresetId = "animal-food" | "four-distinct" | "four-overlap";

interface PresetDef {
  id: PresetId;
  label: string;
  description: string;
}

const PRESETS: PresetDef[] = [
  {
    id: "animal-food",
    label: "Animal or Food?",
    description: "Chicken, salmon, and lamb are BOTH animals AND food \u2014 they sit in the overlap. Two dimensions let us represent overlapping categories, like a Venn diagram.",
  },
  {
    id: "four-distinct",
    label: "Four Distinct Categories",
    description: "Each quadrant uses the same two numbers for completely different axes \u2014 size and speed for animals, height and age for buildings, and so on. The category determines what the dimensions mean, just like how regions of the number line meant different things in the previous widget.",
  },
  {
    id: "four-overlap",
    label: "Four Overlapping Categories",
    description: "Four overlapping regions for wild, water, land, and domestic animals. Where regions overlap, animals belong to multiple categories \u2014 a shark is both wild and aquatic, a goldfish is both aquatic and domestic. But even two dimensions isn\u2019t enough \u2014 a bear is wild and lives on land, but this layout puts it right next to a mole. You\u2019d need more dimensions to tell them apart.",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  animal: "#22c55e",
  vehicle: "#3b82f6",
  instrument: "#f97316",
  food: "#ef4444",
  object: "#8b5cf6",
  both: "#a855f7",
  wild: "#ef4444",
  water: "#3b82f6",
  land: "#22c55e",
  domestic: "#f97316",
  multi: "#a855f7",
  building: "#3b82f6",
  planet: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  animal: "Animals",
  vehicle: "Vehicles",
  instrument: "Instruments",
  food: "Food",
  object: "Other",
  both: "Animal + Food",
  wild: "Wild",
  water: "Water",
  land: "Land",
  domestic: "Domestic",
  multi: "Multiple",
  building: "Buildings",
  planet: "Planets",
};

const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function Simple2DScatter() {
  const [activePreset, setActivePreset] = useState<PresetId>("animal-food");
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

  const preset = PRESETS.find((p) => p.id === activePreset) ?? PRESETS[0];

  const tabs = useMemo(
    () => PRESETS.map((p) => ({ id: p.id, label: p.label })),
    [],
  );
  const isVenn = preset.id === "animal-food";
  const isQuad = preset.id === "four-overlap";
  const isDistinct = preset.id === "four-distinct";
  const isQuadLike = isQuad || isDistinct;

  const resetState = useCallback(() => {
    setActivePreset("animal-food");
    setHoveredWord(null);
  }, []);

  const plotW = dims.width - MARGIN.left - MARGIN.right;
  const plotH = dims.height - MARGIN.top - MARGIN.bottom;

  const xScale = (v: number) => MARGIN.left + (v / 10) * plotW;
  const yScale = (v: number) => dims.height - MARGIN.bottom - (v / 10) * plotH;

  // Which categories to show in legend
  const visibleCategories = isDistinct
    ? ["animal", "building", "planet", "instrument"]
    : isQuad
    ? ["multi"]
    : isVenn
      ? ["animal", "food", "both"]
      : ["animal", "vehicle", "instrument", "food", "object"];

  const plotTop = MARGIN.top;
  const plotBottom = dims.height - MARGIN.bottom;

  // Build the list of data points for rendering
  const points: { word: string; cx: number; cy: number; color: string }[] = [];
  if (isDistinct) {
    for (const entry of DISTINCT_WORDS) {
      points.push({
        word: entry.word,
        cx: xScale(entry.quadX),
        cy: yScale(entry.quadY),
        color: CATEGORY_COLORS[entry.category],
      });
    }
  } else if (isQuad) {
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

  return (
    <WidgetContainer
      title="Two Dimensions of Meaning"
      description="Plot words using two properties at once. Toggle between views to see different ways two dimensions organize meaning."
      onReset={resetState}
    >
      <WidgetTabs tabs={tabs} activeTab={activePreset} onTabChange={(id) => { setActivePreset(id); setHoveredWord(null); }} />

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
          {/* Arrowhead marker for per-quadrant axes */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            </marker>
          </defs>

          {/* Grid lines (scatter and venn only) */}
          {!isQuadLike && [0, 2, 4, 6, 8, 10].map((v) => (
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

          {/* Venn diagram: two overlapping rectangles */}
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

          {/* Four distinct categories: quadrants with per-category axes */}
          {isDistinct && (() => {
            return (
              <>
                {DISTINCT_AXES.map((q) => {
                  const sx = xScale(q.x1);
                  const sy = yScale(q.y2);
                  const sw = xScale(q.x2) - xScale(q.x1);
                  const sh = yScale(q.y1) - yScale(q.y2);
                  const cx = (xScale(q.x1) + xScale(q.x2)) / 2;
                  const cy = (yScale(q.y1) + yScale(q.y2)) / 2;
                  // axis arrow insets — push well inside the quadrant so
                  // labels don't overlap the dashed border lines
                  const inset = 28;
                  const axLeft = sx + inset;
                  const axRight = sx + sw - inset;
                  const axBottom = sy + sh - inset;
                  const axTop = sy + inset;
                  return (
                    <g key={q.label}>
                      {/* Background */}
                      <rect
                        x={sx} y={sy} width={sw} height={sh}
                        fill={q.fill} fillOpacity={0.06}
                        stroke={q.fill} strokeWidth={1.5} strokeDasharray="6,4" opacity={0.35}
                        rx={4}
                      />
                      {/* Category label */}
                      <text
                        x={cx} y={sy + 14}
                        textAnchor="middle"
                        className="text-[11px] font-semibold pointer-events-none select-none"
                        fill={q.fill} opacity={0.6}
                      >
                        {q.label}
                      </text>
                      {/* X-axis: small arrow along the bottom */}
                      <line
                        x1={axLeft} y1={axBottom}
                        x2={axRight} y2={axBottom}
                        stroke={q.fill} strokeWidth={1} opacity={0.3}
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={axLeft + 2} y={axBottom + 11}
                        className="text-[8px] pointer-events-none select-none"
                        fill={q.fill} opacity={0.5}
                      >
                        {q.xLabel[0]}
                      </text>
                      <text
                        x={axRight - 2} y={axBottom + 11}
                        textAnchor="end"
                        className="text-[8px] pointer-events-none select-none"
                        fill={q.fill} opacity={0.5}
                      >
                        {q.xLabel[1]}
                      </text>
                      {/* Y-axis: small arrow along the left */}
                      <line
                        x1={axLeft} y1={axBottom}
                        x2={axLeft} y2={axTop}
                        stroke={q.fill} strokeWidth={1} opacity={0.3}
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={axLeft - 3} y={axBottom - 2}
                        textAnchor="end"
                        className="text-[8px] pointer-events-none select-none"
                        fill={q.fill} opacity={0.5}
                      >
                        {q.yLabel[0]}
                      </text>
                      <text
                        x={axLeft - 3} y={axTop + 4}
                        textAnchor="end"
                        className="text-[8px] pointer-events-none select-none"
                        fill={q.fill} opacity={0.5}
                      >
                        {q.yLabel[1]}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}

          {/* Four-category: four overlapping rectangles */}
          {isQuad && (() => {
            // Each rectangle covers ~65% of each axis, creating overlap where they intersect.
            const rects = [
              { x1: 0, y1: 3.5, x2: 6.5, y2: 10,  fill: "#ef4444", label: "Wild",     lx: 1.5, ly: 9.5 },
              { x1: 3.5, y1: 3.5, x2: 10, y2: 10,  fill: "#3b82f6", label: "Water",    lx: 8.5, ly: 9.5 },
              { x1: 0, y1: 0, x2: 6.5, y2: 6.5,    fill: "#22c55e", label: "Land",     lx: 1.5, ly: 0.5 },
              { x1: 3.5, y1: 0, x2: 10, y2: 6.5,   fill: "#f97316", label: "Domestic", lx: 8.5, ly: 0.5 },
            ];
            return (
              <>
                {rects.map((r) => {
                  const sx = xScale(r.x1);
                  const sy = yScale(r.y2); // higher y value = top in SVG
                  const sw = xScale(r.x2) - xScale(r.x1);
                  const sh = yScale(r.y1) - yScale(r.y2);
                  const labelY = yScale(r.ly);
                  return (
                    <g key={r.label}>
                      <rect
                        x={sx} y={sy} width={sw} height={sh}
                        fill={r.fill} fillOpacity={0.06}
                        stroke={r.fill} strokeWidth={1.5} strokeDasharray="6,4" opacity={0.35}
                        rx={4}
                      />
                      <text
                        x={xScale(r.lx)}
                        y={labelY}
                        textAnchor="middle"
                        className="text-[12px] font-semibold pointer-events-none select-none"
                        fill={r.fill} opacity={0.5}
                      >
                        {r.label}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}

          {/* Axes (scatter and venn only) */}
          {!isQuadLike && (
            <>
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
                {isVenn ? "Food  \u2190  \u2192  Animal" : "Small  \u2190  \u2192  Big"}
              </text>
              <text
                x={12}
                y={dims.height / 2}
                textAnchor="middle"
                className="fill-muted text-[11px] font-medium"
                transform={`rotate(-90, 12, ${dims.height / 2})`}
              >
                {isVenn ? "Small  \u2190  \u2192  Big" : "Safe  \u2190  \u2192  Dangerous"}
              </text>
            </>
          )}

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
