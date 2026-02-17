"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

const SVG_SIZE = 320;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 100;
const MAX_MAG = 1.3;

function Arrow({
  x, y, color, width = 2, opacity = 1, label, dashed = false,
}: {
  x: number; y: number; color: string; width?: number; opacity?: number; label?: string; dashed?: boolean;
}) {
  const sx = CX + x * SCALE;
  const sy = CY - y * SCALE;
  const len = Math.sqrt(x * x + y * y);
  if (len < 0.01) return null;
  // Arrow head
  const angle = Math.atan2(-y, x);
  const headLen = 8;
  const h1x = sx - headLen * Math.cos(angle - 0.35);
  const h1y = sy + headLen * Math.sin(angle - 0.35);
  const h2x = sx - headLen * Math.cos(angle + 0.35);
  const h2y = sy + headLen * Math.sin(angle + 0.35);

  return (
    <g>
      <line
        x1={CX} y1={CY} x2={sx} y2={sy}
        stroke={color} strokeWidth={width} strokeOpacity={opacity}
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      <polygon points={`${sx},${sy} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} fillOpacity={opacity} />
      {label && (
        <text x={sx + 8} y={sy - 4} fontSize={11} fill={color} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
}

const DIR_TABS: { id: "free" | "constrained"; label: string }[] = [
  { id: "free", label: "Free drag" },
  { id: "constrained", label: "Direction + Magnitude" },
];

export function DirectionMagnitudeExplorer() {
  const [angle, setAngle] = useState(0.7); // radians
  const [magnitude, setMagnitude] = useState(1.0);
  const [mode, setMode] = useState<"free" | "constrained">("free");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const unitX = Math.cos(angle);
  const unitY = Math.sin(angle);
  const vecX = unitX * magnitude;
  const vecY = unitY * magnitude;

  const handleReset = useCallback(() => {
    setAngle(0.7);
    setMagnitude(1.0);
    setMode("free");
  }, []);

  const svgToWorld = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * SVG_SIZE;
    const svgY = ((clientY - rect.top) / rect.height) * SVG_SIZE;
    return [(svgX - CX) / SCALE, -(svgY - CY) / SCALE];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const [wx, wy] = svgToWorld(e.clientX, e.clientY);
    if (mode === "free") {
      const mag = Math.sqrt(wx * wx + wy * wy);
      setMagnitude(Math.min(mag, MAX_MAG));
      setAngle(Math.atan2(wy, wx));
    } else {
      // In constrained mode, only change angle
      setAngle(Math.atan2(wy, wx));
    }
  }, [mode, svgToWorld]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const [wx, wy] = svgToWorld(e.clientX, e.clientY);
    if (mode === "free") {
      const mag = Math.sqrt(wx * wx + wy * wy);
      setMagnitude(Math.min(mag, MAX_MAG));
      setAngle(Math.atan2(wy, wx));
    } else {
      setAngle(Math.atan2(wy, wx));
    }
  }, [mode, svgToWorld]);

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  const angleDeg = ((angle * 180) / Math.PI + 360) % 360;

  return (
    <WidgetContainer
      title="Direction and Magnitude"
      description="Every vector = a direction (unit vector) times a length (magnitude)"
      onReset={handleReset}
    >
      {/* Mode tabs */}
      <WidgetTabs tabs={DIR_TABS} activeTab={mode} onTabChange={setMode} />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full max-w-[340px] cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid */}
          {[-1, -0.5, 0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={CX + t * SCALE} y1={0} x2={CX + t * SCALE} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.05} />
              <line x1={0} y1={CY - t * SCALE} x2={SVG_SIZE} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.05} />
            </g>
          ))}
          {/* Axes */}
          <line x1={0} y1={CY} x2={SVG_SIZE} y2={CY} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
          <line x1={CX} y1={0} x2={CX} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />

          {/* Unit circle (always shown in constrained, faint in free) */}
          <circle
            cx={CX} cy={CY} r={SCALE}
            fill="none" stroke="var(--color-accent)" strokeWidth={1}
            strokeOpacity={mode === "constrained" ? 0.3 : 0.1}
            strokeDasharray="3 3"
          />

          {/* Unit vector (dashed) */}
          <Arrow x={unitX} y={unitY} color="#94a3b8" width={1.5} dashed label="unit" />

          {/* Full vector */}
          <Arrow x={vecX} y={vecY} color="var(--color-accent)" width={2.5} label="v" />

          {/* Angle arc */}
          {magnitude > 0.1 && (
            <path
              d={describeArc(CX, CY, 25, 0, -angle)}
              fill="none" stroke="var(--color-accent)" strokeWidth={1} strokeOpacity={0.5}
            />
          )}
        </svg>

        {/* Controls & readout */}
        <div className="space-y-3 min-w-[160px]">
          {mode === "constrained" && (
            <SliderControl
              label="Magnitude"
              value={magnitude}
              min={0}
              max={MAX_MAG}
              step={0.01}
              onChange={setMagnitude}
            />
          )}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Vector</div>
            <div className="font-mono text-xs">
              v = (<span className="text-accent">{vecX.toFixed(2)}</span>, <span className="text-accent">{vecY.toFixed(2)}</span>)
            </div>
            <div className="font-mono text-xs text-muted">
              |v| = {magnitude.toFixed(2)}
            </div>
            <div className="font-mono text-xs text-muted">
              angle = {angleDeg.toFixed(0)}°
            </div>
            <div className="font-mono text-xs text-muted">
              unit = ({unitX.toFixed(2)}, {unitY.toFixed(2)})
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  // SVG arc from startAngle to endAngle (radians, CCW positive)
  const start = { x: cx + r * Math.cos(startAngle), y: cy - r * Math.sin(startAngle) };
  // Sweep: we go from 0 to -angle.  If angle is positive, sweep is CW.
  const end = { x: cx + r * Math.cos(endAngle), y: cy - r * Math.sin(endAngle) };
  const diff = Math.abs(endAngle - startAngle);
  const largeArc = diff > Math.PI ? 1 : 0;
  const sweep = endAngle < startAngle ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}
