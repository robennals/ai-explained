# Notebook Sync — Overview

Catalog of drift between each chapter's MDX and its companion Colab notebook, plus the work units that will address it. Each work unit becomes its own focused brainstorm → spec → plan cycle when it's picked up.

Last audit: 2026-04-23.

## Goal

Bring the notebooks back in sync with the chapters per `notebook-philosophy.md`. The chapters have drifted (mostly during Feb–Apr 2026) while most notebooks were last updated 2026-02-15. Some drift is cosmetic; some is factually wrong; two chapters have no notebook at all.

## See also

- `notebook-philosophy.md` — the editorial reference that every unit should follow
- `pytorch-prerequisites.md` — forward-reference tracking (update when adding/changing notebooks)

## Inventory

| Chapter | Ready? | Notebook? | Status | Unit |
|---|---|---|---|---|
| computation | yes | yes | minor drift | C |
| optimization | yes | yes | minor drift | C |
| neurons | yes | yes | major rework | B |
| vectors | yes | **no** | missing — MDX links to it (broken) | A |
| embeddings | yes | yes | major rework + factual bug | A (bug) + B (rework) |
| next-word-prediction | yes | yes | major rework | B |
| attention | yes | yes | major rework | B |
| positions | yes | **no** | missing notebook AND MDX link | B (after attention) |
| transformers | yes | yes | **SKIP** — actively being edited | — |
| matrix-math | no | yes | **SKIP** — chapter not ready | — |
| appendix-pytorch | yes | yes | minor drift | C |
| chapters 11–17 | no | no | **SKIP** — not ready | — |

## Out of scope

- `transformers` — user is actively editing the chapter; sync when the chapter stabilizes.
- `matrix-math` — chapter is not marked `ready`; the existing notebook will be revisited when the chapter is.
- Chapters 11–17 — not yet written; notebooks will be created alongside them.

## Audit findings

Findings were gathered by comparing each MDX chapter against its notebook (or noting the absence of one). Details are preserved here so future agents can pick up a unit without re-auditing.

### computation (minor)

- Missing "What Can AI Do?" and "Can One Machine Compute Everything?" (Church-Turing) sections. These are intuition-building under the scope rule, so most can be skipped — but the chapter's opening is part of the notebook's current framing too.
- Polynomial example drifted: MDX uses a 4-parameter cubic (a, b, c, d), notebook uses a 3-parameter quadratic. Update notebook to match the 4-parameter cubic.
- Missing the closing 5-point "Real Challenge" recap.

### optimization (minor)

- Terminology mismatch: MDX says "error" throughout; notebook says "loss". Align to the chapter's current term ("error" in narrative, "loss function" when introducing the PyTorch API). No code contradictions.
- Philosophical scaffolding (evolution, Wright brothers, iPhone) is narrative — skip under the scope rule. Core mechanism (gradient descent) is correctly demonstrated.

### neurons (major)

- Notebook treats XOR as a training problem; MDX frames it as a fundamental architectural limitation. Reframe the XOR section to match.
- Missing concrete demo of sigmoid as a "smooth logic gate" — the chapter's central metaphor. Add a cell that shows sigmoid approximating AND/OR/NOT.
- S-curve prevalence, historical XOR context (Minsky/Papert 1969), deep-network-scale anecdotes (GPT-3/5 layer counts) — all intuition-building; skip.
- Chapter's "edges → parts → objects" feature-hierarchy framing has no concrete demo. Consider a small example showing a hidden layer learning features (e.g., simple 2D task where hidden units become visible as decision boundaries).

### vectors (missing)

- Notebook does not exist. MDX has `<TryItInPyTorch notebook="vectors">` — link is currently broken.
- Must create `notebooks/vectors.ipynb` from scratch.
- Chapter topics that need concrete code: vectors as lists of numbers; vector arithmetic (king − man + woman); activation functions making depth meaningful; neurons as vector operations.
- Add to `pytorch-prerequisites.md`.

### embeddings (major + factual bug)

- **Factual bug (Unit A):** notebook downloads `glove.6B.50d.txt`; chapter explicitly says 300-dimensional GloVe. Switch to `glove.6B.300d.txt`.
- Missing vector arithmetic section — the chapter's payoff (king − man + woman = queen, capital-of analogies). Notebook has no arithmetic demos at all.
- Toy vocabulary (cat/dog/car/truck) doesn't illustrate semantic clustering the way the chapter's examples do (size spectrum tiny→huge, rabbit→elephant→lion). Replace with vocabulary that visibly clusters.
- Missing concrete demo of how an embedding layer is trained (one-hot input → gradient descent → learned vectors). Chapter dedicates a section to this.
- Dimension-scaling anecdotes (GPT-2 768d, GPT-3 12,288d) are intuition-building; skip.

### next-word-prediction (major)

