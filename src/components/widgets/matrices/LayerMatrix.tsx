"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SelectControl } from "../shared/SelectControl";
import { ANIMAL_DOMAIN } from "@/components/widgets/vectors/vectorData";
import { sigmoid } from "./matrixMath";

// ─── Example configs ────────────────────────────────────────────────────────

interface Neuron {
  label: string;
  emoji?: string;
  weights: number[];
  bias: number;
}

interface LayerExample {
  id: string;
  label: string;
  dims: string[];
  inputMode: "animal" | "binary";
  // animal mode
  animalNames?: string[];
  defaultAnimal?: string;
  neurons: Neuron[];
  blurb: string;
}

const ANIMAL = (name: string) => ANIMAL_DOMAIN.items.find((a) => a.name === name)!;

// Animal detector layer: 5 neurons, weights = the reference animal's vector
// scaled up (a trained network scales its detectors so sigmoid can commit).
const DETECTOR_ANIMALS = ["Bear", "Rabbit", "Eagle", "Snake", "Dog"];
function detectorNeuron(name: string): Neuron {
  const a = ANIMAL(name);
  return {
    label: `${name.toLowerCase()}-like`,
    emoji: a.emoji,
    weights: a.values.map((v) => Math.round(v * 5 * 10) / 10),
    bias: -3,
  };
}

const EXAMPLES: LayerExample[] = [
  {
    id: "animals",
    label: "Animal detectors",
    dims: ANIMAL_DOMAIN.properties,
    inputMode: "animal",
    animalNames: ANIMAL_DOMAIN.items.map((a) => a.name),
    defaultAnimal: "Cat",
    neurons: DETECTOR_ANIMALS.map(detectorNeuron),
    blurb:
      "Six property inputs feed five detector neurons. Each neuron's weights come from one reference animal (scaled up so the sigmoid can commit), so its output says how much the input looks like that animal.",
  },
  {
    id: "and",
    label: "AND gate",
    dims: ["A", "B"],
    inputMode: "binary",
    neurons: [{ label: "A AND B", weights: [6, 6], bias: -9 }],
    blurb:
      "One neuron with two inputs. Big positive weights and a bias of −9 mean it only fires when both inputs are on.",
  },
  {
    id: "or",
    label: "OR gate",
    dims: ["A", "B"],
    inputMode: "binary",
    neurons: [{ label: "A OR B", weights: [6, 6], bias: -3 }],
    blurb:
      "The same two-input neuron with a gentler bias of −3, so either input on is enough to fire it.",
  },
];

// ─── Neuron diagram ─────────────────────────────────────────────────────────

