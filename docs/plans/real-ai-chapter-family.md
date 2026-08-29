# The "five engines of progress" chapter family

Planning doc for the `real-ai` hub chapter and the depth chapters that spin out of it.
Companion to the spec at [`docs/superpowers/specs/2026-07-20-real-ai-chapter-design.md`](../superpowers/specs/2026-07-20-real-ai-chapter-design.md)
and the sourced data at [`real-ai-model-data.md`](./real-ai-model-data.md).

## 1. The decomposition

Models get better along **five distinct axes**:

| # | Axis | One-line | Engine |
|---|---|---|---|
| 1 | **Scale** | Bigger models, more training. | Doing more of the same |
| 2 | **Tricks** | Architecture tweaks on top of the vanilla transformer. | Changing the machine |
| 3 | **Training data** | What you train on, not how. | Changing the diet |
| 4 | **Efficiency** | Cheaper and faster rather than smarter. | Same result, less cost |
| 5 | **Alignment** | Turning a text-continuer into a helpful, honest assistant. | Changing the goal |

This decomposition is the chapter family's backbone. It's useful precisely because "the model got better"
is normally an undifferentiated blob, and these five have genuinely different mechanisms, different
evidence, and different people working on them.

## 2. The hub chapter (`real-ai`)

**Role:** overview + orientation. Introduce the five axes, give a **brief intro playground for each**, then
hand off. Deliberately shallow — it exists to build a map and create appetite.

**Structure:** intro (incl. the open-vs-closed epistemics) → five axis sections, each with its playground →
close (humility caveat + map of chapters ahead) → notebook.

**Size control (the reason for this replan):** the per-technique mini playgrounds (MoE router, sparse
attention, KV cache, thinking, normalization) **move out of the hub** and become the spine of the depth
chapters. Without this, the hub is ~9 widgets and far too big. The hub keeps exactly **five** playgrounds,
one per axis.

## 3. Playground reuse — the anchoring device

Each depth chapter **opens with the same playground the hub used for its axis**, then goes deeper. The
reader gets a recognition beat ("I've seen this — now let's actually dig in") and a consistent visual
identity across the family.

**Implementation requirement:** these five playgrounds are shared across chapters, so they must **not** live
in `src/components/widgets/real-ai/`. Put them in `src/components/widgets/progress-axes/` with:
- a shared `data.ts` (transcribed from `real-ai-model-data.md`, confidence flags preserved);
- a `mode` / `depth` prop (`"overview" | "deep"`) so the hub renders the simplified version and the depth
  chapter renders the expanded one (more stats, more techniques, more controls) from the same component;
- per-chapter widget barrels that re-export with the right mode.

This keeps one source of truth per playground and avoids two diverging implementations.

## 4. Reconciliation with the existing curriculum

Several axes are **already covered** by planned chapters. Chapter ids below are post-insertion (everything
from `matrix-math` onward shifts +1 when `real-ai` takes id 10).

| Axis | Existing chapters that already cover it | Recommendation |
|---|---|---|
| **Scale** | *(none — the old outline had "Scaling and Emergence" but it is not in `curriculum.ts`)* | **Optional new chapter.** See §5.1 — there is more to say than it first appears. |
| **Tricks** | `mixture-of-experts` (13), `long-context` (14), `training` (12) | **No new chapter.** Already well fanned-out; the hub's playground routes to these. See §5.2. |
| **Training data** | *(none)* — closest is `synthetic-data` (21) | **New chapter — genuine gap.** Recommend **absorbing `synthetic-data`** into it. See §5.3. |
| **Efficiency** | `inference` (15) "Running Models Fast" | **Broaden the existing chapter** rather than add one. See §5.4. |
| **Alignment** | `alignment` (20), plus `reinforcement-learning` (17), `reasoning` (19) | **Already exists.** Hub playground anchors it. See §5.5. |

Net: **one new chapter (training data)**, **one broadened chapter (efficiency/inference)**, **one optional
chapter (scale)**, and two axes served by chapters already planned. That is a much smaller delta than
"spin out five chapters," and it avoids duplicating material the curriculum already commits to.

