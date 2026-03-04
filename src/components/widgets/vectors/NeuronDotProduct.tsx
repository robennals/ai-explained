"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "./VectorCard";
import { VECTOR_DOMAINS, vecDot, productColor, type VectorDomain } from "./vectorData";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function outputColor(v: number): string {
  if (v <= 0.5) {
    const t = v / 0.5;
    const r = Math.round(239 + (160 - 239) * t);
    const g = Math.round(68 + (160 - 68) * t);
    const b = Math.round(68 + (160 - 68) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (v - 0.5) / 0.5;
    const r = Math.round(160 + (16 - 160) * t);
    const g = Math.round(160 + (185 - 160) * t);
    const b = Math.round(160 + (160 - 160) * t);
    return `rgb(${r},${g},${b})`;
  }
}

// --- Neuron diagram ---

function NeuronDiagram({ dot, bias, output, outColor }: {
  dot: number; bias: number; output: number; outColor: string;
}) {
  const preActivation = dot + bias;

  const ND_W = 580;
  const ND_H = 215;
  const ND_IN_X = 45;
  const ND_SUM_X = 200;
  const ND_SUM_Y = 110;
  const ND_ACT_X = 360;
  const ND_ACT_Y = 110;
  const ND_ACT_W = 100;
  const ND_ACT_H = 70;
  const ND_OUT_X = 520;
  const ND_OUT_Y = 110;

  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    const pL = ND_ACT_X - ND_ACT_W / 2 + 8;
    const pR = ND_ACT_X + ND_ACT_W / 2 - 8;
    const pT = ND_ACT_Y - ND_ACT_H / 2 + 8;
    const pB = ND_ACT_Y + ND_ACT_H / 2 - 8;
    for (let i = 0; i <= 100; i++) {
      const xv = -10 + 20 * (i / 100);
      const yv = sigmoid(xv);
      pts.push(
        `${i === 0 ? "M" : "L"}${(pL + (i / 100) * (pR - pL)).toFixed(1)},${(pB - yv * (pB - pT)).toFixed(1)}`
      );
    }
    return pts.join(" ");
  }, []);

  const opFrac = Math.max(0, Math.min(1, (preActivation + 10) / 20));
  const ndPL = ND_ACT_X - ND_ACT_W / 2 + 8;
  const ndPR = ND_ACT_X + ND_ACT_W / 2 - 8;
  const ndPT = ND_ACT_Y - ND_ACT_H / 2 + 8;
  const ndPB = ND_ACT_Y + ND_ACT_H / 2 - 8;
  const opSx = ndPL + opFrac * (ndPR - ndPL);
  const opSy = ndPB - output * (ndPB - ndPT);

  const inputNodes = [
    { label: "x₁", y: 40 },
    { label: "x₂", y: 82 },
    { label: null, y: 120 },
    { label: "xₙ", y: 158 },
  ];

  return (
    <svg viewBox={`0 0 ${ND_W} ${ND_H}`} className="w-full mb-4 select-none" aria-label="Neuron as dot product diagram">
      <defs>
        <marker id="ndp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
        </marker>
      </defs>

      <text x={ND_IN_X} y={12} textAnchor="middle" className="fill-foreground text-[11px] font-bold">Input x</text>

      {inputNodes.map((node, i) => {
        if (!node.label) {
          return (
            <text key={i} x={ND_IN_X} y={node.y + 5} textAnchor="middle" className="fill-muted text-[16px]">⋮</text>
          );
        }
        const wLabel = i === 0 ? "w₁" : i === 1 ? "w₂" : "wₙ";
        const midX = (ND_IN_X + 16 + ND_SUM_X - 26) / 2;
        const midY = (node.y + ND_SUM_Y) / 2;
        return (
          <g key={i}>
            <circle cx={ND_IN_X} cy={node.y} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="1.5" />
            <text x={ND_IN_X} y={node.y + 4} textAnchor="middle" className="fill-accent text-[11px] font-medium">{node.label}</text>
            <line x1={ND_IN_X + 16} y1={node.y} x2={ND_SUM_X - 26} y2={ND_SUM_Y} stroke="#9ca3af" strokeWidth="1.2" markerEnd="url(#ndp-arrow)" />
            <text x={midX} y={midY - 5} textAnchor="middle" className="fill-muted text-[8px] font-mono">{wLabel}</text>
          </g>
        );
      })}

      <text x={(ND_IN_X + 16 + ND_SUM_X - 26) / 2} y={12} textAnchor="middle" className="fill-foreground text-[11px] font-bold">Weight w</text>

      <circle cx={ND_SUM_X} cy={ND_SUM_Y} r={24} fill="#fef9ee" stroke="#f59e0b" strokeWidth="1.5" />
      <text x={ND_SUM_X} y={ND_SUM_Y - 3} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">w · x</text>
      <text x={ND_SUM_X} y={ND_SUM_Y + 10} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">+ bias</text>

      <line x1={ND_SUM_X} y1={ND_SUM_Y + 38} x2={ND_SUM_X} y2={ND_SUM_Y + 26} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#ndp-arrow)" />
      <text x={ND_SUM_X} y={ND_SUM_Y + 50} textAnchor="middle" className="fill-muted text-[9px]">bias = {bias.toFixed(1)}</text>

      <text x={ND_SUM_X} y={ND_SUM_Y - 30} textAnchor="middle" className="fill-warning text-[11px] font-bold font-mono">{preActivation.toFixed(2)}</text>

      <line x1={ND_SUM_X + 26} y1={ND_SUM_Y} x2={ND_ACT_X - ND_ACT_W / 2 - 4} y2={ND_ACT_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ndp-arrow)" />

      <rect x={ND_ACT_X - ND_ACT_W / 2} y={ND_ACT_Y - ND_ACT_H / 2} width={ND_ACT_W} height={ND_ACT_H} rx={8} fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
      <text x={ND_ACT_X} y={ND_ACT_Y - ND_ACT_H / 2 - 6} textAnchor="middle" className="fill-success text-[8px] font-semibold uppercase tracking-wider">Activation</text>
      <path d={sigmoidPath} fill="none" stroke="#10b981" strokeWidth="2" />
      <line x1={opSx} y1={ndPB} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
      <line x1={ndPL} y1={opSy} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
      <circle cx={opSx} cy={opSy} r={5} fill="#f59e0b" stroke="white" strokeWidth="1.5" />

      <line x1={ND_ACT_X + ND_ACT_W / 2 + 2} y1={ND_ACT_Y} x2={ND_OUT_X - 22} y2={ND_OUT_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ndp-arrow)" />

      <text x={ND_OUT_X} y={ND_OUT_Y - 26} textAnchor="middle" className="fill-foreground text-[11px] font-bold">Output</text>
      <circle cx={ND_OUT_X} cy={ND_OUT_Y} r={20} fill={outColor} stroke={outColor} strokeWidth="2" />
      <text x={ND_OUT_X} y={ND_OUT_Y + 5} textAnchor="middle" className="fill-white text-[13px] font-bold font-mono">{output.toFixed(2)}</text>
    </svg>
  );
}

