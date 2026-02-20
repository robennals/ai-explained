"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { VectorCard } from "./VectorCard";
import {
  VECTOR_DOMAINS,
  vecDot,
  directionSimilarityLabel,
  itemSimilarityLabel,
  productColor,
  type VectorDomain,
} from "./vectorData";

// --- Similarity readout ---

function SimilarityReadout({ similarity, variant = "direction" }: { similarity: number; variant?: "direction" | "item" }) {
  const { text, color } = variant === "item"
    ? itemSimilarityLabel(similarity)
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

// --- Product column ---

function ProductColumn({ vecA, vecB, properties, similarity, variant }: {
  vecA: number[]; vecB: number[]; properties: string[]; similarity: number; variant: "direction" | "item";
}) {
  const products = vecA.map((a, i) => a * vecB[i]);
  const maxProduct = Math.max(...products, 0.001);
  const { color: simColor } = variant === "item" ? itemSimilarityLabel(similarity) : directionSimilarityLabel(similarity);

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0" style={{ maxWidth: "10rem" }}>
      <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Multiply</span>
      </div>
      {properties.map((prop, i) => {
        const product = products[i];
        return (
          <div key={prop} className="flex items-center py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]">
            <span className="font-mono text-[10px] text-muted whitespace-nowrap">
              <span className="text-blue-500">{vecA[i].toFixed(2)}</span>
              {" \u00D7 "}
              <span className="text-amber-500">{vecB[i].toFixed(2)}</span>
              {" = "}
              <span className="font-bold" style={{ color: productColor(product, maxProduct) }}>{product.toFixed(2)}</span>
            </span>
          </div>
        );
      })}
      <div className="py-1.5 px-3 border-t-2 border-foreground/15 bg-foreground/[0.02]">
        <div className="font-mono text-[10px] font-bold">
          {products.map((p, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted">{" + "}</span>}
              <span style={{ color: productColor(p, maxProduct) }}>{p.toFixed(2)}</span>
            </span>
          ))}
        </div>
        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: simColor }}>
          = {similarity.toFixed(2)}
        </div>
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
          <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
          <line x1={CX - RADIUS - 10} y1={CY} x2={CX + RADIUS + 10} y2={CY} stroke="currentColor" strokeOpacity={0.06} />
          <line x1={CX} y1={CY - RADIUS - 10} x2={CX} y2={CY + RADIUS + 10} stroke="currentColor" strokeOpacity={0.06} />
          <text x={CX + RADIUS + 14} y={CY + 4} fontSize={10} fill="currentColor" opacity={0.3} fontWeight={600}>x</text>
          <text x={CX + 4} y={CY - RADIUS - 8} fontSize={10} fill="currentColor" opacity={0.3} fontWeight={600}>y</text>

          <path
            d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${arcEndX} ${arcEndY}`}
            fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5}
          />

          {(topVector === "a" ? ["b", "a"] as const : ["a", "b"] as const).map((id) => {
            const isA = id === "a";
            const tipX = isA ? aTipX : bTipX;
            const tipY = isA ? aTipY : bTipY;
            const color = isA ? "#3b82f6" : "#f59e0b";
            const label = isA ? "a" : "b";
            return (
              <g key={id}>
                <line x1={CX} y1={CY} x2={tipX} y2={tipY} stroke={color} strokeWidth={3} />
                <Arrowhead x={tipX} y={tipY} angle={Math.atan2(tipY - CY, tipX - CX)} color={color} />
                <text x={tipX + 10} y={tipY - 4} fontSize={13} fill={color} fontWeight={700}>{label}</text>
                <circle cx={tipX} cy={tipY} r={12} fill={color} fillOpacity={0.15} className="cursor-grab" />
              </g>
            );
          })}
        </svg>

        <div className="space-y-3" style={{ fontVariantNumeric: "tabular-nums" }}>
          <div className="flex gap-2">
            <VectorCard
              name="" emoji=""
              properties={["x", "y"]}
              values={[ax, ay]}
              barColor="#3b82f6"
              label="a" labelColor="#3b82f6"
              className="flex-1 min-w-0"
              animate={false}
            />
            <VectorCard
              name="" emoji=""
              properties={["x", "y"]}
              values={[bx, by]}
              barColor="#f59e0b"
              label="b" labelColor="#f59e0b"
              className="flex-1 min-w-0"
              animate={false}
            />
          </div>

          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Multiply matching parts</div>
            <div className="space-y-1">
              <div className="font-mono text-sm">
                <span className="text-muted">x:</span>{" "}
                <span className="text-blue-500">{ax.toFixed(2)}</span>
                {" \u00D7 "}
                <span className="text-amber-500">{bx.toFixed(2)}</span>
                {" = "}
                <span className="font-semibold">{xProduct.toFixed(2)}</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted">y:</span>{" "}
                <span className="text-blue-500">{ay.toFixed(2)}</span>
                {" \u00D7 "}
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

// --- Domain tab ---

function DomainItemTab({ domain }: { domain: VectorDomain }) {
  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(2);

  const itemA = domain.items[aIdx];
  const itemB = domain.items[bIdx];

  const vecA = itemA.values;
  const vecB = itemB.values;
  const similarity = vecDot(vecA, vecB);

  return (
    <>
      <SimilarityReadout similarity={similarity} variant="item" />

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start overflow-x-auto">
        {/* Row 1: selectors */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">A</div>
          <div className="flex flex-wrap gap-1">
            {domain.items.map((item, i) => (
              <button
                key={item.name}
                onClick={() => setAIdx(i)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === aIdx
                    ? "bg-blue-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">B</div>
          <div className="flex flex-wrap gap-1">
            {domain.items.map((item, i) => (
              <button
                key={item.name}
                onClick={() => setBIdx(i)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === bIdx
                    ? "bg-amber-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
        </div>
        <div>{/* empty cell above multiply column */}</div>

        {/* Row 2: cards */}
        <VectorCard
          name={itemA.name} emoji={itemA.emoji}
          properties={domain.properties} values={vecA}
          barColor="#3b82f6" label="A" labelColor="#3b82f6"
        />
        <VectorCard
          name={itemB.name} emoji={itemB.emoji}
          properties={domain.properties} values={vecB}
          barColor="#f59e0b" label="B" labelColor="#f59e0b"
        />
        <ProductColumn vecA={vecA} vecB={vecB} properties={domain.properties} similarity={similarity} variant="item" />
      </div>
    </>
  );
}

// --- Main component ---

const TABS = [
  { id: "arrows", label: "2D Arrows" },
  ...VECTOR_DOMAINS.map((d) => ({ id: d.id, label: d.label })),
];

export function DotProductComparison() {
  const [activeTab, setActiveTab] = useState("arrows");

  const handleReset = useCallback(() => {
    setActiveTab("arrows");
  }, []);

  return (
    <WidgetContainer
      title="Unit Vectors and Similarity"
      description="The dot product of two unit vectors measures pure similarity"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "arrows" ? (
        <ArrowsTab key="arrows" />
      ) : (
        <DomainItemTab key={activeTab} domain={VECTOR_DOMAINS.find((d) => d.id === activeTab)!} />
      )}
    </WidgetContainer>
  );
}
