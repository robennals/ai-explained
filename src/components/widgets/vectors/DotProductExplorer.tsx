"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_SIZE = 320;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 80;

function Arrow({
  fx, fy, tx, ty, color, width = 2.5, opacity = 1, label,
}: {
  fx: number; fy: number; tx: number; ty: number;
  color: string; width?: number; opacity?: number; label?: string;
}) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return null;
  const angle = Math.atan2(dy, dx);
  const headLen = 8;
  const h1x = tx - headLen * Math.cos(angle - 0.4);
  const h1y = ty - headLen * Math.sin(angle - 0.4);
  const h2x = tx - headLen * Math.cos(angle + 0.4);
  const h2y = ty - headLen * Math.sin(angle + 0.4);

  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={width} strokeOpacity={opacity} />
      <polygon points={`${tx},${ty} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} fillOpacity={opacity} />
      {label && (
        <text x={tx + 8} y={ty - 8} fontSize={13} fill={color} fontWeight={700}>
          {label}
        </text>
      )}
    </g>
  );
}

function toSvg(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

function fromSvg(sx: number, sy: number, rect: DOMRect, svgSize: number): [number, number] {
  const svgX = ((sx - rect.left) / rect.width) * svgSize;
  const svgY = ((sy - rect.top) / rect.height) * svgSize;
  return [(svgX - CX) / SCALE, -(svgY - CY) / SCALE];
}

function magnitudeWord(mag: number): string {
  if (mag < 0.3) return "tiny";
  if (mag < 0.7) return "small";
  if (mag < 1.1) return "medium";
  if (mag < 1.5) return "big";
  return "very big";
}

function directionWord(similarity: number): string {
  if (similarity > 0.95) return "Same direction";
  if (similarity > 0.7) return "Similar direction";
  if (similarity > 0.3) return "Somewhat similar";
  if (similarity > -0.3) return "Perpendicular";
  if (similarity > -0.7) return "Somewhat opposite";
  if (similarity > -0.95) return "Opposite-ish";
  return "Opposite direction";
}

export function DotProductExplorer() {
  const [a, setA] = useState<[number, number]>([1.4, 0.6]);
  const [b, setB] = useState<[number, number]>([0.5, 1.2]);
  const [dragTarget, setDragTarget] = useState<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleReset = useCallback(() => {
    setA([1.4, 0.6]);
    setB([0.5, 1.2]);
  }, []);

  // Computations
  const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  const dotProduct = a[0] * b[0] + a[1] * b[1];
  const similarity = magA > 0.01 && magB > 0.01 ? dotProduct / (magA * magB) : 0;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const [wx, wy] = fromSvg(e.clientX, e.clientY, rect, SVG_SIZE);
      const dA = Math.hypot(wx - a[0], wy - a[1]);
      const dB = Math.hypot(wx - b[0], wy - b[1]);
      setDragTarget(dA < dB ? "a" : "b");
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [a, b]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragTarget) return;
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const [wx, wy] = fromSvg(e.clientX, e.clientY, rect, SVG_SIZE);
      const clamped: [number, number] = [
        Math.max(-1.8, Math.min(1.8, wx)),
        Math.max(-1.8, Math.min(1.8, wy)),
      ];
      if (dragTarget === "a") setA(clamped);
      else setB(clamped);
    },
    [dragTarget]
  );

  const handlePointerUp = useCallback(() => setDragTarget(null), []);

  const [asx, asy] = toSvg(a[0], a[1]);
  const [bsx, bsy] = toSvg(b[0], b[1]);

  const dotColor = dotProduct > 0.01 ? "#22c55e" : dotProduct < -0.01 ? "#ef4444" : "#94a3b8";

  // Angle arc for visual
  const angleA = Math.atan2(-a[1], a[0]);
  const angleB = Math.atan2(-b[1], b[0]);

  return (
    <WidgetContainer
      title="The Dot Product"
      description="Drag the two vectors and watch the dot product change"
      onReset={handleReset}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        {/* SVG */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto w-full max-w-[320px] cursor-crosshair touch-none select-none"
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

          {/* Angle arc */}
          {magA > 0.1 && magB > 0.1 && (
            <path
              d={describeArc(CX, CY, 24, angleA, angleB)}
              fill="none" stroke={dotColor} strokeWidth={1.5} strokeOpacity={0.6}
            />
          )}

          {/* Vector a */}
          <Arrow fx={CX} fy={CY} tx={asx} ty={asy} color="#3b82f6" label="a" />
          {/* Vector b */}
          <Arrow fx={CX} fy={CY} tx={bsx} ty={bsy} color="#f59e0b" label="b" />

          {/* Drag handles */}
          <circle cx={asx} cy={asy} r={10} fill="#3b82f6" fillOpacity={0.15} className="cursor-grab" />
          <circle cx={bsx} cy={bsy} r={10} fill="#f59e0b" fillOpacity={0.15} className="cursor-grab" />
        </svg>

        {/* Right panel */}
        <div className="space-y-3 min-w-[200px]">
          {/* Word descriptions */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">What&apos;s happening</div>
            <div className="text-sm">
              <span className="font-semibold text-blue-500">a</span> is {magnitudeWord(magA)} ({magA.toFixed(2)})
            </div>
            <div className="text-sm">
              <span className="font-semibold text-amber-500">b</span> is {magnitudeWord(magB)} ({magB.toFixed(2)})
            </div>
            <div className="text-sm" style={{ color: dotColor }}>
              {directionWord(similarity)} ({similarity.toFixed(2)})
            </div>
          </div>

          {/* Method 1: length × length × similarity */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Method 1: lengths × similarity</div>
            <div className="font-mono text-xs space-y-0.5">
              <div>length(<span className="text-blue-500">a</span>) = {magA.toFixed(2)}</div>
              <div>length(<span className="text-amber-500">b</span>) = {magB.toFixed(2)}</div>
              <div>similarity = {similarity.toFixed(2)}</div>
            </div>
            <div className="mt-1 border-t border-foreground/10 pt-1 font-mono text-sm font-bold" style={{ color: dotColor }}>
              {magA.toFixed(2)} × {magB.toFixed(2)} × {similarity.toFixed(2)} = {dotProduct.toFixed(2)}
            </div>
          </div>

          {/* Method 2: multiply and add */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Method 2: multiply & add</div>
            <div className="font-mono text-xs space-y-0.5">
              <div>
                <span className="text-blue-500">{a[0].toFixed(2)}</span> × <span className="text-amber-500">{b[0].toFixed(2)}</span> = {(a[0] * b[0]).toFixed(2)}
              </div>
              <div>
                <span className="text-blue-500">{a[1].toFixed(2)}</span> × <span className="text-amber-500">{b[1].toFixed(2)}</span> = {(a[1] * b[1]).toFixed(2)}
              </div>
            </div>
            <div className="mt-1 border-t border-foreground/10 pt-1 font-mono text-sm font-bold" style={{ color: dotColor }}>
              {(a[0] * b[0]).toFixed(2)} + {(a[1] * b[1]).toFixed(2)} = {dotProduct.toFixed(2)}
            </div>
          </div>

          {/* Same answer callout */}
          <div className="text-center text-xs text-muted italic">
            Both methods give the same answer!
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
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
