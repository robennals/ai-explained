"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

// --- Scenario definitions ---

interface VecItem {
  name: string;
  emoji: string;
  /** If set, render a colored swatch instead of the emoji */
  swatch?: string;
  x: number;
  y: number;
}

interface Scenario {
  id: string;
  label: string;
  xAxis: string;
  yAxis: string;
  detectorLabel: string;
  inputLabel: string;
  detectors: VecItem[];
  inputs: VecItem[];
  /** If true, origin is centered and axes extend to negative values */
  centered?: boolean;
  explain: (detector: VecItem, input: VecItem, dot: number, proj: number) => string;
  /** Optional label for the green projection arrow */
  projLabel?: (detector: VecItem, dot: number) => string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "animals",
    label: "Animals",
    xAxis: "Cuddly",
    yAxis: "Scary",
    detectorLabel: "Looking for",
    inputLabel: "What you found",
    detectors: (() => {
      const raw = [
        { name: "Bear", emoji: "🐻", x: 0.50, y: 0.90 },
        { name: "Rabbit", emoji: "🐰", x: 0.90, y: 0.05 },
        { name: "Shark", emoji: "🦈", x: 0.05, y: 0.95 },
        { name: "Cat", emoji: "🐱", x: 0.95, y: 0.05 },
        { name: "Dog", emoji: "🐕", x: 0.85, y: 0.15 },
        { name: "Eagle", emoji: "🦅", x: 0.15, y: 0.40 },
        { name: "Elephant", emoji: "🐘", x: 0.40, y: 0.60 },
      ];
      return raw.map(a => { const m = Math.sqrt(a.x*a.x+a.y*a.y); return { ...a, x: a.x/m, y: a.y/m }; });
    })(),
    inputs: (() => {
      const raw = [
        { name: "Bear", emoji: "🐻", x: 0.50, y: 0.90 },
        { name: "Rabbit", emoji: "🐰", x: 0.90, y: 0.05 },
        { name: "Shark", emoji: "🦈", x: 0.05, y: 0.95 },
        { name: "Cat", emoji: "🐱", x: 0.95, y: 0.05 },
        { name: "Dog", emoji: "🐕", x: 0.85, y: 0.15 },
        { name: "Eagle", emoji: "🦅", x: 0.15, y: 0.40 },
        { name: "Elephant", emoji: "🐘", x: 0.40, y: 0.60 },
      ];
      return raw.map(a => { const m = Math.sqrt(a.x*a.x+a.y*a.y); return { ...a, x: a.x/m, y: a.y/m }; });
    })(),
    explain: (_det, _inp, _dot, proj) => {
      if (proj > 0.99) return "Identical — these animals are alike.";
      if (proj > 0.95) return "Almost identical — these animals are very alike.";
      if (proj > 0.8) return "Very similar animals.";
      if (proj > 0.5) return "Somewhat similar — they share some traits.";
      if (proj > 0.2) return "Not very similar.";
      return "Very different animals.";
    },
  },
  {
    id: "velocity",
    label: "Velocity",
    xAxis: "East",
    yAxis: "North",
    detectorLabel: "Measuring",
    inputLabel: "Vehicle",
    centered: true,
    detectors: [
      { name: "Northward speed", emoji: "⬆️", x: 0.00, y: 1.00 },
      { name: "Eastward speed", emoji: "➡️", x: 1.00, y: 0.00 },
      { name: "North-east speed", emoji: "↗️", x: 0.707, y: 0.707 },
    ],
    inputs: [
      { name: "Car north-east 60", emoji: "🚗", x: 42.4, y: 42.4 },
      { name: "Car due east 50", emoji: "🚗", x: 50, y: 0 },
      { name: "Bike north 15", emoji: "🚲", x: 0, y: 15 },
      { name: "Plane mostly north 200", emoji: "✈️", x: 60, y: 190 },
      { name: "Boat north-west 30", emoji: "⛵", x: -21.2, y: 21.2 },
    ],
    explain: (det, _inp, _dot, proj) => {
      const abs = Math.abs(proj);
      const dirName = det.name.replace(" speed", "").toLowerCase();
      if (abs < 0.5) return `Almost zero ${dirName} speed — they're moving perpendicular to that direction.`;
      const qualifier = abs < 20 ? "slowly" : abs < 80 ? "" : "fast";
      if (proj < 0) return `Moving ${qualifier} ${Math.round(abs)} mph in the opposite direction — negative ${dirName} speed.`.replace("  ", " ");
      return `Moving ${qualifier} ${dirName} at ${Math.round(abs)} mph.`.replace("  ", " ");
    },
    projLabel: (det, dot) => {
      const abs = Math.round(Math.abs(dot));
      const dirName = det.name.replace(" speed", "").toLowerCase();
      if (abs < 1) return "";
      if (dot < 0) return `-${abs} mph ${dirName}`;
      return `${abs} mph ${dirName}`;
    },
  },
  {
    id: "color",
    label: "Color",
    xAxis: "Red",
    yAxis: "Blue",
    detectorLabel: "Filter",
    inputLabel: "Light",
    detectors: [
      { name: "Red filter", emoji: "", swatch: "#ef4444", x: 1.0, y: 0.0 },
      { name: "Blue filter", emoji: "", swatch: "#3b82f6", x: 0.0, y: 1.0 },
      { name: "Purple filter", emoji: "", swatch: "#a855f7", x: 0.6, y: 0.8 },
    ],
    inputs: [
      { name: "Bright red light", emoji: "", swatch: "#ef4444", x: 3.0, y: 0.0 },
      { name: "Dim blue light", emoji: "", swatch: "#3b82f6", x: 0.0, y: 0.3 },
      { name: "Bright purple light", emoji: "", swatch: "#a855f7", x: 1.8, y: 2.4 },
      { name: "Bright white light", emoji: "", swatch: "#ffffff", x: 2.5, y: 2.5 },
      { name: "Dim pink light", emoji: "", swatch: "#f9a8d4", x: 0.6, y: 0.2 },
    ],
    explain: (_det, _inp, _dot, proj) => {
      if (proj < 0.1) return `Almost nothing gets through — the light has almost none of that color.`;
      if (proj < 0.5) return `A little light gets through. There's a small amount of that color in the light.`;
      if (proj < 1.5) return `A moderate amount of light gets through.`;
      return `Lots of light gets through — the light is rich in that color.`;
    },
  },
];

