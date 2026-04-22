# A Transformer In Action Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "A Transformer In Action" playground widget for the transformers chapter — the worked example "On Mars, the astronaut looked to the sky and saw her blue ___" flowing through 3 layers of the transformer, with every per-token rep written as a natural English sentence and clickable detail cards revealing each narrow head's Q/K/V.

**Architecture:** A React client component under `src/components/widgets/transformers/TransformerInAction/`, decomposed into focused sub-components (StackStrip, HeadStrip, Passage, DetailCard, PredictionCard) plus a typed data file holding the English content. The widget is referenced from `src/app/(tutorial)/transformers/content.mdx` via the standard widget-registration pattern. A small new prose sub-section ("How can one vector hold many ideas?") sits before the widget.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, MDX, Playwright (for smoke test). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-21-transformer-in-action-widget-design.md`

**Scope note:** This plan strictly implements the spec. Removing old widget code (ResidualConnection, LayerNorm, MicroTransformer, etc.) and deleting obsolete chapter sections are **out of scope** — follow-up spec. The new content is **inserted** into `content.mdx` between the existing "The Transformer" section and "Add Residual" section.

---

## File Structure

**New files (all under `src/components/widgets/transformers/TransformerInAction/`):**

| File | Responsibility |
|---|---|
| `types.ts` | TypeScript interfaces shared by data and components |
| `astronaut-example.ts` | The English-language content for the one worked example, with runtime validation |
| `validate.ts` | Pure validation function used by `astronaut-example.ts` |
| `StackStrip.tsx` | Horizontal layer selector (L0 / L1 / L2 / L3 / Predict) |
| `HeadStrip.tsx` | Horizontal head selector within the selected layer |
| `Passage.tsx` | Clickable word row with highlights for source tokens |
| `DetailCard.tsx` | Per-token, per-head inspector (handles positional / content / pass-through modes) |
| `PredictionCard.tsx` | Top-k next-word prediction display (shown when "Predict" is selected) |
| `TransformerInAction.tsx` | Main widget: wires state, composes sub-components |
| `VectorSubspaceFig.tsx` | Small SVG illustration for the "How can one vector hold many ideas?" sub-section |
| `index.ts` | Re-exports `TransformerInAction` and `VectorSubspaceFig` |

**Modified files:**
- `src/app/(tutorial)/transformers/widgets.tsx` — registers `<TransformerInActionWidget>` and `<VectorSubspaceFigWidget>` wrappers
- `src/app/(tutorial)/transformers/content.mdx` — inserts the new sub-section and widget section after "The Transformer" section
- `tests/transformers.spec.ts` (new) — Playwright smoke test for the widget

---

## Task 1: Create directory and shared types

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/types.ts`

- [ ] **Step 1: Create the types file**

Create `src/components/widgets/transformers/TransformerInAction/types.ts`:

```ts
export type LayerId = "L0" | "L1" | "L2" | "L3" | "Predict";

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: no errors (the new file adds exported types only).

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/types.ts
git commit -m "Add TransformerInAction widget types"
```

---

## Task 2: Runtime validation utility

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/validate.ts`

- [ ] **Step 1: Create the validator**

Create `src/components/widgets/transformers/TransformerInAction/validate.ts`:

```ts
import type { ExampleData, NonPredictLayerId } from "./types";

const NON_PREDICT_LAYERS: NonPredictLayerId[] = ["L0", "L1", "L2", "L3"];

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/validate.ts
git commit -m "Add runtime validator for TransformerInAction example data"
```

---

## Task 3: Astronaut example data

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/astronaut-example.ts`

- [ ] **Step 1: Create the data file (part 1: layers and predictions)**

Create `src/components/widgets/transformers/TransformerInAction/astronaut-example.ts`:

```ts
import type { ExampleData } from "./types";
import { validateExample } from "./validate";

const layers: ExampleData["layers"] = [
  {
    id: "L0",
    label: "Embed",
    description: "Each token is looked up in the model's embedding table — its raw dictionary meaning, before any other word has influenced it.",
    heads: [],
  },
  {
    id: "L1",
    label: "L1",
    description: "Layer 1 runs one attention head — a positional head that gives every token a copy of its predecessor, which the feed-forward step then composes.",
    heads: [
      {
        id: "prev",
        label: "Previous-token",
        description: "Rule-based: every token attends to the one immediately before it. No content-based matching.",
        kind: "positional",
      },
    ],
  },
  {
    id: "L2",
    label: "L2",
    description: "Layer 2 runs one attention head — pronouns find their antecedents via a content-based match.",
    heads: [
      {
        id: "pronoun",
        label: "Pronoun → Antecedent",
        description: "Each pronoun's Q seeks a compatible preceding noun. Only 'her' does work here.",
        kind: "content",
      },
    ],
  },
  {
    id: "L3",
    label: "L3",
    description: "Layer 3 runs three narrow heads that together pull the features 'blue' needs to predict the next word.",
    heads: [
      {
        id: "possessor",
        label: "Adj → Possessor",
        description: "'blue' attends to the possessor whose noun it modifies.",
        kind: "content",
      },
      {
        id: "location",
        label: "Adj → Location",
        description: "'blue' attends to the scene's location.",
        kind: "content",
      },
      {
        id: "direction",
        label: "Adj → Direction",
        description: "'blue' attends to the direction in which the observation is happening.",
        kind: "content",
      },
    ],
  },
  {
    id: "Predict",
    label: "Predict",
    description: "The prediction head reads 'blue's L3 output rep and produces a probability distribution over the next token.",
    heads: [],
  },
];

const predictions: ExampleData["predictions"] = [
  { token: "planet", probability: 0.62 },
  { token: "home", probability: 0.14 },
  { token: "Earth", probability: 0.11 },
  { token: "world", probability: 0.06 },
  { token: "marble", probability: 0.04 },
  { token: "dot", probability: 0.03 },
];
```

