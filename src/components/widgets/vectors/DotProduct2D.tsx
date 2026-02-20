"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "./VectorCard";

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 80;

function Arrow({
  fx, fy, tx, ty, color, width = 2.5, label,
}: {
  fx: number; fy: number; tx: number; ty: number;
  color: string; width?: number; label?: string;
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
      {label && (
        <text x={tx + 8} y={ty - 8} fontSize={13} fill={color} fontWeight={700}>{label}</text>
      )}
    </g>
  );
}

function toSvg(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

function describeArc(cx: number, cy: number, r: number, a1: number, a2: number): string {
  let diff = a2 - a1;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  const end = a1 + diff;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = Math.abs(diff) > Math.PI ? 1 : 0;
  const sweep = diff > 0 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

function similarityWord(cosTheta: number): { text: string; color: string } {
  if (cosTheta > 0.95) return { text: "Very similar direction", color: "#22c55e" };
  if (cosTheta > 0.7) return { text: "Similar direction", color: "#22c55e" };
  if (cosTheta > 0.3) return { text: "Somewhat similar direction", color: "#94a3b8" };
  if (cosTheta > -0.3) return { text: "Perpendicular direction", color: "#94a3b8" };
  if (cosTheta > -0.7) return { text: "Somewhat opposite direction", color: "#f97316" };
  if (cosTheta > -0.95) return { text: "Mostly opposite direction", color: "#ef4444" };
  return { text: "Opposite direction", color: "#ef4444" };
}

function magnitudeWord(mag: number): string {
  if (mag < 0.3) return "tiny";
  if (mag < 0.7) return "small";
  if (mag < 1.1) return "medium";
  if (mag < 1.5) return "big";
  return "very big";
}

export function DotProduct2D() {
  const [a, setA] = useState<[number, number]>([1.2, 0.5]);
  const [b, setB] = useState<[number, number]>([0.4, 1.1]);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTarget = useRef<"a" | "b" | null>(null);

  const handleReset = useCallback(() => {
    setA([1.2, 0.5]);
    setB([0.4, 1.1]);
  }, []);

  const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  const dotProduct = a[0] * b[0] + a[1] * b[1];
  const cosTheta = magA > 0.01 && magB > 0.01 ? dotProduct / (magA * magB) : 0;

  const xProduct = a[0] * b[0];
  const yProduct = a[1] * b[1];

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const [asx, asy] = toSvg(a[0], a[1]);
    const [bsx, bsy] = toSvg(b[0], b[1]);
    const dA = Math.hypot(mx - asx, my - asy);
    const dB = Math.hypot(mx - bsx, my - bsy);
    dragTarget.current = dA < dB ? "a" : "b";
    (e.target as Element).setPointerCapture(e.pointerId);
    const wx = (mx - CX) / SCALE;
    const wy = -(my - CY) / SCALE;
    const clamp = (v: number) => Math.max(-1.8, Math.min(1.8, v));
    if (dragTarget.current === "a") setA([clamp(wx), clamp(wy)]);
    else setB([clamp(wx), clamp(wy)]);
  }, [a, b]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const wx = (mx - CX) / SCALE;
    const wy = -(my - CY) / SCALE;
    const clamp = (v: number) => Math.max(-1.8, Math.min(1.8, v));
    if (dragTarget.current === "a") setA([clamp(wx), clamp(wy)]);
    else setB([clamp(wx), clamp(wy)]);
  }, []);

  const handlePointerUp = useCallback(() => { dragTarget.current = null; }, []);

  const [asx, asy] = toSvg(a[0], a[1]);
  const [bsx, bsy] = toSvg(b[0], b[1]);

  const dotColor = dotProduct > 0.01 ? "#22c55e" : dotProduct < -0.01 ? "#ef4444" : "#94a3b8";
  const angleA = Math.atan2(-a[1], a[0]);
  const angleB = Math.atan2(-b[1], b[0]);
  const { text: simText, color: simColor } = similarityWord(cosTheta);

  return (
    <WidgetContainer
      title="The Dot Product"
      description="Drag the two vectors and watch the dot product change"
      onReset={handleReset}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto w-full max-w-[300px] cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid */}
          {[-1, 0, 1].map((t) => (
            <g key={t}>
              <line x1={CX + t * SCALE} y1={0} x2={CX + t * SCALE} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.05} />
              <line x1={0} y1={CY - t * SCALE} x2={SVG_SIZE} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.05} />
            </g>
          ))}
          {/* Axes */}
          <line x1={0} y1={CY} x2={SVG_SIZE} y2={CY} stroke="currentColor" strokeOpacity={0.12} />
          <line x1={CX} y1={0} x2={CX} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.12} />
          <text x={SVG_SIZE - 10} y={CY - 6} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.3} fontWeight={600}>x</text>
          <text x={CX + 6} y={14} fontSize={10} fill="currentColor" opacity={0.3} fontWeight={600}>y</text>

          {/* Axis tick labels */}
          {[-1, 1].map((t) => (
            <g key={t}>
              {/* X axis ticks */}
              <line x1={CX + t * SCALE} y1={CY - 3} x2={CX + t * SCALE} y2={CY + 3} stroke="currentColor" strokeOpacity={0.2} />
              <text x={CX + t * SCALE} y={CY + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
              {/* Y axis ticks */}
              <line x1={CX - 3} y1={CY - t * SCALE} x2={CX + 3} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.2} />
              <text x={CX - 8} y={CY - t * SCALE + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
            </g>
          ))}

          {/* Angle arc */}
          {magA > 0.1 && magB > 0.1 && (
            <path
              d={describeArc(CX, CY, 24, angleA, angleB)}
              fill="none" stroke={dotColor} strokeWidth={1.5} strokeOpacity={0.6}
            />
          )}

          <Arrow fx={CX} fy={CY} tx={asx} ty={asy} color="#3b82f6" label="a" />
          <Arrow fx={CX} fy={CY} tx={bsx} ty={bsy} color="#f59e0b" label="b" />

          <circle cx={asx} cy={asy} r={12} fill="#3b82f6" fillOpacity={0.15} className="cursor-grab" />
          <circle cx={bsx} cy={bsy} r={12} fill="#f59e0b" fillOpacity={0.15} className="cursor-grab" />
        </svg>

        <div className="space-y-3" style={{ fontVariantNumeric: "tabular-nums" }}>
          {/* Vector cards */}
          <div className="flex gap-2">
            <VectorCard
              name="" emoji=""
              properties={["x", "y"]}
              values={[a[0], a[1]]}
              barColor="#3b82f6"
              label="a" labelColor="#3b82f6"
              className="flex-1 min-w-0"
            />
            <VectorCard
              name="" emoji=""
              properties={["x", "y"]}
              values={[b[0], b[1]]}
              barColor="#f59e0b"
              label="b" labelColor="#f59e0b"
              className="flex-1 min-w-0"
            />
          </div>

          {/* Step-by-step math */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Multiply matching parts</div>
            <div className="space-y-1">
              <div className="font-mono text-sm">
                <span className="text-muted">x:</span>{" "}
                <span className="text-blue-500">{a[0].toFixed(2)}</span>
                {" \u00D7 "}
                <span className="text-amber-500">{b[0].toFixed(2)}</span>
                {" = "}
                <span className="font-semibold">{xProduct.toFixed(2)}</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted">y:</span>{" "}
                <span className="text-blue-500">{a[1].toFixed(2)}</span>
                {" \u00D7 "}
                <span className="text-amber-500">{b[1].toFixed(2)}</span>
                {" = "}
                <span className="font-semibold">{yProduct.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-foreground/10 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Add them up</div>
              <div className="font-mono text-sm">
                {xProduct.toFixed(2)} + {yProduct.toFixed(2)} ={" "}
                <span className="font-bold" style={{ color: dotColor }}>{dotProduct.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Word descriptions */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-sm">
              <span className="font-semibold text-blue-500">a</span> is {magnitudeWord(magA)},{" "}
              <span className="font-semibold text-amber-500">b</span> is {magnitudeWord(magB)}
            </div>
            <div className="text-sm" style={{ color: simColor }}>
              {simText}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