// --- SVG layout ---

const SVG_W = 360;
const SVG_H = 280;
const PAD_L = 45;
const PAD_B = 40;
const PAD_T = 20;
const PAD_R = 20;

function Arrowhead({ x, y, angle, color, size = 7 }: { x: number; y: number; angle: number; color: string; size?: number }) {
  const h1x = x - size * Math.cos(angle - 0.35);
  const h1y = y - size * Math.sin(angle - 0.35);
  const h2x = x - size * Math.cos(angle + 0.35);
  const h2y = y - size * Math.sin(angle + 0.35);
  return <polygon points={`${x},${y} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />;
}

export function DotProductAnalogies() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [detIdx, setDetIdx] = useState(0);
  const [inpIdx, setInpIdx] = useState(0);

  const scenario = SCENARIOS[scenarioIdx];
  const detector = scenario.detectors[detIdx];
  const input = scenario.inputs[inpIdx];

  // Normalize detector to unit vector
  const dLen = Math.sqrt(detector.x * detector.x + detector.y * detector.y);
  const dUnitX = dLen > 0 ? detector.x / dLen : 0;
  const dUnitY = dLen > 0 ? detector.y / dLen : 0;

  // Dot product
  const dot = input.x * dUnitX + input.y * dUnitY;

  // Projection of input onto detector direction
  const projX = dot * dUnitX;
  const projY = dot * dUnitY;

  // Auto-scale: find a good scale so vectors fit in the plot
  const maxCoord = Math.max(
    Math.abs(input.x), Math.abs(input.y),
    Math.abs(projX), Math.abs(projY),
    Math.abs(dUnitX), Math.abs(dUnitY),
    1
  );
  const plotW = SVG_W - PAD_L - PAD_R;
  const plotH = SVG_H - PAD_T - PAD_B;
  const centered = scenario.centered ?? false;
  // For centered plots, the origin is in the middle so we need to fit ±maxCoord
  const scale = centered
    ? Math.min(plotW, plotH) / (maxCoord * 2.6)
    : Math.min(plotW, plotH) / (maxCoord * 1.3);

  // Origin position in SVG pixels
  const originSvgX = centered ? PAD_L + plotW / 2 : PAD_L;
  const originSvgY = centered ? PAD_T + plotH / 2 : SVG_H - PAD_B;

  const toX = (v: number) => originSvgX + v * scale;
  const toY = (v: number) => originSvgY - v * scale;

  const handleScenarioChange = useCallback((id: string) => {
    setScenarioIdx(SCENARIOS.findIndex((s) => s.id === id));
    setDetIdx(0);
    setInpIdx(0);
  }, []);

  const handleReset = useCallback(() => {
    setDetIdx(0);
    setInpIdx(0);
  }, []);

  // Angle between detector and input
  const inputLen = Math.sqrt(input.x * input.x + input.y * input.y);
  const iUnitX = inputLen > 0 ? input.x / inputLen : 0;
  const iUnitY = inputLen > 0 ? input.y / inputLen : 0;
  const cosAngle = Math.max(-1, Math.min(1, dUnitX * iUnitX + dUnitY * iUnitY));
  const angleDeg = Math.round(Math.acos(cosAngle) * (180 / Math.PI));

  // Angles in SVG space (y-flipped) for the arc
  const detAngleSvg = Math.atan2(-(dUnitY), dUnitX);   // SVG y is flipped
  const inpAngleSvg = Math.atan2(-(iUnitY), iUnitX);

  // Component-wise computation display
  const comp1 = input.x * dUnitX;
  const comp2 = input.y * dUnitY;

  return (
    <WidgetContainer
      title="Dot Product"
      description="How much of this kind of thing is there?"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={SCENARIOS.map((s) => ({ id: s.id, label: s.label }))}
        activeTab={scenario.id}
        onTabChange={handleScenarioChange}
      />

      {/* Selector rows */}
      <div className="mb-3 space-y-2">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted">{scenario.detectorLabel}</div>
          <div className="flex flex-wrap gap-1.5">
            {scenario.detectors.map((d, i) => (
              <button
                key={d.name}
                onClick={() => setDetIdx(i)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  i === detIdx
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {d.swatch
                  ? <span className="inline-block w-3 h-3 rounded-sm border border-foreground/10" style={{ backgroundColor: d.swatch }} />
                  : <span>{d.emoji}</span>}
                <span>{d.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted">{scenario.inputLabel}</div>
          <div className="flex flex-wrap gap-1.5">
            {scenario.inputs.map((inp, i) => (
              <button
                key={inp.name}
                onClick={() => setInpIdx(i)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  i === inpIdx
                    ? "bg-blue-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {inp.swatch
                  ? <span className="inline-block w-3 h-3 rounded-sm border border-foreground/10" style={{ backgroundColor: inp.swatch }} />
                  : <span>{inp.emoji}</span>}
                <span>{inp.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG visualization */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto w-full max-w-[450px]" overflow="visible">
        {/* Axes */}
        <line x1={PAD_L} y1={toY(0)} x2={SVG_W - PAD_R} y2={toY(0)} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
        <line x1={toX(0)} y1={PAD_T} x2={toX(0)} y2={SVG_H - PAD_B} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />

        {/* Axis labels */}
        <text x={SVG_W - PAD_R} y={toY(0) + 14} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.4} fontWeight={600}>
          {scenario.xAxis}
        </text>
        <text x={toX(0) + 6} y={PAD_T + 4} fontSize={10} fill="currentColor" opacity={0.4} fontWeight={600}>
          {scenario.yAxis}
        </text>

        {/* Unit circle arc connecting both unit vectors */}
        {(() => {
          // Unit circle radius in SVG pixels (length of 1 unit)
          const unitR = Math.abs(toX(1) - toX(0));
          // Draw the arc between the two unit vector endpoints
          const startAngle = detAngleSvg;
          const endAngle = inpAngleSvg;
          const sx = toX(0) + unitR * Math.cos(startAngle);
          const sy = toY(0) + unitR * Math.sin(startAngle);
          const ex = toX(0) + unitR * Math.cos(endAngle);
          const ey = toY(0) + unitR * Math.sin(endAngle);
          // Sweep flag: go the short way around
          const diff = ((endAngle - startAngle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
          const sweepFlag = diff > 0 ? 1 : 0;
          const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
          return (
            <path
              d={`M ${sx} ${sy} A ${unitR} ${unitR} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })()}

        {/* Angle arc (small, near origin) with label */}
        {(() => {
          const arcR = 28;
          const startAngle = detAngleSvg;
          const endAngle = inpAngleSvg;
          const sx = toX(0) + arcR * Math.cos(startAngle);
          const sy = toY(0) + arcR * Math.sin(startAngle);
          const ex = toX(0) + arcR * Math.cos(endAngle);
          const ey = toY(0) + arcR * Math.sin(endAngle);
          const diff = ((endAngle - startAngle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
          const sweepFlag = diff > 0 ? 1 : 0;
          const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
          const midAngle = startAngle + diff / 2;
          const labelR = arcR + 10;
          const lx = toX(0) + labelR * Math.cos(midAngle);
          const ly = toY(0) + labelR * Math.sin(midAngle);
          return (
            <>
              <path
                d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1.5}
              />
              <text
                x={lx} y={ly}
                fontSize={9}
                fill="currentColor"
                opacity={0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight={600}
              >
                {angleDeg}°
              </text>
            </>
          );
        })()}

        {/* Input unit vector (dashed blue, same direction as input but length 1) */}
        <line
          x1={toX(0)} y1={toY(0)}
          x2={toX(iUnitX)} y2={toY(iUnitY)}
          stroke="#3b82f6" strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeOpacity={0.5}
        />

        {/* Projection line (dashed, from input to projection point) */}
        <line
          x1={toX(input.x)} y1={toY(input.y)}
          x2={toX(projX)} y2={toY(projY)}
          stroke="currentColor" strokeWidth={1} strokeOpacity={0.2}
          strokeDasharray="3 3"
        />

        {/* Projection vector (thick, along detector direction) */}
        <line
          x1={toX(0)} y1={toY(0)}
          x2={toX(projX)} y2={toY(projY)}
          stroke="#22c55e" strokeWidth={4} strokeOpacity={0.5}
        />
        {Math.abs(dot) > 0.1 && (() => {
          const px = toX(projX);
          const py = toY(projY);
          const angle = Math.atan2(py - toY(0), px - toX(0));
          return <Arrowhead x={px} y={py} angle={angle} color="#22c55e" />;
        })()}

        {/* Detector direction (unit vector, dashed) */}
        <line
          x1={toX(0)} y1={toY(0)}
          x2={toX(dUnitX)} y2={toY(dUnitY)}
          stroke="var(--color-accent)" strokeWidth={2}
          strokeDasharray="4 3"
        />
        {(() => {
          const tx = toX(dUnitX);
          const ty = toY(dUnitY);
          const angle = Math.atan2(ty - toY(0), tx - toX(0));
          return <Arrowhead x={tx} y={ty} angle={angle} color="var(--color-accent)" />;
        })()}
        {detector.swatch
          ? <rect x={toX(dUnitX) + 6} y={toY(dUnitY) - 9} width={10} height={10} rx={2} fill={detector.swatch} opacity={0.8} />
          : <text x={toX(dUnitX) + 8} y={toY(dUnitY) - 2} fontSize={9} fill="var(--color-accent)" fontWeight={600} opacity={0.8}>
              {detector.emoji}
            </text>
        }

        {/* Input vector (solid blue) */}
        <line
          x1={toX(0)} y1={toY(0)}
          x2={toX(input.x)} y2={toY(input.y)}
          stroke="#3b82f6" strokeWidth={2.5}
        />
        {(() => {
          const tx = toX(input.x);
          const ty = toY(input.y);
          const angle = Math.atan2(ty - toY(0), tx - toX(0));
          return <Arrowhead x={tx} y={ty} angle={angle} color="#3b82f6" />;
        })()}
        {input.swatch
          ? <g>
              <rect x={toX(input.x) + 6} y={toY(input.y) - 11} width={10} height={10} rx={2} fill={input.swatch} />
              <text x={toX(input.x) + 20} y={toY(input.y) - 2} fontSize={10} fill="#3b82f6" fontWeight={600}>
                {input.name}
              </text>
            </g>
          : <text x={toX(input.x) + 8} y={toY(input.y) - 4} fontSize={10} fill="#3b82f6" fontWeight={600}>
              {input.emoji} {input.name}
            </text>
        }

        {/* Projection label */}
        {Math.abs(dot) > 0.1 && (
          <text x={toX(projX) + 6} y={toY(projY) + 14} fontSize={9} fill="#22c55e" fontWeight={600}>
            {scenario.projLabel
              ? scenario.projLabel(detector, dot)
              : `${dot > 0 ? "" : "-"}${Math.abs(dot).toFixed(1)}`}
          </text>
        )}
      </svg>

      {/* Readout */}
      <div className="mt-2 space-y-2">
        {/* Component computation */}
        <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
          <div className="font-mono text-xs text-muted">
            angle = {angleDeg}° · cosine = {cosAngle.toFixed(2)} · dot product = <span className="text-accent font-semibold">{dot.toFixed(2)}</span>
          </div>
          <div className="text-sm font-bold text-foreground">
            {scenario.explain(detector, input, dot, dot)}
          </div>
          {scenario.id === "animals" && (
            <div className="text-xs text-muted italic mt-1">
              Both vectors are unit vectors here, so this is pure cosine similarity — just direction, no magnitude.
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
