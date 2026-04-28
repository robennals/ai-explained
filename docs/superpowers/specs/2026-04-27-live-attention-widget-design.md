# Live Attention Playground — A Browser-trained Transformer Alongside the BERT Widget

**Status:** Design complete; ready for implementation plan.
**Scope:** Add a new live-inference widget to the attention chapter that runs a small custom transformer in the browser, letting readers type any sentence and inspect every layer × head of attention. Sits **alongside** the existing pre-recorded `BertAttention` widget (which is preserved unchanged) — readers see both the curated highlights of a real strong model and a sandbox for poking at a live, weaker one.

---

## Motivation

The existing "Real Attention Heads (BERT)" widget shows attention weights from `bert-base-uncased` — beautifully curated heads on a strong model, but the weights are pre-extracted in Python for a fixed list of sentences. The reader can't type their own input, can't poke at unfamiliar heads, and can't see how attention patterns shift as a real model runs.

The other side of that trade-off — a live model in the browser — is also worth showing, even if its heads are weaker. A live playground gives the reader:
- **Authorship.** Type your own sentences and see attention happen.
- **Surprise.** Browse heads that nobody curated. Find a pattern the chapter didn't tell you about.
- **Reality.** Watch the same math the chapter just taught actually run on your machine.

So instead of replacing the BERT widget, we add a second widget — a live tiny transformer — and let the two play complementary roles. The BERT widget is "here's what attention looks like in a real model" (curated, deep). The live widget is "here's attention happening live, on whatever you type" (interactive, shallow).

## Goals

1. Reader can type any sentence and immediately see attention weights for every head at every layer.
2. A handful of heads (~5–7) are documented with names and per-head explanations; the rest are browsable as `L{i} H{j}` cells in a grid.
3. Curated example sentences exercise the most interesting heads — particularly **induction**, the headline demo.
4. Model loads fast: under 10MB on the wire, ready to run within ~2 seconds on a typical connection.
5. Reuse the project's existing infrastructure: `model-inference.ts`, `ts-tokenizer-4096.json`, R2 sync script, `LiveTransformer` loader pattern.
6. Forward pass on a 16-token sentence completes in well under a second.
7. **The BERT widget is preserved unchanged.** No code or copy in `BertAttention.tsx` is touched by this work.

## Non-goals

- Replacing the BERT widget. It stays. The chapter ends up with two attention widgets — one pre-recorded, one live — sitting in different parts of the chapter and playing complementary roles.
- Pronoun-resolution heads in the live model. A 6M-param model trained on TinyStories is not large enough to develop them robustly. The chapter handles this by *not promising* pronoun heads in the live widget — that demo stays the BERT widget's job.
- WebGPU acceleration. Pure-JS is fast enough at this size; if it isn't, we shrink the model rather than add a runtime dependency.
- Replacing the existing `LiveTransformer` (story-generation widget). That widget loads from the same R2 prefix but a different sub-path; the two models coexist.
- Bidirectional attention. The new model is causal (decoder-style), matching the rest of the chapter and the existing `model-inference.ts` engine.
- Training infrastructure improvements beyond what this widget needs. No general-purpose training library.

---

## Phased rollout with a hard checkpoint

This work splits into two phases with a **gate between them**. Phase 2 only proceeds if Phase 1's results are interesting enough.

### Phase 1 — Train and inspect

1. Implement `train-attention-model.py` and run it to convergence.
2. Implement `inspect-attention-heads.py` to score every head against interpretable templates (previous-token, induction, first-token, repeated-token, punctuation, content-token).
3. Run inspection on a battery of probe sentences (induction probes like `"Bob said hi. Bob said"`, repetition probes like `"red apple green apple blue apple"`, sentences with mixed punctuation, plain narrative).
4. For each candidate named head, save its attention matrix on the probe sentences as PNG heatmaps so they can be eyeballed without re-running the model.
5. **Stop and report findings to the user.** The report includes:
   - Which heads scored highly on which templates.
   - Heatmaps for the top candidates.
   - A subjective read on whether the heads look "fun to play with" — clean patterns, recognizable behavior on novel sentences, surprises worth highlighting.

### Checkpoint — gate

The user reviews the Phase 1 report and decides:
- **Heads are good enough → proceed to Phase 2.**
- **Heads are weak → iterate.** Try a different seed, more training tokens, slightly larger model (8L × 8H × 320 ≈ 12M params is the next step up). Re-inspect. Repeat until either the heads pass or we conclude the live-widget idea isn't worth it for this chapter.
- **Heads are unsalvageable → abandon this work.** The BERT widget already exists and the chapter is fine without a second widget. No fallback widget gets built on top of weak heads.

