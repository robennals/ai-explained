# Live Attention Widget — Replace Pre-recorded BERT With a Browser-trained Transformer

**Status:** Design complete; ready for implementation plan.
**Scope:** Replace `BertAttention.tsx` (which serves 8 hardcoded sentences × 4 hardcoded heads of pre-extracted `bert-base-uncased` weights) with a widget that runs a real, small transformer in the browser and exposes every layer × head of attention on user-typed sentences.

---

## Motivation

The current "Real Attention Heads (BERT)" widget shows attention weights from `bert-base-uncased` — but the weights are pre-extracted with a Python script for a fixed list of sentences. The reader can't type their own input, can't poke at unfamiliar heads, and can't see how attention patterns shift across layers. The widget feels like a static figure dressed up as an interaction.

This spec replaces it with a tiny custom transformer trained on TinyStories, running fully in the browser via the existing pure-JS inference engine, with every layer and head browsable on any sentence the reader types.

## Goals

1. Reader can type any sentence and immediately see attention weights for every head at every layer.
2. A handful of heads (~5–7) are documented with names and per-head explanations; the rest are browsable as `L{i} H{j}` cells in a grid.
3. Curated example sentences exercise the most interesting heads — particularly **induction**, the headline demo.
4. Model loads fast: under 10MB on the wire, ready to run within ~2 seconds on a typical connection.
5. Reuse the project's existing infrastructure: `model-inference.ts`, `ts-tokenizer-4096.json`, R2 sync script, `LiveTransformer` loader pattern.
6. Forward pass on a 16-token sentence completes in well under a second.

## Non-goals

- Pronoun-resolution heads. A 6M-param model trained on TinyStories is not large enough to develop them robustly. The chapter copy is updated to reflect the heads we actually get.
- WebGPU acceleration. Pure-JS is fast enough at this size; if it isn't, we shrink the model rather than add a runtime dependency.
- Replacing the existing `LiveTransformer` (story-generation widget). That widget loads from the same R2 prefix but a different sub-path; the two models coexist.
- Bidirectional attention. The new model is causal (decoder-style), matching the rest of the chapter and the existing `model-inference.ts` engine. The chapter's pronoun-example sentences still work because pronouns refer back, not forward.
- Training infrastructure improvements beyond what this widget needs. No general-purpose training library.

---

## Architecture

### Model

A standard causal (decoder-only) transformer in the same shape `model-inference.ts` already loads:

| Field | Value |
|---|---|
| Layers | 6 |
| Heads per layer | 8 |
| Embedding dim | 256 |
| Head dim | 32 |
| FFN dim | 1024 |
| Vocab | 4096 (existing `ts-tokenizer-4096.json`) |
| Context length | 64 |
| Activation | GELU (matches engine) |
| LayerNorm | Pre-norm (matches engine) |
| Param count | ≈6M |
| File size on wire (fp32) | ≈24MB → **quantized to int8 for serving: ≈6MB** |

The architecture deliberately matches `model-inference.ts` exactly so no engine changes are needed. The single weight format (`*.json` config + `*.weights.bin`) is identical to what `LiveTransformer` already loads.

### Why these dimensions

- **6 layers × 8 heads = 48 heads** — enough variety that the layer/head grid feels like exploration, few enough that ~5–7 named heads feels well-curated.
- **embed_dim 256** — the smallest size where induction heads form reliably and where a few content-word vs function-word patterns tend to emerge in practice.
- **vocab 4096** — already what the project's tokenizer produces; no new training of a tokenizer.
- **context 64** — long enough for "type a paragraph" examples; short enough that pure-JS attention quadratic stays fast.

### Inference performance budget

Forward pass on a 16-token sentence in `model-inference.ts`:
- ~6 layers × (3 × QKV matmul + attention quadratic + output proj + 2 × FFN matmul)
- Roughly 100M scalar ops; pure-JS runs ~100M ops/sec without SIMD.
- **Expected: ~700ms first run, faster on repeat (JIT-warm).**

If the latency feels bad in practice we have two cheap escape hatches: shrink to embed_dim 192 (≈3.5M params), or batch the matmuls inside `model-inference.ts` more aggressively. We do not add WebGPU or onnxruntime-web in this spec.

---

## Training

A new script: `scripts/train-attention-model.py`.

