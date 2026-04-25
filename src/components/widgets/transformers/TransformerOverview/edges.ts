import { astronautExample } from "@/components/widgets/transformers/TransformerInAction/astronaut-example";
import type {
  ExampleData,
  HeadCard,
  LayerId,
  NonPredictLayerId,
} from "@/components/widgets/transformers/TransformerInAction/types";
import { NON_PREDICT_LAYERS, LAYER_ORDER } from "./geometry";

export interface ResidualEdge {
  /** Layer this edge enters (the consumer's layer). */
  toLayer: LayerId;
  /** Token column. Same column for source and consumer. */
  tokenIndex: number;
}

export interface AttentionEdge {
  /** Layer this edge enters. Source is on the previous layer of the same column. */
  toLayer: NonPredictLayerId;
  /** Consumer's token column (right-hand endpoint, must be >= fromTokenIndex). */
  toTokenIndex: number;
  /** Source token column on the layer below. */
  fromTokenIndex: number;
  /** [0..1]. Drives stroke thickness. */
  weight: number;
  /** Stable id of the head this edge came from. */
  headId: string;
}

export interface OverviewEdges {
  residuals: ResidualEdge[];
  attention: AttentionEdge[];
}

function buildResiduals(data: ExampleData): ResidualEdge[] {
  const out: ResidualEdge[] = [];
  // L0 -> L1, L1 -> L2, ..., L4 -> L5: every column.
  const transitions: { toLayer: LayerId }[] = [
    { toLayer: "L1" }, { toLayer: "L2" }, { toLayer: "L3" }, { toLayer: "L4" }, { toLayer: "L5" },
  ];
  for (const { toLayer } of transitions) {
    for (let i = 0; i < data.tokens.length; i++) {
      out.push({ toLayer, tokenIndex: i });
    }
  }
  // L5 -> Predict: only the last token's column (the prediction slot).
  out.push({ toLayer: "Predict", tokenIndex: data.tokens.length - 1 });
  return out;
}

function buildAttention(data: ExampleData): AttentionEdge[] {
  const out: AttentionEdge[] = [];
  for (let i = 0; i < data.tokens.length; i++) {
    const token = data.tokens[i];
    for (const layerId of NON_PREDICT_LAYERS) {
      const cards = token.headCards[layerId];
      if (!cards) continue;
      for (const [headId, card] of Object.entries(cards) as [string, HeadCard][]) {
        for (const pull of card.pulls) {
          out.push({
            toLayer: layerId,
            toTokenIndex: i,
            fromTokenIndex: pull.fromTokenIndex,
            weight: pull.weight,
            headId,
          });
        }
      }
    }
  }
  return out;
}

export function buildOverviewEdges(data: ExampleData): OverviewEdges {
  const edges = { residuals: buildResiduals(data), attention: buildAttention(data) };
  validateOverviewEdges(edges, data);
  return edges;
}

export function validateOverviewEdges(edges: OverviewEdges, data: ExampleData): void {
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
    if (!(NON_PREDICT_LAYERS as string[]).includes(e.toLayer)) {
      errs.push(`attention edge has unknown toLayer: ${e.toLayer}`);
    }
  }
  for (const e of edges.residuals) {
    if (e.tokenIndex < 0 || e.tokenIndex >= data.tokens.length) {
      errs.push(`residual edge at ${e.toLayer} tokenIndex out of range: ${e.tokenIndex}`);
    }
    const layerIdx = LAYER_ORDER.indexOf(e.toLayer);
    if (layerIdx <= 0) {
      errs.push(`residual edge has invalid toLayer (cannot be L0 or unknown): ${e.toLayer}`);
    }
  }
  if (errs.length > 0) {
    throw new Error(`TransformerOverview edge validation failed:\n  - ${errs.join("\n  - ")}`);
  }
}

// Build at module init so a bad edit fails fast in dev.
export const overviewEdges: OverviewEdges = buildOverviewEdges(astronautExample);