- [ ] **Step 2: Add token data — part 1 (structure and trivial tokens)**

Append to the same file:

```ts
/*
 * Tokens in the passage. Indices used by pulls below:
 *  0: "On"        1: "Mars"      2: ","         3: "the"
 *  4: "astronaut" 5: "looked"    6: "to"        7: "the"
 *  8: "sky"       9: "and"      10: "saw"      11: "her"
 * 12: "blue"
 */

const tokens: ExampleData["tokens"] = [
  // 0: On
  {
    token: "On",
    clickable: true,
    reps: {
      L0: "a preposition meaning 'at the location of'",
      L1: "a preposition indicating location — first word of the sentence, no predecessor to pull",
      L2: "a preposition indicating location — first word of the sentence, no predecessor to pull",
      L3: "a preposition indicating location — first word of the sentence, no predecessor to pull",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a preposition meaning 'at the location of'",
          positionalRule: "attend to the token at position N-1",
          pulls: [],
          contribution: "nothing (no predecessor)",
        },
      },
    },
  },
  // 1: Mars
  {
    token: "Mars",
    clickable: true,
    reps: {
      L0: "the fourth planet from the sun — a cold, reddish desert world",
      L1: "the planet Mars, serving as the location someone is on",
      L2: "the planet Mars, serving as the location someone is on",
      L3: "the planet Mars, serving as the location someone is on",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the fourth planet from the sun — a cold, reddish desert world",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: 0,
              value: "a preposition indicating location-of-being",
              weight: 1.0,
            },
          ],
          contribution: "marks Mars as the location in an 'on'-phrase",
        },
      },
    },
  },
  // 2: ","  (punctuation — not clickable, reps exist but are trivial)
  {
    token: ",",
    clickable: false,
    reps: {
      L0: "a comma (pacing punctuation)",
      L1: "a comma (pacing punctuation)",
      L2: "a comma (pacing punctuation)",
      L3: "a comma (pacing punctuation)",
    },
    headCards: {},
  },
  // 3: the
  {
    token: "the",
    clickable: true,
    reps: {
      L0: "a definite article",
      L1: "a definite article following a comma",
      L2: "a definite article following a comma",
      L3: "a definite article following a comma",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a definite article",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 2, value: "a comma (pacing)", weight: 1.0 },
          ],
          contribution: "nothing meaningful — prev is punctuation",
        },
      },
    },
  },
];
```

- [ ] **Step 3: Append token entries 4–9 (astronaut, looked, to, the, sky, and)**

You now have tokens 0–3 in the `tokens` array. Open the file and **insert the six entries below directly between the `// 3: the` entry's closing `},` and the `];` that ends the array.** Don't rewrite tokens 0–3; just insert after them.

```ts
  // 4: astronaut
  {
    token: "astronaut",
    clickable: true,
    reps: {
      L0: "a human trained to travel in space",
      L1: "the astronaut — a specific human trained to travel in space",
      L2: "the astronaut — a specific human trained to travel in space",
      L3: "the astronaut — a specific human trained to travel in space",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a human trained to travel in space",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 3, value: "a definite article", weight: 1.0 },
          ],
          contribution: "marks 'astronaut' as a specific individual",
        },
      },
    },
  },
  // 5: looked
  {
    token: "looked",
    clickable: true,
    reps: {
      L0: "past tense of 'look' — turned one's visual attention somewhere",
      L1: "a past act of visual attention, performed by the astronaut",
      L2: "a past act of visual attention, performed by the astronaut",
      L3: "a past act of visual attention, performed by the astronaut",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "past tense of 'look' — turned one's visual attention somewhere",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 4, value: "the astronaut (a human performing an action)", weight: 1.0 },
          ],
          contribution: "binds the astronaut as the subject of the looking",
        },
      },
    },
  },
  // 6: to
  {
    token: "to",
    clickable: true,
    reps: {
      L0: "a directional preposition",
      L1: "a directional preposition attached to the act of looking",
      L2: "a directional preposition attached to the act of looking",
      L3: "a directional preposition attached to the act of looking",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a directional preposition",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 5, value: "a verb of visual attention", weight: 1.0 },
          ],
          contribution: "marks 'to' as the directional preposition of 'looked'",
        },
      },
    },
  },
  // 7: the (second occurrence)
  {
    token: "the",
    clickable: true,
    reps: {
      L0: "a definite article",
      L1: "a definite article following the preposition 'to'",
      L2: "a definite article following the preposition 'to'",
      L3: "a definite article following the preposition 'to'",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a definite article",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 6, value: "a directional preposition", weight: 1.0 },
          ],
          contribution: "marks the following noun as the definite object of 'to'",
        },
      },
    },
  },
  // 8: sky
  {
    token: "sky",
    clickable: true,
    reps: {
      L0: "the expanse above, where clouds and celestial objects appear",
      L1: "the specific sky being referred to",
      L2: "the specific sky being referred to",
      L3: "the specific sky being referred to",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the expanse above, where clouds and celestial objects appear",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 7, value: "a definite article", weight: 1.0 },
          ],
          contribution: "marks 'sky' as a specific definite referent",
        },
      },
    },
  },
  // 9: and
  {
    token: "and",
    clickable: true,
    reps: {
      L0: "a conjunction joining two clauses",
      L1: "a conjunction following the first clause (ending at 'sky')",
      L2: "a conjunction following the first clause (ending at 'sky')",
      L3: "a conjunction following the first clause (ending at 'sky')",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a conjunction joining two clauses",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 8, value: "the sky (the first clause's object)", weight: 1.0 },
          ],
          contribution: "marks this conjunction as joining after 'sky'",
        },
      },
    },
  },
```

