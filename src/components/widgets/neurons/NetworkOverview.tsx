"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

/**
 * Simple static diagram of a multi-layer neural network.
 * Shows input → hidden → output layers with connections between all neurons.
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

export function NetworkOverview() {
  // Pre-compute all node positions
  const nodePositions = LAYERS.map((layer, li) => {
    const x = LAYER_XS[li];
    return Array.from({ length: layer.count }, (_, ni) => ({
      x,
      y: getNodeY(layer.count, ni),
    }));
  });

  return (
    <WidgetContainer
      title="A Neural Network"
      description="Layers of neurons, connected together"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[560px]" aria-label="Diagram of a neural network with input, hidden, and output layers">
        {/* Connections between layers */}
        {nodePositions.map((layerNodes, li) => {
          if (li === 0) return null;
          const prevNodes = nodePositions[li - 1];
          return prevNodes.map((from, fi) =>
            layerNodes.map((to, ti) => {
              // Highlight connections to/from the highlighted neuron (layer 1, index 2)
              const isHighlighted =
                (li === 1 && ti === 2) || (li === 2 && fi === 2);
              return (
                <line
                  key={`${li}-${fi}-${ti}`}
                  x1={from.x + NODE_R}
                  y1={from.y}
                  x2={to.x - NODE_R}
                  y2={to.y}
                  stroke={isHighlighted ? "#f59e0b" : "#d1d5db"}
                  strokeWidth={isHighlighted ? 1.8 : 0.8}
                  opacity={isHighlighted ? 0.8 : 0.5}
                />
              );
            })
          );
        })}

        {/* Nodes */}
        {LAYERS.map((layer, li) =>
          nodePositions[li].map((pos, ni) => (
            <g key={`${li}-${ni}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_R}
                fill={layer.bg}
                stroke={layer.color}
                strokeWidth="1.5"
              />
            </g>
          ))
        )}

        {/* Highlight one neuron in first hidden layer */}
        <circle
          cx={nodePositions[1][2].x}
          cy={nodePositions[1][2].y}
          r={NODE_R + 4}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4,3"
          opacity={0.8}
        />

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
    </WidgetContainer>
  );
}