// --- Product column (matches DotProductComparison) ---

function ProductColumn({ vecW, vecX, properties, dot }: {
  vecW: number[]; vecX: number[]; properties: string[]; dot: number;
}) {
  const products = vecW.map((w, i) => w * vecX[i]);
  const maxProduct = Math.max(...products.map(Math.abs), 0.001);

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
              <span className="text-amber-500">{vecW[i].toFixed(2)}</span>
              {" × "}
              <span className="text-blue-500">{vecX[i].toFixed(2)}</span>
              {" = "}
              <span className="font-bold" style={{ color: productColor(Math.abs(product), maxProduct) }}>{product.toFixed(2)}</span>
            </span>
          </div>
        );
      })}
      <div className="py-1.5 px-3 border-t-2 border-foreground/15 bg-foreground/[0.02]">
        <div className="font-mono text-[10px] font-bold">
          {products.map((p, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted">{" + "}</span>}
              <span style={{ color: productColor(Math.abs(p), maxProduct) }}>{p.toFixed(2)}</span>
            </span>
          ))}
        </div>
        <div className="font-mono text-sm font-bold mt-0.5">
          = {dot.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

// --- Domain tab (animals, RPG, etc.) ---

function DomainNeuronTab({ domain, bias, onBiasChange, weightMag, onWeightMagChange, defaultMag }: { domain: VectorDomain; bias: number; onBiasChange: (v: number) => void; weightMag: number; onWeightMagChange: (v: number) => void; defaultMag: number }) {
  const [wIdx, setWIdx] = useState(0);
  const [xIdx, setXIdx] = useState(1);

  const weightItem = domain.items[wIdx];
  const inputItem = domain.items[xIdx];

  const scaledWeightValues = weightItem.values.map((v) => v * weightMag);
  const dot = vecDot(scaledWeightValues, inputItem.values);
  const output = sigmoid(dot + bias);
  const outColor = outputColor(output);

  return (
    <>
      <NeuronDiagram dot={dot} bias={bias} output={output} outColor={outColor} />

      <div className="mb-4 space-y-2">
        <SliderControl label="bias" value={bias} min={-Math.round(defaultMag * 2)} max={Math.round(defaultMag * 2)} step={0.1} onChange={onBiasChange} />
        <SliderControl label="weight magnitude" value={weightMag} min={0} max={Math.round(defaultMag * 2)} step={0.1} onChange={onWeightMagChange} />
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start overflow-x-auto">
        {/* Row 1: selectors */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">Weight direction (Detects)</div>
          <div className="flex flex-wrap gap-1">
            {domain.items.map((item, i) => (
              <button
                key={item.name}
                onClick={() => setWIdx(i)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === wIdx
                    ? "bg-amber-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">Input</div>
          <div className="flex flex-wrap gap-1">
            {domain.items.map((item, i) => (
              <button
                key={item.name}
                onClick={() => setXIdx(i)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === xIdx
                    ? "bg-blue-500 text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
        </div>
        <div>{/* empty cell above multiply column */}</div>

        {/* Row 2: cards + product column */}
        <VectorCard
          name={`${weightItem.name} × ${weightMag.toFixed(1)}`} emoji={weightItem.emoji}
          properties={domain.properties} values={scaledWeightValues}
          barColor="#f59e0b" label="weight" labelColor="#f59e0b"
          barMax={Math.max(weightMag, 1)}
        />
        <VectorCard
          name={inputItem.name} emoji={inputItem.emoji}
          properties={domain.properties} values={inputItem.values}
          barColor="#3b82f6" label="input" labelColor="#3b82f6"
        />
        <ProductColumn vecW={scaledWeightValues} vecX={inputItem.values} properties={domain.properties} dot={dot} />
      </div>
    </>
  );
}

// --- Main component ---

const TABS = [
  ...VECTOR_DOMAINS.map((d) => ({ id: d.id, label: d.label })),
];

// Per-domain defaults: computed so that the first item ≈ 0.97 output and the least-similar item ≈ 0.03
// Formula: mag*(1)+bias=3.5 and mag*minDot+bias=-3.5 → mag=7/(1-minDot), bias=3.5-mag
const DOMAIN_DEFAULTS: Record<string, { mag: number; bias: number }> = {
  animals:     { mag: 17, bias: -13.5 },
  rpg:         { mag: 15.5, bias: -12 },
  foods:       { mag: 15.5, bias: -12 },
  instruments: { mag: 37, bias: -33.5 },
};

export function NeuronDotProduct() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [bias, setBias] = useState(DOMAIN_DEFAULTS[TABS[0].id]?.bias ?? -1.0);
  const [weightMag, setWeightMag] = useState(DOMAIN_DEFAULTS[TABS[0].id]?.mag ?? 1.0);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const defaults = DOMAIN_DEFAULTS[tab];
    if (defaults) {
      setBias(defaults.bias);
      setWeightMag(defaults.mag);
    } else {
      setBias(-1.0);
      setWeightMag(1.0);
    }
  }, []);

  const handleReset = useCallback(() => {
    handleTabChange(TABS[0].id);
  }, [handleTabChange]);

  return (
    <WidgetContainer
      title="A Neuron Is a Dot Product"
      description="The weighted sum is the dot product of inputs and weights"
      onReset={handleReset}
    >
      <WidgetTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <DomainNeuronTab
        key={activeTab}
        domain={VECTOR_DOMAINS.find((d) => d.id === activeTab)!}
        bias={bias}
        onBiasChange={setBias}
        weightMag={weightMag}
        onWeightMagChange={setWeightMag}
        defaultMag={DOMAIN_DEFAULTS[activeTab]?.mag ?? 6}
      />
    </WidgetContainer>
  );
}
