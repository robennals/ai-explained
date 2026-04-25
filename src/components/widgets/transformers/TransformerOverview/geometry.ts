// Single source of truth for the overview grid's pixel layout.
// Coordinates are in the SVG's local viewBox space.

import type { LayerId, NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";

export const CELL_WIDTH = 50;
export const CELL_HEIGHT = 22;
export const COL_GAP = 4;
export const COL_STRIDE = CELL_WIDTH + COL_GAP; // 54

export const LABEL_GUTTER_RIGHT_X = 120; // right edge of the left gutter where layer labels are anchored
export const FIRST_COL_X = 140; // left gutter for layer labels = 0..120
export const ROW_GAP = 65; // vertical distance between consecutive layer rows

// Bottom row (L0) sits at this y. Layers stack upward.
export const L0_Y = 430;

// Layer order from bottom to top, indexed by row from L0..L6.
export const LAYER_ORDER: LayerId[] = ["L0", "L1", "L2", "L3", "L4", "L5", "Predict"];

// Layers where attention can be a consumer (all non-predict layers except L0).
export const NON_PREDICT_LAYERS: NonPredictLayerId[] = ["L1", "L2", "L3", "L4", "L5"];

export function layerRowY(layer: LayerId): number {
  const idx = LAYER_ORDER.indexOf(layer);
  if (idx < 0) throw new Error(`Unknown layer ${layer}`);
  return L0_Y - idx * ROW_GAP;
}

export function columnX(tokenIndex: number): number {
  return FIRST_COL_X + tokenIndex * COL_STRIDE + CELL_WIDTH / 2; // cell center
}

export function columnLeft(tokenIndex: number): number {
  return FIRST_COL_X + tokenIndex * COL_STRIDE;
}

/** Returns the layer immediately below `layer` in LAYER_ORDER, or null for L0. */
export function previousLayer(layer: LayerId): LayerId | null {
  const idx = LAYER_ORDER.indexOf(layer);
  if (idx <= 0) return null;
  return LAYER_ORDER[idx - 1];
}

// View box. The right padding leaves room for the predict output box.
export const VIEW_WIDTH = 940;
export const VIEW_HEIGHT = 460;
