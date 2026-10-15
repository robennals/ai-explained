import { ArtFrame, keyframes } from "./ArtFrame";

// Signals pulse through a small layered network, lighting up each layer of
// neurons in turn.

const PERIOD_MS = 3200;
const LAYER_DELAY_MS = 700;
const LAYERS = [3, 4, 4, 2];
const LAYER_XS = [52, 128, 204, 276];

const nodes = LAYERS.map((count, layer) =>
  Array.from({ length: count }, (_, i) => ({
    x: LAYER_XS[layer],
    y: 90 + (i - (count - 1) / 2) * 34,
  }))
);

// Deterministic "weights" so some connections look stronger than others.
const weight = (layer: number, i: number, j: number) =>
  0.25 + 0.75 * Math.abs(Math.sin(layer * 7.1 + i * 3.7 + j * 1.9));

const edges = nodes.slice(0, -1).flatMap((from, layer) =>
  from.flatMap((a, i) =>
    nodes[layer + 1].map((b, j) => ({ a, b, layer, w: weight(layer, i, j) }))
  )
);

const css = [
  `.na-pulse{stroke-dasharray:14 100;stroke-dashoffset:14;animation:na-pulse ${PERIOD_MS}ms linear infinite}`,
  keyframes("na-pulse", [
    [0, "stroke-dashoffset:14"],
    [22, "stroke-dashoffset:-100"],
    [100, "stroke-dashoffset:-100"],
  ]),
  `.na-node{fill-opacity:.15;animation:na-node ${PERIOD_MS}ms ease-out infinite}`,
  keyframes("na-node", [
    [0, "fill-opacity:1"],
    [12, "fill-opacity:1"],
    [40, "fill-opacity:.15"],
    [100, "fill-opacity:.15"],
  ]),
].join("\n");

export function NeuronsArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="na"
      css={css}
      label="Signals flowing through the layers of a small neural network"
    >
      {edges.map(({ a, b, w }, k) => (
        <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={0.6 + 1.6 * w} />
      ))}
      {edges.map(({ a, b, layer, w }, k) => (
        <line
          key={k}
          className="na-pulse"
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          pathLength={100}
          stroke={accent}
          strokeWidth={1 + 2.2 * w}
          strokeLinecap="round"
          opacity={0.35 + 0.65 * w}
          style={{ animationDelay: `${layer * LAYER_DELAY_MS}ms` }}
        />
      ))}
      {nodes.map((layer, l) =>
        layer.map((n, i) => (
          <g key={`${l}-${i}`}>
            <circle cx={n.x} cy={n.y} r={10} fill="white" stroke={accent} strokeWidth={2} />
            <circle
              className="na-node"
              cx={n.x}
              cy={n.y}
              r={7}
              fill={accent}
              // Each layer lights up as the pulses from the previous one arrive.
              style={{ animationDelay: `${l * LAYER_DELAY_MS}ms` }}
            />
          </g>
        ))
      )}
    </ArtFrame>
  );
}
