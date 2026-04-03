"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { VectorCard } from "./VectorCard";
import {
  VECTOR_DOMAINS,
  vecDot,
  itemSimilarityLabel,
  productColor,
  type VectorDomain,
} from "./vectorData";

// --- Similarity readout ---

function SimilarityReadout({ similarity }: { similarity: number }) {
  const { text, color } = itemSimilarityLabel(similarity);
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

function ProductColumn({ vecA, vecB, properties, similarity }: {
  vecA: number[]; vecB: number[]; properties: string[]; similarity: number;
}) {
  const products = vecA.map((a, i) => a * vecB[i]);
  const maxProduct = Math.max(...products, 0.001);
  const { color: simColor } = itemSimilarityLabel(similarity);

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
      <SimilarityReadout similarity={similarity} />

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
        <ProductColumn vecA={vecA} vecB={vecB} properties={domain.properties} similarity={similarity} />
      </div>
    </>
  );
}

// --- Main component ---

const TABS = [
  ...VECTOR_DOMAINS.map((d) => ({ id: d.id, label: d.label })),
];

export function DotProductComparison() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const handleReset = useCallback(() => {
    setActiveTab(TABS[0].id);
  }, []);

  return (
    <WidgetContainer
      title="Measuring Similarity"
      description="The dot product of two unit vectors measures how similar they are"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DomainItemTab key={activeTab} domain={VECTOR_DOMAINS.find((d) => d.id === activeTab)!} />
    </WidgetContainer>
  );
}
