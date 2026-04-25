// Single source of truth for the overview grid's pixel layout.
// Coordinates are in the SVG's local viewBox space.

import type { LayerId, NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";

export const CELL_WIDTH = 100;
export const CELL_HEIGHT = 36;
export const COL_GAP = 8;
export const COL_STRIDE = CELL_WIDTH + COL_GAP; // 108

export const LABEL_GUTTER_RIGHT_X = 175;
export const FIRST_COL_X = 195;
export const ROW_GAP = 80;

// Bottom row (L0) sits at this y. Layers stack upward.
export const L0_Y = 320;

// Layer order from bottom to top, indexed by row from L0..L6.
export const LAYER_ORDER: LayerId[] = ["L0", "L1", "L2", "Predict"];

// Layers where attention can be a consumer (all non-predict layers except L0).
export const NON_PREDICT_LAYERS: NonPredictLayerId[] = ["L1", "L2"];

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

/**
 * Layers that get a full row of cells in the grid (everything except Predict).
 * Predict gets only one cell on the last token's column, rendered separately.
 */
export const CELL_ROW_LAYERS: LayerId[] = LAYER_ORDER.filter((l) => l !== "Predict");

// View box. Includes margin around the grid.
export const VIEW_WIDTH = 810;
export const VIEW_HEIGHT = 400;