- Missing bigram-widget-equivalent code: the chapter's 33% frequency detail, temperature knob, Explore-vs-Generate modes. Bigram sampler should exist as tweakable code.
- "John the disgraced surgeon" and "the plan in a thriller" long-context examples are chapter narrative; skip under scope rule. But the underlying claim (fixed context windows miss distant dependencies) should have a concrete demo — e.g., a bigram or 3-gram failing on a constructed long-range case.
- Friston / brain-as-prediction-machine framing and the "doesn't fundamentally just predict the next word" softening are narrative; skip.
- Attention teaser at end is narrative; skip (next chapter covers it).
- Replace older "concatenating" wording in the notebook with the simpler phrasing the chapter now uses.

### attention (major)

- Missing the toy 4-token vocabulary (cat, dog, blah, it) with specific Q/K/V numbers — this is the chapter's main worked example and should be the notebook's main worked example too.
- Key/query phrasing needs to match the chapter: "what this token is *advertising*" (key) and "*looking for*" (query). Notebook currently says "offer" / "looking for".
- Missing a standalone demo of values — currently values are only mentioned in passing. Chapter has a full section ("Values: What Did You Find?").
- Softmax section should reflect the chapter's "relative loudness" framing — that gaps between scores matter more than absolute magnitudes.
- BERT real-attention visualization — probably too heavy for a Colab; can be skipped unless it fits cleanly. Flag for per-unit decision.
- RoPE / positional encoding section — remove from this notebook; positions gets its own notebook (Unit A).
- Motivation sections (bank/river, pronouns) are narrative; skip.

### positions (missing)

- Notebook does not exist; MDX does not yet reference one.
- Must create `notebooks/positions.ipynb` AND add `<TryItInPyTorch notebook="positions">` to `src/app/(tutorial)/positions/content.mdx`.
- Chapter topics that need concrete code: attention being position-blind (demo of same tokens in different orders producing the same output); distance penalties; rotation applied to a pair of dimensions; multiple rotation speeds; causal masking.
- Add to `pytorch-prerequisites.md`.

### appendix-pytorch (minor)

- Missing Python primer, GPU/CUDA/MPS setup, Colab intro, and the 5-step training-loop breakdown. Chapter covers these; notebook skips straight to code.
- Missing brief justifications for Sigmoid, BCELoss, Adam vs SGD. The chapter explains each; the notebook uses them without explanation.
- Code itself aligns with the chapter. These are additive cells, not rewrites.

## Work units

Each unit will become its own focused brainstorm → spec → plan cycle when picked up. The overview spec above is the starting brief for each.

### Unit A — unblock broken and missing

Smallest, highest urgency. User-visible breakage today. Full spec: [notebook-sync-unit-a.md](notebook-sync-unit-a.md).

1. Create `notebooks/vectors.ipynb` from scratch (chapter links to it).
2. Fix the GloVe dimensionality bug in `notebooks/embeddings.ipynb` (50d → 300d).
3. Update `pytorch-prerequisites.md` for the new vectors notebook.
4. Add Anthropic to the researcher list in `appendix-pytorch/content.mdx` (adjacent tiny copy edit).

`positions.ipynb` was originally in Unit A but was moved into Unit B because it conceptually depends on attention; creating it against a soon-to-be-reworked attention notebook would mean hitting a moving target.

### Unit B — major reworks and dependent new notebooks

Bulk of the writing. Each item gets its own brainstorm/plan within this unit.

1. `neurons.ipynb` — rework
2. `embeddings.ipynb` — rework (after the Unit A GloVe fix)
3. `next-word-prediction.ipynb` — rework
4. `attention.ipynb` — rework
5. `positions.ipynb` — **new notebook** (depends on the reworked attention notebook). Also add `<TryItInPyTorch notebook="positions">` to `src/app/(tutorial)/positions/content.mdx` and update `pytorch-prerequisites.md`.

### Unit C — minor touch-ups

Cosmetic alignment. Can be rolled up into one spec or absorbed into each chapter's next edit.

1. `computation.ipynb` — polynomial parameter fix + minor additions
2. `optimization.ipynb` — error/loss terminology
3. `appendix-pytorch.ipynb` — additive explanations

## Ordering rationale

Do Unit A first — `vectors` is a broken link users hit today, and the GloVe bug teaches wrong intuition. Then Unit B, which is the substantive content work plus the positions notebook. Unit C last, or folded into unrelated chapter edits when convenient.

Within Unit B, order by dependency: `neurons` is a prerequisite for the rest conceptually; `embeddings` is a prerequisite for `next-word-prediction` and `attention`; `positions` depends on `attention`. Suggested order: neurons → embeddings → next-word-prediction → attention → positions.

## Keeping this doc current

- When a unit finishes: mark its entries in the inventory as "aligned" and date them.
- When a chapter is edited: re-check the notebook against the philosophy doc. If new drift is introduced, add a line to the relevant section above.
- When a chapter is unskipped (e.g., transformers stops being edited, matrix-math is marked ready): add a new audit section and assign it to a unit.
