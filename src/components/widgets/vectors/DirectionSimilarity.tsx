"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

// --- Animal data (same as AnimalPropertyExplorer) ---

const PROPERTIES = ["big", "scary", "hairy", "cuddly", "fast", "fat"] as const;
type Property = (typeof PROPERTIES)[number];

interface Animal {
  name: string;
  emoji: string;
  big: number;
  scary: number;
  hairy: number;
  cuddly: number;
  fast: number;
  fat: number;
}

const ANIMALS: Animal[] = [
  { name: "Bear",     emoji: "🐻", big: 0.90, scary: 0.85, hairy: 0.80, cuddly: 0.50, fast: 0.40, fat: 0.75 },
  { name: "Rabbit",   emoji: "🐰", big: 0.10, scary: 0.02, hairy: 0.60, cuddly: 0.95, fast: 0.70, fat: 0.15 },
  { name: "Shark",    emoji: "🦈", big: 0.80, scary: 0.95, hairy: 0.00, cuddly: 0.00, fast: 0.75, fat: 0.20 },
  { name: "Mouse",    emoji: "🐭", big: 0.02, scary: 0.05, hairy: 0.30, cuddly: 0.40, fast: 0.60, fat: 0.10 },
  { name: "Eagle",    emoji: "🦅", big: 0.35, scary: 0.60, hairy: 0.05, cuddly: 0.02, fast: 0.95, fat: 0.05 },
  { name: "Elephant", emoji: "🐘", big: 0.98, scary: 0.30, hairy: 0.05, cuddly: 0.40, fast: 0.15, fat: 0.95 },
  { name: "Snake",    emoji: "🐍", big: 0.20, scary: 0.85, hairy: 0.00, cuddly: 0.02, fast: 0.50, fat: 0.05 },
  { name: "Cat",      emoji: "🐱", big: 0.15, scary: 0.30, hairy: 0.75, cuddly: 0.85, fast: 0.70, fat: 0.25 },
  { name: "Dog",      emoji: "🐕", big: 0.45, scary: 0.20, hairy: 0.70, cuddly: 0.90, fast: 0.55, fat: 0.45 },
];

function animalVec(a: Animal): number[] {
  return PROPERTIES.map((p) => a[p]);
}

function vecNormalize(v: number[]): number[] {
  const m = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (m < 0.001) return v.map(() => 0);
  return v.map((x) => x / m);
}

function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

// --- Shared ---

/** Labels for the arrows tab — full -1 to 1 range */
function directionSimilarityLabel(sim: number): { text: string; color: string } {
  if (sim > 0.999) return { text: "Identical!", color: "#22c55e" };
  if (sim > 0.97) return { text: "Almost identical!", color: "#22c55e" };
  if (sim > 0.9) return { text: "Very similar", color: "#22c55e" };
  if (sim > 0.75) return { text: "Quite similar", color: "#86efac" };
  if (sim > 0.5) return { text: "Somewhat similar", color: "#94a3b8" };
  if (sim > 0.25) return { text: "Not very similar", color: "#94a3b8" };
  if (sim > -0.25) return { text: "Very different", color: "#f97316" };
  if (sim > -0.5) return { text: "Opposing", color: "#ef4444" };
  if (sim > -0.9) return { text: "Quite opposite", color: "#ef4444" };
  if (sim > -0.97) return { text: "Very opposite", color: "#ef4444" };
  return { text: "Exactly opposite!", color: "#ef4444" };
}

/**
 * Labels for animal comparisons — all animals have positive properties,
 * so similarity is always ~0.3–1.0 and needs a compressed scale to
 * match human intuition about which animals are alike.
 *
 * Rabbit vs Cat  0.97 → Very similar (both small furry pets)
 * Cat vs Dog     0.96 → Very similar
 * Shark vs Snake 0.92 → Quite similar (both scary predators)
 * Bear vs Dog    0.84 → Somewhat similar
 * Bear vs Shark  0.76 → A little similar
 * Eagle vs Dog   0.52 → Not very similar
 * Shark vs Cat   0.48 → Quite different
 * Rabbit vs Snake 0.31 → Very different
 */
