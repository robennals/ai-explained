"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

interface GroupItem {
  word: string;
  value: number; // position within the group's range
}

type PresetId =
  | "animals-foods"
  | "vehicles-instruments"
  | "animals-foods-instruments";

interface GroupDef {
  name: string;
  ordering: string;
  color: string;
  items: GroupItem[];
}

interface Preset {
  id: PresetId;
  label: string;
  groups: GroupDef[];
}

const PRESETS: Preset[] = [
  {
    id: "animals-foods",
    label: "Animals + Foods",
    groups: [
      {
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
      {
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
    ],
  },
  {
    id: "vehicles-instruments",
    label: "Vehicles + Instruments",
    groups: [
      {
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
      {
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
    ],
  },
  {
    id: "animals-foods-instruments",
    label: "Animals + Foods + Instruments",
    groups: [
      {
        name: "Animals",
        ordering: "by size",
        color: "#22c55e",
        items: [
          { word: "ant", value: 0.2 },
          { word: "mouse", value: 0.9 },
          { word: "cat", value: 1.6 },
          { word: "dog", value: 2.2 },
          { word: "elephant", value: 3.0 },
        ],
      },
      {
        name: "Foods",
        ordering: "by sweetness",
        color: "#ef4444",
        items: [
          { word: "bread", value: 4.2 },
          { word: "cheese", value: 5.1 },
          { word: "cake", value: 6.0 },
        ],
      },
      {
        name: "Instruments",
        ordering: "by size",
        color: "#f97316",
        items: [
          { word: "flute", value: 7.3 },
          { word: "guitar", value: 8.2 },
          { word: "drum", value: 9.0 },
          { word: "piano", value: 9.7 },
        ],
      },
    ],
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
  const [activePreset, setActivePreset] = useState<PresetId>("animals-foods");
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const preset = PRESETS.find((p) => p.id === activePreset) ?? PRESETS[0];

  const tabs = useMemo(
    () => PRESETS.map((p) => ({ id: p.id, label: p.label })),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resetState = useCallback(() => {
    setActivePreset("animals-foods");
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

  const allItems = useMemo(() => {
    const items: { word: string; x: number; color: string }[] = [];
    for (const group of preset.groups) {
      for (const item of group.items) {
        items.push({ word: item.word, x: toX(item.value), color: group.color });
      }
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

  const groupBounds = useMemo(
    () =>
      preset.groups.map((g) => ({
        start: toX(g.items[0].value) - 12,
        end: toX(g.items[g.items.length - 1].value) + 12,
      })),
    [preset, toX],
  );

  return (
    <WidgetContainer
      title="One Dimension, Multiple Meanings"
      description="A single number line can encode both the category a word belongs to AND a property within that category — and you can pack as many categories onto the line as you like."
      onReset={resetState}
    >
      <WidgetTabs tabs={tabs} activeTab={activePreset} onTabChange={(id) => { setActivePreset(id); setHoveredWord(null); }} />

      <div ref={containerRef} className="w-full">
        <svg width={containerWidth} height={totalHeight} className="overflow-visible">
          {/* Region backgrounds — one per group */}
          {preset.groups.map((group, i) => (
            <rect
              key={`${group.name}-bg`}
              x={groupBounds[i].start}
              y={adjustedLineY - 6}
              width={groupBounds[i].end - groupBounds[i].start}
              height={12}
              rx={6}
              fill={group.color}
              opacity={0.12}
            />
          ))}

          {/* Main line */}
          <line
            x1={PADDING} y1={adjustedLineY}
            x2={containerWidth - PADDING} y2={adjustedLineY}
            stroke="var(--color-border)" strokeWidth={2}
          />

          {/* Group labels below — one per group */}
          {preset.groups.map((group, i) => {
            const cx = (groupBounds[i].start + groupBounds[i].end) / 2;
            return (
              <g key={`${group.name}-label`}>
                <text
                  x={cx} y={adjustedLineY + 22}
                  textAnchor="middle"
                  className="text-[10px] font-semibold pointer-events-none select-none"
                  fill={group.color}
                >
                  {group.name}
                </text>
                <text
                  x={cx} y={adjustedLineY + 34}
                  textAnchor="middle"
                  className="text-[9px] pointer-events-none select-none"
                  fill={group.color} opacity={0.7}
                >
                  {group.ordering} →
                </text>
              </g>
            );
          })}

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
        One number encodes <em>two</em> things: which category something belongs to (which region of the line it falls in) and a property <em>within</em> that category. Different regions of the number line mean different things, and you can add as many regions as you need.
      </div>
    </WidgetContainer>
  );
}
