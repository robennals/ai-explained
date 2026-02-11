"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface GroupItem {
  word: string;
  value: number; // position within the group's range
}

interface Preset {
  label: string;
  left: { name: string; ordering: string; color: string; items: GroupItem[] };
  right: { name: string; ordering: string; color: string; items: GroupItem[] };
}

const PRESETS: Preset[] = [
  {
    label: "Animals \u00d7 Foods",
    left: {
      name: "Animals",
      ordering: "by size",
      color: "#22c55e",
      items: [
        { word: "ant", value: 0.3 },
        { word: "mouse", value: 1.0 },
        { word: "cat", value: 1.8 },
        { word: "dog", value: 2.3 },
        { word: "horse", value: 3.2 },
        { word: "elephant", value: 4.2 },
      ],
    },
    right: {
      name: "Foods",
      ordering: "by sweetness",
      color: "#ef4444",
      items: [
        { word: "bread", value: 5.8 },
        { word: "cheese", value: 6.4 },
        { word: "apple", value: 7.2 },
        { word: "cake", value: 8.2 },
        { word: "chocolate", value: 9.0 },
        { word: "honey", value: 9.7 },
      ],
    },
  },
  {
    label: "Vehicles \u00d7 Instruments",
    left: {
      name: "Vehicles",
      ordering: "by speed",
      color: "#3b82f6",
      items: [
        { word: "bicycle", value: 0.5 },
        { word: "boat", value: 1.5 },
        { word: "car", value: 2.5 },
        { word: "train", value: 3.3 },
        { word: "airplane", value: 4.3 },
      ],
    },
    right: {
      name: "Instruments",
      ordering: "by size",
      color: "#f97316",
      items: [
        { word: "flute", value: 5.8 },
        { word: "violin", value: 6.6 },
        { word: "guitar", value: 7.5 },
        { word: "drum", value: 8.4 },
        { word: "piano", value: 9.5 },
      ],
    },
  },
  {
    label: "Clothes \u00d7 Sports",
    left: {
      name: "Clothes",
      ordering: "by warmth",
      color: "#8b5cf6",
      items: [
        { word: "sandals", value: 0.3 },
        { word: "shorts", value: 1.2 },
        { word: "shirt", value: 2.2 },
        { word: "sweater", value: 3.2 },
        { word: "coat", value: 4.2 },
      ],
    },
    right: {
      name: "Sports",
      ordering: "by team size",
      color: "#06b6d4",
      items: [
        { word: "boxing", value: 5.8 },
        { word: "tennis", value: 6.6 },
        { word: "volleyball", value: 7.6 },
        { word: "basketball", value: 8.5 },
        { word: "soccer", value: 9.5 },
      ],
    },
  },
];

function labelWidth(word: string): number {
  return word.length * 5.8 + 8;
}

interface LaidOutLabel {
  word: string;
  x: number;
  labelY: number;
  color: string;
}

function layoutLabels(
  items: { word: string; x: number; color: string }[],
  lineY: number,
): LaidOutLabel[] {
  const SHELF_GAP = 16;
  const MIN_STEM = 14;
  const H_PAD = 4;
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const shelves: [number, number][][] = [];
  const results: LaidOutLabel[] = [];

  for (const item of sorted) {
    const w = labelWidth(item.word);
    const left = item.x - w / 2;
    const right = item.x + w / 2;
    let placed = false;
    for (let s = 0; s < shelves.length; s++) {
      const overlaps = shelves[s].some(
        ([sl, sr]) => left - H_PAD < sr && right + H_PAD > sl
      );
      if (!overlaps) {
        shelves[s].push([left, right]);
        results.push({ word: item.word, x: item.x, labelY: lineY - MIN_STEM - s * SHELF_GAP, color: item.color });
        placed = true;
        break;
      }
    }
    if (!placed) {
      const s = shelves.length;
      shelves.push([[left, right]]);
      results.push({ word: item.word, x: item.x, labelY: lineY - MIN_STEM - s * SHELF_GAP, color: item.color });
    }
  }
  return results;
}

const PADDING = 50;
const LINE_Y = 140;
const AXIS_MIN = -0.2;
const AXIS_MAX = 10.2;

