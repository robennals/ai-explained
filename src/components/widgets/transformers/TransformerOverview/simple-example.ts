// Minimal data for the bird's-eye overview widget.
// This is intentionally separate from the astronaut example used by
// TransformerInAction — the overview's job is to convey "stacked layers + attention flow",
// not the meaning-tracking that TransformerInAction does.

import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";

export interface OverviewToken {
  token: string;
  /**
   * Very short phrase showing what this token's vector "means" after each layer.
   * Keyed by layer id; only L0/L1/L2 are populated for this widget.
   */
  reps: Record<"L0" | "L1" | "L2", string>;
}

export interface OverviewAttentionPull {
  fromTokenIndex: number;
  toTokenIndex: number;
  weight: number;
  /** Stable id so multiple heads at the same layer can be distinguished if needed. */
  headId: string;
}

export interface OverviewLayer {
  id: LayerId;
  label: string;
  /** Pulls that the heads at this layer perform. Empty for L0 and Predict. */
  attention: OverviewAttentionPull[];
}

export interface OverviewExample {
  tokens: OverviewToken[];
  layers: OverviewLayer[];
  /** Top-k next-word predictions shown on the Predict cell. */
  predictions: { token: string; probability: number }[];
  /** Short text shown in the rep-box when the Predict cell is selected. */
  predictRep: string;
}

// Token indices: 0=the, 1=dog, 2=chased, 3=its
const tokens: OverviewToken[] = [
  { token: "the",    reps: { L0: "the",             L1: "the",                               L2: "the" } },
  { token: "dog",    reps: { L0: "dog",             L1: "a specific dog",                    L2: "a specific dog" } },
  { token: "chased", reps: { L0: "chased",          L1: "chased by a dog",                   L2: "chased by a dog" } },
  { token: "its",    reps: { L0: "its",              L1: "belonging to the thing chasing it", L2: "belonging to a specific dog that is chasing it" } },
];

const layers: OverviewLayer[] = [
  { id: "L0", label: "Input", attention: [] },
  {
    id: "L1",
    label: "Previous-token",
    attention: [
      { fromTokenIndex: 0, toTokenIndex: 1, weight: 1.0, headId: "prev" },
      { fromTokenIndex: 1, toTokenIndex: 2, weight: 1.0, headId: "prev" },
      { fromTokenIndex: 2, toTokenIndex: 3, weight: 1.0, headId: "prev" },
    ],
  },
  {
    id: "L2",
    label: "Resolve pronouns",
    attention: [
      // its (3) ← dog (1) — picks up the noun "a specific dog"
      { fromTokenIndex: 1, toTokenIndex: 3, weight: 0.5, headId: "refers" },
      // its (3) ← chased (2) — picks up the noun via "a dog that is chasing"
      { fromTokenIndex: 2, toTokenIndex: 3, weight: 0.5, headId: "refers" },
    ],
  },
  { id: "Predict", label: "Predict", attention: [] },
];

export const simpleOverviewExample: OverviewExample = {
  tokens,
  layers,
  predictions: [
    { token: "tail", probability: 0.42 },
    { token: "owner", probability: 0.21 },
    { token: "leash", probability: 0.11 },
  ],
  predictRep: "tail",
};
