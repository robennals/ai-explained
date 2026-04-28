# Notebook Sync — Unit A

First work unit in the notebook-sync effort. Background and audit catalog: [notebook-sync-overview.md](notebook-sync-overview.md). Editorial rules: [notebook-philosophy.md](notebook-philosophy.md).

## Goal

Unblock user-visible breakage and factual errors in the notebooks:

- Fix the GloVe dimensionality bug in `embeddings.ipynb` (50d → 300d).
- Create `vectors.ipynb` from scratch (the chapter currently links to a non-existent notebook).
- Update `pytorch-prerequisites.md` to cover the new notebook.
- Fold in a one-line copy edit to the PyTorch appendix chapter (Anthropic missing from the researcher list) while we're adjacent.

Out of scope: the embeddings major rework (Unit B), the positions notebook (also Unit B, depends on reworked attention).

## Work items

### 1. GloVe fix in `embeddings.ipynb`

**Changes:**
- Download cell: `glove.6B.50d.txt` → `glove.6B.300d.txt` (URL stays `https://nlp.stanford.edu/data/glove.6B.zip`; just change the extracted filename).
- Any downstream cell that hard-codes `50` as a dimension count → `300`.
- Opening markdown line: "companion to [Chapter 4]" → "Chapter 5" (embeddings is chapter 5 in the current curriculum).

**Explicit non-goals:** no other content changes. The embeddings major rework is Unit B.

**Testing note:** the 300d file is bigger (~376MB zipped, ~1GB extracted) vs 50d (~66MB zipped). On a fresh `pnpm test:notebooks` run, this adds ~5–10 minutes. Once cached in `notebooks/` (already gitignored via `notebooks/glove.*`), it's a no-op. First pass: try it as-is. If `test:notebooks` times out or fails, revisit with a conditional skip.

### 2. Create `notebooks/vectors.ipynb`

**Source data:** reuse the 9 animals from `src/components/widgets/vectors/vectorData.ts` verbatim. Chapter widgets and notebook must agree (philosophy principle 9).

**Widget mapping** (per philosophy principles 5 and 7):

| Chapter widget | Action | Reason |
|---|---|---|
| VectorPropertyExplorer | Skip (but reuse the toy data) | Pure visualization |
| DotProductComparison | Code | Core mechanism |
| UnitVectorExplorer | Code (just the normalization, not the interactive designer) | Core mechanism |
| VectorMixer (blend + modify) | Code | Core mechanism |
| AmplifiedAnimalExplorer | Code (one-liner) | Mechanism, trivial |
| NeuronDotProduct | Code | The punchline |
| DirectionMagnitude + DotProduct2D (the 2D section) | Skip | Pure visualization; geometric intuition landed in the chapter |

**Cell flow (~23 cells, one new idea per cell):**

1. Markdown — title, link to [chapter 4](https://learnai.robennals.org/vectors), one-line "if new to PyTorch, see [appendix](https://learnai.robennals.org/appendix-pytorch)"
2. Code — `import torch`
3. Markdown — our toy animals (6 properties: big, scary, hairy, cuddly, fast, fat)
4. Code — full dict of 9 animal tensors (exact values from `vectorData.ts`)
5. Markdown — dot product = multiply matching pairs, sum
6. Code — dot product manually (multiply, sum); then `torch.dot` confirms
7. Markdown — comparing animals
8. Code — rank all 9 animals by dot-product similarity to bear
9. Markdown — raw dot products are unfair: bigger vectors win
10. Code — construct an "all 1.0s" animal; show it dominates the ranking
11. Markdown — magnitude: √(sum of squares)
12. Code — compute `magnitude(bear)` manually
13. Markdown — unit vector: divide by magnitude
14. Code — `bear_unit`; confirm `magnitude(bear_unit) == 1`
15. Markdown — cosine similarity = dot product of unit vectors
16. Code — normalize all animals; redo the ranking; the "all 1.0s" animal no longer wins
17. Markdown — vector addition = blending
18. Code — `blend = normalize(bear + rabbit)`; find closest real animal
19. Markdown — adding a direction to modify
20. Code — `bear + (smaller, cuddlier, less scary)` → find closest (Paddington-ish result)
21. Markdown — a neuron is a dot product
22. Code — `weight = bear_unit`; loop over all animals as inputs; compute dot + bias, apply `torch.sigmoid`; print each animal's "bear score"
23. Markdown — what's next: embeddings teaser, link to chapter 5

**Forward references:** none new. Uses `torch.tensor`, `torch.dot`, basic arithmetic, and `torch.sigmoid` — all covered in earlier chapters or the PyTorch appendix.

**Dependencies:** assumes appendix-level tensor familiarity (philosophy principle 4). The opening markdown links to the appendix.

**Explicit non-goals:**
- No 2D matplotlib visualizations (per the widget mapping).
- No `nn.Linear`; no `torch.nn.functional.normalize`. Show division by magnitude and raw dot-product-plus-bias explicitly — clarity over brevity.
- No training, no backprop, no gradients.

### 3. Update `docs/plans/pytorch-prerequisites.md`

Add a new subsection after the `optimization.ipynb` entry and before `neurons.ipynb`:

```markdown
### vectors.ipynb

No forward references. Uses `torch.tensor`, `torch.dot`, basic arithmetic, and `torch.sigmoid` — all taught in earlier chapters or the PyTorch appendix. Assumes appendix-level tensor familiarity.
```

### 4. Copy edit to `src/app/(tutorial)/appendix-pytorch/content.mdx:9`

Change:

> It's what researchers at OpenAI, Meta, Google DeepMind, and most universities use to train neural networks.

to:

> It's what researchers at Anthropic, OpenAI, Meta, Google DeepMind, and most universities use to train neural networks.

No other edits to the appendix.

## Commit plan

Branch: `chapter/vectors-notebook` off `meta/colabs`, matching the existing `chapter/...` pattern.

Three commits:

1. **Fix GloVe dimensionality and chapter reference in embeddings notebook** — the 50d → 300d fix plus the Chapter 4 → Chapter 5 label fix. Standalone; could ship on its own.
2. **Add vectors.ipynb + update pytorch-prerequisites.md** — the main deliverable.
3. **Add Anthropic to PyTorch appendix researcher list** — one-line copy edit.

PR to `main` when all three land.

## Testing

- `pnpm test:notebooks` must pass. This runs both the updated `embeddings.ipynb` (now downloading 300d GloVe) and the new `vectors.ipynb`.
- `pnpm lint` — catches MDX issues in the appendix edit.
- Spot-check the Colab link from the vectors chapter — clicking `<TryItInPyTorch notebook="vectors">` should load the new notebook on Colab (build the URL manually from the pattern in `TryItInPyTorch`).

## Success criteria

- The vectors chapter's Colab link resolves to a real, runnable notebook.
- A reader running `vectors.ipynb` top-to-bottom sees:
  - Dot-product similarity rankings over the chapter's 9 toy animals.
  - Unit-vector normalization fixing the "all-1.0s wins everything" problem.
  - Vector blending producing recognizable intermediate animals.
  - A bear-detector neuron built from scratch that gives high scores to bear-like animals.
- `embeddings.ipynb` downloads 300d GloVe; analogies still work; chapter reference reads "Chapter 5".
- `appendix-pytorch/content.mdx` includes Anthropic in the researcher list.
- `pnpm test:notebooks` passes.
