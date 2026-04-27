# Notebook Sync — Unit B

Major reworks for the four chapters whose notebooks have drifted from their chapters, plus one brand-new notebook for `positions` (which currently has no companion). One overview spec; one focused plan per notebook will be written when each is picked up.

## Goal

Bring the notebooks for `neurons`, `embeddings`, `next-word-prediction`, `attention`, and `positions` (new) into alignment with their chapters per `notebook-philosophy.md`. The chapters drifted (mostly Feb–Apr 2026) faster than the notebooks could keep up; this unit catches the notebooks back up under the now-explicit principle that the **notebook mirrors the chapter section by section**.

## See also

- `notebook-philosophy.md` — editorial reference
- `notebook-sync-overview.md` — full unit catalog
- `notebook-sync-unit-a.md` — completed Unit A spec, for stylistic reference
- `pytorch-prerequisites.md` — forward-reference tracking; needs updates for `vectors` (already done in Unit A) and `positions` (new in this unit)

## Cross-cutting decisions

These apply to every notebook in the unit; the per-notebook plans will not re-state them.

### 1. Mirror the chapter section by section

For each section in the chapter, ask: does this section demonstrate a real mechanism (vs pure intuition or narrative)? If yes, the notebook gets a cell that does the same thing the chapter's widget did, with the same examples, vocabulary, and toy data. If no, the notebook skips the section — the chapter handles intuition.

Don't curate or selectively pick "the most interesting" sections. Don't reorder. Don't combine sections to be terse. The notebook structurally follows the chapter so a reader can move between them and feel oriented.

(This sharpens `notebook-philosophy.md` principle 5 — the scope rule says *what to include*; the mirror rule says *the order and structure*.)

### 2. Reader-facing voice is first-person singular

Use **"I"** in markdown cells, never the royal "we". This is a single-author site. Existing notebooks may still use "we" in places — when reworking, switch to "I".

### 3. Branch strategy

One feature branch: **`chapter/notebook-rework-unit-b`**, branched from `main`. One commit per notebook (so 5 commits total). The unit ships as one PR for holistic review.

### 4. Planning strategy

This spec captures the cross-cutting decisions and per-notebook design summary. Each notebook gets its own focused plan written **when it is picked up**, not all five up front. The plan covers cell-by-cell content, exact code, and verification steps — same format as `notebook-sync-unit-a-plan.md`.

### 5. Execution order

Sequential, in chapter order:

1. `neurons` (chapter 3)
2. `embeddings` (chapter 5) — builds on the Unit A GloVe fix
3. `next-word-prediction` (chapter 6)
4. `attention` (chapter 7)
5. `positions` (chapter 8) — depends on the reworked attention notebook

Each notebook completes (plan written, executed, reviewed, committed) before the next begins.

### 6. Compute defaults

Several notebooks have substantial training in them. Standard defaults across the unit:

- **Hardware:** auto-detect GPU (CUDA), Apple MPS, then CPU. Print a one-line "for ~5x speedup, switch Colab runtime to T4 GPU (free)" hint at the top of any notebook with non-trivial training.
- **Outputs:** notebooks ship with cell outputs **cleared** (per repo convention; matches what we did in Unit A). Run `jupyter nbconvert --clear-output --inplace` before committing.
- **Large data downloads:** download to `notebooks/` (gitignored). The `notebooks/` `.gitignore` already covers `glove.*`; add patterns for new files (text8, TinyStories, BERT cache) as needed.

### 7. Notebook-philosophy doc update

Before starting Unit B implementation, add the new "mirror the chapter" principle to `notebook-philosophy.md` as principle 5b (or renumber). Keep the existing principles intact.

## Per-notebook design summary

Each summary lists the chapter sections in order and what the notebook does for each. Sections marked **[skip]** have no real-mechanism widget — they're intuition or narrative; the chapter alone handles them.

### neurons

Chapter sections (from `src/app/(tutorial)/neurons/content.mdx`):

