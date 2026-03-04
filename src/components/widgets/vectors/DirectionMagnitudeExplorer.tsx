"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "./VectorCard";

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 100;
const MAX_MAG = 1.4;

function Arrow({
  x, y, color, width = 2.5, label,
}: {
  x: number; y: number; color: string; width?: number; label?: string;
}) {
  const sx = CX + x * SCALE;
  const sy = CY - y * SCALE;
  const len = Math.sqrt(x * x + y * y);
  if (len < 0.01) return null;
  const angle = Math.atan2(sy - CY, sx - CX);
  const headLen = 8;
  const h1x = sx - headLen * Math.cos(angle - 0.35);
  const h1y = sy - headLen * Math.sin(angle - 0.35);
  const h2x = sx - headLen * Math.cos(angle + 0.35);
  const h2y = sy - headLen * Math.sin(angle + 0.35);

  return (
    <g>
      <line x1={CX} y1={CY} x2={sx} y2={sy} stroke={color} strokeWidth={width} />
      <polygon points={`${sx},${sy} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />
      {label && (
        <text x={sx + 8} y={sy - 4} fontSize={11} fill={color} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
}

function SvgGrid() {
  return (
    <>
      {[-1, 0, 1].map((t) => (
        <g key={t}>
          <line x1={CX + t * SCALE} y1={0} x2={CX + t * SCALE} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.06} />
          <line x1={0} y1={CY - t * SCALE} x2={SVG_SIZE} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.06} />
        </g>
      ))}
      {[-1, 0, 1].map((t) => (
        <g key={`tick-${t}`}>
          <text x={CX + t * SCALE} y={CY + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
          {t !== 0 && (
            <text x={CX - 10} y={CY - t * SCALE + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
          )}
        </g>
      ))}
      <line x1={0} y1={CY} x2={SVG_SIZE} y2={CY} stroke="currentColor" strokeOpacity={0.15} />
      <line x1={CX} y1={0} x2={CX} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.15} />
    </>
  );
}

type Tab = "vector" | "unit-mag";

const TABS: { id: Tab; label: string }[] = [
  { id: "vector", label: "Vector" },
  { id: "unit-mag", label: "Unit Vector × Magnitude" },
];

export function DirectionMagnitudeExplorer() {
  const [angle, setAngle] = useState(0.7);
  const [magnitude, setMagnitude] = useState(1.0);
  const [tab, setTab] = useState<Tab>("vector");

  const unitX = Math.cos(angle);
  const unitY = Math.sin(angle);
  const vecX = unitX * magnitude;
  const vecY = unitY * magnitude;

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const handleReset = useCallback(() => {
    setAngle(0.7);
    setMagnitude(1.0);
    setTab("vector");
  }, []);

  const applyDrag = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const wx = ((clientX - rect.left) / rect.width * SVG_SIZE - CX) / SCALE;
    const wy = -((clientY - rect.top) / rect.height * SVG_SIZE - CY) / SCALE;
    const mag = Math.sqrt(wx * wx + wy * wy);
    setMagnitude(Math.min(mag, MAX_MAG));
    if (mag > 0.01) setAngle(Math.atan2(wy, wx));
  }, []);

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

  return (
    <WidgetContainer
      title="2D Vectors"
      description="When a vector has two dimensions, we can draw it as an arrow"
      onReset={handleReset}
    >
      <WidgetTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <div className="grid gap-4 sm:grid-cols-[auto_1fr] items-start">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto w-full max-w-[300px] cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <SvgGrid />

          {/* Unit circle — visible in unit-mag mode */}
          {tab === "unit-mag" && (
            <circle
              cx={CX} cy={CY} r={SCALE}
              fill="none" stroke="#3b82f6" strokeWidth={1.5}
              strokeOpacity={0.2} strokeDasharray="4 3"
            />
          )}

          {/* Unit vector (only in unit-mag tab) */}
          {tab === "unit-mag" && (
            <Arrow x={unitX} y={unitY} color="#3b82f6" width={2} label="unit" />
          )}

          {/* Full vector */}
          <Arrow x={vecX} y={vecY} color="var(--color-accent)" width={2.5} label="v" />

          {/* Drag handle */}
          <circle
            cx={CX + vecX * SCALE} cy={CY - vecY * SCALE} r={10}
            fill="var(--color-accent)" fillOpacity={0.15} className="cursor-grab"
          />
        </svg>

        <div className="space-y-3">
          {tab === "vector" && (
            <>
              <VectorCard
                name="v" emoji=""
                properties={["x", "y"]}
                values={[vecX, vecY]}
                signed signedMax={MAX_MAG}
                animate={false}
              />
              <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Magnitude</div>
                <div className="font-mono text-xs">
                  √({vecX.toFixed(2)}² + {vecY.toFixed(2)}²)
                </div>
                <div className="font-mono text-xs">
                  = √({(vecX * vecX).toFixed(2)} + {(vecY * vecY).toFixed(2)})
                </div>
                <div className="font-mono text-sm font-bold">
                  = {magnitude.toFixed(2)}
                </div>
              </div>
            </>
          )}

          {tab === "unit-mag" && (
            <>
              <div className="flex gap-2">
                <VectorCard
                  name="unit" emoji=""
                  properties={["x", "y"]}
                  values={[unitX, unitY]}
                  barColor="#3b82f6"
                  label="unit vector" labelColor="#3b82f6"
                  className="flex-1 min-w-0"
                  signed signedMax={1}
                  animate={false}
                />
              </div>

              <SliderControl
                label="magnitude"
                value={magnitude}
                min={0}
                max={MAX_MAG}
                step={0.01}
                onChange={setMagnitude}
              />

              <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Unit vector × magnitude</div>
                {["x", "y"].map((dim, i) => {
                  const uv = i === 0 ? unitX : unitY;
                  const fv = i === 0 ? vecX : vecY;
                  return (
                    <div key={dim} className="font-mono text-sm">
                      <span className="text-muted">{dim}:</span>{" "}
                      <span className="text-blue-500">{uv.toFixed(2)}</span>
                      {" × "}
                      <span className="text-amber-500">{magnitude.toFixed(2)}</span>
                      {" = "}
                      <span className="font-semibold">{fv.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <VectorCard
                name="v" emoji=""
                properties={["x", "y"]}
                values={[vecX, vecY]}
                barColor="#f59e0b"
                label={`× ${magnitude.toFixed(2)}`} labelColor="#f59e0b"
                signed signedMax={MAX_MAG}
                animate={false}
              />
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
