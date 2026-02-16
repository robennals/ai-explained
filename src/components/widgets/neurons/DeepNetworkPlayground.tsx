"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
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
    const b = Math.round(160 + (129 - 160) * t);
    return `rgb(${r},${g},${b})`;
  }
}

// Generate initial random weights for a network
function initWeights(
  numInputs: number,
  numLayers: number,
  neuronsPerLayer: number,
  numOutputs: number
): number[][][] {
  const layers: number[][][] = [];
  const rand = () => (Math.random() - 0.5) * 2;

  for (let l = 0; l < numLayers; l++) {
    const inputSize = l === 0 ? numInputs : neuronsPerLayer;
    const outputSize = neuronsPerLayer;
    const layer: number[][] = [];
    for (let n = 0; n < outputSize; n++) {
      // weights for each input + bias
      const neuronWeights: number[] = [];
      for (let w = 0; w < inputSize; w++) {
        neuronWeights.push(rand());
      }
      neuronWeights.push(rand()); // bias
      layer.push(neuronWeights);
    }
    layers.push(layer);
  }

  // Output layer
  const outLayer: number[][] = [];
  const lastHiddenSize = numLayers > 0 ? neuronsPerLayer : numInputs;
  for (let n = 0; n < numOutputs; n++) {
    const neuronWeights: number[] = [];
    for (let w = 0; w < lastHiddenSize; w++) {
      neuronWeights.push(rand());
    }
    neuronWeights.push(rand()); // bias
    outLayer.push(neuronWeights);
  }
  layers.push(outLayer);

  return layers;
}

// Forward pass through the network
function forwardPass(
  inputs: number[],
  weights: number[][][]
): number[][] {
  const activations: number[][] = [inputs];
  let current = inputs;

  for (let l = 0; l < weights.length; l++) {
    const layerOut: number[] = [];
    for (let n = 0; n < weights[l].length; n++) {
      const w = weights[l][n];
      let sum = w[w.length - 1]; // bias
      for (let i = 0; i < current.length; i++) {
        sum += current[i] * w[i];
      }
      layerOut.push(sigmoid(sum));
    }
    activations.push(layerOut);
    current = layerOut;
  }

  return activations;
}

interface SelectedNeuron {
  layer: number; // 0 = first hidden layer, weights.length-1 = output layer
  index: number;
}

const NODE_R = 14;
const MAX_VISIBLE_NEURONS = 8;