export function CombinedNumberLine() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const preset = PRESETS[presetIdx];

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resetState = useCallback(() => {
    setPresetIdx(0);
    setHoveredWord(null);
  }, []);

  const lineWidth = containerWidth - PADDING * 2;

  const toX = useCallback(
    (value: number) => {
      const t = (value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN);
      return PADDING + Math.max(0, Math.min(1, t)) * lineWidth;
    },
    [lineWidth],
  );

  // Combine all items with their colors for layout
  const allItems = useMemo(() => {
    const items: { word: string; x: number; color: string }[] = [];
    for (const item of preset.left.items) {
      items.push({ word: item.word, x: toX(item.value), color: preset.left.color });
    }
    for (const item of preset.right.items) {
      items.push({ word: item.word, x: toX(item.value), color: preset.right.color });
    }
    return items;
  }, [preset, toX]);

  const labelLayout = useMemo(() => {
    return layoutLabels(allItems, LINE_Y);
  }, [allItems]);

  const minLabelY = useMemo(() => {
    if (labelLayout.length === 0) return LINE_Y - 30;
    return Math.min(...labelLayout.map((l) => l.labelY)) - 14;
  }, [labelLayout]);

  const labelYOffset = minLabelY < 10 ? 10 - minLabelY : 0;
  const adjustedLineY = LINE_Y + labelYOffset;
  const totalHeight = adjustedLineY + 50;

  const layoutMap = useMemo(() => {
    const map = new Map<string, LaidOutLabel>();
    for (const l of labelLayout) {
      map.set(l.word, { ...l, labelY: l.labelY + labelYOffset });
    }
    return map;
  }, [labelLayout, labelYOffset]);

  // Region backgrounds
  const leftStart = toX(preset.left.items[0].value) - 12;
  const leftEnd = toX(preset.left.items[preset.left.items.length - 1].value) + 12;
  const rightStart = toX(preset.right.items[0].value) - 12;
  const rightEnd = toX(preset.right.items[preset.right.items.length - 1].value) + 12;

  return (
    <WidgetContainer
      title="One Dimension, Multiple Meanings"
      description="A single number line can encode both the category a word belongs to AND a property within that category."
      onReset={resetState}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
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

      <div ref={containerRef} className="w-full">
        <svg width={containerWidth} height={totalHeight} className="overflow-visible">
          {/* Region backgrounds */}
          <rect
            x={leftStart} y={adjustedLineY - 6}
            width={leftEnd - leftStart} height={12}
            rx={6}
            fill={preset.left.color} opacity={0.12}
          />
          <rect
            x={rightStart} y={adjustedLineY - 6}
            width={rightEnd - rightStart} height={12}
            rx={6}
            fill={preset.right.color} opacity={0.12}
          />

          {/* Main line */}
          <line
            x1={PADDING} y1={adjustedLineY}
            x2={containerWidth - PADDING} y2={adjustedLineY}
            stroke="var(--color-border)" strokeWidth={2}
          />

          {/* Group labels below */}
          <text
            x={(leftStart + leftEnd) / 2} y={adjustedLineY + 22}
            textAnchor="middle"
            className="text-[10px] font-semibold pointer-events-none select-none"
            fill={preset.left.color}
          >
            {preset.left.name}
          </text>
          <text
            x={(leftStart + leftEnd) / 2} y={adjustedLineY + 34}
            textAnchor="middle"
            className="text-[9px] pointer-events-none select-none"
            fill={preset.left.color} opacity={0.7}
          >
            {preset.left.ordering} →
          </text>
          <text
            x={(rightStart + rightEnd) / 2} y={adjustedLineY + 22}
            textAnchor="middle"
            className="text-[10px] font-semibold pointer-events-none select-none"
            fill={preset.right.color}
          >
            {preset.right.name}
          </text>
          <text
            x={(rightStart + rightEnd) / 2} y={adjustedLineY + 34}
            textAnchor="middle"
            className="text-[9px] pointer-events-none select-none"
            fill={preset.right.color} opacity={0.7}
          >
            {preset.right.ordering} →
          </text>

          {/* Dots and labels */}
          {allItems.map((item) => {
            const layout = layoutMap.get(item.word);
            if (!layout) return null;
            const { x, labelY, color } = layout;
            const isHovered = hoveredWord === item.word;

            return (
              <g
                key={item.word}
                onMouseEnter={() => setHoveredWord(item.word)}
                onMouseLeave={() => setHoveredWord(null)}
                className="cursor-default"
              >
                <line
                  x1={x} y1={adjustedLineY - 4}
                  x2={x} y2={labelY + 4}
                  stroke={isHovered ? color : "var(--color-border)"}
                  strokeWidth={isHovered ? 1.5 : 0.75}
                  opacity={isHovered ? 0.8 : 0.4}
                />
                <circle
                  cx={x} cy={adjustedLineY}
                  r={isHovered ? 5 : 3.5}
                  fill={color}
                  opacity={isHovered ? 1 : 0.8}
                />
                <text
                  x={x} y={labelY}
                  textAnchor="middle"
                  className={`text-[10px] pointer-events-none select-none ${isHovered ? "font-bold" : "font-medium"}`}
                  fill={color}
                  opacity={isHovered ? 1 : 0.85}
                >
                  {item.word}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 rounded-lg bg-surface p-3 text-xs text-muted">
        One number encodes <em>two</em> things: which category something belongs to (left or right cluster), and a property <em>within</em> that category ({preset.left.ordering} for {preset.left.name.toLowerCase()}, {preset.right.ordering} for {preset.right.name.toLowerCase()}). The gap in the middle separates the categories. Different regions of the number line mean different things.
      </div>
    </WidgetContainer>
  );
}
