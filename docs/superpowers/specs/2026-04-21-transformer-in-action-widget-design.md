# A Transformer In Action — Playground 1, first example

**Status:** Design complete; ready for implementation plan.
**Scope:** A single worked example of the "A Transformer In Action" widget (Playground 1), polished to the point of being publishable. Everything else in the chapter rework is deferred.

---

## Motivation

The existing transformers chapter dwells on mechanical details (residual, layernorm, feed-forward, prefix attention, etc.) and only shows transformers working via an opaque live model. Readers leave with "something happens inside the box" but no intuition about *what each layer is actually doing* in English-language terms.

This spec replaces most of the chapter with a hands-on visualization: the reader watches a transformer process a real sentence layer by layer, clicking words to see what each attention head did at each step, with every representation written as a natural English sentence.

## Goals

1. A reader clicking through the widget sees the model *earn* its prediction — every layer does visible, necessary work toward the final word choice.
2. Every query, key, and value shown is trivially deducible from the relevant token's own prior-layer representation. No head uses information it couldn't plausibly have derived locally.
3. Each head in the widget does something a real interpretability-paper head could actually do. No composite super-heads that secretly smuggle multiple real heads into one.
4. Representations read as natural English sentences, not as fragment lists.

## Non-goals (this spec)

- Playground 1 second example (follow-up work)
- Playground 2 with bespoke per-example architectures (follow-up work)
- Rewrite of the rest of the chapter narrative (follow-up work; this spec only covers the immediate prose that frames the widget)
- Removal of old widget components (residual, layernorm, etc.) — explicit follow-up
- Companion notebook changes

---

## The worked example

**Passage:** *"On Mars, the astronaut looked to the sky and saw her blue ___"*

**Target prediction:** **planet** (with "Earth," "home," "world" as runners-up)

**Why this sentence meets the design constraints:**
- Pronoun "her" has exactly one candidate referent (astronaut), so pronoun resolution is a warm-up job — the subtle work is elsewhere.
- The final content word "blue" is the decisive token: only after the layers pull in Mars + astronaut + sky context does "blue" narrow from "any blue thing" to "the blue planet an astronaut on Mars sees in the sky" = Earth.
- Without the accumulated context, the prediction has no grip (blue could precede anything). With it, the prediction is sharply determined.
- The example requires the reader to *feel* something beyond grammar-tagging — vector composition conjures Earth-as-home from a sentence that never names it.

---

## Architecture

**3 layers, 5 narrow heads total.** Every head does one obvious, narrow thing — nothing smuggles multiple real-head behaviors into one. Every content-based Q and K are the same short noun-phrase tag, so matches are visibly obvious.

### Layer 1 — "previous-token" head (positional)