- **Dataset:** TinyStories (`roneneldan/TinyStories`), streamed via `datasets`, ~50K stories tokenized.
- **Tokenizer:** load `public/data/tokenizer/ts-tokenizer-4096.json` directly.
- **Loss:** standard next-token cross-entropy. **No auxiliary head-steering.** Letting heads emerge naturally is the more honest pedagogical story and is what the existing chapter copy already implies ("no one told these heads what patterns to learn").
- **Hardware:** trains in 2–6 hours on a single laptop GPU or ~12 hours on CPU. Runs locally; no cloud step.
- **Output:** `public/data/attention-model/model.json` + `model.weights.bin` (gitignored), then `pnpm sync-r2:apply` to upload.
- **Quantization:** weights stored as int8 with per-tensor scale, dequantized at load time inside `loadTransformerModel`. Engine changes: a new optional `quantization: "int8"` field in the config; if present, `loadTransformerModel` reads `Int8Array` and a per-tensor scale array and produces `Float32Array`s before handing to the engine. The forward pass code is unchanged.

If int8 turns out to be lossy enough that named heads' patterns blur, fp16 is the fallback (~12MB on wire instead of ~6MB).

### Head-discovery script

A second script: `scripts/inspect-attention-heads.py` (or just a Jupyter cell). After training:

1. Run forward passes on a battery of probe sentences (induction probes, repeated-token probes, sentences with clear punctuation, etc.).
2. For each (layer, head), score it on a few **interpretable templates** — e.g., diagonal-shifted-by-1 ≈ previous-token, induction template ≈ matches at "second occurrence → token after first occurrence."
3. Output a ranked list of "best previous-token head," "best induction head," etc.
4. The implementer hand-picks the labels and writes them into the widget config.

Expected named heads (the chapter beats):
- **Previous token** (likely a layer 0 head)
- **First token / sink** (every token attends to position 0)
- **Induction** (likely layer 1+ — the headline demo)
- **Punctuation / boundary** (attends to recent period or comma)
- **Repeated token** (attends to other instances of the same token; distinct from induction)
- **Content tokens** (broad attention skipping function words; the "Broad context" analogue)

We aim for 5–7 labeled heads. If fewer emerge cleanly, the curation simply lists fewer; the grid view always shows all 48 regardless. **Acceptance bar for shipping:** at least three named heads, one of which is induction. If we can't find a clear induction head after training, we retrain with a different seed or a slightly larger model rather than ship without it — induction is the headline demo.

---

## Browser widget

### File layout

```
src/components/widgets/attention/
  BertAttention.tsx              ← deleted
  LiveAttention.tsx              ← new
  attention-model-loader.ts      ← new (or extends model-inference.ts loader)

scripts/
  train-attention-model.py       ← new
  inspect-attention-heads.py     ← new
  sync-r2.sh                     ← updated FILES list
```

The two MDX call-sites (`<BertAttentionWidget>` and `<BertAttentionNoPositionWidget>`) both become `<LiveAttentionWidget>` (single component, no "exclude positional heads" variant — see the prose-update section).

### Component shape

```ts
function LiveAttention(): JSX.Element
```

State:
- `model: TransformerModel | null` — loaded once on mount via lazy effect (same pattern as `LiveTransformer`).
- `inputText: string` — defaults to first curated example.
- `tokens: string[]` — derived from `inputText` via the existing tokenizer.
- `attentionByLayerHead: Float32Array[][]` — derived from `forward(model, tokenIds)`, recomputed when `tokens` change. `[layer][head]` is a `(seqLen × seqLen)` matrix.
- `selectedToken: number | null` — which token's attention row is on display.
- `selectedHead: { layer: number; head: number }` — currently shown head.
- `viewMode: "named" | "grid"` — toggle between curated heads (chips) and the full 6×8 grid.

### UI layout (top to bottom)

1. **Sentence tabs** — curated examples. Each tab is a starter sentence chosen to make a specific head's behavior visible. Initial set:
   - `"The dog chased the cat. The dog chased"` — induction probe (predicts `the cat` continuation by attending back).
   - `"Bob said hi. Bob said"` — minimal induction probe.
   - `"She picked up the book. The book was heavy."` — punctuation / boundary head.
   - `"red apple green apple blue apple"` — repeated-token head.
   - `"Once upon a time, there was a little girl."` — first-token / boundary mix; baseline for "broad context."
   - `"the cat the cat the cat"` — extreme induction stress test.

   Each tab also carries a `defaultSelectedToken` (the token whose attention is most interesting to look at on this sentence) and a `defaultHead` (the named head most relevant to this sentence) so a reader who clicks a tab sees the most striking pattern immediately.

2. **Free text input** — a `<textarea>` showing the current sentence. Editing it retokenizes and runs forward inference. Debounced ~150ms so typing doesn't spam forward passes.

3. **Tokenized display** — chips showing the WordPiece tokens (matters because TinyStories tokenizer splits unfamiliar words; users should see what the model actually sees). Click a token to set `selectedToken`. Click again to deselect.