## 5. What goes in each chapter

### 5.1 Scale — optional chapter, "How Big Is Big Enough?"
The author's instinct was that there isn't much more to say. There is **somewhat** more than it looks:
- **Scaling laws** — loss falls predictably (a straight line on a log-log plot) as you add parameters, data, and compute.
- **Chinchilla / compute-optimal training** — the discovery that early large models were badly *under-trained*: for a fixed compute budget you want far more data relative to parameters. This reframed the whole field and is genuinely surprising.
- **Emergence** — smooth aggregate curves but sharp jumps in specific capabilities; and the counter-argument that some "emergence" is an artifact of discontinuous metrics.
- **Where scaling is hitting limits** — data exhaustion, cost, and the pivot to test-time compute.
- **The MoE twist** — total size decoupled from per-word cost.

**Recommendation:** worth a short chapter, but lowest priority of the family. If skipped, fold scaling laws
and the Chinchilla surprise into the hub's scale section, which would otherwise be the thinnest of the five.
**Decision needed from the author.**

Anchor playground: `ScalePlayground` in deep mode (add loss-vs-compute curves and a compute-optimal frontier).

### 5.2 Tricks — no new chapter; routes into three existing ones
The tricks axis fans out cleanly:
- **Mixture of Experts** → `mixture-of-experts` (13) — routing, experts, sparsity, load balancing.
- **Attention variants & long context** → `long-context` (14) — GQA, MLA/"KV LoRA", sparse and sliding-window attention, RoPE scaling, KV cache.
- **The quiet plumbing** → `training` (12) — RMSNorm, pre-norm, SwiGLU, QK-Norm. These belong here because
  they exist to *make training work*, which is that chapter's stated subject.
- **Multi-token prediction** → `inference` (15), since its main payoff is speculative decoding.

**Risk to manage:** the plumbing (RMSNorm/SwiGLU/QK-Norm) is architecture-side while `training` (12) is
currently framed around optimizers, activations, and regularization. These are adjacent enough to coexist,
but the `training` chapter's scope should be explicitly widened to "the hard-won tricks that make deep
models trainable — in the optimizer *and* in the architecture."

Anchor playground: `TricksPlayground` in deep mode could open `mixture-of-experts`, filtered to that technique.

### 5.3 Training data — NEW chapter, "What Models Learn From"
The genuine gap, and (from the research) the richest of the five for a young audience because it's full of
concrete, surprising, human stories.

Planned content:
1. **Secrecy** — even open-weight labs publish token counts and architecture but are vague on the data mix. Truly-open-data projects (OLMo/Dolma, Pythia) are the exception. This is the sharp point: open weights tell you *how it's shaped*, not *how it was made*.
2. **Where the data comes from** — the web (Common Crawl), books, code, forums; plus licensing deals.
3. **Cunning sourcing — buying data you wouldn't think of.** The **Enron email corpus** is the anchor
   example precisely because it's publicly known and citable: ~500k internal emails made public after the
   company's collapse, now a standard NLP corpus. *(Verification and article link pending research.)*
   The practice is **reported to be far broader** — publicly documented licensing deals for forums, news
   archives, stock media, academic publishing, subtitles and transcripts. **Rule for this section:** state
   only the publicly-documented deals as fact; characterise the wider practice as *reported*, or leave it
   out. The author has heard the private-data-licensing world goes much further than what's public, but
   anecdote doesn't go in the chapter.
4. **Paying experts to write training data.** A genuinely surprising beat for a young reader: rather than
   only scraping what exists, labs pay **domain experts** (PhDs, doctors, lawyers, competitive programmers)
   to hand-write solutions, explanations, and reasoning traces *specifically to be trained on*. There's a
   whole industry behind this — Scale AI, Surge AI, Mercor and others — with customers among every major
   lab. *(Companies, customers, rates, and deal figures pending research; use only citable numbers.)*
   Distinguish this from RLHF preference labelling, which is related but a different job.
