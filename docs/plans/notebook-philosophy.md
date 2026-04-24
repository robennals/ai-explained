# Notebook Philosophy

Editorial reference for the PyTorch Colab notebooks that accompany each chapter.

The chapter teaches the idea. The notebook proves it's real. Chapters can hand-wave to get to the insight quickly; notebooks make everything concrete in code that the reader can run and poke at.

## Principles

1. **The chapter teaches, the notebook proves.**
   The chapter's job is intuition. The notebook's job is to show that every claim has real code behind it — that the mechanism described actually exists and actually works.

2. **Write for a middle schooler.**
   Explain everything in plain language. Never use a word or concept unless (a) a middle schooler would already know it, or (b) it was introduced in a previous example in this notebook or an earlier chapter. Unpack jargon before using it.

3. **Assume the reader has read the chapter.**
   Don't re-teach concepts. Brief framing for each section is fine; re-explaining isn't. Overlap is harmless, but default to lean.

4. **Scope rule — real components only.**
   For each section of the chapter, ask: "is there a real AI component here, or is this intuition-building?" Real component (attention scoring, sigmoid neurons, next-word sampling) → demo it in code. Intuition-building (hockey-stick growth plots, historical anecdotes, pure analogies) → skip.

5. **One new idea per cell.**
   Each code cell introduces at most one new concept. Reading cell N should feel like a tiny step from cell N−1. Never stack two unfamiliar things in one cell. Lead the reader gently.

6. **Widgets follow the scope rule.**
   A widget that computes a real mechanism (attention-score slider, bigram sampler) becomes tweakable code — the reader changes a variable and re-runs. A widget whose point is visual intuition (lookup-table size visualization, abstract diagrams) doesn't need a code version; that pedagogy already landed in the chapter. A single worked example is enough — no need for sliders.

7. **Code clarity above all.**
   Clear names, minimal abstraction, one idea per cell. Prefer readable code over terse code. Variable names should match the chapter's vocabulary — if the chapter says "key", the variable is `key`, not `k`.

8. **Match the chapter's examples.**
   Use the same toy vocabularies, analogies, and specific numbers the chapter uses, so readers recognize them. If the chapter names a dimension or size (e.g., 300-dim GloVe, 12,288-dim GPT-3), the notebook must match.

9. **Forward references are governed by `pytorch-prerequisites.md`.**
   When a notebook uses a PyTorch concept before its chapter, add a one-line explanation and log the forward reference in `pytorch-prerequisites.md`.

10. **Every notebook must pass `pnpm test:notebooks`.**
    Large data (GloVe, datasets) goes in the gitignored `data/` directory. Notebooks download what they need on first run.

11. **Maintenance — update the notebook when you edit the chapter.**
    When editing a chapter, check whether any new claim now has no corresponding concrete demo in the notebook. If so, update the notebook in the same PR when practical. If the drift is larger than a quick touch-up, log it in `notebook-sync-overview.md` so it's not forgotten.

## See also

- `notebook-sync-overview.md` — current drift catalog and work units
- `pytorch-prerequisites.md` — forward-reference tracking
- `curriculum-outline.md` — chapter-level editorial philosophy
