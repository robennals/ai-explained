import type { LayerId, NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { LAYER_ORDER, NON_PREDICT_LAYERS } from "./geometry";
import { simpleOverviewExample, type OverviewExample } from "./simple-example";

export interface ResidualEdge {
  toLayer: LayerId;
  tokenIndex: number;
}

export interface AttentionEdge {
  toLayer: NonPredictLayerId;
  toTokenIndex: number;
  fromTokenIndex: number;
  weight: number;
  headId: string;
}

export interface OverviewEdges {
  residuals: ResidualEdge[];
  attention: AttentionEdge[];
}

function buildResiduals(data: OverviewExample): ResidualEdge[] {
  const out: ResidualEdge[] = [];
  const transitions: LayerId[] = ["L1", "L2", "L3", "L4", "L5"];
  for (const toLayer of transitions) {
    const layerExists = data.layers.some((l) => l.id === toLayer);
    if (!layerExists) continue;
    for (let i = 0; i < data.tokens.length; i++) {
      out.push({ toLayer, tokenIndex: i });
    }
  }
  // Final residual into Predict on the last token's column only.
  out.push({ toLayer: "Predict", tokenIndex: data.tokens.length - 1 });
  return out;
}

function buildAttention(data: OverviewExample): AttentionEdge[] {
  const out: AttentionEdge[] = [];
  for (const layer of data.layers) {
    if (layer.id === "L0" || layer.id === "Predict") continue;
    for (const pull of layer.attention) {
      out.push({
        toLayer: layer.id as NonPredictLayerId,
        toTokenIndex: pull.toTokenIndex,
        fromTokenIndex: pull.fromTokenIndex,
        weight: pull.weight,
        headId: pull.headId,
      });
    }
  }
  return out;
}

export function buildOverviewEdges(data: OverviewExample): OverviewEdges {
  const edges = { residuals: buildResiduals(data), attention: buildAttention(data) };
  validateOverviewEdges(edges, data);
  return edges;
}

export function validateOverviewEdges(edges: OverviewEdges, data: OverviewExample): void {
  const errs: string[] = [];
  for (const e of edges.attention) {
    if (e.fromTokenIndex < 0 || e.fromTokenIndex >= data.tokens.length) {
      errs.push(`attention edge fromTokenIndex out of range: ${e.fromTokenIndex}`);
    }
    if (e.toTokenIndex < 0 || e.toTokenIndex >= data.tokens.length) {
      errs.push(`attention edge toTokenIndex out of range: ${e.toTokenIndex}`);
    }
    if (e.fromTokenIndex > e.toTokenIndex) {
      errs.push(
        `attention edge violates causal mask at ${e.toLayer}: from #${e.fromTokenIndex} to #${e.toTokenIndex}`
      );
    }
    if (e.weight < 0 || e.weight > 1) {
      errs.push(`attention edge weight out of [0,1]: ${e.weight}`);
    }
    if (!NON_PREDICT_LAYERS.includes(e.toLayer)) {
      errs.push(`attention edge has unknown toLayer: ${e.toLayer}`);
    }
  }
  for (const e of edges.residuals) {
    if (e.tokenIndex < 0 || e.tokenIndex >= data.tokens.length) {
      errs.push(`residual edge at ${e.toLayer} tokenIndex out of range: ${e.tokenIndex}`);
    }
    if (e.toLayer === "L0" || !LAYER_ORDER.includes(e.toLayer)) {
      errs.push(`residual edge has invalid toLayer (cannot be L0 or unknown): ${e.toLayer}`);
    }
  }
  if (errs.length > 0) {
    throw new Error(`TransformerOverview edge validation failed:\n  - ${errs.join("\n  - ")}`);
  }
}

export const overviewEdges: OverviewEdges = buildOverviewEdges(simpleOverviewExample);
