"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

// Hand-crafted word data.
// "size" uses log10 of approximate real-world length in cm:
//   ant ~0.2cm (log=-0.7), grape ~2cm (0.3), apple ~8cm (0.9), cat ~45cm (1.65),
//   car ~450cm (2.65), airplane ~3500cm (3.54)
// This gives a natural spread where relative positions match intuition.

interface WordEntry {
  word: string;
  size: number;       // log10(length in cm) — maps roughly -0.7 to 3.5
  alive: number;      // 0-10 scale
  dangerous: number;  // 0-10 scale
}

const WORDS: WordEntry[] = [
  // Animals (alive, various sizes and danger levels)
  { word: "ant",       size: -0.7,  alive: 9.5, dangerous: 0.5 },
  { word: "bee",       size: 0.15,  alive: 9.5, dangerous: 2.5 },
  { word: "mouse",     size: 0.9,   alive: 9.5, dangerous: 0.3 },
  { word: "rabbit",    size: 1.6,   alive: 9.5, dangerous: 0.3 },
  { word: "cat",       size: 1.65,  alive: 9.5, dangerous: 1.5 },
  { word: "dog",       size: 1.78,  alive: 9.5, dangerous: 2.5 },
  { word: "snake",     size: 2.08,  alive: 9.5, dangerous: 6.5 },
  { word: "deer",      size: 2.26,  alive: 9.5, dangerous: 1 },
  { word: "horse",     size: 2.38,  alive: 9.5, dangerous: 2 },
  { word: "bear",      size: 2.3,   alive: 9.5, dangerous: 8 },
  { word: "shark",     size: 2.55,  alive: 9.0, dangerous: 9 },
  { word: "elephant",  size: 2.78,  alive: 9.5, dangerous: 4 },

  // Vehicles (not alive, various sizes and danger)
  { word: "skateboard", size: 1.9,  alive: 0.3, dangerous: 1.5 },
  { word: "bicycle",    size: 2.23, alive: 0.3, dangerous: 1 },
  { word: "car",        size: 2.65, alive: 0.3, dangerous: 4 },
  { word: "truck",      size: 2.85, alive: 0.3, dangerous: 5 },
  { word: "airplane",   size: 3.54, alive: 0.3, dangerous: 6 },

  // Instruments (not alive, small-medium, safe)
  { word: "flute",     size: 1.81,  alive: 0.3, dangerous: 0 },
  { word: "guitar",    size: 2.0,   alive: 0.3, dangerous: 0 },
  { word: "drum",      size: 1.65,  alive: 0.3, dangerous: 0 },
  { word: "piano",     size: 2.18,  alive: 0.3, dangerous: 0 },

  // Food (not alive, small, safe)
  { word: "grape",     size: 0.3,   alive: 0.5, dangerous: 0 },
  { word: "apple",     size: 0.9,   alive: 0.5, dangerous: 0 },
  { word: "bread",     size: 1.48,  alive: 0.3, dangerous: 0 },
  { word: "pizza",     size: 1.54,  alive: 0.3, dangerous: 0 },
  { word: "cake",      size: 1.4,   alive: 0.3, dangerous: 0 },

  // Objects (not alive, various sizes and danger)
  { word: "coin",      size: -0.4,  alive: 0.3, dangerous: 0.2 },
  { word: "knife",     size: 1.4,   alive: 0.3, dangerous: 7 },
  { word: "book",      size: 1.4,   alive: 0.3, dangerous: 0 },
  { word: "sword",     size: 1.95,  alive: 0.3, dangerous: 8.5 },
  { word: "chair",     size: 1.95,  alive: 0.3, dangerous: 0.3 },
  { word: "gun",       size: 1.4,   alive: 0.3, dangerous: 10 },
];

const AXES = [
  { id: "size" as const, label: "Size", left: "Tiny", right: "Huge", min: -1, max: 3.8 },
  { id: "alive" as const, label: "Alive", left: "Not alive", right: "Alive", min: -0.5, max: 10.5 },
  { id: "dangerous" as const, label: "Dangerous", left: "Safe", right: "Dangerous", min: -0.5, max: 10.5 },
];

// Estimate label width in pixels (at ~10px font, ~6px per char + padding)
function labelWidth(word: string): number {
  return word.length * 6 + 8;
}