function animalSimilarityLabel(sim: number): { text: string; color: string } {
  if (sim > 0.999) return { text: "Identical!", color: "#22c55e" };
  if (sim > 0.95) return { text: "Very similar", color: "#22c55e" };
  if (sim > 0.88) return { text: "Quite similar", color: "#86efac" };
  if (sim > 0.78) return { text: "Somewhat similar", color: "#94a3b8" };
  if (sim > 0.65) return { text: "A little similar", color: "#94a3b8" };
  if (sim > 0.5) return { text: "Not very similar", color: "#f97316" };
  if (sim > 0.38) return { text: "Quite different", color: "#f97316" };
  return { text: "Very different", color: "#ef4444" };
}

function SimilarityReadout({ similarity, variant = "direction" }: { similarity: number; variant?: "direction" | "animal" }) {
  const { text, color } = variant === "animal"
    ? animalSimilarityLabel(similarity)
    : directionSimilarityLabel(similarity);
  return (
    <div className="text-center mb-2">
      <div className="text-2xl font-bold" style={{ color }}>
        {text}
      </div>
      <div className="font-mono text-sm text-muted mt-1">
        similarity = {similarity.toFixed(2)}
      </div>
    </div>
  );
}

// --- Arrows tab ---

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const RADIUS = 110;

function Arrowhead({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const s = 8;
  const h1x = x - s * Math.cos(angle - 0.35);
  const h1y = y - s * Math.sin(angle - 0.35);
  const h2x = x - s * Math.cos(angle + 0.35);
  const h2y = y - s * Math.sin(angle + 0.35);
  return <polygon points={`${x},${y} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />;
}

function MeasurementArrow({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  // Small arrowheads at both ends
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const s = 5;
  // Head at (x2, y2)
  const h1x = x2 - s * Math.cos(angle - 0.4);
  const h1y = y2 - s * Math.sin(angle - 0.4);
  const h2x = x2 - s * Math.cos(angle + 0.4);
  const h2y = y2 - s * Math.sin(angle + 0.4);
  // Head at (x1, y1) pointing the other way
  const rAngle = angle + Math.PI;
  const r1x = x1 - s * Math.cos(rAngle - 0.4);
  const r1y = y1 - s * Math.sin(rAngle - 0.4);
  const r2x = x1 - s * Math.cos(rAngle + 0.4);
  const r2y = y1 - s * Math.sin(rAngle + 0.4);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} strokeOpacity={0.5} />
      <polygon points={`${x2},${y2} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} fillOpacity={0.5} />
      <polygon points={`${x1},${y1} ${r1x},${r1y} ${r2x},${r2y}`} fill={color} fillOpacity={0.5} />
    </g>
  );
}

function MeasurementLines({
  tipX, tipY, vx, vy, color,
  otherTipX, otherTipY, xOffset, yOffset,
}: {
  tipX: number; tipY: number; vx: number; vy: number;
  color: string;
  otherTipX: number; otherTipY: number;
  xOffset: number; yOffset: number;
}) {
  // Fixed L-shape: horizontal along x-axis, then vertical to tip.
  // Horizontal line: offset to opposite side of axis from the tip
  const xLineY = tipY < CY ? CY + xOffset : CY - xOffset;
  const xMidX = (CX + tipX) / 2;
  // Vertical line: offset further from origin than the tip
  const yLineX = tipX > CX ? tipX + yOffset : tipX - yOffset;
  const yMidY = (CY + tipY) / 2;
  const yLabelOffsetX = tipX > CX ? 20 : -20;
  const yLabelAnchor = tipX > CX ? "start" : "end";
  // x label: offset further from axis than the line
  const xLabelY = tipY < CY ? xLineY + 12 : xLineY - 12;

  return (
    <g>
      <line x1={tipX} y1={xLineY} x2={yLineX} y2={tipY} stroke={color} strokeWidth={0.5} strokeOpacity={0.25} strokeDasharray="2 2" />
      <MeasurementArrow x1={CX} y1={xLineY} x2={tipX} y2={xLineY} color={color} />
      <text x={xMidX} y={xLabelY + 3.5} textAnchor="middle" fontSize={10} fill={color} fontWeight={700}>
        x={vx.toFixed(2)}
      </text>
      <MeasurementArrow x1={yLineX} y1={CY} x2={yLineX} y2={tipY} color={color} />
      <text x={yLineX + yLabelOffsetX} y={yMidY + 3.5} textAnchor={yLabelAnchor} fontSize={10} fill={color} fontWeight={700}>
        y={vy.toFixed(2)}
      </text>
    </g>
  );
}

