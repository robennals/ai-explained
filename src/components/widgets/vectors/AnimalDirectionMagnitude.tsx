"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

// --- Example tab definitions ---

interface Example {
  id: string;
  label: string;
  directionLabel: string;
  magnitudeLabel: string;
  magnitudeNoun: string;
  items: ExampleItem[];
  xAxisLabel: string;
  yAxisLabel: string;
  sliderMin: number;
  sliderStep: number;
  formatMagnitude: (count: number, item: ExampleItem) => string;
  /** Short label for the SVG next to the vector tip, e.g. "3 bears" */
  vectorLabel: (count: number, item: ExampleItem) => string;
  /** If true, origin is centered and axes extend to negative values */
  centered?: boolean;
}

interface ExampleItem {
  name: string;
  plural?: string;
  emoji: string;
  /** CSS color for swatch-based items (used instead of emoji when set) */
  color?: string;
  x: number;
  y: number;
}

function velocityMagnitude(count: number): string {
  const v = Math.round(count * 10) / 10;
  return `${v < 1 ? v.toFixed(1) : v} mph`;
}

function brightnessName(count: number): string {
  if (count <= 1) return "very dim";
  if (count <= 2) return "dim";
  if (count <= 3) return "bright";
  return "very bright";
}


/** Inline SVG arrow pointing in the given direction (unit vector). */
function DirectionArrow({ x, y, size = 18, className }: { x: number; y: number; size?: number; className?: string }) {
  const len = Math.sqrt(x * x + y * y);
  const ux = len > 0 ? x / len : 0;
  const uy = len > 0 ? y / len : 0;
  const c = size / 2;
  const r = size / 2 - 1.5; // shaft length from center
  const tailX = c - ux * r * 0.55;
  const tailY = c + uy * r * 0.55;
  const tipX = c + ux * r;
  const tipY = c - uy * r; // SVG y is flipped
  const headLen = 5.5;
  const angle = Math.atan2(tipY - tailY, tipX - tailX);
  const h1x = tipX - headLen * Math.cos(angle - 0.55);
  const h1y = tipY - headLen * Math.sin(angle - 0.55);
  const h2x = tipX - headLen * Math.cos(angle + 0.55);
  const h2y = tipY - headLen * Math.sin(angle + 0.55);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <polyline points={`${h1x},${h1y} ${tipX},${tipY} ${h2x},${h2y}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const EXAMPLES: Example[] = [
  {
    id: "velocity",
    label: "Velocity",
    directionLabel: "Which direction",
    magnitudeLabel: "How fast",
    magnitudeNoun: "speed",
    xAxisLabel: "East",
    yAxisLabel: "North",
    centered: true,
    sliderMin: 0.1,
    sliderStep: 0.1,
    formatMagnitude: velocityMagnitude,
    vectorLabel: (count, item) => {
      const v = Math.round(count * 10) / 10;
      return `${v < 1 ? v.toFixed(1) : v} mph ${item.name.toLowerCase()}`;
    },
    items: [
      { name: "North", emoji: "", x: 0.00, y: 1.00 },
      { name: "NE", emoji: "", x: 0.707, y: 0.707 },
      { name: "East", emoji: "", x: 1.00, y: 0.00 },
      { name: "SE", emoji: "", x: 0.707, y: -0.707 },
      { name: "South", emoji: "", x: 0.00, y: -1.00 },
      { name: "SW", emoji: "", x: -0.707, y: -0.707 },
      { name: "West", emoji: "", x: -1.00, y: 0.00 },
      { name: "NW", emoji: "", x: -0.707, y: 0.707 },
    ],
  },
  {
    id: "color",
    label: "Color",
    directionLabel: "Hue",
    magnitudeLabel: "Brightness",
    magnitudeNoun: "brightness",
    xAxisLabel: "Red",
    yAxisLabel: "Blue",
    sliderMin: 0.1,
    sliderStep: 0.1,
    formatMagnitude: (count) => brightnessName(count),
    vectorLabel: (count, item) => `${brightnessName(count)} ${item.name.toLowerCase()}`,
    items: [
      { name: "Red", emoji: "", color: "#ef4444", x: 1.00, y: 0.00 },
      { name: "Blue", emoji: "", color: "#3b82f6", x: 0.00, y: 1.00 },
      { name: "Purple", emoji: "", color: "#8b5cf6", x: 0.60, y: 0.80 },
      { name: "Magenta", emoji: "", color: "#ec4899", x: 0.85, y: 0.50 },
      { name: "Indigo", emoji: "", color: "#6366f1", x: 0.30, y: 0.90 },
    ],
  },
];

// --- Coordinate system ---
const MAX_UNITS = 4;
const SVG_SIZE = 350;
const PAD = 45;

function fmt(n: number): string {
  return n.toFixed(2);
}

export function AnimalDirectionMagnitude() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [selectedItem, setSelectedItem] = useState(0);
  const [rawCount, setRawCount] = useState(1);

  const example = EXAMPLES[exampleIdx];
  const item = example.items[selectedItem];
  const centered = example.centered ?? false;

  // Coordinate system: for centered plots, origin in middle; otherwise bottom-left
  const PLOT = SVG_SIZE - 2 * PAD;
  const UNIT_PX = centered ? PLOT / (MAX_UNITS * 2) : PLOT / MAX_UNITS;
  const originX = centered ? PAD + PLOT / 2 : PAD;
  const originY = centered ? PAD + PLOT / 2 : SVG_SIZE - PAD;
  const toSvgX = (v: number) => originX + v * UNIT_PX;
  const toSvgY = (v: number) => originY - v * UNIT_PX;

  // Grid ticks
  const minTick = centered ? -MAX_UNITS : 0;
  const maxTick = MAX_UNITS;
  const gridTicks = Array.from(
    { length: maxTick - minTick + 1 },
    (_, i) => minTick + i,
  );

  // Snap to the nearest step for display/math, but keep slider smooth
  const count = Math.round(rawCount / example.sliderStep) * example.sliderStep;

  // Compute unit vector from the item's 2D coordinates
  const rawLen = Math.sqrt(item.x * item.x + item.y * item.y);
  const unitX = rawLen > 0 ? item.x / rawLen : 0;
  const unitY = rawLen > 0 ? item.y / rawLen : 0;

  // Scaled vector (in "unit" coordinates — 1 = one grid square)
  const scaledX = unitX * count;
  const scaledY = unitY * count;

  // Max slider value: largest count that fits on screen.
  // Use the larger unit-vector component to determine max.
  const maxComponent = Math.max(Math.abs(unitX), Math.abs(unitY));
  const rawMax = maxComponent > 0 ? MAX_UNITS / maxComponent : MAX_UNITS;
  // Round down to nearest step so the vector doesn't overflow
  const step = example.sliderStep;
  const sliderMax = Math.max(step, Math.floor(rawMax / step) * step);

  // Smoothly animate rawCount from current position to snapped target
  const snapAnimRef = useRef<number>(0);
  const animateSnap = useCallback((from: number, to: number) => {
    cancelAnimationFrame(snapAnimRef.current);
    if (Math.abs(from - to) < 0.01) { setRawCount(to); return; }
    const duration = 200; // ms
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / duration, 1);
      // ease-in-out cubic: slow start, fast middle, slow end
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setRawCount(from + (to - from) * eased);
      if (t < 1) snapAnimRef.current = requestAnimationFrame(tick);
    };
    // Run the first frame synchronously so movement starts immediately
    tick(performance.now());
    snapAnimRef.current = requestAnimationFrame(tick);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedItem(0);
    setRawCount(1);
  }, []);

  const handleExampleChange = useCallback((idx: number) => {
    setExampleIdx(idx);
    setSelectedItem(0);
    setRawCount(1);
  }, []);

  // When selected item changes, clamp count to new max
  const handleSelectItem = useCallback((idx: number) => {
    setSelectedItem(idx);
    setRawCount((prev) => {
      const ex = EXAMPLES[exampleIdx];
      const it = ex.items[idx];
      const len = Math.sqrt(it.x * it.x + it.y * it.y);
      const ux = len > 0 ? it.x / len : 0;
      const uy = len > 0 ? it.y / len : 0;
      const mc = Math.max(Math.abs(ux), Math.abs(uy));
      const rm = mc > 0 ? MAX_UNITS / mc : MAX_UNITS;
      const newMax = Math.max(ex.sliderStep, Math.floor(rm / ex.sliderStep) * ex.sliderStep);
      return Math.min(prev, newMax);
    });
  }, [exampleIdx]);

  return (
    <WidgetContainer
      title="Direction and Magnitude"
      description="Direction = what kind of thing. Magnitude = how much."
      onReset={handleReset}
    >
      {/* Example tabs */}
      <WidgetTabs
        tabs={EXAMPLES.map((ex, i) => ({ id: String(i), label: ex.label }))}
        activeTab={String(exampleIdx)}
        onTabChange={(id) => handleExampleChange(Number(id))}
      />

      {/* Item selector */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {example.items.map((it, i) => (
          <button
            key={it.name}
            onClick={() => handleSelectItem(i)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              i === selectedItem
                ? "bg-accent text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            {example.id === "velocity" ? (
              <DirectionArrow x={it.x} y={it.y} size={14} />
            ) : it.color ? (
              <span className="inline-block h-3 w-3 rounded-sm border border-foreground/10" style={{ backgroundColor: it.color }} />
            ) : (
              <span>{it.emoji}</span>
            )}
            <span>{it.name}</span>
          </button>
        ))}
      </div>

      {example.id === "color" && (
        <div className="mb-3 text-[11px] text-muted">
          Real color has three dimensions (red, green, blue), but we show only two here because 2D is easier to visualize.
        </div>
      )}

      {/* How many slider */}
      <div className="mb-4">
        <SliderControl
          label={example.magnitudeLabel}
          value={rawCount}
          min={example.sliderMin}
          max={sliderMax}
          step={0.01}
          onChange={setRawCount}
          onCommit={() => animateSnap(rawCount, count)}
          formatValue={() => example.id === "color"
            ? brightnessName(count)
            : count < 1 ? count.toFixed(1) : String(Math.round(count * 10) / 10)}
          ticks={example.sliderStep >= 1
            ? Array.from({ length: Math.floor(sliderMax) }, (_, i) => i + 1)
            : undefined}
        />
      </div>

      {/* SVG visualization */}
      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="mx-auto w-full max-w-[400px]">
        {/* Grid lines at each integer unit */}
        {gridTicks.map((t) => (
          <g key={t}>
            <line
              x1={toSvgX(t)} y1={toSvgY(minTick)} x2={toSvgX(t)} y2={toSvgY(maxTick)}
              stroke="currentColor" strokeOpacity={t === 0 && centered ? 0.15 : 0.06}
            />
            <line
              x1={toSvgX(minTick)} y1={toSvgY(t)} x2={toSvgX(maxTick)} y2={toSvgY(t)}
              stroke="currentColor" strokeOpacity={t === 0 && centered ? 0.15 : 0.06}
            />
            {/* X tick labels */}
            {(t !== 0 || !centered) && (
              <text x={toSvgX(t)} y={toSvgY(minTick) + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>
                {t}
              </text>
            )}
            {/* Y tick labels */}
            {t !== 0 && (
              <text x={toSvgX(minTick) - 8} y={toSvgY(t) + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.3}>
                {t}
              </text>
            )}
          </g>
        ))}

        {/* Axes */}
        <line x1={toSvgX(minTick)} y1={toSvgY(0)} x2={toSvgX(maxTick)} y2={toSvgY(0)} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />
        <line x1={toSvgX(0)} y1={toSvgY(minTick)} x2={toSvgX(0)} y2={toSvgY(maxTick)} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={toSvgX(maxTick)} y={toSvgY(0) + 14} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.5} fontWeight={600}>
          {example.xAxisLabel}
        </text>
        <text
          x={toSvgX(0) - 14} y={toSvgY(maxTick) + 4}
          textAnchor="end" fontSize={11} fill="currentColor" opacity={0.5} fontWeight={600}
        >
          {example.yAxisLabel}
        </text>

        {/* Unit circle arc (radius = 1 unit, centered at origin) */}
        {centered ? (
          <circle
            cx={toSvgX(0)} cy={toSvgY(0)} r={UNIT_PX}
            fill="none" stroke="var(--color-accent)"
            strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 3"
          />
        ) : (
          <path
            d={`M ${toSvgX(1)} ${toSvgY(0)} A ${UNIT_PX} ${UNIT_PX} 0 0 0 ${toSvgX(0)} ${toSvgY(1)}`}
            fill="none" stroke="var(--color-accent)"
            strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 3"
          />
        )}

        {/* Ghost dots for non-selected items on the unit arc (color only) */}
        {example.id !== "velocity" && example.items.map((it, i) => {
          if (i === selectedItem) return null;
          const len = Math.sqrt(it.x * it.x + it.y * it.y);
          const ux = len > 0 ? it.x / len : 0;
          const uy = len > 0 ? it.y / len : 0;
          return (
            <g key={it.name} opacity={0.35}>
              <circle cx={toSvgX(ux)} cy={toSvgY(uy)} r={4} fill={it.color ?? "currentColor"} stroke="white" strokeWidth={0.5} />
            </g>
          );
        })}

        {/* Scaled vector arrow (solid, wider) */}
        {count > 0.1 && (
          <>
            <line
              x1={toSvgX(0)} y1={toSvgY(0)}
              x2={toSvgX(scaledX)} y2={toSvgY(scaledY)}
              stroke="var(--color-accent)" strokeWidth={3} strokeOpacity={0.3}
            />
            {/* Arrowhead for scaled vector */}
            {(() => {
              const sx = toSvgX(scaledX);
              const sy = toSvgY(scaledY);
              const ox = toSvgX(0);
              const oy = toSvgY(0);
              const angle = Math.atan2(sy - oy, sx - ox);
              const headLen = 8;
              const h1x = sx - headLen * Math.cos(angle - 0.35);
              const h1y = sy - headLen * Math.sin(angle - 0.35);
              const h2x = sx - headLen * Math.cos(angle + 0.35);
              const h2y = sy - headLen * Math.sin(angle + 0.35);
              return (
                <polygon
                  points={`${sx},${sy} ${h1x},${h1y} ${h2x},${h2y}`}
                  fill="var(--color-accent)" fillOpacity={0.3}
                />
              );
            })()}
          </>
        )}

        {/* Unit vector arrow (dashed) */}
        <line
          x1={toSvgX(0)} y1={toSvgY(0)}
          x2={toSvgX(unitX)} y2={toSvgY(unitY)}
          stroke="var(--color-accent)" strokeWidth={2}
          strokeDasharray="4 3"
        />
        {/* Arrowhead for unit vector */}
        {(() => {
          const sx = toSvgX(unitX);
          const sy = toSvgY(unitY);
          const ox = toSvgX(0);
          const oy = toSvgY(0);
          const angle = Math.atan2(sy - oy, sx - ox);
          const headLen = 7;
          const h1x = sx - headLen * Math.cos(angle - 0.35);
          const h1y = sy - headLen * Math.sin(angle - 0.35);
          const h2x = sx - headLen * Math.cos(angle + 0.35);
          const h2y = sy - headLen * Math.sin(angle + 0.35);
          return (
            <polygon
              points={`${sx},${sy} ${h1x},${h1y} ${h2x},${h2y}`}
              fill="var(--color-accent)"
            />
          );
        })()}

        {/* Selected item dot on unit circle */}
        <circle cx={toSvgX(unitX)} cy={toSvgY(unitY)} r={5} fill={item.color ?? "var(--color-accent)"} />
        {item.color && (
          <circle cx={toSvgX(unitX)} cy={toSvgY(unitY)} r={5} fill={item.color} stroke="white" strokeWidth={1} />
        )}
        {item.emoji && (
          <text x={toSvgX(unitX)} y={toSvgY(unitY) - 10} textAnchor="middle" fontSize={16}>
            {item.emoji}
          </text>
        )}

        {/* "direction" label near unit vector tip */}
        <text
          x={toSvgX(unitX) + 10} y={toSvgY(unitY) + 4}
          fontSize={9} fill="var(--color-accent)" fontWeight={600} opacity={0.7}
        >
          direction
        </text>

        {/* Scaled vector label, e.g. "3 bears" */}
        <text
          x={toSvgX(scaledX) + 8} y={toSvgY(scaledY) - 4}
          fontSize={10} fill="var(--color-accent)" fontWeight={600} opacity={0.7}
        >
          {example.vectorLabel(count, item)}
        </text>
      </svg>

      {/* Readout */}
      <div className="mt-3 space-y-2">
        <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1" style={{ fontVariantNumeric: "tabular-nums" }}>
          <div className="font-mono text-xs">
            <span className="text-muted">{example.directionLabel}:</span>{" "}
            <span className="text-accent">({fmt(unitX)}, {fmt(unitY)})</span>
            <span className="text-muted"> — the {item.name.toLowerCase()} direction</span>
          </div>
          <div className="font-mono text-xs">
            <span className="text-muted">{example.magnitudeLabel}:</span>{" "}
            <span className="text-accent">{example.formatMagnitude(count, item)}</span>
          </div>
          <div className="font-mono text-xs text-muted pt-1 border-t border-foreground/5">
            Full vector: {count < 1 ? count.toFixed(1) : Math.round(count * 10) / 10} × ({fmt(unitX)}, {fmt(unitY)}) = ({fmt(scaledX)}, {fmt(scaledY)})
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
