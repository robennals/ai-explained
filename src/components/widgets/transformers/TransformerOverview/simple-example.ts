// Minimal data for the bird's-eye overview widget.
// This is intentionally separate from the astronaut example used by
// TransformerInAction — the overview's job is to convey "stacked layers + attention flow",
// not the meaning-tracking that TransformerInAction does.

import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";

export interface OverviewToken {
  token: string;
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
}

// Token indices: 0=the, 1=dog, 2=chased, 3=its
const tokens: OverviewToken[] = [
  { token: "the" },
  { token: "dog" },
  { token: "chased" },
  { token: "its" },
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
      // its (3) ← dog (1)
      { fromTokenIndex: 1, toTokenIndex: 3, weight: 1.0, headId: "refers" },
    ],
  },
  {
    id: "L3",
    label: "Subject of verb",
    attention: [
      // chased (2) ← dog (1) — the verb pulls in its subject
      { fromTokenIndex: 1, toTokenIndex: 2, weight: 1.0, headId: "subject-of-verb" },
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
};