(The `];` closing bracket is still in the file from Step 2; leave it where it is. You're just inserting new entries before it.)

- [ ] **Step 4: Append token entries 10–12 (saw, her, blue)**

Continue inserting **before the same closing `];`**. The blue entry is the big one (three heads at L3):

```ts
  // 10: saw
  {
    token: "saw",
    clickable: true,
    reps: {
      L0: "past tense of 'see' — observed with the eyes",
      L1: "a past act of seeing, starting a new conjoined action",
      L2: "a past act of seeing, starting a new conjoined action",
      L3: "a past act of seeing, starting a new conjoined action",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "past tense of 'see' — observed with the eyes",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 9, value: "a conjunction", weight: 1.0 },
          ],
          contribution: "marks 'saw' as starting the second conjoined clause",
        },
      },
    },
  },
  // 11: her
  {
    token: "her",
    clickable: true,
    reps: {
      L0: "a feminine possessive pronoun",
      L1: "a feminine possessive pronoun, appearing as the possessor of what was seen",
      L2: "her — now known to be the astronaut",
      L3: "her — now known to be the astronaut",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a feminine possessive pronoun",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 10, value: "a verb of perception — its object follows", weight: 1.0 },
          ],
          contribution: "marks 'her' as the possessor of what was seen",
        },
      },
      L2: {
        pronoun: {
          kind: "content",
          inputRep: "a feminine possessive pronoun, appearing as the possessor of what was seen",
          query: "a human noun",
          pulls: [
            {
              fromTokenIndex: 4,
              key: "a human noun",
              value: "the astronaut",
              weight: 1.0,
            },
          ],
          contribution: "resolves 'her' to the astronaut",
        },
      },
    },
  },
  // 12: blue
  {
    token: "blue",
    clickable: true,
    reps: {
      L0: "the color blue",
      L1: "the color blue, modifying something that belongs to 'her'",
      L2: "the color blue, modifying something that belongs to 'her'",
      L3: "a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the color blue",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 11, value: "a feminine possessive pronoun", weight: 1.0 },
          ],
          contribution: "marks blue as modifying something belonging to 'her'",
        },
      },
      L3: {
        possessor: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "a possessor",
          pulls: [
            {
              fromTokenIndex: 11,
              key: "a possessor",
              value: "the astronaut",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing belongs to the astronaut",
        },
        location: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: 1,
              key: "a location",
              value: "the Martian setting — not Earth",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing is set in a Martian, non-Earth context",
        },
        direction: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "a direction of observation",
          pulls: [
            {
              fromTokenIndex: 8,
              key: "a direction of observation",
              value: "seen in the sky above",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing is seen up in the sky",
        },
      },
    },
  },
```

(Do not add another `];`; the existing one stays at the end of the array.)

- [ ] **Step 5: Assemble, validate, and export**

Append to the end of the file:

```ts
export const astronautExample: ExampleData = {
  name: "astronaut",
  sentence: "On Mars, the astronaut looked to the sky and saw her blue ___",
  tokens,
  layers,
  predictions,
};

// Fail fast if a later edit breaks the data.
validateExample(astronautExample);
```

- [ ] **Step 6: Verify compile and validation both pass**

Run: `pnpm tsc --noEmit`
Expected: no errors.

Run: `node --experimental-strip-types --input-type=module -e "import('./src/components/widgets/transformers/TransformerInAction/astronaut-example.ts').then(m => console.log('ok:', m.astronautExample.name))"`

If the Node invocation form is unavailable on the dev machine, skip — the data will be validated at dev-server load instead (Step 8 of Task 11 catches it).

- [ ] **Step 7: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/astronaut-example.ts
git commit -m "Add astronaut-example data for TransformerInAction widget"
```

---

## Task 4: StackStrip component

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/StackStrip.tsx`

- [ ] **Step 1: Create the StackStrip component**

```tsx
"use client";

import type { LayerDef, LayerId } from "./types";

interface StackStripProps {
  layers: LayerDef[];
  selectedId: LayerId;
  onSelect: (id: LayerId) => void;
}

export function StackStrip({ layers, selectedId, onSelect }: StackStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        Layers
      </span>
      {layers.map((layer, idx) => (
        <div key={layer.id} className="flex items-center gap-1.5">
          {idx > 0 && <span className="text-muted">▸</span>}
          <button
            type="button"
            onClick={() => onSelect(layer.id)}
            aria-pressed={selectedId === layer.id}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              selectedId === layer.id
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-foreground hover:bg-foreground/10"
            }`}
          >
            {layer.label}
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/StackStrip.tsx
git commit -m "Add StackStrip component for TransformerInAction"
```

---

## Task 5: HeadStrip component

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/HeadStrip.tsx`

