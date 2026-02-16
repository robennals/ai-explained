"use client";

import { useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/**
 * Interactive diagram of a multi-layer neural network.
 * Click any neuron to learn what it does.
 */

const W = 500;
const H = 240;

const LAYERS = [
  { label: "Input", count: 3, color: "#3b82f6", bg: "#f0f4ff" },
  { label: "Hidden", count: 5, color: "#f59e0b", bg: "#fef9ee" },
  { label: "Hidden", count: 4, color: "#f59e0b", bg: "#fef9ee" },
  { label: "Output", count: 2, color: "#10b981", bg: "#f0fdf4" },
];

const LAYER_XS = [80, 200, 320, 430];
const NODE_R = 14;
const LABEL_Y = H - 8;

function getNodeY(count: number, index: number): number {
  const totalSpacing = Math.min(40, (H - 80) / (count - 1 || 1));
  const startY = H / 2 - ((count - 1) * totalSpacing) / 2;
  return startY + index * totalSpacing;
}

const LAYER_DESCRIPTIONS: Record<string, string> = {
  Input:
    "This is an **input neuron**. It receives information from the outside world. In an image recognizer, each input might be the brightness of one pixel.",
  Hidden:
    "This is a **hidden neuron**. It's neither an input nor an output — it computes some intermediate concept. For example, one hidden neuron might detect fur, while another checks for eyes.",
  Output:
    "This is an **output neuron**. It produces the network's answer. In an image recognizer, one output might mean 'cat' and another 'dog'.",
};

export function NetworkOverview({ children }: { children?: React.ReactNode }) {
  const [selected, setSelected] = useState<{
    layer: number;
    index: number;
  } | null>(null);

  // Pre-compute all node positions
  const nodePositions = LAYERS.map((layer, li) => {
    const x = LAYER_XS[li];
    return Array.from({ length: layer.count }, (_, ni) => ({
      x,
      y: getNodeY(layer.count, ni),
    }));
  });

  const selectedLabel = selected ? LAYERS[selected.layer].label : null;

  return (
    <WidgetContainer
      title="A Neural Network"
      description="Layers of neurons, connected together"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[560px]"
        aria-label="Diagram of a neural network with input, hidden, and output layers"
      >
        {/* Connections between layers */}
        {nodePositions.map((layerNodes, li) => {
          if (li === 0) return null;
          const prevNodes = nodePositions[li - 1];
          return prevNodes.map((from, fi) =>
            layerNodes.map((to, ti) => {
              const isHighlighted =
                selected !== null &&
                ((li === selected.layer &&
                  ti === selected.index) ||
                  (li === selected.layer + 1 &&
                    fi === selected.index));
              return (
                <line
                  key={`${li}-${fi}-${ti}`}
                  x1={from.x + NODE_R}
                  y1={from.y}
                  x2={to.x - NODE_R}
                  y2={to.y}
                  stroke={isHighlighted ? LAYERS[selected!.layer].color : "#d1d5db"}
                  strokeWidth={isHighlighted ? 1.8 : 0.8}
                  opacity={isHighlighted ? 0.8 : 0.5}
                />
              );
            })
          );
        })}

        {/* Nodes */}
        {LAYERS.map((layer, li) =>
          nodePositions[li].map((pos, ni) => {
            const isSelected =
              selected !== null &&
              selected.layer === li &&
              selected.index === ni;
            return (
              <g
                key={`${li}-${ni}`}
                className="cursor-pointer"
                onClick={() => setSelected({ layer: li, index: ni })}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R}
                  fill={layer.bg}
                  stroke={layer.color}
                  strokeWidth="1.5"
                />
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R + 4}
                    fill="none"
                    stroke={layer.color}
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    opacity={0.8}
                  />
                )}
              </g>
            );
          })
        )}

        {/* Layer labels */}
        {LAYERS.map((layer, li) => (
          <text
            key={li}
            x={LAYER_XS[li]}
            y={LABEL_Y}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {layer.label}
          </text>
        ))}
      </svg>

      {selectedLabel ? (
        <p className="mt-3 text-sm text-foreground leading-relaxed max-w-[560px]">
          {LAYER_DESCRIPTIONS[selectedLabel].split("**").map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i}>{part}</strong>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      ) : (
        <div className="mt-3 max-w-[560px] rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-center text-sm font-medium text-accent">
          👆 Click any neuron to learn what it does.
        </div>
      )}
    </WidgetContainer>
  );
}