| Chapter section | Notebook |
|---|---|
| Intro / brain-vs-AI scale | **[skip]** intuition framing |
| The Building Block (`NeuronDiagramWidget`) | Code: a single neuron as `weighted_sum + activation` from scratch — given inputs, weights, bias, compute the output. |
| Your First Neuron (`NeuronFreePlayWidget`) | Code: same neuron, vary weights/bias, observe output. |
| The Sigmoid (`SigmoidExplorerWidget`, `SigmoidZoomWidget`) | Code: define sigmoid, plot it across a range; show extreme inputs squash to 0/1. |
| Sigmoid sharpness (`SharpnessExplorerWidget`) | Code: plot sigmoid at multiple sharpness multipliers (e.g., ×0.5, ×1, ×3, ×10); show the curve sharpens. |
| Logic Gates (`LogicGatePlaygroundWidget`, `GateCircuitDiagramWidget`) | **[skip]** chapter framing for what gates are |
| Neurons as Smooth Logic (`NeuronPlaygroundWidget`) | Code: hardcode weights/biases for AND, OR, NOT, NAND on a single neuron. Compute the truth table for each. |
| Two Neurons Solve XOR (`TwoNeuronXORWidget`) | Code: (a) build a single neuron, train it on XOR, watch loss plateau and accuracy stuck at 0.75. (b) build a 2-hidden-1-output network, train, watch loss go to ~0 and all four cases correct. |
| What Hidden Layers Compute | **[skip]** intuition framing |
| Deeper Networks (`DeepNetworkPlaygroundWidget`) | Code: build a deeper `nn.Sequential` with ~3 hidden layers to make depth tangible. Just the construction; no training. |
| Training Deep Networks | **[skip]** chapter narrative on backprop; covered structurally by the XOR training cell. |

The notebook closes pointing toward `vectors` (the next chapter), per the existing pattern.

### embeddings

The Unit A fix already brought 50d → 300d GloVe and Chapter 4 → 5. Unit B reworks the rest:

