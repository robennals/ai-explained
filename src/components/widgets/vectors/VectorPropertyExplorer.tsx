"use client";

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { VectorCard } from "./VectorCard";
import { VECTOR_DOMAINS, type VectorDomain, type VectorItem } from "./vectorData";

const ANIM_MS = 300;
const GAP = 12;

interface TransitionState {
  exitingItem: VectorItem;
  cardWidth: number;
}

const TABS = [
  { id: "2d", label: "2D Line" },
  ...VECTOR_DOMAINS.map((d) => ({ id: d.id, label: d.label })),
];

// --- 2D Arrow tab ---

const SVG_SIZE = 260;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 80;

function ArrowTab() {
  const [vx, setVx] = useState(0.7);
  const [vy, setVy] = useState(0.5);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const tipX = CX + vx * SCALE;
  const tipY = CY - vy * SCALE;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const clamp = (v: number) => Math.max(-1.5, Math.min(1.5, v));
    setVx(clamp((mx - CX) / SCALE));
    setVy(clamp(-(my - CY) / SCALE));
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const clamp = (v: number) => Math.max(-1.5, Math.min(1.5, v));
    setVx(clamp((mx - CX) / SCALE));
    setVy(clamp(-(my - CY) / SCALE));
  }, []);

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  // Arrow head
  const dx = tipX - CX;
  const dy = tipY - CY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const hl = 8;
  const h1x = tipX - hl * Math.cos(angle - 0.4);
  const h1y = tipY - hl * Math.sin(angle - 0.4);
  const h2x = tipX - hl * Math.cos(angle + 0.4);
  const h2y = tipY - hl * Math.sin(angle + 0.4);

  const vecLength = Math.sqrt(vx * vx + vy * vy);

  return (
    <>
      <p className="mb-4 text-xs text-muted">
        Drag the tip to change the line. The card shows the same line as two numbers — the x and y dimensions. The <strong>length</strong> of the line is calculated from x and y using the Pythagorean theorem.
      </p>
      <div className="flex gap-4 items-start flex-wrap sm:flex-nowrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full max-w-[260px] cursor-crosshair touch-none select-none shrink-0"
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
          {/* Tick labels */}
          {[-1, 1].map((t) => (
            <g key={t}>
              <line x1={CX + t * SCALE} y1={CY - 3} x2={CX + t * SCALE} y2={CY + 3} stroke="currentColor" strokeOpacity={0.2} />
              <text x={CX + t * SCALE} y={CY + 14} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
              <line x1={CX - 3} y1={CY - t * SCALE} x2={CX + 3} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.2} />
              <text x={CX - 8} y={CY - t * SCALE + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.3}>{t}</text>
            </g>
          ))}
          {/* Arrow */}
          {len > 2 && (
            <g>
              <line x1={CX} y1={CY} x2={tipX} y2={tipY} stroke="var(--color-accent)" strokeWidth={2.5} />
              <polygon points={`${tipX},${tipY} ${h1x},${h1y} ${h2x},${h2y}`} fill="var(--color-accent)" />
            </g>
          )}
          <circle cx={tipX} cy={tipY} r={10} fill="var(--color-accent)" fillOpacity={0.15} className="cursor-grab" />
        </svg>

        <div>
          <VectorCard
            name="2D Line" emoji="→"
            properties={["x", "y"]}
            values={[vx, vy]}
            signed signedMax={1.5}
            animate={false}
          />
          <div className="mt-2 rounded-lg bg-foreground/[0.03] p-3 space-y-1">
            <div className="font-mono text-xs">
              vector = ({vx.toFixed(2)}, {vy.toFixed(2)})
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted mt-2">Length</div>
            <div className="font-mono text-xs flex items-baseline gap-0">
              = <span className="inline-flex items-center"><span>√</span><span className="border-t border-current px-0.5 -mt-1">{vx.toFixed(2)}² + {vy.toFixed(2)}²</span></span>
            </div>
            <div className="font-mono text-xs flex items-baseline gap-0">
              = <span className="inline-flex items-center"><span>√</span><span className="border-t border-current px-0.5 -mt-1">{(vx * vx).toFixed(2)} + {(vy * vy).toFixed(2)}</span></span>
            </div>
            <div className="font-mono text-xs flex items-baseline gap-0">
              = <span className="inline-flex items-center"><span>√</span><span className="border-t border-current px-0.5 -mt-1">{(vx * vx + vy * vy).toFixed(2)}</span></span>
            </div>
            <div className="font-mono text-sm font-bold">
              = {vecLength.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DomainTab({ domain }: { domain: VectorDomain }) {
  const [selected, setSelected] = useState<[number, number | null]>([0, null]);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (idx: number) => {
      setSelected(([a, b]) => {
        if (b === null) {
          return idx === a ? [a, null] : [a, idx];
        }
        if (idx === a || idx === b) return [a, b];

        const cardWidth = cardRef.current?.offsetWidth ?? 150;
        setTransition({ exitingItem: domain.items[a], cardWidth });

        return [b, idx];
      });
    },
    [domain.items]
  );

  useLayoutEffect(() => {
    if (!transition && stripRef.current) {
      stripRef.current.style.transition = "none";
      stripRef.current.style.transform = "translateX(0)";
    }
  }, [transition]);

  useEffect(() => {
    if (!transition || !stripRef.current) return;
    const strip = stripRef.current;
    const offset = transition.cardWidth + GAP;

    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";

    strip.getBoundingClientRect();
    strip.style.transition = `transform ${ANIM_MS}ms ease-out`;
    strip.style.transform = `translateX(-${offset}px)`;

    const timer = setTimeout(() => {
      setTransition(null);
    }, ANIM_MS);

    return () => clearTimeout(timer);
  }, [transition]);

  const [selA, selB] = selected;
  const itemA = domain.items[selA];
  const itemB = selB !== null ? domain.items[selB] : null;

  const getHighlight = useCallback(
    (index: number): "match" | "diff" | "none" => {
      if (!itemB) return "none";
      const diff = Math.abs(itemA.values[index] - itemB.values[index]);
      return diff < 0.2 ? "match" : "diff";
    },
    [itemA, itemB]
  );

  return (
    <>
      {/* Item selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {domain.items.map((item, i) => {
          const isSel = i === selA || i === selB;
          return (
            <button
              key={item.name}
              onClick={() => handleClick(i)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isSel
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-foreground hover:bg-foreground/10"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-muted">
        {itemB
          ? "Comparing two items. Green bars are similar, red bars are different."
          : "Click a second item to compare their vectors."}
      </p>

      {/* Cards */}
      <div className="overflow-hidden">
        <div ref={stripRef} className="flex gap-3">
          {transition && (
            <VectorCard
              name={transition.exitingItem.name}
              emoji={transition.exitingItem.emoji}
              properties={domain.properties}
              values={transition.exitingItem.values}
            />
          )}

          <div ref={cardRef}>
            <VectorCard
              name={itemA.name}
              emoji={itemA.emoji}
              properties={domain.properties}
              values={itemA.values}
              highlight={itemB ? getHighlight : undefined}
            />
          </div>

          {itemB && (
            <VectorCard
              name={itemB.name}
              emoji={itemB.emoji}
              properties={domain.properties}
              values={itemB.values}
              highlight={getHighlight}
            />
          )}
        </div>
      </div>

      {/* Vector notation */}
      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-foreground/[0.03] p-3">
          <span className="font-mono text-xs">
            {itemA.emoji} = ({itemA.values.map((v) => v.toFixed(2)).join(", ")})
          </span>
        </div>
        {itemB && (
          <div className="rounded-lg bg-foreground/[0.03] p-3">
            <span className="font-mono text-xs">
              {itemB.emoji} = ({itemB.values.map((v) => v.toFixed(2)).join(", ")})
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export function VectorPropertyExplorer() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const handleReset = useCallback(() => {
    setActiveTab(TABS[0].id);
  }, []);

  return (
    <WidgetContainer
      title="Describing Things with Vectors"
      description="Each thing is described by a list of numbers — a vector"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === "2d" ? (
        <ArrowTab key="2d" />
      ) : (
        <DomainTab key={activeTab} domain={VECTOR_DOMAINS.find((d) => d.id === activeTab)!} />
      )}
    </WidgetContainer>
  );
}
