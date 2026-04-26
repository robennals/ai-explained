import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";

/**
 * Short, middle-school-friendly summaries shown when the user clicks a layer label.
 * Tied to the simple "the dog chased its tail" example used by the overview widget.
 */
export const LAYER_SUMMARIES: Record<LayerId, string> = {
  L0: "These are just dictionary meanings — 'dog' means dog, 'its' means its — before the model has thought about how the words fit together.",
  L1: "Every word grabs a copy of the word right before it. The simplest kind of context: who's my neighbor?",
  L2: "The pronoun 'its' looks back for nouns it could refer to. It finds two: 'dog' (which after L1 reads 'a specific dog'), and 'chased' (which after L1 reads 'a dog that is chasing'). Both carry the dog-noun, just with different extra info. 'its' pulls both in.",
  L3: "(unused in this example)",
  L4: "(unused in this example)",
  L5: "(unused in this example)",
  Predict: "The model reads the last word's row and matches it against every word in its vocabulary. Top guess: 'tail'.",
};
