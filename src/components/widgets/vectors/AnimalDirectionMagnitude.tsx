"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

// --- Example tab definitions ---

interface Example {
  id: string;
  label: string;
  xAxisLabel: string;
  yAxisLabel: string;
  centered?: boolean;
  magnitudeLabel: string;
  formatMagnitude: (mag: number) => string;
  vectorLabel: (angle: number, mag: number) => string;
  /** Optional: compute a CSS color from the angle (0..2π) */
  hueColor?: (angle: number) => string;
}

function angleName(angle: number): string {
  // Normalize to 0..2π
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const deg = a * 180 / Math.PI;
  if (deg < 22.5) return "east";
  if (deg < 67.5) return "north-east";
  if (deg < 112.5) return "north";
  if (deg < 157.5) return "north-west";
  if (deg < 202.5) return "west";
  if (deg < 247.5) return "south-west";
  if (deg < 292.5) return "south";
  if (deg < 337.5) return "south-east";
  return "east";
}

function brightnessName(mag: number): string {
  if (mag <= 1) return "very dim";
  if (mag <= 2) return "dim";
  if (mag <= 3) return "bright";
  return "very bright";
}

function colorFromAngle(angle: number): string {
  // angle 0 = pure red (1,0), angle π/2 = pure blue (0,1)
  // Map to hue: 0° angle → red, 90° angle → blue
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  // Clamp to positive quadrant for meaningful color
  const r = Math.max(0, cos);
  const b = Math.max(0, sin);
  const max = Math.max(r, b, 0.01);
  return `rgb(${Math.round((r / max) * 255)}, 0, ${Math.round((b / max) * 255)})`;
}

function colorName(angle: number): string {
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const deg = a * 180 / Math.PI;
  if (deg < 15 || deg > 345) return "red";
  if (deg < 35) return "magenta";
  if (deg < 55) return "purple";
  if (deg < 75) return "indigo";
  if (deg < 105) return "blue";
  // Beyond the first quadrant, colors wrap weirdly — just describe the angle
  return "mixed";
}

const EXAMPLES: Example[] = [
  {
    id: "velocity",
    label: "Velocity",
    xAxisLabel: "East",
    yAxisLabel: "North",
    centered: true,
    magnitudeLabel: "Speed",
    formatMagnitude: (mag) => {
      const v = Math.round(mag * 10) / 10;
      return `${v < 1 ? v.toFixed(1) : v} mph`;
    },
    vectorLabel: (angle, mag) => {
      const v = Math.round(mag * 10) / 10;
      return `${v < 1 ? v.toFixed(1) : v} mph ${angleName(angle)}`;
    },
  },
  {
    id: "color",
    label: "Color",
    xAxisLabel: "Red",
    yAxisLabel: "Blue",
    centered: false,
    magnitudeLabel: "Brightness",
    formatMagnitude: (mag) => {
      const v = Math.round(mag * 10) / 10;
      return `${v < 1 ? v.toFixed(1) : v} (${brightnessName(mag)})`;
    },
    vectorLabel: (angle, mag) => `${brightnessName(mag)} ${colorName(angle)}`,
    hueColor: colorFromAngle,
  },
];

// --- Coordinate system ---
const MAX_UNITS = 4;
const SVG_SIZE = 350;
const PAD = 45;

function fmt(n: number): string {
  return n.toFixed(2);
}

// --- Direction label ---
function directionLabel(angle: number): string {
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const deg = a * 180 / Math.PI;
  if (deg < 22.5) return "East";
  if (deg < 67.5) return "North-East";
  if (deg < 112.5) return "North";
  if (deg < 157.5) return "North-West";
  if (deg < 202.5) return "West";
  if (deg < 247.5) return "South-West";
  if (deg < 292.5) return "South";
  if (deg < 337.5) return "South-East";
  return "East";
}

// --- Rotary direction control ---
const KNOB_SIZE = 120;
const KNOB_CX = KNOB_SIZE / 2;
const KNOB_CY = KNOB_SIZE / 2;
const KNOB_R = 44;

