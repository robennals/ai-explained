import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";

/**
 * Short, middle-school-friendly summaries shown when the user clicks a layer label.
 * Keep each summary to 1-2 short sentences. They should describe what a reader can
 * see happening in that row of the grid, not generic transformer theory.
 */
export const LAYER_SUMMARIES: Record<LayerId, string> = {
  L0: "Each cell here is just the dictionary meaning of that word, before any layer has run.",
  L1: "Every word grabs a copy of the word right before it. That gives each word a tiny bit of context about its neighbour.",
  L2: "Words that belong somewhere in the scene reach back to the scene's location. Astronaut, looked, and sky all pull from Mars; saw and her split between Mars and the sky.",
  L3: "The pronoun her looks back to find who she is — and pulls in the astronaut.",
  L4: "Same trick as L1 — every word pulls its neighbour again. But now those neighbours carry everything the middle layers added, so blue effectively gets a freshly-enriched her.",
  L5: "Each word inside a verb's object reaches back to its verb. Sky to looked. Her to saw. Blue splits half-saw, half-her.",
  Predict: "The model reads only the last word's row and matches it against every word it knows. The closest match is the next-word guess.",
};