| Chapter section | Notebook |
|---|---|
| Intro / hand-picked-dimensions don't scale | **[skip]** intuition |
| Adding a Second Dimension (`Simple2DScatterWidget`) | **[skip]** intuition |
| Beyond Two Dimensions | **[skip]** intuition |
| Exploring a Real Embedding (`EmbeddingPlaygroundWidget`) | Code: load 300d GloVe (already in current notebook from Unit A). For a few seed words, print top-5 nearest neighbors via cosine similarity. |
| Directions Have Meaning (`WordPairSpectrumWidget`) | Code: implement the projection-onto-line algorithm — for two endpoints (rabbit, elephant), find words whose embedding sits along the line between them, sorted by `t` (position along line). Use the chapter's example pairs (rabbit↔elephant, salad↔cake, tiny↔huge). |
| Adding Meaning (`EmbeddingArithmeticWidget`) | Code: compute analogies for **all four** chapter patterns: `paris − france + japan`, `woman − man + king`, `walking − walk + run`, `elephant − mouse + rabbit` (bigger-animal). |
| From Words to Tokens (`TokenizationPlaygroundWidget`) | Code: load a real tokenizer (tiktoken's GPT-4 tokenizer); tokenize the chapter's example words (`superman`, `qwertyflorp`, punctuation). Already in current notebook. |
| Where Do Embeddings Come From? (`EmbeddingLayerDiagramWidget`) | Code: train word2vec (skip-gram with negative sampling) on **text8** (full 100MB, downloaded to `notebooks/`). Use a top-10k vocabulary, ensuring the chapter's 8 example tokens (the, dog, cat, fish, car, apple, king, piano) are included regardless of frequency rank. PCA the resulting embeddings to 2D and scatter-plot, with the 8 example tokens labeled. **Quality verification at test time:** at minimum, dog/cat should be visibly closer to each other than to car. |
| Beyond Words | **[skip]** chapter framing |

text8 specifics: download from a stable mirror (Mahoney's homepage at https://mattmahoney.net/dc/text8.zip is canonical). Train ~5 epochs of skip-gram with negative sampling on a top-10k vocabulary. Notebook should expose `EPOCHS` and `VOCAB_SIZE` near the top so readers can tune.

### next-word-prediction

| Chapter section | Notebook |
|---|---|
| The Game (`NextWordGameWidget`) | **[skip]** intuition |
| The Simplest Approach: Count What Comes Next (`BigramExplorerWidget`) | Code: load the same TinyStories first-50k subset that the NN section trains on (defined once near the top of the notebook), tokenize with the WordPiece tokenizer, build a bigram count table. For seed words (`of`, `he`, `she`), print top-5 next-word predictions with frequencies (chapter's "33% for 'of the'" should reproduce). Implement temperature sampling. Generate ~20 tokens at low and high temperature. |
| The N-gram Wall (`NgramExplosionWidget`) | **[skip]** intuition / explosion math is in the chapter |
| Neural Networks to the Rescue (`SimpleNNPredictorWidget`) | Code: replicate the deployed model exactly. Architecture: `nn.Embedding(4096, 64) → flatten → nn.Linear(192, 128) → ReLU → nn.Linear(128, 4096)`. Train on first 50k stories from `roneneldan/TinyStories` (HuggingFace, streaming) for 5 epochs, batch_size=1024. Use the WordPiece tokenizer at `public/data/tokenizer/ts-tokenizer-4096.json` (the deployed tokenizer). Show predictions on chapter's example prompts ("once upon a", "the little"). Implement temperature sampling here too; generate longer sequences. |
| More Context, Same Problem | **[skip]** chapter narrative; the limitation is self-evident from `context_len=3` in the model definition |
| "It Just Predicts the Next Word" | **[skip]** narrative softening |
| What's Next | brief markdown cell pointing to the attention notebook |

GPU is strongly recommended for the NN training section (~3-5 min on T4 vs ~15-20 min on CPU). The notebook prints the runtime hint at the top.

### attention

| Chapter section | Notebook |
|---|---|
| Some Words Need Other Words (`WhyAttentionMattersWidget`) | **[skip]** intuition |
| Building Attention from Scratch (`ToyVocabTableWidget`, `ToyAttentionWidget`) | Code: define the chapter's exact 4-token vocab (cat, dog, blah, it) with 1D keys and queries (key=3 for nouns, key=0 for filler/it; query=3 for it, query=0 for the rest — match chapter's `ToyVocabTableWidget` exactly). Compute dot-product attention scores manually for each "it" position in chapter's example sentences ("cat blah blah it", "cat blah dog it", "blah blah blah it", "cat it dog it"). |
| Attention in a Real Model (`BertAttentionNoPositionWidget`) | Code: load `bert-base-uncased` from HuggingFace transformers, run a chapter sentence through with `output_attentions=True`, extract attention weights for the 4 specific heads the chapter visualizes (Layer 2 / Head 0, Layer 3 / Head 5, Layer 4 / Head 3, Layer 6 / Head 11). Plot each as a heatmap. Same sentences as `scripts/extract-bert-attention.py`. |
| Softmax: Dividing Your Attention (`SoftmaxExplorerWidget`) | Code: implement softmax from scratch. Show "all equal", "moderate, rest silent", "moderate meets loud", "all large but equal" — the four scenarios from the widget. Print the resulting probability distribution for each. |
| Values: What Did You Find? (`ToyValueTableWidget`, `ToyAttentionValuesWidget`) | Code: extend the toy vocab with value vectors (cat's value = "I'm a cat", dog's value = "I'm a dog", filler & it = zero). Compute weighted-sum-of-values for each example sentence; show "cat blah blah it" produces ~100% cat; "cat blah dog it" produces a 50/50 mix; "blah blah blah it" produces ~zero. |
| Multiple Heads | covered by the BERT visualization above |
| Where the Vectors Come From (`QKVProjectionWidget`) | Code: instantiate three `nn.Linear` layers as Q, K, V projections (no activation, as the chapter says). Show that two similar input embeddings (cat and dog with similar 4D embeddings) produce similar Q/K/V outputs, while a dissimilar embedding (it) produces very different outputs. |
| What We've Built / position-blindness teaser | brief markdown cell pointing to positions |

The notebook **does not** implement multi-head from scratch — the chapter doesn't either; multi-head is shown via real BERT.

### positions (new notebook)

| Chapter section | Notebook |
|---|---|
| Word Order Matters (`WordOrderMattersWidget`) | **[skip]** intuition |
| Attention Is Position-Blind | Code: recap the toy 4-token vocab from the attention notebook (rebuild keys/queries/values inline — readers may not have run attention.ipynb in the same session). Run two scenarios with same tokens in different orders; show identical attention scores; demonstrates position-blindness. |
| The Simplest Fix: Distance Penalties (`ALiBiToyTokensWidget`) | Code: implement ALiBi — `score = (query · key) − m × distance`. Show that with `m = 0` we get the position-blind result; with `m = 0.5` the closer noun wins. |
| The Limits of Linear Distance Penalties | **[skip]** chapter explains the limitation in prose, no widget |
| Rotation Encodes Distance (`RotationDotProductWidget`) | Code: take two 2D vectors, rotate both by the same angle, show dot product unchanged. Then rotate them by different angles, show dot product depends on the gap. |
| Applying Rotation to a Dimension (`RotationToyTokensWidget`) | Code: extend the toy by adding a 2D "noun-x, noun-y" pair to each token's key. Apply rotation `position × speed` to that pair. Show the closer noun winning attention as speed increases. |
| Multiple Rotation Speeds (`RoPEMultiSpeedWidget`) | Code: implement multi-pair RoPE — e.g., 8 dimension pairs at exponentially-decreasing speeds. For a fixed query position, plot attention weight as a function of distance for the four chapter configurations (single fast pair only, single slow pair only, sharper-medium combination, two-stage dropoff). Reproduces the widget's curves. |
| You Don't Need to Double the Dimensions | **[skip]** chapter explanation, no widget |
| Causal Masking (`CausalMaskingWidget`) | Code: build attention scores matrix, apply upper-triangle mask (set to -inf), apply softmax, print the resulting attention matrix showing the triangular pattern. Show one row's attention weights to confirm later positions get zero. |
| Words in Order | brief markdown cell pointing to transformers |

After the new notebook is committed, also:

- Add `<TryItInPyTorch notebook="positions">` to `src/app/(tutorial)/positions/content.mdx` (currently absent — chapter does not link to a notebook).
- Add a `### positions.ipynb` subsection to `pytorch-prerequisites.md`.

## Out of scope

- The other Unit B/C notebooks listed in `notebook-sync-overview.md` — handled in their own units.
- `transformers`, `matrix-math`, chapters 11–17 — explicitly skipped per the overview.
- Refactoring any shared notebook infrastructure (e.g., a common cell header) — not a goal here; if duplication shows up, just copy-paste.
- Updating chapter MDX content (other than the one-line `<TryItInPyTorch notebook="positions">` add).

## Acceptance criteria

A notebook in this unit is "done" when:

1. Every chapter section with a real mechanism has a corresponding code cell (or set of cells) that does the same thing the widget did, using the same examples and vocabulary.
2. The notebook executes end-to-end with `jupyter nbconvert --execute --output ...` and produces sensible outputs:
   - For the embeddings word2vec demo: dog/cat visibly closer than to car (verified by re-running the cell and inspecting the plot).
   - For the next-word-prediction NN: predictions on "once upon a" and "the little" look chapter-grade (top prediction is grammatically plausible).
   - For the BERT attention demo: the 4 specific heads produce the expected patterns (Self / pronoun head shows "it" splitting attention to nouns).
   - All other cells run without error.
3. Cell outputs are cleared before commit (`jupyter nbconvert --clear-output --inplace`).
4. Markdown cells use first-person singular ("I", not "we").
5. The notebook structurally follows the chapter — a reader who has the chapter open should be able to find the corresponding code cell quickly.

The unit is "done" when all 5 notebooks meet the above and the branch is ready for review.
