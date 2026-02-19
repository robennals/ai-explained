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

function ArrowsTab() {
  const [aAngle, setAAngle] = useState(0.4);
  const [bAngle, setBAngle] = useState(1.2);
  const dragTarget = useRef<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const ax = Math.cos(aAngle);
  const ay = Math.sin(aAngle);
  const bx = Math.cos(bAngle);
  const by = Math.sin(bAngle);

  const similarity = ax * bx + ay * by;

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
    dragTarget.current = dA < dB ? "a" : "b";
    (e.target as Element).setPointerCapture(e.pointerId);
    const angle = Math.atan2(-(my - CY), mx - CX);
    if (dragTarget.current === "a") setAAngle(angle);
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

  return (
    <>
      <SimilarityReadout similarity={similarity} />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="mx-auto w-full max-w-[320px] cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Unit circle */}
        <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />

        {/* Faint axes */}
        <line x1={CX - RADIUS - 10} y1={CY} x2={CX + RADIUS + 10} y2={CY} stroke="currentColor" strokeOpacity={0.06} />
        <line x1={CX} y1={CY - RADIUS - 10} x2={CX} y2={CY + RADIUS + 10} stroke="currentColor" strokeOpacity={0.06} />

        {/* Angle arc */}
        <path
          d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${arcEndX} ${arcEndY}`}
          fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5}
        />

        {/* Vector a */}
        <line x1={CX} y1={CY} x2={aTipX} y2={aTipY} stroke="#3b82f6" strokeWidth={3} />
        <Arrowhead x={aTipX} y={aTipY} angle={Math.atan2(aTipY - CY, aTipX - CX)} color="#3b82f6" />
        <text x={aTipX + 10} y={aTipY - 4} fontSize={13} fill="#3b82f6" fontWeight={700}>a</text>
        <circle cx={aTipX} cy={aTipY} r={12} fill="#3b82f6" fillOpacity={0.15} className="cursor-grab" />

        {/* Vector b */}
        <line x1={CX} y1={CY} x2={bTipX} y2={bTipY} stroke="#f59e0b" strokeWidth={3} />
        <Arrowhead x={bTipX} y={bTipY} angle={Math.atan2(bTipY - CY, bTipX - CX)} color="#f59e0b" />
        <text x={bTipX + 10} y={bTipY - 4} fontSize={13} fill="#f59e0b" fontWeight={700}>b</text>
        <circle cx={bTipX} cy={bTipY} r={12} fill="#f59e0b" fillOpacity={0.15} className="cursor-grab" />
      </svg>

      {/* Component computation */}
      <div className="mt-2 rounded-lg bg-foreground/[0.03] p-3 text-center" style={{ fontVariantNumeric: "tabular-nums" }}>
        <div className="font-mono text-sm">
          <span className="text-blue-500">({ax.toFixed(2)}</span>
          {" × "}
          <span className="text-amber-500">{bx.toFixed(2)})</span>
          {" + "}
          <span className="text-blue-500">({ay.toFixed(2)}</span>
          {" × "}
          <span className="text-amber-500">{by.toFixed(2)})</span>
          {" = "}
          <span className="font-bold" style={{ color: simColor }}>{similarity.toFixed(2)}</span>
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
        <div key={prop} className="flex items-center gap-2 py-1.5 px-3 border-b border-foreground/5 last:border-b-0">
          <span className="w-12 text-xs font-medium capitalize text-muted shrink-0">{prop}</span>
          <PropBar value={vec[i]} color={color} />
        </div>
      ))}
    </div>
  );
}

function ProductColumn({ vecA, vecB, similarity }: { vecA: number[]; vecB: number[]; similarity: number }) {
  const products = vecA.map((a, i) => a * vecB[i]);
  const maxProduct = Math.max(...products.map(Math.abs), 0.01);

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0" style={{ minWidth: 100 }}>
      <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Product</span>
      </div>
      {PROPERTIES.map((prop, i) => {
        const product = products[i];
        const barFrac = Math.abs(product) / maxProduct;
        return (
          <div key={prop} className="flex items-center gap-1.5 py-1.5 px-3 border-b border-foreground/5 last:border-b-0">
            <div className="h-2.5 w-10 rounded-full bg-foreground/5">
              <div
                className="h-2.5 rounded-full bg-green-400 transition-all duration-200"
                style={{ width: `${barFrac * 100}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted w-8 text-right">{product.toFixed(2)}</span>
          </div>
        );
      })}
      {/* Total */}
      <div className="flex items-center gap-1.5 py-1.5 px-3 border-t-2 border-foreground/15 bg-foreground/[0.02]">
        <span className="text-xs font-bold" style={{ color: animalSimilarityLabel(similarity).color }}>
          = {similarity.toFixed(2)}
        </span>
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

      {/* Three-column layout: selectors above their cards */}
      <div className="flex gap-2 overflow-x-auto">
        {/* Column A */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
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
          <AnimalCard animal={animalA} color="#3b82f6" label="A" />
        </div>

        {/* Column B */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
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
          <AnimalCard animal={animalB} color="#f59e0b" label="B" />
        </div>

        {/* Product column */}
        <div className="shrink-0">
          <div className="mb-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted">&nbsp;</div>
            <div className="h-[1.375rem]" /> {/* spacer to align with button rows */}
          </div>
          <ProductColumn vecA={vecA} vecB={vecB} similarity={similarity} />
        </div>
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
