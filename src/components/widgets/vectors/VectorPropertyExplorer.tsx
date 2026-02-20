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

const TABS = VECTOR_DOMAINS.map((d) => ({ id: d.id, label: d.label }));

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

  const domain = VECTOR_DOMAINS.find((d) => d.id === activeTab)!;

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
      <DomainTab key={activeTab} domain={domain} />
    </WidgetContainer>
  );
}