// Greedy shelf-based label placement to avoid overlaps.
// Returns an array of { word, x, shelfY } where shelfY is the y offset above the line.
function layoutLabels(
  items: { word: string; x: number }[],
  lineY: number,
): { word: string; x: number; labelY: number }[] {
  const SHELF_GAP = 16; // vertical distance between shelves
  const MIN_STEM = 14;  // minimum stem height
  const H_PAD = 4;      // horizontal padding between labels

  // Sort by x position
  const sorted = [...items].sort((a, b) => a.x - b.x);

  // Track occupied horizontal ranges per shelf: shelf[i] = list of [left, right]
  const shelves: [number, number][][] = [];

  const results: { word: string; x: number; labelY: number }[] = [];

  for (const item of sorted) {
    const w = labelWidth(item.word);
    const left = item.x - w / 2;
    const right = item.x + w / 2;

    // Find the lowest shelf where this label fits
    let placed = false;
    for (let s = 0; s < shelves.length; s++) {
      const shelf = shelves[s];
      const overlaps = shelf.some(
        ([sl, sr]) => left - H_PAD < sr && right + H_PAD > sl
      );
      if (!overlaps) {
        shelf.push([left, right]);
        results.push({
          word: item.word,
          x: item.x,
          labelY: lineY - MIN_STEM - s * SHELF_GAP,
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // New shelf
      const s = shelves.length;
      shelves.push([[left, right]]);
      results.push({
        word: item.word,
        x: item.x,
        labelY: lineY - MIN_STEM - s * SHELF_GAP,
      });
    }
  }

  return results;
}

export function WordNumberLine() {
  const [axisIdx, setAxisIdx] = useState(0);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const axis = AXES[axisIdx];

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resetState = useCallback(() => {
    setAxisIdx(0);
    setHoveredWord(null);
  }, []);

  const PADDING = 50;
  const lineWidth = containerWidth - PADDING * 2;
  const LINE_Y = 220;

  // Map each word to an x position
  const xPositions = useMemo(() => {
    return WORDS.map((entry) => {
      const value = entry[axis.id];
      const t = (value - axis.min) / (axis.max - axis.min);
      return PADDING + Math.max(0, Math.min(1, t)) * lineWidth;
    });
  }, [axis, lineWidth]);

  // Compute label layout (non-overlapping shelves)
  const labelLayout = useMemo(() => {
    const items = WORDS.map((entry, i) => ({
      word: entry.word,
      x: xPositions[i],
    }));
    return layoutLabels(items, LINE_Y);
  }, [xPositions]);

  // Find the topmost label to size the SVG
  const minLabelY = useMemo(() => {
    if (labelLayout.length === 0) return LINE_Y - 30;
    return Math.min(...labelLayout.map((l) => l.labelY)) - 14;
  }, [labelLayout]);

  const svgHeight = LINE_Y + 35;
  const labelYOffset = minLabelY < 10 ? 10 - minLabelY : 0; // shift everything down if labels go above SVG

  // Create a word → layout lookup
  const layoutMap = useMemo(() => {
    const map = new Map<string, { x: number; labelY: number }>();
    for (const l of labelLayout) {
      map.set(l.word, { x: l.x, labelY: l.labelY + labelYOffset });
    }
    return map;
  }, [labelLayout, labelYOffset]);

  const adjustedLineY = LINE_Y + labelYOffset;
  const totalHeight = svgHeight + labelYOffset;

  return (
    <WidgetContainer
      title="Words on a Number Line"
      description="Each word gets a single number. Toggle axes to see how one dimension captures one property but conflates everything else."
      onReset={resetState}
    >
      {/* Axis selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {AXES.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setAxisIdx(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              i === axisIdx
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Number line visualization */}
      <div ref={containerRef} className="w-full">
        <svg width={containerWidth} height={totalHeight} className="overflow-visible">
          {/* Main horizontal line */}
          <line
            x1={PADDING}
            y1={adjustedLineY}
            x2={containerWidth - PADDING}
            y2={adjustedLineY}
            stroke="var(--color-border)"
            strokeWidth={2}
          />
          {/* Arrow heads */}
          <polygon
            points={`${PADDING - 6},${adjustedLineY} ${PADDING + 2},${adjustedLineY - 4} ${PADDING + 2},${adjustedLineY + 4}`}
            fill="var(--color-border)"
          />
          <polygon
            points={`${containerWidth - PADDING + 6},${adjustedLineY} ${containerWidth - PADDING - 2},${adjustedLineY - 4} ${containerWidth - PADDING - 2},${adjustedLineY + 4}`}
            fill="var(--color-border)"
          />

          {/* Axis labels below */}
          <text
            x={PADDING}
            y={adjustedLineY + 22}
            textAnchor="start"
            className="fill-muted text-[11px]"
          >
            ← {axis.left}
          </text>
          <text
            x={containerWidth - PADDING}
            y={adjustedLineY + 22}
            textAnchor="end"
            className="fill-muted text-[11px]"
          >
            {axis.right} →
          </text>

          {/* Words: dot on line + stem + label */}
          {WORDS.map((entry, i) => {
            const dotX = xPositions[i];
            const layout = layoutMap.get(entry.word);
            if (!layout) return null;
            const { labelY } = layout;
            const isHovered = hoveredWord === entry.word;

            return (
              <g
                key={entry.word}
                onMouseEnter={() => setHoveredWord(entry.word)}
                onMouseLeave={() => setHoveredWord(null)}
                className="cursor-default"
              >
                {/* Stem from dot to label */}
                <line
                  x1={dotX}
                  y1={adjustedLineY - 4}
                  x2={dotX}
                  y2={labelY + 4}
                  stroke={isHovered ? "var(--color-accent)" : "var(--color-border)"}
                  strokeWidth={isHovered ? 1.5 : 0.75}
                  opacity={isHovered ? 1 : 0.5}
                />
                {/* Dot on the line */}
                <circle
                  cx={dotX}
                  cy={adjustedLineY}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? "var(--color-accent)" : "var(--color-foreground)"}
                  opacity={isHovered ? 1 : 0.7}
                />
                {/* Label */}
                <text
                  x={dotX}
                  y={labelY}
                  textAnchor="middle"
                  className={`text-[10px] pointer-events-none select-none ${
                    isHovered ? "font-bold" : "font-medium"
                  }`}
                  fill={isHovered ? "var(--color-accent)" : "var(--color-foreground)"}
                  opacity={isHovered ? 1 : 0.8}
                >
                  {entry.word}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 rounded-lg bg-surface p-3 text-xs text-muted">
        {axisIdx === 0 ? (
          <>Notice how elephant ends up next to truck and car — they&apos;re all big, but have nothing else in common. One number can&apos;t separate &quot;big animal&quot; from &quot;big machine&quot;.</>
        ) : axisIdx === 1 ? (
          <>Now animals separate from objects. But elephant and mouse are neighbors — even though they&apos;re completely different sizes.</>
        ) : (
          <>Dangerous things cluster together: shark, bear, gun, sword. But a dangerous animal and a dangerous weapon are very different things.</>
        )}
      </div>
    </WidgetContainer>
  );
}