- [ ] **Step 1: Create the HeadStrip component**

```tsx
"use client";

import type { HeadDef } from "./types";

interface HeadStripProps {
  heads: HeadDef[];
  selectedHeadId: string | null;
  onSelect: (id: string) => void;
  /** Layer label (e.g. "L2") shown as a prefix. */
  layerLabel: string;
}

export function HeadStrip({ heads, selectedHeadId, onSelect, layerLabel }: HeadStripProps) {
  if (heads.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 pl-4">
      <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        Heads in {layerLabel}
      </span>
      {heads.map((head) => (
        <button
          key={head.id}
          type="button"
          onClick={() => onSelect(head.id)}
          aria-pressed={selectedHeadId === head.id}
          className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            selectedHeadId === head.id
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-foreground hover:bg-foreground/10"
          }`}
        >
          {head.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/HeadStrip.tsx
git commit -m "Add HeadStrip component for TransformerInAction"
```

---

## Task 6: Passage component

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/Passage.tsx`

- [ ] **Step 1: Create the Passage component**

```tsx
"use client";

import type { TokenState } from "./types";

interface PassageProps {
  tokens: TokenState[];
  focusedTokenIndex: number | null;
  /** Indices of source tokens the focused token pulled from — rendered with an accent border. */
  pulledFromIndices: number[];
  onClickToken: (index: number) => void;
}

export function Passage({
  tokens,
  focusedTokenIndex,
  pulledFromIndices,
  onClickToken,
}: PassageProps) {
  const pulledSet = new Set(pulledFromIndices);
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-5 text-base leading-loose">
      {tokens.map((token, i) => {
        const isFocused = focusedTokenIndex === i;
        const isPulledFrom = pulledSet.has(i);

        if (!token.clickable) {
          return (
            <span key={i} className="text-foreground/70">
              {/* tokens that attach to their predecessor visually keep spacing clean */}
              {token.token === "," || token.token === "." ? token.token : ` ${token.token} `}
            </span>
          );
        }

        const base = "mx-0.5 rounded px-1.5 py-0.5 transition-colors cursor-pointer";
        const stateClasses = isFocused
          ? "bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-500 font-semibold"
          : isPulledFrom
          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-400"
          : "border border-transparent hover:bg-foreground/10";

        return (
          <button
            key={i}
            type="button"
            onClick={() => onClickToken(i)}
            className={`${base} ${stateClasses}`}
          >
            {token.token}
          </button>
        );
      })}
      <span className="text-foreground/70">{" ___"}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/Passage.tsx
git commit -m "Add Passage component for TransformerInAction"
```

---

## Task 7: DetailCard component

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/DetailCard.tsx`

- [ ] **Step 1: Create the DetailCard component**

```tsx
"use client";

import type { HeadCard, HeadDef, TokenState } from "./types";

interface DetailCardProps {
  focalToken: TokenState;
  tokens: TokenState[];
  headDef: HeadDef | null;
  /** null → no card to show at this layer (L0) or head is L0/Predict. */
  card: HeadCard | null;
  /** Output rep shown at the bottom (same for all heads of a layer — post-FFN). */
  outputRep: string | null;
  /** Layer label for section headers. */
  layerLabel: string;
}

export function DetailCard({
  focalToken,
  tokens,
  headDef,
  card,
  outputRep,
  layerLabel,
}: DetailCardProps) {
  // L0 — no head, just show the embedding rep.
  if (!headDef) {
    return (
      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          {layerLabel} · {focalToken.token}
        </div>
        <div className="text-foreground/80">
          <span className="text-muted">Embedding:</span> <em>{focalToken.reps.L0}</em>
        </div>
      </div>
    );
  }

  // Head exists but did nothing for this token → pass-through.
  if (!card) {
    return (
      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          {layerLabel} · {headDef.label} · {focalToken.token}
        </div>
        <div className="italic text-muted">
          This head's Q does not match any K strongly for this token — its rep passes through unchanged.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        {layerLabel} · {headDef.label} · {focalToken.token}
      </div>
      <div className="mb-2 text-xs text-muted">{headDef.description}</div>

      {/* Input rep */}
      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
            Input rep
          </div>
          <div className="rounded bg-surface px-2 py-1 italic">{card.inputRep}</div>
        </div>

        {/* Q (or positional rule) */}
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {card.kind === "positional" ? "Rule" : "Q — seeking"}
          </div>
          <div className="rounded bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
            {card.kind === "positional" ? card.positionalRule : card.query}
          </div>
        </div>
      </div>

      {/* Pulled-from list */}
      {card.pulls.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
            Pulled from
          </div>
          <div className="grid gap-1">
            {card.pulls.map((pull) => {
              const from = tokens[pull.fromTokenIndex];
              return (
                <div
                  key={pull.fromTokenIndex}
                  className="grid grid-cols-[90px_1fr_1fr_50px] items-center gap-2 rounded border border-border bg-surface px-2 py-1 text-xs"
                >
                  <span className="font-medium">{from.token}</span>
                  {card.kind === "content" ? (
                    <span className="rounded bg-green-50 px-1.5 py-0.5 dark:bg-green-900/30">
                      <span className="text-[10px] text-muted">K</span> {pull.key}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                  <span className="rounded bg-yellow-50 px-1.5 py-0.5 dark:bg-yellow-900/30">
                    <span className="text-[10px] text-muted">V</span> {pull.value}
                  </span>
                  <span className="text-right font-medium text-accent">
                    {Math.round(pull.weight * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contribution */}
      <div className="mb-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
          This head's contribution
        </div>
        <div className="rounded bg-surface px-2 py-1 italic">{card.contribution}</div>
      </div>

      {/* Output rep */}
      {outputRep && (
        <div className="rounded border-l-4 border-green-500 bg-green-50 px-3 py-2 dark:bg-green-900/20">
          <div className="text-[10px] font-medium uppercase tracking-wider text-green-900 dark:text-green-300">
            Output rep after {layerLabel} (shared across all heads of this layer, post-FFN)
          </div>
          <div className="mt-1 font-medium">{outputRep}</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/DetailCard.tsx
git commit -m "Add DetailCard component for TransformerInAction"
```

---

## Task 8: PredictionCard component

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/PredictionCard.tsx`

- [ ] **Step 1: Create the PredictionCard component**

```tsx
"use client";

import type { PredictionRow } from "./types";

interface PredictionCardProps {
  predictions: PredictionRow[];
}

export function PredictionCard({ predictions }: PredictionCardProps) {
  const max = Math.max(...predictions.map((p) => p.probability));
  return (
    <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted">
        Prediction · top candidates for the next token
      </div>
      <div className="grid gap-1.5">
        {predictions.map((pred) => (
          <div key={pred.token} className="grid grid-cols-[100px_1fr_50px] items-center gap-2">
            <span className="font-mono text-xs">{pred.token}</span>
            <div className="h-2 rounded bg-surface">
              <div
                className="h-2 rounded bg-accent"
                style={{ width: `${(pred.probability / max) * 100}%` }}
              />
            </div>
            <span className="text-right text-xs text-muted">
              {Math.round(pred.probability * 100)}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] italic text-muted">
        Illustrative probabilities — this is a hand-constructed pedagogical example, not a real model run.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/PredictionCard.tsx
git commit -m "Add PredictionCard component for TransformerInAction"
```

---

## Task 9: Main TransformerInAction widget

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/TransformerInAction.tsx`

- [ ] **Step 1: Create the main widget**

```tsx
"use client";

import { useMemo, useState, useCallback } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { astronautExample } from "./astronaut-example";
import { StackStrip } from "./StackStrip";
import { HeadStrip } from "./HeadStrip";
import { Passage } from "./Passage";
import { DetailCard } from "./DetailCard";
import { PredictionCard } from "./PredictionCard";
import type { HeadCard, HeadDef, LayerId, NonPredictLayerId } from "./types";

const INITIAL_LAYER: LayerId = "L0";
const INITIAL_FOCAL: number | null = null;

export function TransformerInAction() {
  const data = astronautExample;

  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>(INITIAL_LAYER);
  const [selectedHeadId, setSelectedHeadId] = useState<string | null>(null);
  const [focalTokenIndex, setFocalTokenIndex] = useState<number | null>(INITIAL_FOCAL);

  const selectedLayer = useMemo(
    () => data.layers.find((l) => l.id === selectedLayerId) ?? data.layers[0],
    [data.layers, selectedLayerId]
  );

  const selectedHead: HeadDef | null = useMemo(() => {
    if (!selectedLayer || selectedLayer.heads.length === 0) return null;
    if (selectedHeadId) {
      const found = selectedLayer.heads.find((h) => h.id === selectedHeadId);
      if (found) return found;
    }
    return selectedLayer.heads[0];
  }, [selectedLayer, selectedHeadId]);

  const handleSelectLayer = useCallback((id: LayerId) => {
    setSelectedLayerId(id);
    setSelectedHeadId(null); // re-auto-select first head on layer change
  }, []);

  const handleSelectHead = useCallback((id: string) => {
    setSelectedHeadId(id);
  }, []);

  const handleClickToken = useCallback((index: number) => {
    setFocalTokenIndex(index);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedLayerId(INITIAL_LAYER);
    setSelectedHeadId(null);
    setFocalTokenIndex(INITIAL_FOCAL);
  }, []);

  // Resolve what to show in the detail region.
  const focalToken = focalTokenIndex !== null ? data.tokens[focalTokenIndex] : null;

  const card: HeadCard | null = useMemo(() => {
    if (!focalToken || !selectedHead) return null;
    if (selectedLayerId === "Predict" || selectedLayerId === "L0") return null;
    const layerCards = focalToken.headCards[selectedLayerId as NonPredictLayerId];
    return layerCards?.[selectedHead.id] ?? null;
  }, [focalToken, selectedHead, selectedLayerId]);

  const outputRep: string | null = useMemo(() => {
    if (!focalToken) return null;
    if (selectedLayerId === "Predict") return null;
    return focalToken.reps[selectedLayerId as NonPredictLayerId];
  }, [focalToken, selectedLayerId]);

  const pulledFromIndices = card?.pulls.map((p) => p.fromTokenIndex) ?? [];

  return (
    <WidgetContainer
      title="A Transformer In Action"
      description="Watch this sentence flow through 3 transformer layers. Click a layer to see each token's current rep; click a word to see what any head did to it."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4 p-4">
        <StackStrip
          layers={data.layers}
          selectedId={selectedLayerId}
          onSelect={handleSelectLayer}
        />

        {selectedLayer && selectedLayer.heads.length > 0 && (
          <>
            <HeadStrip
              heads={selectedLayer.heads}
              selectedHeadId={selectedHead?.id ?? null}
              onSelect={handleSelectHead}
              layerLabel={selectedLayer.label}
            />
            {selectedHead && (
              <div className="pl-4 text-xs text-muted">{selectedHead.description}</div>
            )}
          </>
        )}

        <Passage
          tokens={data.tokens}
          focusedTokenIndex={focalTokenIndex}
          pulledFromIndices={pulledFromIndices}
          onClickToken={handleClickToken}
        />

        {selectedLayerId === "Predict" ? (
          <PredictionCard predictions={data.predictions} />
        ) : focalToken ? (
          <DetailCard
            focalToken={focalToken}
            tokens={data.tokens}
            headDef={selectedHead}
            card={card}
            outputRep={outputRep}
            layerLabel={selectedLayer.label}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-foreground/[0.03] p-6 text-center text-sm italic text-muted">
            Click a word in the passage above to inspect it.
          </div>
        )}

        <div className="rounded border border-border/60 bg-foreground/[0.03]/50 p-3 text-[11px] italic text-muted">
          Real transformers use dozens of narrow heads per layer. We're showing the five that do the visible
          work for this sentence. Other heads exist but don't contribute here.
        </div>
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/TransformerInAction.tsx
git commit -m "Add main TransformerInAction widget component"
```

---

## Task 10: VectorSubspaceFig illustration

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/VectorSubspaceFig.tsx`

- [ ] **Step 1: Create the illustration component**

```tsx
"use client";

/**
 * Small illustration for the "How can one vector hold many ideas?" sub-section.
 * Shows a single vector box with two arrows labeled "self" and "pulled-in" pointing
 * into orthogonal directions, and an FFN symbol reading both.
 */
export function VectorSubspaceFig() {
  return (
    <div className="my-6 flex items-center justify-center">
      <svg
        viewBox="0 0 520 260"
        className="max-w-full text-foreground"
        role="img"
        aria-label="A vector carrying two ideas — self-info on one axis, pulled-in info on another — both read by a feed-forward network."
      >
        {/* Vector box */}
        <rect
          x="60" y="80" width="220" height="100"
          rx="10" ry="10"
          fill="var(--color-surface, #f7f7fb)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <text x="170" y="72" textAnchor="middle" fontSize="12" fill="currentColor">
          one token's vector
        </text>

        {/* Self arrow (horizontal) */}
        <line x1="90" y1="130" x2="250" y2="130" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow-blue)" />
        <text x="170" y="148" textAnchor="middle" fontSize="11" fill="#3b82f6" fontWeight="600">
          self (original meaning)
        </text>

        {/* Pulled-in arrow (vertical) */}
        <line x1="170" y1="170" x2="170" y2="95" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
        <text x="175" y="110" fontSize="11" fill="#f59e0b" fontWeight="600">
          pulled-in info
        </text>

        {/* FFN reads both */}
        <path
          d="M 280 130 Q 330 130 360 130"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-fg)"
        />
        <rect
          x="360" y="100" width="100" height="60"
          rx="6" ry="6"
          fill="var(--color-surface, #f7f7fb)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <text x="410" y="135" textAnchor="middle" fontSize="13" fill="currentColor" fontWeight="600">
          FFN
        </text>
        <text x="410" y="180" textAnchor="middle" fontSize="11" fill="currentColor">
          reads across
        </text>
        <text x="410" y="195" textAnchor="middle" fontSize="11" fill="currentColor">
          both subspaces
        </text>

        <defs>
          <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#3b82f6" />
          </marker>
          <marker id="arrow-amber" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#f59e0b" />
          </marker>
          <marker id="arrow-fg" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/VectorSubspaceFig.tsx
git commit -m "Add VectorSubspaceFig illustration for the 'one vector, many ideas' section"
```

---

## Task 11: Index re-exports

**Files:**
- Create: `src/components/widgets/transformers/TransformerInAction/index.ts`

- [ ] **Step 1: Create the index**

```ts
export { TransformerInAction } from "./TransformerInAction";
export { VectorSubspaceFig } from "./VectorSubspaceFig";
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerInAction/index.ts
git commit -m "Add index re-exports for TransformerInAction"
```

---

## Task 12: Register widgets in the chapter's widgets.tsx

**Files:**
- Modify: `src/app/(tutorial)/transformers/widgets.tsx`

- [ ] **Step 1: Read the current file**

Read `src/app/(tutorial)/transformers/widgets.tsx` and note:
- The file wraps each widget in a dynamic import + Suspense boundary via `WidgetSlot`.
- Each widget has a corresponding export like `TransformerBlockDiagramWidget`.

- [ ] **Step 2: Add dynamic imports**

At the top of `src/app/(tutorial)/transformers/widgets.tsx`, after the existing `PrefixAttention` dynamic import (and before `WidgetSlot`), add:

```tsx
const TransformerInAction = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerInAction").then(
      (m) => m.TransformerInAction
    ),
  { ssr: false }
);

const VectorSubspaceFig = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerInAction").then(
      (m) => m.VectorSubspaceFig
    ),
  { ssr: false }
);
```

- [ ] **Step 3: Add widget wrapper exports**

At the bottom of `src/app/(tutorial)/transformers/widgets.tsx`, after the last existing widget wrapper (`PrefixAttentionWidget`), add:

```tsx
export function TransformerInActionWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TransformerInAction />
    </WidgetSlot>
  );
}

export function VectorSubspaceFigWidget() {
  return (
    <Suspense fallback={<div className="my-6 h-40 animate-pulse rounded bg-foreground/[0.03]" />}>
      <VectorSubspaceFig />
    </Suspense>
  );
}
```

- [ ] **Step 4: Verify compile and lint**

Run: `pnpm tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(tutorial\)/transformers/widgets.tsx
git commit -m "Register TransformerInAction and VectorSubspaceFig widget wrappers"
```

---

## Task 13: Add new MDX content

**Files:**
- Modify: `src/app/(tutorial)/transformers/content.mdx`

- [ ] **Step 1: Locate the insertion point**

Open `src/app/(tutorial)/transformers/content.mdx`. Find the boundary between:

- The existing `<TransformerBlockDiagramWidget>...</TransformerBlockDiagramWidget>` block (end of the "## The Transformer" section)
- The following `## Add Residual` heading

The new content goes between those two.

- [ ] **Step 2: Insert the "How can one vector hold many ideas?" sub-section**

Immediately after the existing `</TransformerBlockDiagramWidget>` closing line and before `## Add Residual`, insert:

```mdx
## How Can One Vector Hold Many Ideas?

Before we watch a transformer in motion, one more piece of intuition. Each token's vector has thousands of dimensions — far more than needed to store just its own meaning. This turns out to matter.

When an attention head pulls information from another token, that information lands in a *different subspace* of this token's vector — a different direction — via the head's output projection. The original self-info and the new pulled-in info coexist, because they point different ways. Nothing is overwritten.

The feed-forward network that runs after attention reads across the whole vector at once. It sees both the self-info and the pulled-in info, and can compose them into a richer meaning — "Mars" plus "previous word was 'on'" becomes "Mars as a location someone is currently on."

This is why each layer genuinely *accumulates* understanding. Attention brings new material in; the feed-forward composes it. Stack enough layers and ideas pile up — without erasing each other.

<VectorSubspaceFigWidget />

## A Transformer In Action

Enough theory — let's watch one run. The playground below shows a real sentence flowing through three transformer layers. Every representation is written as a plain English sentence. Click a layer to see where the model has arrived; click a word to see what any head did to it.

One thing to look for as you explore: the model never sees the word *Earth* spelled out in the sentence. But by the final layer, "blue" has accumulated enough context to predict a word that specifically names it. Watch it happen step by step.

<TransformerInActionWidget>
Start at **Embed** and click through the layers: L1 attaches each token to its predecessor, L2 resolves the pronoun *her*, and L3 pulls scene features into the prediction slot *blue*. Then click **Predict** to see the top candidates for the next word.
</TransformerInActionWidget>

Notice what just happened. The word **Earth** never appears in the sentence. Yet by the end of L3, the model has composed *a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet*. Nothing in any single layer did this on its own: L1 barely did more than bolt each word to its neighbour; L2 resolved one pronoun; L3 pulled three features into one slot. Stacked together, they fingerprint a specific idea that wasn't in any of the input tokens. That accumulation is the whole mechanism.

Each head here is a simplified version of a pattern real interpretability research has documented in trained transformers — previous-token heads, coreference heads, and name-mover-style heads that move features to the prediction slot. A real model has hundreds of narrow heads; we're showing the handful that do visible work on this particular sentence.

```

- [ ] **Step 3: Verify no raw `<p>` tags and lint passes**

Run: `pnpm lint`
Expected: no errors. The lint script includes `scripts/lint-mdx-no-raw-p.sh` which fails on raw `<p>` tags.

- [ ] **Step 4: Build the site to confirm MDX compiles**

Run: `pnpm build`
Expected: build succeeds (may take several minutes). If validation in `astronaut-example.ts` fails, you'll get a clear error here.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(tutorial\)/transformers/content.mdx
git commit -m "Add 'How Can One Vector Hold Many Ideas' section and TransformerInAction playground"
```

---

## Task 14: Manual dev smoke test

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Navigate to the transformers page**

Open a browser to `http://localhost:3000/transformers`.

- [ ] **Step 3: Verify the new section renders**

Scroll past the block diagram to the new "## How Can One Vector Hold Many Ideas?" section. Confirm:
- Four paragraphs of prose render correctly.
- The `VectorSubspaceFig` SVG appears below the prose.
- The "## A Transformer In Action" heading and intro paragraphs render.
- The `TransformerInAction` widget renders with the stack strip, the passage, and the "Click a word" placeholder.

- [ ] **Step 4: Click through the widget**

Perform this sequence and verify each step:
1. Click **L0 Embed** in the stack strip, then click **astronaut** in the passage. DetailCard shows "Embedding: a human trained to travel in space."
2. Click **L1** in the stack. DetailCard for astronaut shows the positional head card: pulls from "the", contribution "marks 'astronaut' as a specific individual."
3. Click **Mars** in the passage. DetailCard shows Mars pulled "On" with the contribution "marks Mars as the location in an 'on'-phrase." The output rep reads "the planet Mars, serving as the location someone is on."
4. Click **L2**. Click **her** in the passage. DetailCard shows content head pulling "astronaut" (K: "a human noun"), with output rep "her — now known to be the astronaut."
5. Click **L3**. Click **blue** in the passage. DetailCard shows the first head "Adj → Possessor" with blue pulling "her" (K: "a possessor", V: "the astronaut").
6. Click "Adj → Location" in the head strip. DetailCard now shows blue pulling "Mars."
7. Click "Adj → Direction" in the head strip. DetailCard now shows blue pulling "sky."
8. The output rep at the bottom of the L3 detail card (for any L3 head selected, since the output rep is shared post-FFN) reads: "a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet."
9. Click **Predict** in the stack strip. PredictionCard shows "planet" as the top prediction (62%), with "home", "Earth", "world", "marble", "dot" below.

- [ ] **Step 5: Verify passage highlighting**

When a word is clicked at L3 with any head selected that has a pull, the source token (her / Mars / sky) gets a blue-accent border in the passage.

- [ ] **Step 6: Check responsive behavior**

Resize the browser narrow (~400px wide). Verify the stack strip wraps cleanly, the head strip wraps, and the detail card's two-column input/Q grid stacks to one column.

If any of these fail, fix them before continuing. Do not commit anything in this task — it's verification only.

---

## Task 15: Playwright smoke test

**Files:**
- Create: `tests/transformers.spec.ts`

- [ ] **Step 1: Confirm dev server is running**

The Playwright config expects `pnpm dev` to be running at `http://localhost:3000`. Leave the dev server from Task 14 running, or start a fresh one.

- [ ] **Step 2: Create the Playwright test**

Create `tests/transformers.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Transformers chapter — A Transformer In Action widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("widget renders with the stack strip", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await expect(widget).toBeVisible();
    await expect(widget.getByRole("button", { name: "Embed" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L1" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L2" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L3" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Predict" })).toBeVisible();
  });

  test("clicking Predict shows 'planet' as the top candidate", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "Predict" }).click();

    // The prediction card shows a list of rows, top being "planet".
    await expect(widget.getByText("Prediction · top candidates for the next token")).toBeVisible();
    await expect(widget.getByText("planet").first()).toBeVisible();

    // The first row percentage is 62%.
    await expect(widget.getByText("62%").first()).toBeVisible();
  });

  test("clicking 'blue' at L3 shows the adj-to-possessor head pulling her", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "L3" }).click();
    await widget.getByRole("button", { name: "blue" }).click();

    // Default head is "Adj → Possessor".
    await expect(widget.getByText("a possessor", { exact: false })).toBeVisible();
    // The V "the astronaut" appears in the pull row.
    await expect(widget.getByText("the astronaut", { exact: false }).first()).toBeVisible();
    // The output rep at the bottom shows the final composition.
    await expect(
      widget.getByText("a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet", { exact: false })
    ).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx playwright test transformers.spec.ts`

Expected: all 3 tests pass. If failures point to selector mismatches, tighten the selectors to match what the dev server actually renders.

- [ ] **Step 4: Commit**

```bash
git add tests/transformers.spec.ts
git commit -m "Add Playwright smoke test for TransformerInAction widget"
```

---

## Task 16: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass. If anything fails, fix and commit before moving on.

- [ ] **Step 2: Run the Playwright tests**

Run: `npx playwright test`
Expected: the new `transformers.spec.ts` tests pass along with any existing tests. (Chapter 1 / homepage tests should still pass.)

- [ ] **Step 3: Manual regression check on other chapters**

Navigate to `/computation` and `/attention` — confirm both still render correctly. The new widget module shouldn't affect other chapters, but verify.

- [ ] **Step 4: Clean any uncommitted noise**

Run: `git status`
Expected: working tree clean.

---

## Out-of-scope follow-ups (explicit)

The following are **deliberately not part of this plan** and require their own specs:

1. A second Playground 1 example (e.g., another sentence with simple pronoun resolution).
2. Playground 2 with three per-example bespoke architectures (Paris/Eiffel, metaphor override, commonsense inference chain).
3. Cleaning up the existing transformer chapter: deleting ResidualConnection, LayerNorm, MicroTransformer, DepthComparison, LiveTransformer, TransformerXRay, PrefixAttention widgets and their corresponding sections, and restructuring the chapter narrative around the two playgrounds.
4. Updating the companion notebook to match the new narrative.
5. Animated attention arrows from the focal token to source tokens (spec says "no animations for v1").