function LayerDiagram({
  dims,
  neurons,
}: {
  dims: string[];
  neurons: Neuron[];
}) {
  const W = 430;
  const rowH = 34;
  const H = Math.max(dims.length, neurons.length) * rowH + 20;
  const inX = 46;
  const outX = W - 130;
  const yFor = (i: number, n: number) => (H - (n - 1) * rowH) / 2 + i * rowH;

  return (
    <div className="mb-4 flex justify-center overflow-x-auto">
      <svg width={W} height={H} style={{ maxWidth: "100%" }}>
        {/* connections: every input to every neuron */}
        {dims.map((_, di) =>
          neurons.map((_, ni) => (
            <line
              key={`l-${di}-${ni}`}
              x1={inX}
              y1={yFor(di, dims.length)}
              x2={outX}
              y2={yFor(ni, neurons.length)}
              stroke="var(--color-border, #d4d4d8)"
              strokeWidth={1}
            />
          ))
        )}
        {/* input nodes */}
        {dims.map((d, di) => {
          const y = yFor(di, dims.length);
          return (
            <g key={`in-${d}`}>
              <circle cx={inX} cy={y} r={9} fill="#f59e0b" opacity={0.9} />
              <text x={inX - 14} y={y + 3} textAnchor="end" fontSize={10} fill="var(--color-muted, #94a3b8)">
                {d}
              </text>
            </g>
          );
        })}
        {/* neuron nodes */}
        {neurons.map((nrn, ni) => {
          const y = yFor(ni, neurons.length);
          return (
            <g key={`nrn-${nrn.label}`}>
              <circle cx={outX} cy={y} r={11} fill="var(--color-accent, #6366f1)" />
              <text x={outX + 16} y={y + 3} textAnchor="start" fontSize={10} fill="var(--color-foreground)">
                {nrn.emoji ? `${nrn.emoji} ` : ""}{nrn.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Value colour ───────────────────────────────────────────────────────────

function outColor(v: number): string {
  if (v >= 0.65) return "#16a34a";
  if (v >= 0.4) return "#f59e0b";
  return "#94a3b8";
}

// ─── One worked example ─────────────────────────────────────────────────────

function ExampleView({ example }: { example: LayerExample }) {
  const [animalName, setAnimalName] = useState(example.defaultAnimal ?? "Cat");
  const [bits, setBits] = useState<number[]>(() => example.dims.map(() => 1));

  const input = useMemo(() => {
    if (example.inputMode === "animal") return ANIMAL(animalName).values;
    return bits;
  }, [example, animalName, bits]);

  const inputEmoji = example.inputMode === "animal" ? ANIMAL(animalName).emoji : "🔢";
  const inputName = example.inputMode === "animal" ? animalName : "input";

  const nDims = example.dims.length;
  const template = `8rem repeat(${nDims}, 3rem) 3.25rem 4.25rem 4.75rem`;

  const animalOptions = (example.animalNames ?? []).map((n) => {
    const a = ANIMAL(n);
    return { value: n, label: `${a.emoji} ${n}` };
  });

  return (
    <>
      <LayerDiagram dims={example.dims} neurons={example.neurons} />

      <div className="mb-4 text-xs text-muted leading-relaxed">{example.blurb}</div>

      {/* Input control */}
      <div className="mb-4">
        {example.inputMode === "animal" ? (
          <SelectControl
            label="Input vector"
            value={animalName}
            options={animalOptions}
            onChange={setAnimalName}
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">Inputs</span>
            {example.dims.map((d, i) => (
              <button
                key={d}
                onClick={() => setBits((prev) => prev.map((b, j) => (j === i ? (b ? 0 : 1) : b)))}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  bits[i]
                    ? "border-amber-500 text-amber-600 bg-amber-500/10"
                    : "border-border text-muted hover:bg-surface"
                }`}
                style={bits[i] ? { color: "#d97706" } : undefined}
              >
                {d} = {bits[i]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Equation grid */}
      <div className="overflow-x-auto">
        <div style={{ width: "max-content" }}>
          {/* header */}
          <div className="grid" style={{ gridTemplateColumns: template, columnGap: "0.375rem" }}>
            <div className="px-1 pb-1" />
            {example.dims.map((d) => (
              <div key={d} className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                {d}
              </div>
            ))}
            <div className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted">bias</div>
            <div className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted">w·x+b</div>
            <div className="px-1 pb-1 text-center text-[9px] font-bold uppercase tracking-widest text-accent leading-tight">
              after<br />sigmoid
            </div>
          </div>

          {/* input row */}
          <div className="grid" style={{ gridTemplateColumns: template, columnGap: "0.375rem" }}>
            <div className="flex items-center gap-1.5 rounded-md border bg-surface px-3 py-2.5" style={{ borderColor: "#f59e0b" }}>
              <span className="text-base leading-none">{inputEmoji}</span>
              <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>{inputName}</span>
            </div>
            {input.map((v, i) => (
              <div key={`in-${example.dims[i]}`} className="flex items-center justify-center rounded-md border bg-surface px-1 py-2.5" style={{ borderColor: "#f59e0b" }}>
                <span className="font-mono text-xs font-bold tabular-nums" style={{ color: "#f59e0b" }}>{v.toFixed(2)}</span>
              </div>
            ))}
            <div /><div /><div />
          </div>

          {/* × */}
          <div className="flex justify-center py-1">
            <span className="font-bold select-none" style={{ fontSize: "1.75rem", lineHeight: 1, color: "var(--color-muted, #94a3b8)" }} aria-hidden="true">×</span>
          </div>

          {/* neuron rows */}
          <div className="flex flex-col gap-1.5">
            {example.neurons.map((nrn) => {
              const raw = nrn.weights.reduce((s, w, i) => s + w * input[i], 0) + nrn.bias;
              const out = sigmoid(raw);
              const col = outColor(out);
              return (
                <div key={nrn.label} className="grid" style={{ gridTemplateColumns: template, columnGap: "0.375rem" }}>
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5">
                    {nrn.emoji && <span className="text-base leading-none">{nrn.emoji}</span>}
                    <span className="text-xs font-semibold text-foreground">{nrn.label}</span>
                  </div>
                  {nrn.weights.map((w, i) => (
                    <div key={`w-${example.dims[i]}`} className="flex items-center justify-center rounded-md border border-border bg-surface px-1 py-2.5">
                      <span className="font-mono text-xs text-foreground tabular-nums">{w.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-center rounded-md border border-border bg-surface px-1 py-2.5">
                    <span className="font-mono text-xs text-muted tabular-nums">{nrn.bias.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-center rounded-md border border-border bg-foreground/[0.03] px-1 py-2.5">
                    <span className="font-mono text-xs font-semibold text-foreground tabular-nums">{raw.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-center rounded-md border-2 px-1 py-2.5" style={{ borderColor: col, backgroundColor: `${col}1a` }}>
                    <span className="font-mono text-xs font-bold tabular-nums" style={{ color: col }}>{out.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-surface px-3 py-2 text-xs text-muted border border-border">
        The matrix multiply gives <span className="font-mono">w·x+b</span> for every neuron at once. The
        activation function (here the <strong>sigmoid</strong>) then squashes each result into a smooth 0-to-1
        answer. Matrix, then activation — that is one layer.
      </div>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

const TABS = EXAMPLES.map((e) => ({ id: e.id, label: e.label }));

export function LayerMatrix() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const handleReset = useCallback(() => setActiveTab(TABS[0].id), []);
  const example = EXAMPLES.find((e) => e.id === activeTab)!;

  return (
    <WidgetContainer
      title="A Layer Is a Matrix, Then an Activation"
      description="Each tab is a layer of neurons written as a weight matrix. Multiply by the input, then apply the activation function."
      onReset={handleReset}
    >
      <WidgetTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <ExampleView key={activeTab} example={example} />
    </WidgetContainer>
  );
}
