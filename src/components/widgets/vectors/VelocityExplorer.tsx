"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "./VectorCard";

const SVG_SIZE = 280;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 80;
const MAX_VAL = 1.5;

function Arrow({
  fx, fy, tx, ty, color, width = 2.5,
}: {
  fx: number; fy: number; tx: number; ty: number;
  color: string; width?: number;
}) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return null;
  const angle = Math.atan2(dy, dx);
  const hl = 8;
  const h1x = tx - hl * Math.cos(angle - 0.4);
  const h1y = ty - hl * Math.sin(angle - 0.4);
  const h2x = tx - hl * Math.cos(angle + 0.4);
  const h2y = ty - hl * Math.sin(angle + 0.4);

  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={width} />
      <polygon points={`${tx},${ty} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />
    </g>
  );
}

export function VelocityExplorer() {
  const [vx, setVx] = useState(0.8);
  const [vy, setVy] = useState(0.6);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const handleReset = useCallback(() => {
    setVx(0.8);
    setVy(0.6);
  }, []);

  const tipX = CX + vx * SCALE;
  const tipY = CY - vy * SCALE;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const clamp = (v: number) => Math.max(-MAX_VAL, Math.min(MAX_VAL, v));
    setVx(clamp((mx - CX) / SCALE));
    setVy(clamp(-(my - CY) / SCALE));
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const clamp = (v: number) => Math.max(-MAX_VAL, Math.min(MAX_VAL, v));
    setVx(clamp((mx - CX) / SCALE));
    setVy(clamp(-(my - CY) / SCALE));
  }, []);

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  const speed = Math.sqrt(vx * vx + vy * vy);

  // Direction label
  const dirLabel = (() => {
    if (speed < 0.05) return "Stationary";
    const parts: string[] = [];
    if (vy > 0.15) parts.push("North");
    else if (vy < -0.15) parts.push("South");
    if (vx > 0.15) parts.push("East");
    else if (vx < -0.15) parts.push("West");
    return parts.join("-") || "Stationary";
  })();

  return (
    <WidgetContainer
      title="Velocity as a Vector"
      description="Drag the arrow to change speed and direction"
      onReset={handleReset}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_auto] justify-start items-start">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto w-full max-w-[280px] cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Compass labels */}
          <text x={CX} y={18} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.3} fontWeight={600}>N</text>
          <text x={CX} y={SVG_SIZE - 8} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.3} fontWeight={600}>S</text>
          <text x={SVG_SIZE - 10} y={CY + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.3} fontWeight={600}>E</text>
          <text x={12} y={CY + 4} textAnchor="start" fontSize={11} fill="currentColor" opacity={0.3} fontWeight={600}>W</text>

          {/* Faint axes */}
          <line x1={CX} y1={25} x2={CX} y2={SVG_SIZE - 25} stroke="currentColor" strokeOpacity={0.08} />
          <line x1={25} y1={CY} x2={SVG_SIZE - 25} y2={CY} stroke="currentColor" strokeOpacity={0.08} />

          {/* Grid circles */}
          <circle cx={CX} cy={CY} r={SCALE * 0.5} fill="none" stroke="currentColor" strokeOpacity={0.05} />
          <circle cx={CX} cy={CY} r={SCALE} fill="none" stroke="currentColor" strokeOpacity={0.08} />

          {/* Velocity arrow */}
          <Arrow fx={CX} fy={CY} tx={tipX} ty={tipY} color="#3b82f6" />

          {/* Drag handle */}
          <circle cx={tipX} cy={tipY} r={12} fill="#3b82f6" fillOpacity={0.15} className="cursor-grab" />

          {/* Center dot */}
          <circle cx={CX} cy={CY} r={3} fill="currentColor" opacity={0.2} />
        </svg>

        <div className="w-72">
          <VectorCard
            name="Velocity"
            emoji=""
            properties={["East / West", "North / South"]}
            values={[vx, vy]}
            signed
            animate={false}
            labelWidth="w-24"
          />

          <div className="mt-3 rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="font-mono text-xs">
              velocity = ({vx.toFixed(2)}, {vy.toFixed(2)})
            </div>
            <div className="text-sm text-muted">
              Heading <span className="font-semibold text-foreground">{dirLabel}</span> at speed{" "}
              <span className="font-semibold text-foreground">{speed.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