function ArrowsTab() {
  const [aAngle, setAAngle] = useState(0.4);
  const [bAngle, setBAngle] = useState(1.2);
  const [topVector, setTopVector] = useState<"a" | "b">("a");
  const dragTarget = useRef<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const ax = Math.cos(aAngle);
  const ay = Math.sin(aAngle);
  const bx = Math.cos(bAngle);
  const by = Math.sin(bAngle);

  const similarity = ax * bx + ay * by;
  const xProduct = ax * bx;
  const yProduct = ay * by;

  const aTipX = CX + ax * RADIUS;
  const aTipY = CY - ay * RADIUS;
  const bTipX = CX + bx * RADIUS;
  const bTipY = CY - by * RADIUS;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const dA = Math.hypot(mx - aTipX, my - aTipY);
    const dB = Math.hypot(mx - bTipX, my - bTipY);
    const target = dA < dB ? "a" : "b";
    dragTarget.current = target;
    setTopVector(target);
    (e.target as Element).setPointerCapture(e.pointerId);
    const angle = Math.atan2(-(my - CY), mx - CX);
    if (target === "a") setAAngle(angle);
    else setBAngle(angle);
  }, [aTipX, aTipY, bTipX, bTipY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const angle = Math.atan2(-(my - CY), mx - CX);
    if (dragTarget.current === "a") setAAngle(angle);
    else setBAngle(angle);
  }, []);

  const handlePointerUp = useCallback(() => { dragTarget.current = null; }, []);

  // Angle arc
  const aAngleSvg = Math.atan2(-ay, ax);
  const bAngleSvg = Math.atan2(-by, bx);
  const arcR = 30;
  const arcStartX = CX + arcR * Math.cos(aAngleSvg);
  const arcStartY = CY + arcR * Math.sin(aAngleSvg);
  const arcEndX = CX + arcR * Math.cos(bAngleSvg);
  const arcEndY = CY + arcR * Math.sin(bAngleSvg);
  let arcDiff = bAngleSvg - aAngleSvg;
  if (arcDiff > Math.PI) arcDiff -= 2 * Math.PI;
  if (arcDiff < -Math.PI) arcDiff += 2 * Math.PI;
  const sweepFlag = arcDiff > 0 ? 1 : 0;
  const largeArc = Math.abs(arcDiff) > Math.PI ? 1 : 0;

  const { color: simColor } = directionSimilarityLabel(similarity);

  const MEASUREMENT_OFFSET = 12;

  return (
    <>
      <SimilarityReadout similarity={similarity} />

      <div className="grid gap-4 sm:grid-cols-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          overflow="visible"
          className="mx-auto w-full max-w-[320px] cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Unit circle */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />

          {/* Faint axes */}
          <line x1={CX - RADIUS - 10} y1={CY} x2={CX + RADIUS + 10} y2={CY} stroke="currentColor" strokeOpacity={0.06} />
          <line x1={CX} y1={CY - RADIUS - 10} x2={CX} y2={CY + RADIUS + 10} stroke="currentColor" strokeOpacity={0.06} />

          {/* Axis labels */}
          <text x={CX + RADIUS + 14} y={CY + 4} fontSize={10} fill="currentColor" opacity={0.3} fontWeight={600}>x</text>
          <text x={CX + 4} y={CY - RADIUS - 8} fontSize={10} fill="currentColor" opacity={0.3} fontWeight={600}>y</text>

          {/* Angle arc */}
          <path
            d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${arcEndX} ${arcEndY}`}
            fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5}
          />

          {/* Render back vector first (underneath), then front vector on top */}
          {(topVector === "a" ? ["b", "a"] as const : ["a", "b"] as const).map((id) => {
            const isA = id === "a";
            const tipX = isA ? aTipX : bTipX;
            const tipY = isA ? aTipY : bTipY;
            const vx = isA ? ax : bx;
            const vy = isA ? ay : by;
            const color = isA ? "#3b82f6" : "#f59e0b";
            const label = isA ? "a" : "b";
            return (
              <g key={id}>
                {id === topVector && (
                  <MeasurementLines tipX={tipX} tipY={tipY} vx={vx} vy={vy} color={color} otherTipX={0} otherTipY={0} xOffset={MEASUREMENT_OFFSET} yOffset={MEASUREMENT_OFFSET} />
                )}
                <line x1={CX} y1={CY} x2={tipX} y2={tipY} stroke={color} strokeWidth={3} />
                <Arrowhead x={tipX} y={tipY} angle={Math.atan2(tipY - CY, tipX - CX)} color={color} />
                <text x={tipX + 10} y={tipY - 4} fontSize={13} fill={color} fontWeight={700}>{label}</text>
                <circle cx={tipX} cy={tipY} r={12} fill={color} fillOpacity={0.15} className="cursor-grab" />
              </g>
            );
          })}
        </svg>

        {/* Step-by-step computation */}
        <div className="space-y-3" style={{ fontVariantNumeric: "tabular-nums" }}>
          {/* Vectors */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Vectors</div>
            <div className="font-mono text-sm">
              <span className="text-blue-500 font-bold">a</span> = (<span className="text-blue-500">{ax.toFixed(2)}</span>, <span className="text-blue-500">{ay.toFixed(2)}</span>)
            </div>
            <div className="font-mono text-sm">
              <span className="text-amber-500 font-bold">b</span> = (<span className="text-amber-500">{bx.toFixed(2)}</span>, <span className="text-amber-500">{by.toFixed(2)}</span>)
            </div>
          </div>

          {/* Multiply & add */}
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Multiply matching parts</div>
            <div className="space-y-1">
              <div className="font-mono text-sm">
                <span className="text-muted">x:</span>{" "}
                <span className="text-blue-500">{ax.toFixed(2)}</span>
                {" × "}
                <span className="text-amber-500">{bx.toFixed(2)}</span>
                {" = "}
                <span className="font-semibold">{xProduct.toFixed(2)}</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted">y:</span>{" "}
                <span className="text-blue-500">{ay.toFixed(2)}</span>
                {" × "}
                <span className="text-amber-500">{by.toFixed(2)}</span>
                {" = "}
                <span className="font-semibold">{yProduct.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-foreground/10 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Add them up</div>
              <div className="font-mono text-sm">
                {xProduct.toFixed(2)} + {yProduct.toFixed(2)} ={" "}
                <span className="font-bold" style={{ color: simColor }}>{similarity.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Animals tab ---

function PropBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2.5 w-16 rounded-full bg-foreground/5">
        <div
          className="h-2.5 rounded-full transition-all duration-200"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[10px] text-muted">{value.toFixed(2)}</span>
    </div>
  );
}

function AnimalCard({ animal, color, label }: { animal: Animal; color: string; label: string }) {
  const vec = vecNormalize(animalVec(animal));
  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden flex-1 min-w-0">
      <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color }}>{label}</span>
        {animal.emoji} {animal.name}
      </div>
      {PROPERTIES.map((prop, i) => (
        <div key={prop} className="flex items-center gap-2 py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]">
          <span className="w-12 text-xs font-medium capitalize text-muted shrink-0">{prop}</span>
          <PropBar value={vec[i]} color={color} />
        </div>
      ))}
    </div>
  );
}

function productColor(product: number, maxProduct: number): string {
  if (maxProduct === 0) return "#888";
  // 0 → red, maxProduct → green
  const t = Math.max(0, Math.min(1, product / maxProduct));
  const r = Math.round(220 - 140 * t);
  const g = Math.round(80 + 120 * t);
  const b = Math.round(80 - 20 * t);
  return `rgb(${r},${g},${b})`;
}

function ProductColumn({ vecA, vecB, similarity }: { vecA: number[]; vecB: number[]; similarity: number }) {
  const products = vecA.map((a, i) => a * vecB[i]);
  const maxProduct = Math.max(...products, 0.001);

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0" style={{ maxWidth: "10rem" }}>
      <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Multiply</span>
      </div>
      {PROPERTIES.map((prop, i) => {
        const product = products[i];
        return (
          <div key={prop} className="flex items-center py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]">
            <span className="font-mono text-[10px] text-muted whitespace-nowrap">
              <span className="text-blue-500">{vecA[i].toFixed(2)}</span>
              {" × "}
              <span className="text-amber-500">{vecB[i].toFixed(2)}</span>
              {" = "}
              <span className="font-bold" style={{ color: productColor(product, maxProduct) }}>{product.toFixed(2)}</span>
            </span>
          </div>
        );
      })}
      {/* Total */}
      <div className="py-1.5 px-3 border-t-2 border-foreground/15 bg-foreground/[0.02]">
        <div className="font-mono text-[10px] font-bold">
          {products.map((p, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted">{" + "}</span>}
              <span style={{ color: productColor(p, maxProduct) }}>{p.toFixed(2)}</span>
            </span>
          ))}
        </div>
        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: animalSimilarityLabel(similarity).color }}>
          = {similarity.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function AnimalsTab() {
  const [aIdx, setAIdx] = useState(0); // Bear
  const [bIdx, setBIdx] = useState(2); // Shark

  const animalA = ANIMALS[aIdx];
  const animalB = ANIMALS[bIdx];

  const vecA = vecNormalize(animalVec(animalA));
  const vecB = vecNormalize(animalVec(animalB));
  const similarity = vecDot(vecA, vecB);

  return (
    <>
      <SimilarityReadout similarity={similarity} variant="animal" />

      {/* Selectors above their respective cards */}
      <div className="flex gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">Animal A</div>
          <div className="flex flex-wrap gap-1">
            {ANIMALS.map((a, i) => (
              <button
                key={a.name}
                onClick={() => setAIdx(i)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === aIdx
                    ? "bg-blue-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {a.emoji} {a.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">Animal B</div>
          <div className="flex flex-wrap gap-1">
            {ANIMALS.map((a, i) => (
              <button
                key={a.name}
                onClick={() => setBIdx(i)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === bIdx
                    ? "bg-amber-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {a.emoji} {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards row — all tops aligned */}
      <div className="flex gap-2 items-start overflow-x-auto">
        <AnimalCard animal={animalA} color="#3b82f6" label="A" />
        <AnimalCard animal={animalB} color="#f59e0b" label="B" />
        <ProductColumn vecA={vecA} vecB={vecB} similarity={similarity} />
      </div>
    </>
  );
}

// --- Main component ---

const TABS = [
  { id: "arrows", label: "Arrows" },
  { id: "animals", label: "Animals" },
];

export function DirectionSimilarity() {
  const [activeTab, setActiveTab] = useState("arrows");

  const handleReset = useCallback(() => {
    setActiveTab("arrows");
  }, []);

  return (
    <WidgetContainer
      title="Direction Similarity"
      description="How similar are two directions?"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "arrows" ? <ArrowsTab key="arrows" /> : <AnimalsTab key="animals" />}
    </WidgetContainer>
  );
}