function RotaryControl({
  angle,
  onChange,
  color,
  label,
  showCardinals = true,
  quarterCircle = false,
  axisLabels,
}: {
  angle: number;
  onChange: (angle: number) => void;
  color?: string;
  label?: string;
  showCardinals?: boolean;
  /** Only show a quarter arc (0 to π/2) instead of a full circle */
  quarterCircle?: boolean;
  /** Labels for the axes — shown at the ends of the quarter arc */
  axisLabels?: { x: string; y: string };
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const indicatorX = KNOB_CX + KNOB_R * Math.cos(-angle);
  const indicatorY = KNOB_CY + KNOB_R * Math.sin(-angle);

  const getAngle = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * KNOB_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * KNOB_SIZE;
    return Math.atan2(-(my - KNOB_CY), mx - KNOB_CX);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    onChange(getAngle(e));
  }, [onChange, getAngle]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    onChange(getAngle(e));
  }, [onChange, getAngle]);

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  const accentColor = color ?? "var(--color-accent)";

  // Cardinal direction labels around the ring
  const labelR = KNOB_R + 14;
  const cardinals = [
    { label: "E", a: 0 }, { label: "N", a: Math.PI / 2 },
    { label: "W", a: Math.PI }, { label: "S", a: -Math.PI / 2 },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Direction</div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${KNOB_SIZE} ${KNOB_SIZE}`}
        width={KNOB_SIZE}
        height={KNOB_SIZE}
        overflow="visible"
        className="cursor-crosshair touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {quarterCircle ? (
          /* Quarter arc from 0 to π/2 */
          <>
            <path
              d={`M ${KNOB_CX + KNOB_R} ${KNOB_CY} A ${KNOB_R} ${KNOB_R} 0 0 0 ${KNOB_CX} ${KNOB_CY - KNOB_R}`}
              fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1.5}
            />
            {/* Short axis stubs */}
            <line x1={KNOB_CX} y1={KNOB_CY} x2={KNOB_CX + KNOB_R + 4} y2={KNOB_CY} stroke="currentColor" strokeOpacity={0.06} />
            <line x1={KNOB_CX} y1={KNOB_CY} x2={KNOB_CX} y2={KNOB_CY - KNOB_R - 4} stroke="currentColor" strokeOpacity={0.06} />
            {axisLabels && (
              <>
                <text x={KNOB_CX + KNOB_R + 8} y={KNOB_CY + 3} fontSize={9} fill="currentColor" opacity={0.3} fontWeight={600}>
                  {axisLabels.x}
                </text>
                <text x={KNOB_CX} y={KNOB_CY - KNOB_R - 8} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3} fontWeight={600}>
                  {axisLabels.y}
                </text>
              </>
            )}
          </>
        ) : (
          <>
            <circle cx={KNOB_CX} cy={KNOB_CY} r={KNOB_R} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1.5} />
            {/* Cardinal labels */}
            {showCardinals && cardinals.map((c) => (
              <text
                key={c.label}
                x={KNOB_CX + labelR * Math.cos(-c.a)}
                y={KNOB_CY + labelR * Math.sin(-c.a) + 3}
                textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3} fontWeight={600}
              >
                {c.label}
              </text>
            ))}
          </>
        )}
        <line x1={KNOB_CX} y1={KNOB_CY} x2={indicatorX} y2={indicatorY} stroke={accentColor} strokeWidth={2} strokeOpacity={0.5} />
        <circle cx={indicatorX} cy={indicatorY} r={7} fill={accentColor} />
        <circle cx={indicatorX} cy={indicatorY} r={12} fill={accentColor} fillOpacity={0.15} />
      </svg>
      {label && (
        <div className="text-xs font-medium" style={{ color: accentColor }}>{label}</div>
      )}
    </div>
  );
}

// --- Main component ---

export function AnimalDirectionMagnitude() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [angle, setAngle] = useState(Math.PI / 4); // radians, 45°
  const [magnitude, setMagnitude] = useState(2.0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef(false);

  const example = EXAMPLES[exampleIdx];
  const centered = example.centered ?? false;

  // Clamp angle for non-centered (color): keep in first quadrant
  const effectiveAngle = !centered
    ? Math.max(0.05, Math.min(Math.PI / 2 - 0.05, angle))
    : angle;

  const unitX = Math.cos(effectiveAngle);
  const unitY = Math.sin(effectiveAngle);
  const scaledX = unitX * magnitude;
  const scaledY = unitY * magnitude;

  // Coordinate system
  const PLOT = SVG_SIZE - 2 * PAD;
  const UNIT_PX = centered ? PLOT / (MAX_UNITS * 2) : PLOT / MAX_UNITS;
  const originX = centered ? PAD + PLOT / 2 : PAD;
  const originY = centered ? PAD + PLOT / 2 : SVG_SIZE - PAD;
  const toSvgX = (v: number) => originX + v * UNIT_PX;
  const toSvgY = (v: number) => originY - v * UNIT_PX;

  // Grid ticks
  const minTick = centered ? -MAX_UNITS : 0;
  const maxTick = MAX_UNITS;
  const gridTicks = Array.from({ length: maxTick - minTick + 1 }, (_, i) => minTick + i);

  // Fixed magnitude range
  const sliderMax = MAX_UNITS;

  // Dragging the vector tip on the SVG
  const handleSvgPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    updateFromSvg(e);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centered]);

  const updateFromSvg = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const wx = (mx - originX) / UNIT_PX;
    const wy = -(my - originY) / UNIT_PX;
    const mag = Math.sqrt(wx * wx + wy * wy);
    if (mag > 0.05) {
      let newAngle = Math.atan2(wy, wx);
      if (!centered) newAngle = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, newAngle));
      setAngle(newAngle);
      setMagnitude(Math.min(Math.max(0.1, mag), sliderMax));
    }
  }, [originX, originY, centered, sliderMax]);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    updateFromSvg(e);
  }, [updateFromSvg]);

  const handleSvgPointerUp = useCallback(() => { dragRef.current = false; }, []);

  const handleReset = useCallback(() => {
    setAngle(Math.PI / 4);
    setMagnitude(2.0);
  }, []);

  const handleExampleChange = useCallback((idx: number) => {
    setExampleIdx(idx);
    setAngle(Math.PI / 4);
    setMagnitude(2.0);
  }, []);

  // Color for the accent in color mode
  const accentColor = example.hueColor ? example.hueColor(effectiveAngle) : undefined;
  const vecColor = accentColor ?? "var(--color-accent)";

  // SVG positions
  const tipX = toSvgX(scaledX);
  const tipY = toSvgY(scaledY);
  const unitTipX = toSvgX(unitX);
  const unitTipY = toSvgY(unitY);

  return (
    <WidgetContainer
      title="Direction and Magnitude"
      description="Direction = what kind of thing. Magnitude = how much."
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={EXAMPLES.map((ex, i) => ({ id: String(i), label: ex.label }))}
        activeTab={String(exampleIdx)}
        onTabChange={(id) => handleExampleChange(Number(id))}
      />

      {example.id === "color" && (
        <div className="mb-3 text-[11px] text-muted">
          Real color has three dimensions (red, green, blue), but we show only two here because 2D is easier to visualize.
        </div>
      )}

      {/* Controls: rotary direction + magnitude slider */}
      <div className="mb-4 flex items-start gap-6">
        <RotaryControl
          angle={effectiveAngle}
          onChange={(a) => {
            const clamped = !centered ? Math.max(0.05, Math.min(Math.PI / 2 - 0.05, a)) : a;
            setAngle(clamped);
          }}
          color={accentColor}
          label={example.id === "velocity" ? directionLabel(effectiveAngle) : example.id === "color" ? colorName(effectiveAngle) : undefined}
          showCardinals={example.id === "velocity"}
          quarterCircle={example.id === "color"}
          axisLabels={example.id === "color" ? { x: "Red", y: "Blue" } : undefined}
        />
        <div className="flex-1 pt-1">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">{example.magnitudeLabel}</div>
          <SliderControl
            label=""
            value={magnitude}
            min={0.1}
            max={sliderMax}
            step={0.01}
            onChange={setMagnitude}
            formatValue={() => example.formatMagnitude(magnitude)}
          />
        </div>
      </div>

      {/* SVG visualization */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="mx-auto w-full max-w-[400px] cursor-crosshair touch-none select-none"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
      >
        {/* Grid lines */}
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
            {(t !== 0 || !centered) && (
              <text x={toSvgX(t)} y={toSvgY(minTick) + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>
                {t}
              </text>
            )}
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
        <text x={toSvgX(0) - 14} y={toSvgY(maxTick) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.5} fontWeight={600}>
          {example.yAxisLabel}
        </text>

        {/* Unit circle / arc */}
        {centered ? (
          <circle
            cx={toSvgX(0)} cy={toSvgY(0)} r={UNIT_PX}
            fill="none" stroke={vecColor}
            strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 3"
          />
        ) : (
          <path
            d={`M ${toSvgX(1)} ${toSvgY(0)} A ${UNIT_PX} ${UNIT_PX} 0 0 0 ${toSvgX(0)} ${toSvgY(1)}`}
            fill="none" stroke={vecColor}
            strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 3"
          />
        )}

        {/* Scaled vector arrow (solid, wider) */}
        {magnitude > 0.1 && (
          <>
            <line
              x1={toSvgX(0)} y1={toSvgY(0)} x2={tipX} y2={tipY}
              stroke={vecColor} strokeWidth={3} strokeOpacity={0.3}
            />
            {(() => {
              const a = Math.atan2(tipY - toSvgY(0), tipX - toSvgX(0));
              const hl = 8;
              return (
                <polygon
                  points={`${tipX},${tipY} ${tipX - hl * Math.cos(a - 0.35)},${tipY - hl * Math.sin(a - 0.35)} ${tipX - hl * Math.cos(a + 0.35)},${tipY - hl * Math.sin(a + 0.35)}`}
                  fill={vecColor} fillOpacity={0.3}
                />
              );
            })()}
          </>
        )}

        {/* Unit vector arrow (dashed) */}
        <line
          x1={toSvgX(0)} y1={toSvgY(0)} x2={unitTipX} y2={unitTipY}
          stroke={vecColor} strokeWidth={2} strokeDasharray="4 3"
        />
        {(() => {
          const a = Math.atan2(unitTipY - toSvgY(0), unitTipX - toSvgX(0));
          const hl = 7;
          return (
            <polygon
              points={`${unitTipX},${unitTipY} ${unitTipX - hl * Math.cos(a - 0.35)},${unitTipY - hl * Math.sin(a - 0.35)} ${unitTipX - hl * Math.cos(a + 0.35)},${unitTipY - hl * Math.sin(a + 0.35)}`}
              fill={vecColor}
            />
          );
        })()}

        {/* Unit vector dot */}
        <circle cx={unitTipX} cy={unitTipY} r={5} fill={vecColor} />
        <text x={unitTipX + 10} y={unitTipY + 4} fontSize={9} fill={vecColor} fontWeight={600} opacity={0.7}>
          direction
        </text>

        {/* Drag handle at vector tip */}
        <circle cx={tipX} cy={tipY} r={10} fill={vecColor} fillOpacity={0.15} className="cursor-grab" />
        <text x={tipX + 8} y={tipY - 4} fontSize={10} fill={vecColor} fontWeight={600} opacity={0.7}>
          {example.vectorLabel(effectiveAngle, magnitude)}
        </text>
      </svg>

      {/* Readout */}
      <div className="mt-3">
        <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1" style={{ fontVariantNumeric: "tabular-nums" }}>
          <div className="font-mono text-xs">
            <span className="text-muted">Direction (unit vector):</span>{" "}
            <span style={{ color: vecColor }}>({fmt(unitX)}, {fmt(unitY)})</span>
          </div>
          <div className="font-mono text-xs">
            <span className="text-muted">Magnitude:</span>{" "}
            <span style={{ color: vecColor }}>{example.formatMagnitude(magnitude)}</span>
          </div>
          <div className="font-mono text-xs text-muted pt-1 border-t border-foreground/5">
            Full vector: {magnitude.toFixed(1)} × ({fmt(unitX)}, {fmt(unitY)}) = ({fmt(scaledX)}, {fmt(scaledY)})
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
