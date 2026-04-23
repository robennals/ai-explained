export type LayerId = "L0" | "L1" | "L2" | "L3" | "L4" | "Predict";

export type NonPredictLayerId = Exclude<LayerId, "Predict">;

export interface HeadPull {
  /** Index into ExampleData.tokens of the token this head pulls from. */
  fromTokenIndex: number;
  /** Short noun-phrase tag (e.g. "a location"). Absent for positional heads. */
  key?: string;
  /** Short English phrase describing what the source token contributes. */
  value: string;
  /** Attention weight, 0..1. Rendered as percent. */
  weight: number;
}

export interface HeadCard {
  kind: "positional" | "content";
  /** One English sentence — equal to the token's rep at the previous layer. */
  inputRep: string;
  /** Short noun-phrase tag the focal token is seeking. Absent for positional heads. */
  query?: string;
  /** For positional heads, a sentence describing the rule (e.g. "attend to token at position N-1"). */
  positionalRule?: string;
  pulls: HeadPull[];
  /** One short English phrase: what this head added to the focal token's rep. */
  contribution: string;
}

export interface TokenState {
  /** The surface token text rendered in the passage (e.g. "astronaut", "blue", "."). */
  token: string;
  /** Whether this token is clickable in the passage (false for punctuation). */
  clickable: boolean;
  /** One English sentence per layer giving this token's rep at the output of that layer. */
  reps: Record<NonPredictLayerId, string>;
  /**
   * Per-layer, per-head-id detail cards for this token.
   * Missing layer → nothing to inspect at that layer.
   * Missing head id within a layer → this head did nothing for this token (pass-through).
   */
  headCards: Partial<Record<NonPredictLayerId, Record<string, HeadCard>>>;
}

export interface HeadDef {
  /** Stable id used as a key in headCards (e.g. "H1", "pronoun"). */
  id: string;
  /** Short label shown on the head-strip button (e.g. "Adj → Possessor"). */
  label: string;
  /** One-sentence description shown beneath the head strip when this head is selected. */
  description: string;
  kind: "positional" | "content";
}

export interface LayerDef {
  id: LayerId;
  /** Short label for the stack strip button (e.g. "L1", "Predict"). */
  label: string;
  /** Longer description shown near the stack when this layer is selected. */
  description: string;
  /** Empty for L0 and Predict. */
  heads: HeadDef[];
}

export interface PredictionRow {
  token: string;
  probability: number;
}

export interface ExampleData {
  /** Short human-readable name of the example. */
  name: string;
  /** Full sentence, used for a11y descriptions. */
  sentence: string;
  tokens: TokenState[];
  layers: LayerDef[];
  /** Top-k next-word predictions shown on the Predict stack item. */
  predictions: PredictionRow[];
}