5. **Dubious rights** — Books3 and the surrounding litigation. **Legally careful phrasing required**: separate what is alleged, what a court found, and what was settled. Use the research report's exact wording; do not accuse any named company of a crime.
6. **Most of the internet is junk** — filtering, deduplication, quality classifiers; the finding that a small high-quality set can beat a much larger raw one (FineWeb/FineWeb-Edu, Phi's "textbooks" line of work).
7. **Weighting and mixing** — how much code vs web vs books vs math, and upweighting good sources.
8. **Making data that doesn't exist** — synthetic data and distillation-for-data: getting an LLM (often a *thinking* model reasoning deeply) to write high-quality material better than what's available. **Absorbs the planned `synthetic-data` chapter**, which is the same subject seen from the model-to-model side.
9. **Model collapse** — the worry about training on model output, and what the evidence actually shows.

**The through-line for this chapter:** there are four ways to get good training data — *scrape it*, *buy it*,
*pay humans to make it*, and *have a model make it*. Each has a different cost, a different legal status, and
a different failure mode. That framing gives the chapter a spine and makes the secrecy point land: labs
compete on this, so they don't tell you which mix they used.

Anchor playground: `DataPlayground` in deep mode (see §6.3).

**Curriculum action:** merge `synthetic-data` (21) into this chapter, or narrow `synthetic-data` to
distillation-for-*efficiency* and move data-generation here. **Decision needed.**

### 5.4 Efficiency — broaden the existing `inference` chapter
`inference` (15) already plans GPUs, CUDA, FlashAttention, KV caching, speculative decoding, and memory
bandwidth. Broaden it from "how we run models fast" to "how a fixed capability got ~1000× cheaper," adding:
1. **The economics** — price for a fixed capability level falling (~40×/yr for GPT-4-level science reasoning; ~5–10×/yr frontier price-per-capability; GPT-3.5-level fell >280× in two years).
2. **The attribution split** — only ~3×/yr is algorithmic; ~30%/yr is hardware; the rest is market pricing. And the counterpoint that running *the frontier* is getting 3–18×/yr more expensive.
3. **Quantization** — FP8/INT8/INT4, what breaks and when.
4. **Distillation for efficiency** — small models inheriting big-model behaviour (the R1-distill result where distillation beat running RL directly on the same small base).
5. **Pruning**, **MoE as a compute-saving device**, **KV compression**, **speculative decoding / MTP**, **FlashAttention**, **sparse attention**.
6. **Serving** — batching, PagedAttention/vLLM — flagged as *not* model techniques.

All figures already sourced in `real-ai-model-data.md` Table 5. Keep the "these savings don't multiply"
caveat prominent.

Anchor playground: `EfficiencyPlayground` in deep mode.

### 5.5 Alignment — the existing `alignment` chapter
Already planned (20) as "RLHF transforms a text completer into a helpful assistant; optimize too hard and it
tells you what you want to hear." The hub's playground anchors it. Content to confirm against the alignment
research now in flight:
1. **The pipeline** — SFT → RLHF (humans rank; reward model; optimize) → Constitutional AI / RLAIF → DPO → RLVR.
2. **What alignment buys** — the InstructGPT-style result that a much smaller *aligned* model can be preferred by humans over a much larger *unaligned* one. **Exact numbers pending verification.**
3. **The alignment tax** — small capability cost, large usefulness gain; and whether that's still true today.
4. **Failure modes** — sycophancy, reward hacking / Goodhart, over-refusal.
5. Relationship to `reinforcement-learning` (17) and `reasoning` (19), which supply the RL machinery.

Anchor playground: `AlignmentPlayground` in deep mode.

## 6. The five hub playgrounds

Overview mode in the hub; deep mode in the corresponding depth chapter.

### 6.1 `ScalePlayground` (axis 1) — a table
Rows are models in release order; columns are the statistics (parameters stored, parameters used per word,
layers, attention heads, training tokens, context window, and benchmark scores). Clicking a column heading
explains what that statistic measures; clicking a model explains what it was. Missing values show `—`
("never published") and leaked figures are marked `†`.

Chosen over a chart deliberately: a chart shows one statistic at a time, which hides the fact that these
numbers rise together *except* for parameters-used-per-word, and that exception is the whole point.
*Deep mode:* add loss-vs-compute scaling curves and the compute-optimal frontier.

### 6.2 `TricksPlayground` (axis 2) — a table
Rows are tweaks, columns are models, cells are ✓ / · / ?. Clicking a model column heading gives what it is,
when it shipped, and how open it is; clicking a tweak row gives the problem it solves, roughly how, and a
link onward. The GPT-5 column is nearly all `?`, which is the teaching point.

A plain "who uses what" table also sidesteps the correlation-versus-causation hazard that an
ability-over-time chart created, since it makes no causal claim at all.
*Deep mode:* per-technique drill-down.

### 6.3 Training data (axis 3) — **no playground**
Dropped. The material here is narrative — the Enron corpus, Books3 and its litigation, commissioned expert
data, the Kenyan data workers — and none of it is something a reader manipulates. Prose carries it, with the
filtering numbers (36T → 20T → 15T, and the educational subset matching on a tenth the data) stated inline.

### 6.4 `EfficiencyPlayground` (axis 4)
Cost-per-capability headline plus sourced savings bars per technique, with serving/hardware bars visually
separated and a caption stating the savings do not multiply.
*Deep mode:* per-technique detail and the algorithmic/hardware/market attribution split.

### 6.5 `AlignmentPlayground` (axis 5) — new design
Same base model, same prompt, three stages: **raw pre-trained** (just continues the text, ignores the
question), **SFT** (answers, but flatly), **RLHF'd** (helpful, formatted, appropriately cautious). Reader
flips between stages on several prompts. A second panel lets them play reward-model labeller — rank two
answers and see which behaviour that reinforces, then push the optimization pressure too far and watch it
tip into sycophancy.
*Deep mode:* the full pipeline with DPO/RLVR and the alignment-tax comparison.
**Blocked on the alignment research** for the example content and any quoted numbers.

## 7. Resulting curriculum shape

With `real-ai` inserted at 10 (everything after shifts +1), the family is:

- **10 `real-ai`** — the hub: five axes, five playgrounds. *(new)*
- **12 `training`** — widened to include architecture plumbing (RMSNorm, SwiGLU, QK-Norm). *(scope tweak)*
- **13 `mixture-of-experts`** — tricks axis, deep. *(unchanged)*
- **14 `long-context`** — tricks axis, deep (attention variants, KV, RoPE scaling). *(unchanged)*
- **15 `inference`** — broadened into the efficiency chapter. *(scope tweak + rename candidate)*
- **20 `alignment`** — alignment axis, deep. *(unchanged)*
- **NEW `training-data`** — "What Models Learn From". Placement: near `synthetic-data`, which it absorbs.
- **OPTIONAL NEW `scaling`** — "How Big Is Big Enough?" (scaling laws, Chinchilla, emergence).

## 8. Open decisions for the author

1. **Scale chapter** — build it (scaling laws / Chinchilla / emergence), or fold into the hub? (My view: there's a real chapter's worth here, especially the Chinchilla "everyone was training wrong" surprise, which is a strong "wait, what?" beat.)
2. **`synthetic-data`** — absorb wholly into the new training-data chapter, or split (data-generation → training-data; distillation-for-speed → efficiency)? (My view: absorb; then reference it from efficiency.)
3. **`inference` rename** — keep "Running Models Fast", or rebrand to something like "Making Models Cheap" to match the broadened efficiency scope?
4. **Tricks chapter** — confirm no separate chapter, given MoE / long-context / training already carry it.
5. **Hub minis** — confirm the per-technique minis (MoE router, KV cache, thinking, etc.) move out of the hub into the depth chapters, leaving the hub at exactly five playgrounds.
6. **Widget depth prop** — confirm the shared `progress-axes/` component approach with `mode="overview" | "deep"` rather than separate per-chapter implementations.