- **Real-research grounding:** Previous-token heads are among the most well-characterized features of trained transformers (cited in Anthropic's *A Mathematical Framework for Transformer Circuits*). They attend from each position to position N-1.
- **What it does:** Each content token attends (≈100%) to the token immediately before it and writes a copy of that token's information into its own residual stream — in a different subspace from its self-info, so they coexist without overwriting. The match is *purely positional*; we don't show content-based Q/K for this head because that would misrepresent how positional heads work. The detail card shows: *"Rule: attend to the token at position N-1"* plus the pulled V.
- **FFN step (folded into the rep for simplicity):** composes `{self, prev-token}` into English where that composition is meaningful — "Mars + prev=On" → "the planet Mars, serving as the location someone is on"; "her + prev=saw" → "her, as possessor of what was seen." Where composition yields nothing new (e.g., "astronaut + prev=the" stays "the astronaut"), the rep barely changes.

### Layer 2 — "pronoun-to-antecedent" head (content-based)

- **Real-research grounding:** Coreference heads are well-documented in BERT (Clark et al., *What Does BERT Look At?*) and across model families. Each pronoun attends to the nearest preceding compatible noun.
- **What it does:** For our sentence, only "her" has meaningful Q; only "astronaut" has a matching K. Every other token has its Q/K produce weak or no attention and passes through unchanged.

| Token | Q | K | V |
|---|---|---|---|
| her | *a human noun* | — | — |
| astronaut | — | *a human noun* | *the astronaut* |

- **FFN step:** her's rep becomes *"her — now known to be the astronaut."*

### Layer 3 — three sibling narrow heads, each pulling one token into the prediction slot

Each L3 head does exactly one thing: pulls one specific property into "blue" (the prediction slot). Their Q/K tags are identical — the match is literally visible.

**L3 H1 — "adjective-to-possessor"**

| Token | Q | K | V |
|---|---|---|---|
| blue | *a possessor* | — | — |
| her | — | *a possessor* | *the astronaut* (her's L2 rep has already resolved to astronaut, so its K-as-possessor carries that info) |

**L3 H2 — "adjective-to-location"**

| Token | Q | K | V |
|---|---|---|---|
| blue | *a location* | — | — |
| Mars | — | *a location* | *the Martian setting — not Earth* |

**L3 H3 — "adjective-to-direction"**

| Token | Q | K | V |
|---|---|---|---|
| blue | *a direction of observation* | — | — |
| sky | — | *a direction of observation* | *seen in the sky above* |

- **FFN step (at blue's L3):** composes self + H1 + H2 + H3 contributions into one fluent English sentence — *"a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet."* The prediction head then reads this and predicts **planet**.

### Why this decomposition is honest

- Every head's Q and K are the same short noun-phrase tag — match is visible identity.
- Every Q is trivially deducible from the focal token's own prior-layer rep ("blue needs: a possessor, a location, a direction — three separate narrow needs, each its own head").
- Every K is trivially deducible from the source token's own prior-layer rep.
- Pronoun resolution gets its own layer and its own head — never hidden inside a super-head.
- No single head pulls from multiple tokens and "knows" they're all relevant — instead, three narrow heads each pull one specific token.

### Honest caveat, stated in-widget
A small info box notes: *"Real transformers use dozens of narrow heads per layer. We're showing the five that do the visible work for this sentence. Other heads exist but don't contribute here."*

---

## Widget UI

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Stack strip (horizontal, top)                                 │
│  [L0 Embed] ▸ [L1] ▸ [L2] ▸ [L3] ▸ [Predict]                   │
├────────────────────────────────────────────────────────────────┤
│  Head strip (horizontal, below stack, only for L1/L2/L3)       │
│  L1: [Previous-token (positional)]                             │
│  L2: [Pronoun-to-antecedent]                                   │
│  L3: [Adj→Possessor] [Adj→Location] [Adj→Direction]            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Passage (clickable words)                                     │
│  On Mars, the astronaut looked to the sky and saw her blue ___ │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Detail card (populates when a word is clicked)                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Interaction

- The stack strip's selected item controls which layer's state is being visualized.
- The head strip appears for L1 / L2 / L3. L1 and L2 have one head each (auto-selected). L3 has three heads; the user clicks to switch between them, and the detail card below updates.
- The passage is always visible. Every content word is clickable.
- Clicking a word opens the detail card showing that word's state at the currently-selected layer + head.
- Clicking "Predict" in the stack strip hides the detail card and shows the top-k predicted next-words (reading from blue's L3 output rep).

### Rep display

Every representation shown in the widget is a single natural English sentence, not a list of fragments. Example:

- L0 rep of "blue": *"the color blue"*
- L1 output rep of "blue": *"the color blue, modifying something that belongs to 'her'"*
- L2 output rep of "blue": same as L1 (L2 passes blue through — only "her" changes at L2).
- L3 output rep of "blue": *"a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet"*

### Detail card

When a word is clicked (say, "blue" at L3 with head H1 selected), the card shows:

1. **Input rep** — one English sentence: the rep this token carries going into this layer (= its rep at the end of the previous layer).
2. **Q** — a short noun-phrase tag describing the *kind of thing* the token is seeking. Same-shape as a K. Trivially deducible from the input rep.
3. **Pulled from** — a list, each entry: token name, K (same-shape tag as Q), V (short English phrase), attention weight. Same-shape Q/K makes the match visibly obvious.
4. **This head's contribution** — one English phrase summarising what this head added to the focal token's rep.
5. **Output rep** — one English sentence: the rep this token will carry forward *after this layer's heads + FFN have all composed*. Shared across all heads of the same layer (it's the post-FFN rep, not a per-head output).
6. For the prediction slot at L3, additionally: **Top predictions** — top-k next-word candidates with pseudo-probabilities (shown only on the Predict stack-item, not the detail card itself).

For tokens where a given head did nothing (passes through), the card instead shows: *"This head's Q does not match any K strongly for this token — its rep passes through unchanged."*

For L1 (positional head), the detail card omits Q/K entirely and shows instead: *"Rule: attend to the token at position N-1."*

### Visual affordances
- Follow the visual style of the attention chapter's `ToyAttention` / `ToyAttentionValues` widgets: clean row of token cards, subtle highlights, no gratuitous color.
- When a word is clicked and it drew info from other tokens, those source tokens are highlighted in the passage row with a colored border matching their entry in the detail card's "Pulled from" list.

---

## Content — full per-cell English

Tokens (12 + the blank): `On` `Mars` `,` `the` `astronaut` `looked` `to` `the` `sky` `and` `saw` `her` `blue` `___`

### L0 — raw embedding reps

| Token | L0 rep |
|---|---|
| On | a preposition meaning "at the location of" |
| Mars | the fourth planet from the sun — a cold, reddish desert world |
| , | (punctuation — carries pacing, nothing to inspect) |
| the | a definite article |
| astronaut | a human trained to travel in space |
| looked | past tense of "look" — turned one's visual attention somewhere |
| to | a directional preposition |
| the | a definite article |
| sky | the expanse above, where clouds and celestial objects appear |
| and | a conjunction joining two clauses |
| saw | past tense of "see" — observed with the eyes |
| her | a feminine possessive pronoun |
| blue | the color blue |

Punctuation (`,`) is not clickable. All other tokens are clickable at every layer.

### L1 — after previous-token head + FFN

Each token's L1 rep is the result of its L0 rep combining with a copy of the previous token's L0 rep, then being composed by the FFN.

| Token | L1 output rep | Worth clicking? |
|---|---|---|
| On | a preposition indicating location (no earlier word to pull from — it's the first token) | low interest |
| Mars | the planet Mars, serving as the location someone is on | **yes** (shows prev-token doing useful work) |
| the | a definite article following punctuation | low |
| astronaut | the specific astronaut being described | low (prev=the is weak) |
| looked | a past act of visual attention, performed by the astronaut | **yes** (subject-of-verb binding via prev-token) |
| to | a directional preposition attached to the act of looking | low |
| the | a definite article following the preposition "to" | low |
| sky | the specific sky, being the direction of the looking | **yes** |
| and | a conjunction starting a second clause after "sky" | low |
| saw | a past act of seeing, starting a new conjoined clause | low |
| her | a feminine possessive pronoun, appearing as the possessor of what was seen | **yes** |
| blue | the color blue, modifying something that belongs to "her" | **yes** |

"Worth clicking" is a hint to the widget: tokens marked low still render; they just don't reward investigation at this layer.

### L1 detail card content — the "worth clicking" tokens

**Mars at L1** (head: previous-token)
- Input rep: *the fourth planet from the sun — a cold, reddish desert world*
- Q: *the word immediately preceding me in the sentence*
- Pulled from:
  - **On** (≈100%) — K: *a word appearing in the position immediately before me*; V: *a preposition indicating location-of-being*
- Output rep: *the planet Mars, serving as the location someone is on*

**looked at L1**
- Input rep: *past tense of "look"*
- Q: *the word immediately preceding me*
- Pulled from:
  - **astronaut** (≈100%) — K: *the word immediately before me*; V: *a human performing an action*
- Output rep: *a past act of visual attention, performed by the astronaut*

**sky at L1**
- Input rep: *the expanse above, where clouds and celestial objects appear*
- Q: *the word immediately preceding me*
- Pulled from:
  - **the** (≈100%) — K: *the word immediately before me*; V: *marks the following noun as definite*
- Output rep: *the specific sky being referred to*
  *(Honest limitation: a pure previous-token head gives "sky" only "prev=the," which is thin. The richer "sky as a direction of observation" reading only materializes at L3 when "blue" pulls from "sky" via the adjective-to-direction head. We don't smuggle that in at L1.)*

**her at L1**
- Input rep: *a feminine possessive pronoun*
- Q: *the word immediately preceding me*
- Pulled from:
  - **saw** (≈100%) — K: *the word immediately before me*; V: *a verb of perception whose object follows*
- Output rep: *a feminine possessive pronoun, appearing as the possessor of what was seen*

**blue at L1**
- Input rep: *the color blue*
- Q: *the word immediately preceding me*
- Pulled from:
  - **her** (≈100%) — K: *the word immediately before me*; V: *a feminine possessive pronoun*
- Output rep: *the color blue, modifying something that belongs to "her"*

### L2 — after pronoun-to-antecedent head + FFN

Only **her** changes at L2. Every other token's L1 rep carries forward unchanged; their detail card at L2 shows *"This head's Q does not match any K strongly for this token — rep passes through."*

**her at L2** (head: pronoun-to-antecedent)
- Input rep (from L1): *her, as possessor of what was seen*
- Q: *a human noun*
  *(Trivially deducible from her's own L1 rep: I'm a feminine possessive pronoun, so I need a preceding human noun as my antecedent.)*
- Pulled from:
  - **astronaut** (≈100%) — K: *a human noun*; V: *the astronaut*. *(Derived from the word "astronaut" itself — an astronaut is by definition a human.)*
- Output rep: *her — now known to be the astronaut*

### L3 — after three sibling prediction-slot heads + FFN

Only **blue** changes at L3. Clicking any L3 head with a non-blue token selected shows *"This head's Q does not match any K strongly for this token — rep passes through."*

**blue at L3 · H1 (adjective-to-possessor)**
- Input rep (from L2): *the color blue, modifying something that belongs to "her"*
- Q: *a possessor*
- Pulled from:
  - **her** (≈100%) — K: *a possessor*; V: *the astronaut*. *(her's L2 rep has resolved to astronaut, so its K as "a possessor" carries that identity in its V.)*
- This head's contribution to blue's rep: *"this blue thing belongs to the astronaut."*

**blue at L3 · H2 (adjective-to-location)**
- Input rep (from L2): *the color blue, modifying something that belongs to "her"*
- Q: *a location*
- Pulled from:
  - **Mars** (≈100%) — K: *a location*; V: *the Martian setting — not Earth*. *(Derived from Mars's L1 rep: "the planet Mars, serving as the location someone is on.")*
- This head's contribution to blue's rep: *"this blue thing is set in a Martian, non-Earth context."*

**blue at L3 · H3 (adjective-to-direction)**
- Input rep (from L2): *the color blue, modifying something that belongs to "her"*
- Q: *a direction of observation*
- Pulled from:
  - **sky** (≈100%) — K: *a direction of observation*; V: *seen in the sky above*. *(Derived from the L0 meaning of "sky" — the expanse above where celestial objects appear.)*
- This head's contribution to blue's rep: *"this blue thing is seen up in the sky."*

**blue's L3 output rep (after all three heads + FFN composes)**
*a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet*

*(Pedagogical note: each of the three heads did one narrow pull. The FFN at blue's L3 then reads all three pulled-in subspaces plus blue's self-rep and composes them into one fluent sentence. The "her home planet" framing emerges because "a blue thing belonging to a human-from-Earth astronaut, now on Mars and seen in the sky" has exactly one compelling interpretation: Earth seen from Mars.)*

### Predict — final output

Reading from blue's L3 output rep, the top-k predicted next tokens are:

| Rank | Token | Probability |
|---|---|---|
| 1 | planet | 62% |
| 2 | home | 14% |
| 3 | Earth | 11% |
| 4 | world | 6% |
| 5 | marble | 4% |
| 6 | dot | 3% |

These numbers are illustrative (this is a hand-constructed pedagogical example, not a real model output) and should be presented as such — the widget shows them as pseudo-probabilities reflecting "what this rep points toward" rather than measured probabilities.

---

## Chapter context for the widget

### New sub-section introduced *before* the widget: "How can one vector hold many ideas?"

A short textual stop (no widget) explaining:

1. A token's vector has thousands of dimensions — far more than needed to store just its own meaning.
2. When a head pulls info from another token, that info gets projected (via the head's output projection) into a *different subspace* of the residual stream. The token's original self-info and the pulled-in info coexist — neither overwrites the other.
3. The feed-forward network after attention reads across the whole vector at once, so it sees both the self-info and the pulled-in info and can compose them into a new, richer meaning.
4. This is why each layer can genuinely *accumulate* understanding: attention brings new material in; the FFN composes. Stacking layers lets ideas accumulate.

A small accompanying figure: two colored arrows labeled "self" and "pulled-in" pointing into different directions of a shared vector box, with an FFN symbol reading both and emitting a combined output. Target length: ~200 words of prose + one diagram.

### Section housing the widget: "A Transformer In Action"

Prose frames the widget (~150 words):
- This is a hand-constructed example showing what each layer plausibly does for a single sentence.
- Heads here are simplified versions of patterns real interpretability research has documented (link: Anthropic's *A Mathematical Framework for Transformer Circuits* or a comparably accessible source).
- Instructions for interaction: click the stack items to move between layers; click words to inspect them.
- A one-line goal: "See how the model earns its prediction of 'planet.'"

After the widget (~100 words): a brief reflection on what the reader just saw — the final word choice ("planet") was impossible without layers of composition; the model never saw "Earth" spelled out in the sentence but pulled it from the combination of Mars + astronaut + sky + her.

### Rest of the chapter

Out of scope for this spec. Follow-up work will decide what of residual / layernorm / feed-forward / live transformer content to keep or cut. The block diagram at the top of the chapter stays as-is.

---

## Technical implementation

### File layout

```
src/components/widgets/transformers/
  TransformerInAction.tsx            — the new widget
  transformer-in-action-data.ts      — the English-language content as a typed data structure
```

The widget is a new component. It does not replace any existing widget file. Cleanup of unused widgets is follow-up work.

### Data structure (sketch)

```ts
type LayerId = "L0" | "L1" | "L2" | "L3" | "Predict";

interface TokenState {
  token: string;                             // displayed surface form
  clickable: boolean;                        // punctuation → false
  reps: Record<Exclude<LayerId, "Predict">, string>;   // L0, L1, L2, L3 — one English sentence each
  headCards: Partial<Record<LayerId, Record<string, HeadCard>>>;
  // e.g. headCards.L3.H1 is the per-head detail card for blue at L3 H1.
  // Absent keys mean "this head's Q does not match any K strongly; passes through."
  // L1's head card uses the special positional shape (no Q/K).
}

interface HeadCard {
  kind: "content" | "positional";            // L1 is "positional"; others are "content"
  inputRep: string;                          // = reps[previous layer]
  query?: string;                            // absent for positional heads
  pulls: Array<{
    fromTokenIndex: number;
    key?: string;                            // absent for positional heads
    value: string;                           // short English phrase
    weight: number;                          // 0..1
  }>;
  contribution: string;                      // short English phrase: what this head added to the focal token
}

interface HeadDef {
  id: string;                                // e.g. "H1", "H2"
  label: string;                             // e.g. "Adjective → Possessor"
  kind: "content" | "positional";
  description: string;                       // one-line explanation for the head strip
}

interface LayerDef {
  id: LayerId;
  label: string;                             // "L0 Embed", "L1", "L2", "L3", "Predict"
  heads: HeadDef[];                          // empty for L0 and Predict
}

interface ExampleData {
  sentence: string;
  tokens: TokenState[];
  layers: LayerDef[];
  predictions: Array<{ token: string; probability: number }>;  // shown on Predict
}
```

Note: the `outputRep` seen in the detail card is always `reps[this layer]` on the focal token — it's shared across all heads of a given layer because the FFN composition happens after all heads of that layer. Individual heads only contribute; they don't separately produce output reps.

### Registration

- Add `<TransformerInActionWidget>` to `src/app/(tutorial)/transformers/widgets.tsx`.
- Referenced from `content.mdx` inside the "A Transformer In Action" section.

### Styling

- Uses `WidgetContainer` for chrome (title, reset, etc.) consistently with other widgets.
- Follows the monochrome-with-accent visual style of `ToyAttention`.
- No animations for v1.

### Testing

- Unit tests for data validation (every pulled-from reference points to an existing token index; attention weights sum to ≈1; Q/K/V shape conventions).
- Manual smoke test: click every word at every layer and confirm the detail card renders coherently.
- Playwright e2e (optional v1): click through L0 → L1 → L2 → L3 → Predict and confirm the prediction card shows "planet" as the top.

---

## Open questions for follow-up (not blocking this spec)

1. Should the widget show the FFN step visually distinct from the attention step, or fold both into one "output rep" (current plan)?
2. Should "Predict" show the top-6 candidates as a bar chart, or as a plain table (current plan)?
3. For Playground 1's second example (dog/cat or similar), should we require exactly the same architecture (forces shared heads) or allow slight variation?
4. Chapter-level rewrite decisions (which old sections/widgets to delete) — separate spec.