The acceptance bar is *qualitative* (does the demo feel fun?), not just quantitative — three named heads aren't worth shipping if none of them are visibly impressive on novel sentences.

### Phase 2 — Build the widget (only after the gate passes)

1. Implement `LiveAttention.tsx` against the trained model.
2. Wire it into `widgets.tsx` and the new chapter section.
3. Upload weights to R2 via `pnpm sync-r2:apply`.
4. Test in dev, refine the curated examples and per-head copy based on what the actual heads do.
5. Ship.

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

A second script: `scripts/inspect-attention-heads.py`. After training:

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

We aim for 5–7 labeled heads. The grid view always shows all 48 regardless. **The Phase 1 → Phase 2 gate (above) is what determines whether we ship at all** — the test is qualitative ("does this feel fun?"), not a fixed threshold count.

---

## Browser widget

### File layout

```
src/components/widgets/attention/
  BertAttention.tsx              ← unchanged
  LiveAttention.tsx              ← new

scripts/
  train-attention-model.py       ← new
  inspect-attention-heads.py     ← new
  sync-r2.sh                     ← updated FILES list
```

`BertAttention.tsx` and its MDX call-sites stay as they are. The new live widget is wired into the chapter at a different location (see "Chapter prose updates" below).

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

The existing BERT widget call-site in `src/app/(tutorial)/attention/content.mdx` (`<BertAttentionNoPositionWidget>`, in the "Attention in a Real Model" section) **stays where it is, with its prose unchanged**. (Note: `widgets.tsx` also exports a second `BertAttentionWidget` variant that's currently unused in the MDX — that export remains untouched.)

The new widget gets a brand-new section, placed after "Where the Vectors Come From" and before "What We've Built" — i.e. once the reader has seen all the mechanisms (attention math, softmax, values, multi-head, QKV-from-embeddings), they get to play with the whole thing live before the chapter wraps up. The new section reads roughly:

> ## Try Attention Yourself
>
> The BERT widget above showed curated heads from a strong model. Now here's the other side of that trade-off — a tiny transformer running live in your browser, trained on a small collection of children's stories. Its heads aren't as sophisticated as BERT's, but they're real, computed on whatever sentence you type, on demand.
>
> [`<LiveAttentionWidget />`]
>
> Try one of the repeated-phrase examples and switch to the "Induction" head. Watch how, when the model sees a phrase it's seen before, attention jumps back to whatever followed the earlier occurrence — that's a simple form of in-context learning, emerging from training without anyone designing it.

The exact wording is finalized once we've trained the model and seen which heads emerged. If the training run produces something other than induction as the most striking demo, the prose pivots to that.

---

## What changes, file by file

| File | Change |
|---|---|
| `src/components/widgets/attention/BertAttention.tsx` | **Unchanged.** |
| `src/components/widgets/attention/LiveAttention.tsx` | **New.** Implements the live widget. |
| `src/app/(tutorial)/attention/widgets.tsx` | Add `LiveAttentionWidget` export alongside the existing `BertAttention*` exports. |
| `src/app/(tutorial)/attention/content.mdx` | Add a new "Try Attention Yourself" section between "Where the Vectors Come From" and "What We've Built", containing the `<LiveAttentionWidget />` call-site. The existing BERT call-site is not modified. |
| `src/components/widgets/transformers/model-inference.ts` | Add optional int8 dequantization in the loader. The forward pass is unchanged. |
| `scripts/train-attention-model.py` | **New.** Trains the model, exports JSON + binary weights. |
| `scripts/inspect-attention-heads.py` | **New.** Probes the trained model to identify candidate named heads. |
| `scripts/sync-r2.sh` | Add the two new file paths. |
| `scripts/extract-bert-attention.py` | **Unchanged** (still owns the BERT widget's data). |

The companion notebook `notebooks/attention.ipynb` does not change in this spec.

---

## Open questions deferred to implementation

- Exact int8 quantization scheme (per-tensor vs per-row). Per-tensor is simpler and probably fine at this size. Per-row is the fallback if attention patterns blur.
- Whether to memoize forward passes by `(tokens, layer, head)` or by token-array. Probably memoize by tokens; layer/head selection is a free read off the cached `Float32Array[][]`.
- Default sentence on first load — placeholder is the induction probe, but we may pick the most visually striking example after we've seen the trained heads.

These are implementation-time decisions, not design decisions.
