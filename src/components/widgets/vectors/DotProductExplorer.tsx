"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_SIZE = 340;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 80;

function Arrow({
  fx, fy, tx, ty, color, width = 2, opacity = 1, label,
}: {
  fx: number; fy: number; tx: number; ty: number;
  color: string; width?: number; opacity?: number; label?: string;
}) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return null;
  const angle = Math.atan2(dy, dx);
  const headLen = 7;
  const h1x = tx - headLen * Math.cos(angle - 0.4);
  const h1y = ty - headLen * Math.sin(angle - 0.4);
  const h2x = tx - headLen * Math.cos(angle + 0.4);
  const h2y = ty - headLen * Math.sin(angle + 0.4);

  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={width} strokeOpacity={opacity} />
      <polygon points={`${tx},${ty} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} fillOpacity={opacity} />
      {label && (
        <text x={tx + 6} y={ty - 6} fontSize={12} fill={color} fontWeight={700}>
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

export function DotProductExplorer() {
  const [a, setA] = useState<[number, number]>([1.2, 0.8]);
  const [b, setB] = useState<[number, number]>([0.6, 1.1]);
  const [view, setView] = useState<"components" | "projection">("components");
  const [dragTarget, setDragTarget] = useState<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleReset = useCallback(() => {
    setA([1.2, 0.8]);
    setB([0.6, 1.1]);
    setView("components");
  }, []);

  const dotProduct = a[0] * b[0] + a[1] * b[1];
  const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  const cosTheta = magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const thetaDeg = (theta * 180) / Math.PI;

  // Projection of a onto b
  const projScalar = magB > 0 ? dotProduct / (magB * magB) : 0;
  const projX = projScalar * b[0];
  const projY = projScalar * b[1];

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const [wx, wy] = fromSvg(e.clientX, e.clientY, rect, SVG_SIZE);
      // Find closest vector tip
      const dA = Math.hypot(wx - a[0], wy - a[1]);
      const dB = Math.hypot(wx - b[0], wy - b[1]);
      const target = dA < dB ? "a" : "b";
      setDragTarget(target);
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
  const [psx, psy] = toSvg(projX, projY);

  const dotColor = dotProduct > 0.01 ? "#22c55e" : dotProduct < -0.01 ? "#ef4444" : "#94a3b8";

  return (
    <WidgetContainer
      title="The Dot Product"
      description="Two ways to see the same operation — drag the arrows"
      onReset={handleReset}
    >
      {/* View toggle */}
      <div className="mb-4 flex gap-2">
        {(["components", "projection"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v ? "bg-accent text-white" : "bg-foreground/5 text-muted hover:bg-foreground/10"
            }`}
          >
            {v === "components" ? "Component view" : "Projection view"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full max-w-[360px] cursor-crosshair touch-none"
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

          {view === "projection" && magB > 0.1 && (
            <>
              {/* When projection is negative, show b's negative extension as faint dots */}
              {projScalar < -0.05 && (() => {
                // Extend b direction into negative side (through origin and beyond)
                const negExtent = Math.abs(projScalar);
                const bNormX = b[0] / magB;
                const bNormY = b[1] / magB;
                const [negSx, negSy] = toSvg(-bNormX * negExtent * magB, -bNormY * negExtent * magB);
                return (
                  <line x1={CX} y1={CY} x2={negSx} y2={negSy}
                    stroke="#f59e0b" strokeWidth={1.5} strokeOpacity={0.2} strokeDasharray="3 3" />
                );
              })()}
              {/* Projection line (dashed from a to proj point) */}
              <line x1={asx} y1={asy} x2={psx} y2={psy} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" />
              {/* Projection point on b */}
              <circle cx={psx} cy={psy} r={4} fill={dotColor} />
              {/* Projection arrow along b */}
              <Arrow fx={CX} fy={CY} tx={psx} ty={psy} color={dotColor} width={3} opacity={0.5} />
              {/* Angle arc */}
              <path
                d={describeArc(CX, CY, 20, Math.atan2(-a[1], a[0]), Math.atan2(-b[1], b[0]))}
                fill="none" stroke={dotColor} strokeWidth={1.5}
              />
              <text
                x={CX + 30 * Math.cos(Math.atan2(-(a[1] + b[1]) / 2, (a[0] + b[0]) / 2))}
                y={CY + 30 * Math.sin(Math.atan2(-(a[1] + b[1]) / 2, (a[0] + b[0]) / 2))}
                fontSize={10} fill={dotColor} textAnchor="middle"
              >
                {thetaDeg.toFixed(0)}°
              </text>
            </>
          )}

          {/* Vector a */}
          <Arrow fx={CX} fy={CY} tx={asx} ty={asy} color="#3b82f6" width={2.5} label="a" />
          {/* Vector b */}
          <Arrow fx={CX} fy={CY} tx={bsx} ty={bsy} color="#f59e0b" width={2.5} label="b" />

          {/* Drag handles */}
          <circle cx={asx} cy={asy} r={8} fill="#3b82f6" fillOpacity={0.2} className="cursor-grab" />
          <circle cx={bsx} cy={bsy} r={8} fill="#f59e0b" fillOpacity={0.2} className="cursor-grab" />
        </svg>

        {/* Readout */}
        <div className="space-y-3 min-w-[170px]">
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Vectors</div>
            <div className="font-mono text-xs">
              <span className="text-blue-500">a</span> = ({a[0].toFixed(2)}, {a[1].toFixed(2)})
            </div>
            <div className="font-mono text-xs">
              <span className="text-amber-500">b</span> = ({b[0].toFixed(2)}, {b[1].toFixed(2)})
            </div>
          </div>

          {view === "components" ? (
            <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Component multiply</div>
              <div className="font-mono text-xs">
                {a[0].toFixed(2)} x {b[0].toFixed(2)} = <span className="text-accent">{(a[0] * b[0]).toFixed(2)}</span>
              </div>
              <div className="font-mono text-xs">
                {a[1].toFixed(2)} x {b[1].toFixed(2)} = <span className="text-accent">{(a[1] * b[1]).toFixed(2)}</span>
              </div>
              <div className="mt-1 border-t border-foreground/10 pt-1 font-mono text-sm font-bold" style={{ color: dotColor }}>
                a . b = {dotProduct.toFixed(3)}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Projection view</div>
              <div className="font-mono text-xs">|a| = {magA.toFixed(2)}</div>
              <div className="font-mono text-xs">|b| = {magB.toFixed(2)}</div>
              <div className="font-mono text-xs">angle = {thetaDeg.toFixed(1)}°</div>
              <div className="font-mono text-xs">cos(angle) = {cosTheta.toFixed(3)}</div>
              <div className="mt-1 border-t border-foreground/10 pt-1 font-mono text-sm font-bold" style={{ color: dotColor }}>
                {magA.toFixed(2)} x {magB.toFixed(2)} x {cosTheta.toFixed(2)} = {dotProduct.toFixed(3)}
              </div>
            </div>
          )}

          <div className="text-xs text-muted">
            {dotProduct > 0.01
              ? "Positive: vectors point the same way"
              : dotProduct < -0.01
                ? "Negative: vectors point in opposite directions"
                : "Zero: vectors are perpendicular"}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

function describeArc(cx: number, cy: number, r: number, a1: number, a2: number): string {
  // Ensure we take the short arc
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
