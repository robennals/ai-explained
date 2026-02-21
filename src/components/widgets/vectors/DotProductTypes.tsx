"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

// --- SVG layout ---

const SPACE_SIZE = 340;
const SPACE_CX = SPACE_SIZE / 2;
const SPACE_CY = SPACE_SIZE / 2;
const SPACE_SCALE = 80;
const SPACE_MAX = 1.8;

function spaceToSvg(x: number, y: number): [number, number] {
  return [SPACE_CX + x * SPACE_SCALE, SPACE_CY - y * SPACE_SCALE];
}

function svgToSpace(sx: number, sy: number, rect: DOMRect): [number, number] {
  const svgX = ((sx - rect.left) / rect.width) * SPACE_SIZE;
  const svgY = ((sy - rect.top) / rect.height) * SPACE_SIZE;
  return [(svgX - SPACE_CX) / SPACE_SCALE, -(svgY - SPACE_CY) / SPACE_SCALE];
}

function SpaceArrow({
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
  const hl = 7;
  const h1x = tx - hl * Math.cos(angle - 0.4);
  const h1y = ty - hl * Math.sin(angle - 0.4);
  const h2x = tx - hl * Math.cos(angle + 0.4);
  const h2y = ty - hl * Math.sin(angle + 0.4);
  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={width} strokeOpacity={opacity} />
      <polygon points={`${tx},${ty} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} fillOpacity={opacity} />
      {label && <text x={tx + 6} y={ty - 6} fontSize={12} fill={color} fontWeight={700}>{label}</text>}
    </g>
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

// --- Tab types ---

type DotType = "similarity" | "projection" | "full";

const TABS: { id: DotType; label: string }[] = [
  { id: "similarity", label: "Similarity" },
  { id: "projection", label: "Projection" },
  { id: "full", label: "Full Dot Product" },
];

const INITIAL_VECTORS: Record<DotType, { a: [number, number]; b: [number, number] }> = {
  similarity: { a: [0.8, 0.6], b: [0.3, 0.95] },
  projection: { a: [1.2, 0.8], b: [0.8, 0.6] },
  full: { a: [1.2, 0.8], b: [0.6, 1.1] },
};

function normalize(v: [number, number]): [number, number] {
  const m = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  if (m < 0.001) return [1, 0];
  return [v[0] / m, v[1] / m];
}

function TypeExplorer({ type }: { type: DotType }) {
  const init = INITIAL_VECTORS[type];
  const [a, setA] = useState<[number, number]>(init.a);
  const [b, setB] = useState<[number, number]>(init.b);
  const dragTarget = useRef<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Apply constraints based on type
  const constrainA = useCallback((v: [number, number]): [number, number] => {
    if (type === "similarity") return normalize(v);
    return v;
  }, [type]);

  const constrainB = useCallback((v: [number, number]): [number, number] => {
    if (type === "similarity" || type === "projection") return normalize(v);
    return v;
  }, [type]);

  // Constrained vectors for display
  const aDisp = constrainA(a);
  const bDisp = constrainB(b);

  const dotProduct = aDisp[0] * bDisp[0] + aDisp[1] * bDisp[1];
  const magA = Math.sqrt(aDisp[0] * aDisp[0] + aDisp[1] * aDisp[1]);
  const magB = Math.sqrt(bDisp[0] * bDisp[0] + bDisp[1] * bDisp[1]);
  const cosTheta = magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const thetaDeg = (theta * 180) / Math.PI;

  // Projection of a onto b
  const projScalar = magB > 0 ? dotProduct / (magB * magB) : 0;
  const projX = projScalar * bDisp[0];
  const projY = projScalar * bDisp[1];

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const [wx, wy] = svgToSpace(e.clientX, e.clientY, rect);
    const dA = Math.hypot(wx - aDisp[0], wy - aDisp[1]);
    const dB = Math.hypot(wx - bDisp[0], wy - bDisp[1]);
    dragTarget.current = dA < dB ? "a" : "b";
    (e.target as Element).setPointerCapture(e.pointerId);
    const clamp = (v: number) => Math.max(-SPACE_MAX, Math.min(SPACE_MAX, v));
    if (dragTarget.current === "a") setA([clamp(wx), clamp(wy)]);
    else setB([clamp(wx), clamp(wy)]);
  }, [aDisp, bDisp]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const [wx, wy] = svgToSpace(e.clientX, e.clientY, rect);
    const clamp = (v: number) => Math.max(-SPACE_MAX, Math.min(SPACE_MAX, v));
    if (dragTarget.current === "a") setA([clamp(wx), clamp(wy)]);
    else setB([clamp(wx), clamp(wy)]);
  }, []);

  const handlePointerUp = useCallback(() => { dragTarget.current = null; }, []);

  const [asx, asy] = spaceToSvg(aDisp[0], aDisp[1]);
  const [bsx, bsy] = spaceToSvg(bDisp[0], bDisp[1]);
  const [psx, psy] = spaceToSvg(projX, projY);

  const dotColor = dotProduct > 0.01 ? "#22c55e" : dotProduct < -0.01 ? "#ef4444" : "#94a3b8";

  // Unit circle for similarity tab
  const unitCircleR = SPACE_SCALE;

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SPACE_SIZE} ${SPACE_SIZE}`}
        className="w-full max-w-[360px] cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Grid */}
        {[-1, 0, 1].map((t) => (
          <g key={t}>
            <line x1={SPACE_CX + t * SPACE_SCALE} y1={0} x2={SPACE_CX + t * SPACE_SCALE} y2={SPACE_SIZE} stroke="currentColor" strokeOpacity={0.05} />
            <line x1={0} y1={SPACE_CY - t * SPACE_SCALE} x2={SPACE_SIZE} y2={SPACE_CY - t * SPACE_SCALE} stroke="currentColor" strokeOpacity={0.05} />
          </g>
        ))}
        <line x1={0} y1={SPACE_CY} x2={SPACE_SIZE} y2={SPACE_CY} stroke="currentColor" strokeOpacity={0.12} />
        <line x1={SPACE_CX} y1={0} x2={SPACE_CX} y2={SPACE_SIZE} stroke="currentColor" strokeOpacity={0.12} />

        {/* Unit circle (always shown for similarity, shown as reference for others) */}
        <circle
          cx={SPACE_CX} cy={SPACE_CY} r={unitCircleR}
          fill="none" stroke="currentColor"
          strokeOpacity={type === "similarity" ? 0.12 : 0.06}
          strokeWidth={1}
          strokeDasharray={type === "similarity" ? "none" : "3 3"}
        />

        {/* Projection visualization */}
        {magB > 0.1 && (
          <>
            {/* Dashed line from a to projection point */}
            <line x1={asx} y1={asy} x2={psx} y2={psy} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" />
            {/* Projection dot */}
            <circle cx={psx} cy={psy} r={4} fill={dotColor} />
            {/* Projection arrow */}
            <SpaceArrow fx={SPACE_CX} fy={SPACE_CY} tx={psx} ty={psy} color={dotColor} width={3} opacity={0.5} />
            {/* Angle arc */}
            <path
              d={describeArc(SPACE_CX, SPACE_CY, 20, Math.atan2(-aDisp[1], aDisp[0]), Math.atan2(-bDisp[1], bDisp[0]))}
              fill="none" stroke={dotColor} strokeWidth={1.5}
            />
            <text
              x={SPACE_CX + 30 * Math.cos(Math.atan2(-(aDisp[1] + bDisp[1]) / 2, (aDisp[0] + bDisp[0]) / 2))}
              y={SPACE_CY + 30 * Math.sin(Math.atan2(-(aDisp[1] + bDisp[1]) / 2, (aDisp[0] + bDisp[0]) / 2))}
              fontSize={10} fill={dotColor} textAnchor="middle"
            >
              {thetaDeg.toFixed(0)}°
            </text>
          </>
        )}

        {/* Vector a */}
        <SpaceArrow fx={SPACE_CX} fy={SPACE_CY} tx={asx} ty={asy} color="#3b82f6" width={2.5} label="a" />
        {/* Vector b */}
        <SpaceArrow fx={SPACE_CX} fy={SPACE_CY} tx={bsx} ty={bsy} color="#f59e0b" width={2.5} label="b" />

        {/* Drag handles */}
        <circle cx={asx} cy={asy} r={8} fill="#3b82f6" fillOpacity={0.2} className="cursor-grab" />
        <circle cx={bsx} cy={bsy} r={8} fill="#f59e0b" fillOpacity={0.2} className="cursor-grab" />
      </svg>

      <div className="space-y-3 min-w-[170px]">
        <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Vectors</div>
          <div className="font-mono text-xs">
            <span className="text-blue-500">a</span> = ({aDisp[0].toFixed(2)}, {aDisp[1].toFixed(2)})
            {type === "similarity" && <span className="text-muted ml-1">unit</span>}
          </div>
          <div className="font-mono text-xs">
            <span className="text-amber-500">b</span> = ({bDisp[0].toFixed(2)}, {bDisp[1].toFixed(2)})
            {(type === "similarity" || type === "projection") && <span className="text-muted ml-1">unit</span>}
          </div>
        </div>

        <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {type === "similarity" ? "Similarity" : type === "projection" ? "Projection" : "Dot Product"}
          </div>

          <div className="font-mono text-xs">
            <span className="text-blue-500">{aDisp[0].toFixed(2)}</span>×<span className="text-amber-500">{bDisp[0].toFixed(2)}</span>
            {" + "}
            <span className="text-blue-500">{aDisp[1].toFixed(2)}</span>×<span className="text-amber-500">{bDisp[1].toFixed(2)}</span>
          </div>
          <div className="font-mono text-xs">angle = {thetaDeg.toFixed(1)}°</div>
          <div className="mt-1 border-t border-foreground/10 pt-1 font-mono text-sm font-bold" style={{ color: dotColor }}>
            {dotProduct.toFixed(3)}
          </div>
        </div>

        <div className="text-xs text-muted">
          {type === "similarity" && (
            dotProduct > 0.01
              ? "Same direction — high similarity"
              : dotProduct < -0.01
                ? "Opposite directions — negative similarity"
                : "Perpendicular — zero similarity"
          )}
          {type === "projection" && (
            dotProduct > 0.01
              ? "a has a component in b's direction"
              : dotProduct < -0.01
                ? "a points away from b's direction"
                : "a is perpendicular to b — zero projection"
          )}
          {type === "full" && (
            dotProduct > 0.01
              ? "Positive: vectors point the same way"
              : dotProduct < -0.01
                ? "Negative: vectors point opposite ways"
                : "Zero: vectors are perpendicular"
          )}
        </div>
      </div>
    </div>
  );
}

export function DotProductTypes() {
  const [activeTab, setActiveTab] = useState<DotType>("similarity");

  const handleReset = useCallback(() => {
    setActiveTab("similarity");
  }, []);

  return (
    <WidgetContainer
      title="Three Types of Dot Product"
      description="The same operation, three levels of constraint"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DotType)}
      />

      <div className="mt-1 mb-3 text-sm text-muted">
        {activeTab === "similarity" && (
          <>Both vectors have length 1. The dot product is pure direction comparison: a similarity score from −1 (opposite) to 1 (identical). How much do these point in the same direction?</>
        )}
        {activeTab === "projection" && (
          <>Vector <span className="text-amber-500 font-semibold">b</span> is a unit direction; <span className="text-blue-500 font-semibold">a</span> is free. The dot product tells you how far a extends in b&apos;s direction.</>
        )}
        {activeTab === "full" && (
          <>Both vectors are free. The dot product combines direction similarity with both lengths.</>
        )}
      </div>

      {/* Key the explorer by tab so state resets on tab change */}
      <TypeExplorer key={activeTab} type={activeTab} />
    </WidgetContainer>
  );
}
