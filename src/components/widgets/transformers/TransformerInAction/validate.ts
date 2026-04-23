import type { ExampleData, NonPredictLayerId } from "./types";

const NON_PREDICT_LAYERS: NonPredictLayerId[] = ["L0", "L1", "L2", "L3", "L4", "L5", "L6"];

/**
 * Throws if the example data is internally inconsistent.
 * Called at module init of any example file, so the dev server fails fast on a bad edit.
 */
export function validateExample(data: ExampleData): void {
  const errors: string[] = [];

  // Every layer id in data.layers must be valid.
  for (const layer of data.layers) {
    if (layer.id !== "Predict" && !NON_PREDICT_LAYERS.includes(layer.id as NonPredictLayerId)) {
      errors.push(`Unknown layer id: ${layer.id}`);
    }
  }

  // Every token's reps must cover all non-predict layers.
  for (let i = 0; i < data.tokens.length; i++) {
    const token = data.tokens[i];
    for (const layerId of NON_PREDICT_LAYERS) {
      if (typeof token.reps[layerId] !== "string" || token.reps[layerId].length === 0) {
        errors.push(`Token #${i} (${token.token}) missing rep at ${layerId}`);
      }
    }

    // Every head card must reference valid tokens and valid head ids.
    for (const [layerIdRaw, heads] of Object.entries(token.headCards)) {
      const layerId = layerIdRaw as NonPredictLayerId;
      const layerDef = data.layers.find((l) => l.id === layerId);
      if (!layerDef) {
        errors.push(`Token #${i} (${token.token}) has headCards at unknown layer ${layerId}`);
        continue;
      }
      for (const [headId, card] of Object.entries(heads ?? {})) {
        const headDef = layerDef.heads.find((h) => h.id === headId);
        if (!headDef) {
          errors.push(`Token #${i} (${token.token}) has card for unknown head ${layerId}.${headId}`);
          continue;
        }
        if (card.kind !== headDef.kind) {
          errors.push(`Token #${i} headCard at ${layerId}.${headId} kind (${card.kind}) != head def kind (${headDef.kind})`);
        }
        if (card.kind === "content" && !card.query) {
          errors.push(`Token #${i} content headCard at ${layerId}.${headId} missing query`);
        }
        if (card.kind === "positional" && !card.positionalRule) {
          errors.push(`Token #${i} positional headCard at ${layerId}.${headId} missing positionalRule`);
        }
        for (const pull of card.pulls) {
          if (pull.fromTokenIndex < 0 || pull.fromTokenIndex >= data.tokens.length) {
            errors.push(`Token #${i} pull at ${layerId}.${headId} has invalid fromTokenIndex ${pull.fromTokenIndex}`);
          }
          if (card.kind === "content" && !pull.key) {
            errors.push(`Token #${i} content pull at ${layerId}.${headId} from ${pull.fromTokenIndex} missing key`);
          }
          if (pull.weight < 0 || pull.weight > 1) {
            errors.push(`Token #${i} pull weight at ${layerId}.${headId} from ${pull.fromTokenIndex} out of [0,1]: ${pull.weight}`);
          }
        }
        // Weights in a single head card should sum to ~1 if there are any pulls.
        if (card.pulls.length > 0) {
          const sum = card.pulls.reduce((s, p) => s + p.weight, 0);
          if (sum < 0.95 || sum > 1.05) {
            errors.push(`Token #${i} pull weights at ${layerId}.${headId} sum to ${sum.toFixed(3)}, expected ≈1`);
          }
        }
      }
    }
  }

  // Predictions should have non-negative probabilities summing to ≤ 1.
  const predSum = data.predictions.reduce((s, p) => s + p.probability, 0);
  if (predSum < 0 || predSum > 1.01) {
    errors.push(`Predictions sum to ${predSum.toFixed(3)}, expected 0..1`);
  }
  for (const pred of data.predictions) {
    if (pred.probability < 0 || pred.probability > 1) {
      errors.push(`Prediction "${pred.token}" has probability out of [0,1]: ${pred.probability}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `TransformerInAction example "${data.name}" failed validation:\n  - ${errors.join("\n  - ")}`
    );
  }
}