4. **Named-head chips OR full grid** (toggled by `viewMode`):
   - **Named view** (default): a row of pill buttons, one per curated head, with the head's name. Below the row, a one-sentence explanation of the head's job.
   - **Grid view** (toggle "Show all heads"): a 6×8 grid of cells, each labeled `L{i}H{j}`. Cells corresponding to named heads have a small badge with the name. Cells display a tiny sparkline of attention from `selectedToken` (or a flat bar if no token is selected) so the reader can scan visually for "which heads are even doing anything?".

5. **Attention readout** — same visual treatment as the current `BertAttention` widget: each token in the sentence is shown with its attention weight from the selected token printed above and a background tint proportional to weight. Selected token gets the accent outline.

6. **Per-head guide** — a rendered explanation for the currently selected head, tied to the currently selected sentence. Stored as `Record<headLabel, Record<sentenceId, string>>` in widget config.

7. **Per-sentence "Try this" hint** — same role as today's `<sentence>.guide`. One sentence telling the reader the most interesting thing to click on.

### Loading and error states

Match `LiveTransformer.tsx` exactly:
- While the model is loading, show a centered spinner with "Loading attention model…"
- On fetch failure, show a soft amber error box. Do not block the rest of the page.
- Lazy-load on mount of the widget itself (not at page load), via the existing `next/dynamic` + `ssr: false` pattern in `widgets.tsx`.

The model file is ≈6MB; on a slow connection it may take a few seconds. After first load, the browser caches it.

---

## Hosting

R2 bucket `learnai`, prefix `data/attention-model/`, two files:

- `model.json` — config (architecture, vocab pointer, optional `quantization: "int8"` field, scale arrays)
- `model.weights.bin` — packed binary weights

Served via the existing public R2 URL (`pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev`). The widget hard-codes the URL the same way `LiveTransformer.tsx` does.

The `scripts/sync-r2.sh` `FILES` list is extended:

```bash
"attention-model/model.json"
"attention-model/model.weights.bin"
```

Both paths are gitignored under `public/data/`. Local dev can either run the sync script or download the files into `public/data/attention-model/` manually.

---

## Chapter prose updates

The widget appears at one place in `src/app/(tutorial)/attention/content.mdx`:

> "Below are real attention weights from **BERT**, a well-known language model."

This becomes something like:

> "Below is a small transformer running live in your browser. It was trained on a tiny corpus of children's stories — small enough to download in a couple of seconds, big enough to develop interesting attention patterns. Type any sentence and watch what each head pays attention to."

The sub-prose currently teasing the "Self / pronoun" head ("Click 'it' and try the 'Self / pronoun' head…") is rewritten to point at induction:

> "Try one of the repeated-phrase examples and switch to the 'Induction' head. Watch how, when the model sees a phrase it's seen before, attention jumps back to whatever followed the earlier occurrence — that's how it can predict what's likely to come next."

The MDX call-site that previously excluded positional heads (`BertAttentionNoPositionWidget`) becomes `<LiveAttentionWidget defaultHead="Induction" />` so its first impression is the headline demo, not a positional head. The other call-site (`<BertAttentionWidget>`) becomes `<LiveAttentionWidget />` with the default starter sentence.

---

## What changes, file by file

| File | Change |
|---|---|
| `src/components/widgets/attention/BertAttention.tsx` | **Delete.** |
| `src/components/widgets/attention/LiveAttention.tsx` | **New.** Implements the widget. |
| `src/app/(tutorial)/attention/widgets.tsx` | Replace `BertAttention` imports/exports with `LiveAttention`. Both call-site components (`BertAttentionWidget`, `BertAttentionNoPositionWidget`) become `LiveAttentionWidget` variants. |
| `src/app/(tutorial)/attention/content.mdx` | Update prose at the BERT mention; update the per-widget hint copy. |
| `src/components/widgets/transformers/model-inference.ts` | Add optional int8 dequantization in the loader. The forward pass is unchanged. |
| `scripts/train-attention-model.py` | **New.** Trains the model, exports JSON + binary weights. |
| `scripts/inspect-attention-heads.py` | **New.** Probes the trained model to identify candidate named heads. |
| `scripts/sync-r2.sh` | Add the two new file paths. |
| `scripts/extract-bert-attention.py` | **Delete** (no longer used). |

The companion notebook `notebooks/attention.ipynb` does not change in this spec. The chapter still teaches the same mechanism; only the demo source changes. We can revisit whether the notebook should also load the same trained weights as a follow-up.

---

## Open questions deferred to implementation

- Exact int8 quantization scheme (per-tensor vs per-row). Per-tensor is simpler and probably fine at this size. Per-row is the fallback if attention patterns blur.
- Whether to memoize forward passes by `(tokens, layer, head)` or by token-array. Probably memoize by tokens; layer/head selection is a free read off the cached `Float32Array[][]`.
- Default sentence on first load — placeholder is the induction probe, but we may pick the most visually striking example after we've seen the trained heads.

These are implementation-time decisions, not design decisions.