export function DeepNetworkPlayground() {
  const [numInputs, setNumInputs] = useState(2);
  const [numLayers, setNumLayers] = useState(2);
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(3);
  const [numOutputs, setNumOutputs] = useState(1);
  const [weights, setWeights] = useState(() =>
    initWeights(2, 2, 3, 1)
  );
  const [inputs, setInputs] = useState<number[]>([0.5, 0.5]);
  const [selected, setSelected] = useState<SelectedNeuron | null>(null);

  // Recompute weights when architecture changes
  const rebuildNetwork = useCallback(
    (ni: number, nl: number, npl: number, no: number) => {
      setNumInputs(ni);
      setNumLayers(nl);
      setNeuronsPerLayer(npl);
      setNumOutputs(no);
      setWeights(initWeights(ni, nl, npl, no));
      setInputs(Array(ni).fill(0.5));
      setSelected(null);
    },
    []
  );

  const reset = useCallback(() => {
    rebuildNetwork(2, 2, 3, 1);
  }, [rebuildNetwork]);

  // Forward pass
  const activations = useMemo(
    () => forwardPass(inputs, weights),
    [inputs, weights]
  );

  // Network structure for layout: [numInputs, npl, npl, ..., numOutputs]
  const layerSizes = useMemo(() => {
    const sizes = [numInputs];
    for (let i = 0; i < numLayers; i++) sizes.push(neuronsPerLayer);
    sizes.push(numOutputs);
    return sizes;
  }, [numInputs, numLayers, neuronsPerLayer, numOutputs]);

  // SVG layout
  const totalLayers = layerSizes.length;
  const maxNeurons = Math.max(...layerSizes);
  const svgW = Math.max(400, totalLayers * 80 + 40);
  const svgH = Math.max(200, Math.min(maxNeurons, MAX_VISIBLE_NEURONS) * 38 + 60);
  const layerSpacing = (svgW - 60) / Math.max(1, totalLayers - 1);

  const getNodePos = (layerIdx: number, neuronIdx: number, layerSize: number) => {
    const visSize = Math.min(layerSize, MAX_VISIBLE_NEURONS);
    const x = 30 + layerIdx * layerSpacing;
    const totalH = visSize * 36;
    const startY = (svgH - totalH) / 2 + 18;
    const y = startY + neuronIdx * 36;
    return { x, y };
  };

  const updateWeight = useCallback(
    (layerIdx: number, neuronIdx: number, weightIdx: number, value: number) => {
      setWeights((prev) => {
        const next = prev.map((l) => l.map((n) => [...n]));
        next[layerIdx][neuronIdx][weightIdx] = value;
        return next;
      });
    },
    []
  );

  const toggleInput = useCallback(
    (idx: number) => {
      setInputs((prev) => {
        const next = [...prev];
        next[idx] = next[idx] > 0.5 ? 0 : 1;
        return next;
      });
    },
    []
  );

  // Selected neuron details
  const selWeights = selected ? weights[selected.layer][selected.index] : null;
  const selInputSize = selected
    ? selected.layer === 0
      ? numInputs
      : weights[selected.layer - 1].length
    : 0;

  // Count total parameters
  const totalParams = weights.reduce(
    (sum, layer) => sum + layer.reduce((s, n) => s + n.length, 0),
    0
  );

  return (
    <WidgetContainer
      title="Deep Network Playground"
      description="Build a network, click neurons to explore their weights, and try to make it do something useful."
      onReset={reset}
    >
      {/* Architecture controls */}
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        {[
          { label: "Inputs", value: numInputs, set: (v: number) => rebuildNetwork(v, numLayers, neuronsPerLayer, numOutputs), min: 1, max: 8 },
          { label: "Hidden layers", value: numLayers, set: (v: number) => rebuildNetwork(numInputs, v, neuronsPerLayer, numOutputs), min: 1, max: 6 },
          { label: "Neurons/layer", value: neuronsPerLayer, set: (v: number) => rebuildNetwork(numInputs, numLayers, v, numOutputs), min: 1, max: 8 },
          { label: "Outputs", value: numOutputs, set: (v: number) => rebuildNetwork(numInputs, numLayers, neuronsPerLayer, v), min: 1, max: 4 },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground">{c.label}</span>
            <input
              type="range"
              min={c.min}
              max={c.max}
              step={1}
              value={c.value}
              onChange={(e) => c.set(parseInt(e.target.value))}
              className="w-20 h-1.5 accent-accent"
            />
            <span className="text-[12px] font-mono font-bold text-foreground w-6 text-right">
              {c.value}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center text-[11px] text-muted mb-3">
        {totalParams} total parameters (weights + biases)
      </div>

      {/* Network diagram */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        <defs>
          <marker
            id="dn-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="3"
            markerHeight="3"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#d1d5db" />
          </marker>
        </defs>

        {/* Connections */}
        {layerSizes.slice(0, -1).map((fromSize, lIdx) => {
          const toSize = layerSizes[lIdx + 1];
          const visFrom = Math.min(fromSize, MAX_VISIBLE_NEURONS);
          const visTo = Math.min(toSize, MAX_VISIBLE_NEURONS);
          const isSelectedLayer =
            selected && selected.layer === lIdx;
          const lines: React.ReactNode[] = [];
          for (let f = 0; f < visFrom; f++) {
            for (let t = 0; t < visTo; t++) {
              const from = getNodePos(lIdx, f, fromSize);
              const to = getNodePos(lIdx + 1, t, toSize);
              const bold =
                isSelectedLayer && t === selected!.index;
              lines.push(
                <line
                  key={`${lIdx}-${f}-${t}`}
                  x1={from.x + NODE_R}
                  y1={from.y}
                  x2={to.x - NODE_R}
                  y2={to.y}
                  stroke={bold ? "#3b82f6" : "#e5e7eb"}
                  strokeWidth={bold ? 1.5 : 0.5}
                  markerEnd="url(#dn-arrow)"
                />
              );
            }
          }
          return lines;
        })}

        {/* Nodes */}
        {layerSizes.map((size, lIdx) => {
          const visSize = Math.min(size, MAX_VISIBLE_NEURONS);
          const nodes: React.ReactNode[] = [];
          for (let n = 0; n < visSize; n++) {
            const pos = getNodePos(lIdx, n, size);
            const val = activations[lIdx]?.[n] ?? 0.5;
            const isInput = lIdx === 0;
            const isSelected =
              selected &&
              selected.layer === lIdx - 1 &&
              selected.index === n;
            // For hidden/output layers, layer index in weights is lIdx - 1
            const canSelect = !isInput;

            nodes.push(
              <g
                key={`${lIdx}-${n}`}
                className={canSelect || isInput ? "cursor-pointer" : ""}
                onClick={() => {
                  if (isInput) {
                    toggleInput(n);
                  } else {
                    setSelected({ layer: lIdx - 1, index: n });
                  }
                }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R}
                  fill={isInput ? (val > 0.5 ? "#dbeafe" : "#f9fafb") : outputColor(val)}
                  stroke={
                    isSelected
                      ? "#3b82f6"
                      : isInput
                      ? val > 0.5
                        ? "#3b82f6"
                        : "#d1d5db"
                      : outputColor(val)
                  }
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  className={`text-[9px] font-bold font-mono pointer-events-none select-none ${
                    isInput ? "fill-foreground" : "fill-white"
                  }`}
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          }
          if (size > MAX_VISIBLE_NEURONS) {
            const pos = getNodePos(lIdx, visSize, size);
            nodes.push(
              <text
                key={`${lIdx}-overflow`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                className="fill-muted text-[10px] pointer-events-none select-none"
              >
                +{size - MAX_VISIBLE_NEURONS} more
              </text>
            );
          }
          // Layer label
          const labelY = 16;
          const labelX = 30 + lIdx * layerSpacing;
          nodes.push(
            <text
              key={`label-${lIdx}`}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              className="fill-muted text-[9px] font-medium pointer-events-none select-none"
            >
              {lIdx === 0
                ? "Input"
                : lIdx === layerSizes.length - 1
                ? "Output"
                : `Layer ${lIdx}`}
            </text>
          );
          return nodes;
        })}
      </svg>

      {/* Selected neuron weights */}
      {selected && selWeights && (
        <div className="mt-3 p-3 rounded-lg bg-foreground/[0.03] border border-border">
          <div className="text-xs font-semibold text-foreground mb-2">
            {selected.layer === weights.length - 1
              ? `Output neuron ${selected.index + 1}`
              : `Layer ${selected.layer + 1}, Neuron ${selected.index + 1}`}
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {selWeights.slice(0, selInputSize).map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-16 shrink-0">
                  w{i + 1}
                </span>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.1}
                  value={w}
                  onChange={(e) =>
                    updateWeight(
                      selected.layer,
                      selected.index,
                      i,
                      parseFloat(e.target.value)
                    )
                  }
                  className="flex-1 h-1.5 accent-accent"
                />
                <span className="text-[10px] font-mono font-bold text-foreground w-10 text-right">
                  {w.toFixed(1)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted w-16 shrink-0">
                bias
              </span>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.1}
                value={selWeights[selInputSize]}
                onChange={(e) =>
                  updateWeight(
                    selected.layer,
                    selected.index,
                    selInputSize,
                    parseFloat(e.target.value)
                  )
                }
                className="flex-1 h-1.5 accent-accent"
              />
              <span className="text-[10px] font-mono font-bold text-foreground w-10 text-right">
                {selWeights[selInputSize].toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="mt-3 text-center text-[11px] text-muted">
          Click any neuron to see and adjust its weights
        </div>
      )}
    </WidgetContainer>
  );
}
