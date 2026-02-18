"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

const SVG_SIZE = 320;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 100; // 1 unit = 100px, so the unit vector reaches exactly one grid square
const MAX_MAG = 1.4;

function Arrow({
  x, y, color, width = 2, opacity = 1, label, dashed = false,
}: {
  x: number; y: number; color: string; width?: number; opacity?: number; label?: string; dashed?: boolean;
}) {
  const sx = CX + x * SCALE;
  const sy = CY - y * SCALE;
  const len = Math.sqrt(x * x + y * y);
  if (len < 0.01) return null;
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

// Fixed-width number formatting: always 5 chars wide (e.g. " 0.70", "-1.23")
function fmt(n: number): string {
  const s = n.toFixed(2);
  return s.length < 5 ? " " + s : s;
}

type Mode = "dir-mag" | "unit-mag" | "raw";

const MODE_TABS: { id: Mode; label: string }[] = [
  { id: "dir-mag", label: "Direction + Length" },
  { id: "unit-mag", label: "Unit Vector + Length" },
  { id: "raw", label: "Raw Vector" },
];

export function DirectionMagnitudeExplorer() {
  const [angle, setAngle] = useState(0.7); // radians
  const [magnitude, setMagnitude] = useState(1.0);
  const [mode, setMode] = useState<Mode>("dir-mag");

  const unitX = Math.cos(angle);
  const unitY = Math.sin(angle);
  const vecX = unitX * magnitude;
  const vecY = unitY * magnitude;

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const handleReset = useCallback(() => {
    setAngle(0.7);
    setMagnitude(1.0);
  }, []);

  const svgToWorld = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * SVG_SIZE;
    const svgY = ((clientY - rect.top) / rect.height) * SVG_SIZE;
    return [(svgX - CX) / SCALE, -(svgY - CY) / SCALE];
  }, []);

  const applyDrag = useCallback((clientX: number, clientY: number) => {
    const [wx, wy] = svgToWorld(clientX, clientY);
    const mag = Math.sqrt(wx * wx + wy * wy);
    setMagnitude(Math.min(mag, MAX_MAG));
    if (mag > 0.01) setAngle(Math.atan2(wy, wx));
  }, [svgToWorld]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    applyDrag(e.clientX, e.clientY);
  }, [applyDrag]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    applyDrag(e.clientX, e.clientY);
  }, [applyDrag]);

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  // When changing unit vector components, keep it normalized to length 1
  const handleUnitX = useCallback((val: number) => {
    const clamped = Math.max(-1, Math.min(1, val));
    const newY = Math.sqrt(Math.max(0, 1 - clamped * clamped)) * (unitY >= 0 ? 1 : -1);
    setAngle(Math.atan2(newY, clamped));
  }, [unitY]);

  const handleUnitY = useCallback((val: number) => {
    const clamped = Math.max(-1, Math.min(1, val));
    const newX = Math.sqrt(Math.max(0, 1 - clamped * clamped)) * (unitX >= 0 ? 1 : -1);
    setAngle(Math.atan2(clamped, newX));
  }, [unitX]);

  // When changing raw x/y, derive angle and magnitude
  const handleRawX = useCallback((val: number) => {
    const newY = vecY;
    const mag = Math.sqrt(val * val + newY * newY);
    if (mag > 0.01) setAngle(Math.atan2(newY, val));
    setMagnitude(Math.min(mag, MAX_MAG));
  }, [vecY]);

  const handleRawY = useCallback((val: number) => {
    const newX = vecX;
    const mag = Math.sqrt(newX * newX + val * val);
    if (mag > 0.01) setAngle(Math.atan2(val, newX));
    setMagnitude(Math.min(mag, MAX_MAG));
  }, [vecX]);

  const angleDeg = ((angle * 180) / Math.PI + 360) % 360;

  return (
    <WidgetContainer
      title="Direction and Length"
      description="Every vector = a direction (unit vector) × a length"
      onReset={handleReset}
    >
      {/* Mode tabs */}
      <WidgetTabs tabs={MODE_TABS} activeTab={mode} onTabChange={setMode} />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full max-w-[340px] cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid lines at every 1 unit */}
          {[-1, 0, 1].map((t) => (
            <g key={t}>
              <line x1={CX + t * SCALE} y1={0} x2={CX + t * SCALE} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.06} />
              <line x1={0} y1={CY - t * SCALE} x2={SVG_SIZE} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.06} />
            </g>
          ))}
          {/* Tick labels at -1, 0, 1 */}
          {[-1, 0, 1].map((t) => (
            <g key={`tick-${t}`}>
              <text x={CX + t * SCALE} y={CY + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
              {t !== 0 && (
                <text x={CX - 10} y={CY - t * SCALE + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
              )}
            </g>
          ))}
          {/* Axes */}
          <line x1={0} y1={CY} x2={SVG_SIZE} y2={CY} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
          <line x1={CX} y1={0} x2={CX} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />

          {/* Unit circle — more prominent in unit-mag mode */}
          <circle
            cx={CX} cy={CY} r={SCALE}
            fill="none" stroke="var(--color-accent)" strokeWidth={1}
            strokeOpacity={mode === "unit-mag" ? 0.3 : 0.15}
            strokeDasharray="3 3"
          />

          {/* Unit vector (dashed) — always length 1 in grid units */}
          <Arrow x={unitX} y={unitY} color="#94a3b8" width={1.5} dashed label="unit" />

          {/* Full vector */}
          <Arrow x={vecX} y={vecY} color="var(--color-accent)" width={2.5} label="v" />

          {/* Angle arc with label */}
          {magnitude > 0.1 && (() => {
            // Draw arc from positive x-axis to the vector direction
            // In SVG coords: x-axis is angle 0, vector is at svgAngle
            const svgAngle = -angle; // flip y for SVG
            const r = 25;
            const x1 = CX + r; // start on positive x-axis
            const y1 = CY;
            const x2 = CX + r * Math.cos(svgAngle);
            const y2 = CY + r * Math.sin(svgAngle);
            // Always take the short arc
            const absDiff = Math.abs(angle);
            const largeArc = absDiff > Math.PI ? 1 : 0;
            // If angle > 0, vector is above x-axis (svgAngle < 0), sweep CCW (0)
            // If angle < 0, vector is below x-axis (svgAngle > 0), sweep CW (1)
            const sweep = angle > 0 ? 0 : 1;
            // Label at midpoint of arc
            const midSvgAngle = svgAngle / 2;
            const labelR = 38;
            const lx = CX + labelR * Math.cos(midSvgAngle);
            const ly = CY + labelR * Math.sin(midSvgAngle);
            return (
              <>
                <path
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`}
                  fill="none" stroke="var(--color-accent)" strokeWidth={1} strokeOpacity={0.5}
                />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="var(--color-accent)" opacity={0.7}>
                  {Math.round(angleDeg)}°
                </text>
              </>
            );
          })()}
        </svg>

        {/* Controls & readout */}
        <div className="space-y-3 min-w-[180px]">
          {mode === "dir-mag" && (
            <>
              <SliderControl
                label="Direction"
                value={angleDeg}
                min={0}
                max={360}
                step={1}
                onChange={(v) => setAngle((v * Math.PI) / 180)}
                formatValue={(v) => `${Math.round(v)}°`}
              />
              <SliderControl
                label="Length"
                value={magnitude}
                min={0}
                max={MAX_MAG}
                step={0.01}
                onChange={setMagnitude}
              />
            </>
          )}

          {mode === "unit-mag" && (
            <>
              <SliderControl
                label="unit x"
                value={parseFloat(unitX.toFixed(2))}
                min={-1}
                max={1}
                step={0.01}
                onChange={handleUnitX}
              />
              <SliderControl
                label="unit y"
                value={parseFloat(unitY.toFixed(2))}
                min={-1}
                max={1}
                step={0.01}
                onChange={handleUnitY}
              />
              <SliderControl
                label="Length"
                value={magnitude}
                min={0}
                max={MAX_MAG}
                step={0.01}
                onChange={setMagnitude}
              />
            </>
          )}

          {mode === "raw" && (
            <>
              <SliderControl
                label="x"
                value={parseFloat(vecX.toFixed(2))}
                min={-MAX_MAG}
                max={MAX_MAG}
                step={0.01}
                onChange={handleRawX}
              />
              <SliderControl
                label="y"
                value={parseFloat(vecY.toFixed(2))}
                min={-MAX_MAG}
                max={MAX_MAG}
                step={0.01}
                onChange={handleRawY}
              />
            </>
          )}

          {/* Readout */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
            <div className="font-mono text-xs whitespace-pre">
              v = (<span className="text-accent">{fmt(vecX)}</span>, <span className="text-accent">{fmt(vecY)}</span>)
            </div>
            <div className="font-mono text-xs text-muted whitespace-pre">
              unit × length = ({fmt(unitX)}, {fmt(unitY)}) × {fmt(magnitude)}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

