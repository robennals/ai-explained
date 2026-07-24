# Chapter design: "Getting the Right Information" (context)

**Date:** 2026-07-24
**Slug:** `context`
**Status:** design approved, ready to plan

## Goal

A single unified chapter about *context* — how a transformer physically handles
a huge input window, and how systems and agents decide what to put in that window
in the first place. It absorbs the material that was planned for the separate
`long-context` chapter (ch 13) and tells one continuous story, from "attention
compares every token to every token" (just learned in Transformers) all the way
to "how a coding agent curates its own context."

The chapter is positioned as **crucial nuance on how transformers actually work
on real inputs**, so it sits immediately after Transformers.

**Open vs. closed framing (use throughout).** The frontier closed models (Claude,
OpenAI's) don't publish how they make long context work. But **GLM-5.2 is an open
model with fairly similar performance that does publish its method** — so the
chapter can teach the real, documented mechanism (DSA + IndexShare) and note that
it's reasonable to assume the closed models do something broadly similar. This
lets the chapter be concrete about frontier behavior without pretending to know
Anthropic's or OpenAI's internals. Land this point explicitly at the centerpiece
(beat 4).

## Audience & voice

Same as the rest of the site: smart-middle-schooler target, plain and
pedagogical, no personal "I", follows `docs/style/voice.md`. No math background
assumed. Every big idea gets an interactive playground, not a demo.

## The "wait, what?" moment

A million-token context window *sounds* impossible. Attention compares every
token to every other token, so a million tokens is on the order of a **trillion**
comparisons per layer. Yet an **open-weight** model (GLM-5.2) does exactly this
at near-frontier quality. The trick has two parts the chapter builds to:

1. A cheap **index** reads the whole million tokens and hands full attention a
   **shortlist** of ~2,000 tokens that actually matter (DeepSeek DSA).
2. The layers **share** that shortlist instead of each recomputing it, cutting
   the cost ~2.9× more (GLM-5.2's IndexShare) — which is what makes the 1M window
   practical.

## Placement, renumbering, and removal of ch 13

`ch.id` in `src/lib/curriculum.ts` is used directly as the displayed chapter
number, and the array order drives display order. Changes:

- **Insert `context` at id 10**, immediately after `transformers` (id 9), moving
  its array entry to that position. Set its prerequisites to `[9]` (Transformers;
  Embeddings is a transitive prereq and stays satisfied).
- **Remove the `long-context` entry** (id 13, "Remembering a Million Words"). It
  was never implemented — no `content.mdx` exists — and its KV-cache / sparse-
  attention material now lives in this chapter.
- **Renumber the shifted chapters:** `matrix-math` 10→11, `training` 11→12,
  `mixture-of-experts` 12→13. Chapters `inference` (14) through `hallucination`
  (26) keep their existing ids. Final ids are contiguous 1–26.
- **Prerequisites need no remapping.** Every prerequisite array references only
  ids in {1–9, 16, 18, 22}, none of which change value. Verified against the full
  list before writing this spec.

Update `context`'s `description` if needed so it reads as the unified chapter
(retrieval + the long-context architecture), and set `ready: true` when done.

## Narrative spine (7 beats)

Each beat states the confirmed facts it teaches and its widget. Facts are grounded
in the research briefing (see "Sources" below); guardrails on shaky claims are in
"Accuracy guardrails."

### 1. The quadratic wall
Attention is all-pairs: double the input → 4× the work (O(L²)). A million tokens
is ~10¹² comparisons per layer. This is the problem the whole chapter solves.
**Widget — QuadraticWall:** drag context length; watch the comparison count and a
cost bar explode against a linear reference line. "Try this": find the length
where full attention becomes absurd.

### 2. Don't redo the past — KV caching
Generating one token at a time, a naive model would recompute the keys and values
for the entire history at every step. The fix: **cache** each token's key and
value the first time it's computed and reuse them. The KV cache grows linearly
with length and becomes the dominant memory cost of long-context generation.
**Widget — KVCache:** stream text out token by token with the cache on vs. off;
a counter shows work recomputed vs. reused, and a memory bar grows with length.

### 3. Most tokens don't need most tokens — local attention
Many layers only need a nearby window. **Gemma 3** interleaves **5 local layers
(1024-token sliding window) : 1 global layer** (Gemma 2 was 1:1 with a 4096
window; Gemma 1 was global-only). Cheap local layers between rare global ones keep
long-range ability while shrinking the cache — and information still propagates
far because stacked local windows overlap.
**Widget — LocalVsGlobal:** set each layer in a small stack to local-window or
global; see the cost, and trace how a fact at position 0 can still reach position
N through overlapping local windows across layers.

### 4. Pick the tokens that matter — sparse attention (CENTERPIECE)
Two steps, built up in order:
- **DeepSeek Sparse Attention (DSA).** A small, fast **"lightning indexer"** scores
  how relevant each earlier token is to the current one, and a **top-k = 2,048**
  operation keeps only the best; full attention runs on just that shortlist. Main
  attention cost drops from O(L²) to O(L·k). The indexer itself is still O(L²) but
  is cheap enough (few heads, low precision) not to dominate. DSA's own context is
  **128K**.
- **IndexShare (GLM-5.2).** Neighboring layers tend to want the same tokens, so run
  the indexer **once every 4 layers** and let the next 3 reuse those indices.
  Result: **~2.9× fewer FLOPs at 1M tokens**, enabling GLM-5.2's **1M** context at
  near-frontier quality — an open-weight model.

This is where the open-vs-closed point lands: Claude and OpenAI don't disclose how
they handle long context, but GLM-5.2 (open, similar performance) does, and it's
reasonable to assume the closed models do something broadly similar.
**Widget — SparseIndexer:** a big scrollable "haystack" of tokens; pick/type a
query token and watch the indexer light up the handful it selects; a slider tunes
k (see quality vs. cost); a toggle turns on IndexShare so several layers reuse one
selection, with a FLOP meter showing the savings. This is the chapter's marquee
playground.

### 5. The cache as pageable memory
Reserving one big contiguous block of KV memory per request wastes most of it.
**PagedAttention (vLLM)** borrows OS paging: chop the KV cache into fixed **~16-
token blocks**, keep a **block table** mapping each sequence's logical positions to
scattered physical blocks (blocks=pages, tokens=bytes, sequences=processes). Waste
drops from 60–80% to under 4%, and identical blocks (e.g. a shared prompt prefix)
can be shared across requests.
**Widget — PagedCache:** a grid of physical blocks; allocate tokens into pages for
one or more sequences, watch the block table fill, evict, and share a common
prefix. Compare fragmentation vs. the naive contiguous reservation.

### 6. What do you even put in the window? — retrieval
The window is finite; the world is not. Two approaches:
- **RAG + vector DB:** split documents into chunks, embed each into a vector,
  store them, and at query time embed the question and pull the nearest vectors —
  **semantic search** by meaning (builds directly on the Embeddings chapter).
- **Agentic grep-and-follow:** newer coding agents (Claude Code, etc.) often skip a
  prebuilt index and act like a developer — run grep, read files, follow imports
  and links. For code this is fresh (no re-embedding), exact, and precise; the
  study *"Is Grep All You Need?"* found grep-based retrieval generally matched or
  beat vector retrieval on code. Real systems combine semantic + lexical.
**Widget — Retrieval:** one small corpus, one query box; show semantic (nearest-
vector) hits beside keyword/grep hits, so the reader feels where each wins (query
that shares no words but shares meaning → semantic wins; exact identifier →
keyword wins).

### 7. Agents managing their own context
As a long-running agent fills its window, it curates: **compaction** (summarize
old turns), **memory files** (write durable facts to disk and re-read them), and
selective retrieval of just what the current step needs. This is prose plus a
light static diagram, not a full widget — the 6-widget budget goes to beats 1–6.

## Extras, mentioned lightly (no dedicated section)

- **MLA (Multi-head Latent Attention)** — Kimi K2 / DeepSeek: compresses keys and
  values into a small latent vector, shrinking the KV cache; the memory foundation
  DSA builds sparsity on top of.
- **Attention sinks / StreamingLLM** — keep the first few tokens plus a rolling
  window to stream near-infinite text.
- **RoPE scaling / YaRN** — gently "stretch" a model's sense of distance to run
  past its trained length.
- **Ring Attention** — a systems trick: split one long sequence across many GPUs in
  a ring. Complementary to the algorithmic sparsity above.

## Accuracy guardrails (from research)

- **1M context = GLM-5.2 / IndexShare**, not DeepSeek. DSA's own context is 128K.
- **Kimi K3** (2.8T MoE, "Kimi Delta Attention", 6.3× decode) rests on secondary
  reporting past the training cutoff — present cautiously and attributed to
  Moonshot's announcement. Use **Kimi K2 + MLA** as the solid, cited example.
- **Soften secondary percentages** (Gemma "60%→15% KV cache", GLM benchmark
  scores, per-query RAG dollar costs) — attribute rather than assert.
- GLM-5 (predecessor, 200K, DSA) vs **GLM-5.2** (1M, DSA + IndexShare) — don't
  conflate; IndexShare and 1M are the 5.2 story.

## Widgets (6)

All wrap `<WidgetContainer>`, are `"use client"`, dynamically imported with
`{ ssr: false }`, and live in `src/components/widgets/context/`. Reuse shared
controls (`SliderControl`, `ToggleControl`, `SelectControl`) and the `TryItProvider`
pattern seen in the Attention chapter. Each has a "try this" prompt that leads to a
surprise.

**Widget principles (author guidance):**
- **Readable text.** All labels, token text, and numbers must be comfortably
  legible — no cramming a real corpus into tiny type. Prefer few, large elements
  over many small ones. Keep the widget legible on a phone.
- **Show the principle, not a model.** Use small, hand-authored fake data, not a
  real model — real models are too big and too hard to interpret to make the idea
  visible. The point is for the reader to *see* the mechanism clearly. Concretely:
  - `SparseIndexer`: a hand-written haystack of a few dozen labeled tokens with
    author-assigned relevance to each query, so the "indexer" deterministically and
    understandably lights up the right ~handful. Not a real indexer network.
  - `Retrieval`: a tiny fixed corpus with author-chosen "meaning tags" so semantic
    vs. keyword hits are obvious and contrast cleanly (a query that shares meaning
    but not words; a query that shares an exact identifier).
  - `LocalVsGlobal`, `KVCache`, `QuadraticWall`, `PagedCache`: driven by counts and
    simple rules, not tensors — the numbers should be exact and inspectable.
- **Fun and interactive.** Each is a playground with a knob whose effect is
  immediately visible; the "try this" prompt should lead to a moment of surprise.

1. `QuadraticWall` — context length → comparison explosion vs. linear.
2. `KVCache` — streaming generation with cache on/off; work + memory counters.
3. `LocalVsGlobal` — per-layer local-window vs. global; reach through stacked
   locals; Gemma 5:1 framing.
4. `SparseIndexer` — lightning indexer over a haystack; top-k slider; IndexShare
   cross-layer reuse toggle; FLOP meter. (Centerpiece.)
5. `PagedCache` — KV cache as pages; block table; eviction and prefix sharing.
6. `Retrieval` — semantic vs. keyword search over one small corpus.

## Deliverables

- `src/app/(tutorial)/context/content.mdx` — the article (7 beats).
- `src/app/(tutorial)/context/page.tsx` — wrapper (follow Attention template).
- `src/app/(tutorial)/context/widgets.tsx` — dynamic imports + `WidgetSlot`s.
- `src/app/(tutorial)/context/quiz.mdx` + `QuizContent.tsx` — quiz
  (follow `docs/plans/quiz-writing-guide.md`).
- `src/components/widgets/context/` — the 6 widgets above.
- `src/lib/curriculum.ts` — reposition/renumber + remove `long-context`.
- `notebooks/context.ipynb` — companion notebook mirroring the beats section by
  section (per repo convention): a tiny NumPy/PyTorch demo of quadratic cost, a KV
  cache, a top-k indexer over toy embeddings that reproduces beat 4, and a toy
  semantic-vs-keyword retrieval. Every term defined before use or referenced to its
  chapter (`docs/plans/pytorch-prerequisites.md`).
- Glossary terms added for: KV cache, sparse attention, lightning indexer / DSA,
  IndexShare, local (sliding-window) attention, PagedAttention, RAG, semantic
  search, context window, MLA.
- OG diagram: falls back to the site card automatically; a curated one is optional.

## Testing / verification

- `pnpm lint` (includes MDX validation and the raw-`<p>` check — no raw `<p>` in
  MDX; use `<Lead>` or `<div>`).
- Build passes (`pnpm build`).
- The chapter renders and all 6 widgets mount (verify against the user's existing
  dev server on :3000 — do not start a new one; ask the user if it isn't running).
- `pnpm test:notebooks` passes for `context.ipynb`.
- Homepage/side-nav show the renumbered chapters in the right order.

## Sources (primary)

- DeepSeek-V3.2 / DSA — arXiv 2512.02556
- IndexShare / GLM-5.2 — HF `zai-org/GLM-5.2` model card + Z.ai blog; Raschka explainer
- Gemma 3 local/global — arXiv 2503.19786
- PagedAttention / vLLM — SOSP 2023 paper + vLLM blog
- Kimi K2 (MLA) — arXiv 2507.20534
- "Is Grep All You Need?" — arXiv 2605.15184
- MLA — arXiv 2405.04434; YaRN — arXiv 2309.00071; StreamingLLM — arXiv 2309.17453;
  Ring Attention — arXiv 2310.01889
