# Chapter design: "Real AI Models"

**Slug:** `real-ai` · **Position:** immediately after `transformers` (new Chapter 10) · **Status:** spec (rev 4 — built)
**Date:** 2026-07-20
**Companion data (source of truth for all factual claims & widget data):** [`docs/plans/real-ai-model-data.md`](../../plans/real-ai-model-data.md)

---

## 1. Purpose

A tour chapter that sits right after the transformers chapter. It connects the **vanilla transformer the
reader just built** to how **real cutting-edge models** actually work, and gets them excited for the
deep-dive chapters that follow.

It goes into *a little* detail — enough for intuition, not enough to fully understand any technique. Every
technique section says so explicitly.

### Goals
- Show that frontier models are **the architecture we just described**, plus the incremental addition of a
  fairly small set of fairly simple tweaks.
- Give the reader a clear mental model of the **five distinct engines of progress** (§2), so "the model got
  better" stops being a single undifferentiated thing.
- Give intuition for a few selected techniques via small playgrounds.
- Be honest about what is known: open models publish much of this; closed models don't; and *nobody* fully
  publishes their training data or recipe.

### Non-goals
- No deep mechanism teaching (later chapters). No math.
- Not a leaderboard or model-buying guide.
- No claim that any single technique *causes* a jump in ability.
- No legal accusations — the training-data section must distinguish allegation from finding from settlement.

## 2. Thesis and the five engines

> The state-of-the-art models really are mostly the simple architecture we already described. There are lots
> of little ideas built on top, but they're mostly simple tweaks to the same core. If you understand the
> core, you can understand the tweaks.

Models get better along **five distinct axes**. The chapter gives a brief overview of each, then a brief
intro to a few particularly interesting techniques:

1. **Doing more** — bigger models, more training.
2. **Tweaking the model** — architecture techniques.
3. **Improving efficiency** — cheaper/faster rather than smarter.
4. **Better training data** — what you train on, not how.
5. **Alignment** — turning a text-continuer into a helpful, honest assistant.

## 3. Placement & curriculum migration

`ch.id` is rendered directly as the chapter number (`ChapterList.tsx` uses `label={String(ch.id)}`;
`page.tsx` prints `ch.id`). Inserting at position 10 is a **renumbering migration**:

1. Insert the new chapter in `src/lib/curriculum.ts` **after `transformers` (id 9)** with `id: 10`.
2. **Increment `id` by 1 for every chapter currently at 10–27** (`matrix-math` 10→11 … `context` 27→28); appendix chapters shift to 29, 30 (`getAppendixLabel` uses array position, so labels stay correct — re-verify).
3. **Update every `prerequisites` entry referencing an id ≥ 10.** Current cross-refs: `self-play` `[16]`, `reasoning` `[9,16]`, `alignment` `[9,16]`, `world-models` `[22]`, `agents` `[9,18]` → `[17]`, `[9,17]`, `[9,17]`, `[23]`, `[9,19]`. Audit the whole file; don't eyeball.
4. New chapter `prerequisites: [9]`. `ready` stays unset until the author is happy to publish.

**Metadata:** `slug: "real-ai"` · working title **"It's Still the Transformer"** · subtitle "Real frontier models".

**Files:** `src/app/(tutorial)/real-ai/{page.tsx,content.mdx,widgets.tsx}` ·
`src/components/widgets/real-ai/` (widgets + `data.ts`) · `notebooks/real-ai.ipynb`.

## 4. Section-by-section outline

### 4.1 Intro
Cutting-edge frontier models are basically the architecture we just described. When new models get better,
it's partly **parameters getting better** and partly the **incremental addition of a fairly small set of
fairly simple tweaks**. Introduce the five engines as the chapter's map.

Then the epistemics. The argument runs: open models achieving **comparable performance** publish everything,
so we have readable build instructions for something about as good as the secret models. Supporting facts:
GPT-5's SWE-bench Verified (74.9) sits *below* GLM-5's self-reported 77.8; Google officially confirms Gemini
is sparse MoE; OpenAI's own open `gpt-oss` uses the conventional toolkit. Conclusion: the closed models are
*likely* built along similar lines. Caveats: likely not certain, nobody outside can check, and a lab that
found something genuinely new would have every reason not to say so. Also, open weights reveal
*architecture* but not *training data or recipe* — which sets up §4.5.

> ⚠️ **Do NOT argue that independent convergence between the open models proves the recipe is right.** They
> publish their designs and copy each other, so agreement between them is expected and proves nothing. The
> load-bearing fact is the small *performance* gap to the closed frontier, not the agreement among open models.

### 4.2 Engine 1 — Improving by doing more
Getting better by getting bigger and training longer. → **`ScalePlayground`** (§5.1), a table.
Beats: params 1.5B → ~1.8T; context 1k → 1M+; training data ~10B → ~36T tokens; and the twist that **MoE
broke the link between total size and per-word cost** (trillion-parameter models activate only 17–50B per
word, often *less* than dense GPT-3's 175B).

### 4.3 Engine 2 — Improving by tweaking the model
The small set of tweaks, when each appeared, and whether having them seems to matter. →
**`TricksPlayground`** (§5.2), a table. One line per technique: what problem it solves, roughly how.

### 4.4 Engine 3 — Improving efficiency
Techniques that make models **cheaper and faster rather than smarter**. → **`EfficiencyPlayground`** (§5.3).
Headline (data file Table 5a): the price for a *fixed capability level* has fallen fast — ~40×/yr for
GPT-4-level science reasoning (Epoch AI), ~5–10×/yr for frontier price-per-capability (Thompson et al.),
and GPT-3.5-level inference fell >280× between Nov 2022 and Oct 2024 (Stanford AI Index).

**Two required honesty beats** (Table 5b): only ~3×/yr of that is *algorithmic* — the rest is hardware
(~30%/yr) and market/pricing pressure; and **running the actual frontier is getting more expensive**
(3–18×/yr). Scope the claim to *"a fixed capability level gets radically cheaper,"* never *"AI is getting cheaper."*

### 4.5 Engine 4 — Improving with better training data
**Brief section**, organised around four ways to get good data: **scrape it, buy it, pay humans to make it,
have a model make it.** Beats:
- **Secrecy.** Labs — **including the open-weight ones** — are fairly secretive here. They publish token
  counts and architecture but are vague or silent on the exact data mix. Truly-open-data projects
  (OLMo/Dolma, Pythia) are the exception. This is why "open weights" answers *how is it shaped?* but not
  *how was it made?*
- **Buying data you wouldn't think of.** Anchor on the **Enron email corpus** — emails made public after the
  company's collapse, now a standard NLP corpus — precisely because it's publicly known and citable.
  *(Verification + article link pending research.)* The wider private-licensing world is **reported** to go
  much further; state only publicly-documented deals as fact and characterise the rest as reported, or omit.
- **Paying experts to write training data.** Labs pay domain experts (PhDs, doctors, competitive
  programmers) to hand-write solutions and explanations *specifically to train on*, via companies like
  Scale AI, Surge AI, and Mercor. *(Figures pending research; citable numbers only.)*
- **Dubious rights** — **Books3** and the litigation around it. **Careful, non-defamatory phrasing
  required**: distinguish what is alleged, what a court found, and what was settled. Wording comes from the
  research report, not from memory.
- **Most of the internet is junk** — filtering, deduplication, quality classifiers, and *weighting* good
  sources up; a small high-quality set can beat a much larger raw one.
- **Making data that doesn't exist yet** — getting an LLM (often a *thinking* model reasoning deeply) to
  generate high-quality text better than what's available.
- **The generate/verify asymmetry** (hint only, forward-reference to `self-play`). Judging whether an answer
  is good is easier than producing a good answer from scratch. That asymmetry is *why* the
  generate-lots-then-filter loop raises quality above the model's average attempt, and it's the seed of
  self-improvement: models reviewing models can climb, the way two people arguing sharpen each other's
  reasoning. Keep it to two or three sentences here — the `self-play` chapter is where it gets developed.

**No playground.** Prose carries this section; the material is narrative (Enron, Books3, commissioned data) rather than something a reader manipulates. The FineWeb funnel numbers live in the prose instead.

### 4.6 Engine 5 — Alignment
**Brief section.** A raw pre-trained model just continues text; it isn't trying to be helpful, honest, or
safe. Alignment is the stage that turns it into an assistant: **SFT** → **RLHF** (humans rank answers) →
variants (**Constitutional AI / RLAIF**, **DPO**) and **RLVR** (reward for verifiably correct answers).

The striking beat, if the research confirms the numbers: a much *smaller* aligned model was preferred by
humans over a much *larger* unaligned one — alignment can matter more than size for how good a model feels
to use. Also mention the failure modes in one line each: sycophancy, reward hacking, over-refusal.
→ Deep dives in the Alignment and RL chapters.

### 4.7 (removed — moved to the depth chapters)
Earlier revisions put per-technique mini playgrounds (MoE router, sparse attention, KV cache, thinking,
normalization) in this chapter. They **move out** to the depth chapters, which keeps the hub at exactly five
playgrounds instead of nine. See the family plan for where each one lands. The hub instead *names* each
technique inside the relevant axis playground, with a one-line description and a link onward.

### 4.8 Close
Brief recap (voice guide: short, no mechanically-bolded list), the humility caveat — *these are the
state-of-the-art models at the time of writing; by the time you read this the frontier will likely use even
cleverer techniques not described here, but probably still built on this same core* — and a map of the
chapters ahead. Then `<TryItInPyTorch notebook="real-ai">`.

## 5. Widgets

All client components in `src/components/widgets/real-ai/`, wrapped in `<WidgetContainer>`, dynamically
imported with `{ ssr: false }`, data from a shared `data.ts` transcribed from the data file with confidence
flags preserved. **Missing data is a first-class case** — widgets must render "unknown" honestly rather than
hiding or interpolating. Charts follow the `dataviz` skill.

**Small illustrative diagrams.** Where a technique's one-line blurb is hard to picture (mixture of experts,
sparse attention, KV cache, distillation), pair it with a small inline SVG in the playground's detail panel.
The glossary supports the same thing: `GlossaryEntryMeta` already has an optional `illustration` field
pointing at an SVG under `/public`, so the *same* asset can serve both the playground blurb and the glossary
popover. Build these as a small shared set rather than per-widget one-offs.

**Prose/playground balance.** The chapter prose is deliberately thin wherever a playground follows — the
playground does the explaining, and the prose only sets up the idea and states the one insight the reader
should leave with. Keep it that way when editing; if a section's prose grows, that's a sign content belongs
in the playground or a depth chapter.

### 5.1 `ScalePlayground` — engine 1 (a table, not a chart)
A **table**: rows are models in release order, columns are the statistics (parameters stored, parameters
used per word, layers, attention heads, training tokens, context window, MMLU, GPQA, SWE-bench). A chart
only shows one statistic at a time, which hides the thing that matters — that these numbers move together,
except where they pointedly don't.

- **Click a column heading** for a plain-language explanation of what that statistic measures.
- **Click a model** for what it is, when it shipped, and how it stood at the time.
- Missing values render as `—` ("the lab never published this"), leaked figures are marked `†` and coloured.
- Horizontally scrollable; first column sticky.

### 5.2 `TricksPlayground` — engine 2 (a table, not a chart)
A **table**: rows are the tweaks, columns are models in release order, cells are ✓ / · / ?.

- **Click a model column heading** for what that model is, its release date, its openness, and how
  state-of-the-art it was.
- **Click a tweak row** for the problem it solves, roughly how, and a link to its deep-dive chapter.
- The **GPT-5 column is almost all `?`**, which is the point: it's what a closed model looks like from
  outside. The default panel says so explicitly.

Dropping the ability-vs-time chart also removes the correlation-versus-causation hazard that the previous
design needed a standing warning for. A plain "who uses what" table makes no causal claim.

### 5.3 `EfficiencyPlayground` — engine 3
- Headline cost-per-capability stat (Table 5a).
- **Bars per technique** with sourced magnitudes (Table 5c): quantization (2× at FP8, 4× at 4-bit),
  MoE sparsity (18–23× fewer FLOPs/token), KV compression (MLA 93.3% smaller cache), sparse attention
  (2.9× fewer FLOPs at 1M ctx), speculative decoding (2–3×), FlashAttention (3× end-to-end),
  pruning+distillation (40× fewer training tokens).
- **Serving/hardware bars visually separated** (PagedAttention 2–4×, GPUs 30%/yr) — they are not model techniques.
- **Required caption:** these bars measure different things (memory vs FLOPs vs latency vs dollars) and
  **do not multiply**. The layout must not imply otherwise.

### 5.4 Mini playgrounds
Small, single-concept, deliberately shallow; each carries the "intuition only" framing.
1. **`MoERouterMini`** — a token arrives; the router lights up a few of N experts. Dense/MoE toggle; counter for total vs active params.
2. **`SparseAttentionMini`** — token×token grid; toggle full / sliding-window / top-k; counter for cells computed and saving.
3. **`KVCacheMini`** — KV cache memory bar growing with context; toggle MHA / GQA / MLA to watch it shrink.
4. **`ThinkingMini`** — a hard question answered instantly (wrong) vs with a visible scratchpad (right); slider for thinking length vs accuracy. Must note the gain is *test-time compute*, not a bigger model.
5. **`NormalizationMini`** — activations drifting/exploding across a deep stack without normalization; stabilised with it.

**Scope note:** up to 9 widgets — a large build. Suggested phasing — **v1:** the three main playgrounds
(§5.1–5.3) plus `MoERouterMini` and `KVCacheMini`; **v2:** the remaining minis. The chapter reads coherently
with static prose standing in for v2 minis.

## 6. Companion notebook (`notebooks/real-ai.ipynb`)

Theme: **"these models are real, and you can read and run them."** No deep technique dives.
1. **Pull real spec sheets** — download `config.json` for several open models (tiny JSON, no weights) via `huggingface_hub`; print and compare experts, attention type, context, vocab, params.
2. **Plot the growth** — reproduce the scale playground's charts from the data-file numbers.
3. **Actually run one** — load a **small quantized** open model with `transformers` and generate text. Download **optional and clearly gated**; the notebook must run end-to-end without it. Follow the runtime-download pattern in `notebooks/04-embeddings.ipynb`; never commit weights (CLAUDE.md "Large Files").

Per CLAUDE.md, define every term before use or forward-reference its chapter.

## 7. Data status & gaps

Source of truth: `docs/plans/real-ai-model-data.md`.
- ✅ **Have:** technique×model matrix (T1); per-model dials (T2); growth over time incl. GPT-2/3/4 (T3);
  benchmark scores across the LAMBADA→MMLU→GPQA/SWE-bench relay with confidence flags (T4); efficiency
  headline, attribution split, per-technique savings, distillation evidence, tradeoffs (T5); technique
  first-appearance dates; per-technique blurbs; primary sources; closed-model facts.
- ✅ **Table 6 — training data** (landed): Enron corpus **verified** (FERC, ~500k emails, 0.14% of The Pile);
  Books3 with court-accurate phrasing and approved chapter wording; FineWeb/DCLM filtering numbers;
  Llama 3's published mix; synthetic data (Phi, Nemotron 98%, Qwen3, R1's 800k examples); model-collapse
  nuance; and the GPT-4 report's verbatim non-disclosure quote for the secrecy point.
- ✅ **Table 7 — alignment** (landed): full pipeline definitions in middle-school register; the **verified**
  InstructGPT result (1.3B aligned preferred over 175B unaligned — 100× fewer params); the Tülu 3
  stage-by-stage exhibit; the honest, scale-dependent alignment-tax picture; sycophancy / reward hacking /
  over-refusal with the XSTest chess example.
- ✅ **Table 6c — paying humans to write data** (landed): the expert-data industry (Scale, Surge, Mercor,
  Handshake, Turing); the Meta↔Scale $14.3B stake and the OpenAI/Google fallout; the "ChatGPT's manners came
  from about forty people" InstructGPT beat; usable hourly-rate figures; the Kenyan data-worker
  counter-story; and a consolidated licensing-deals table with documented figures.
- **All research is complete.** No section is blocked on further research.
- **Legal sensitivity:** use Table 6d's approved wording verbatim-ish. Re-check the AI litigation tracker
  before publishing — those cases are actively moving.
- ⚠️ **Known gaps to render as "unknown", not guess:** Llama 4 layer counts; GPT-4 params/tokens/layers
  (leak only); GLM-5.2 parameter count (aggregator-only — prefer GLM-5's confirmed 744B/40B/80 layers/28.5T
  tokens; note the two research passes conflated GLM-5 and GLM-5.2); Kimi K3 internals (weights due
  2026-07-27); attention-head counts for several models.

## 8. Accuracy & voice requirements

- **Every factual claim traces to the data file.** Never state `~`, `?`, `⏳`, `🔴`, or aggregator-only cells as fact.
- **Correlation ≠ causation** in `TechniqueTimeline` — standing note in widget *and* prose.
- **Benchmarks:** no single benchmark spans GPT-2 → 2026 (it's a relay as each saturates); reasoning-mode
  scores buy accuracy with test-time compute; eval settings move scores several points; contamination is
  real. Use "≈", not decimal-precise rankings.
- **Efficiency:** don't credit model techniques for hardware or pricing gains; don't imply the bars multiply;
  scope cost claims to a fixed capability level.
- **Training data (legal sensitivity):** distinguish allegation / court finding / settlement. Use the
  research report's exact careful phrasing. Do not accuse any named company of a crime.
- **Closed models:** reasonable inference, not proof. Gemini-MoE confirmed; GPT-4-MoE is a leak; Claude undisclosed.
- **Never** use fabricated content-farm names ("DeepSeek R2", "Qwen3.7-Max").
- **Voice** (`docs/style/voice.md`): no "it's not X, it's Y"; sparse em-dashes; no drumroll phrases; no
  blocklist vocabulary; no raw `<p>` in MDX; keep author-style bolding in lists; no first-person "I". Run `pnpm lint`.

## 9. Open questions for the author
1. Final **title** (working: "It's Still the Transformer").
2. **Widget scope** — build all, or phase v1/v2 per §5.4?
3. **Featured model** for spec-sheet-style examples — DeepSeek-V3 (most bulletproof) or GLM-5 (newest
   fully-citable)? (Recommendation: DeepSeek-V3 for hard numbers, name-check GLM-5 as the newest readable one.)
4. In `TechniqueTimeline`, plot **individual models** or a **frontier envelope**? (Recommendation:
   individual models — an envelope hides the has/lacks contrast that is the point.)
5. Should engines 4 and 5 get minis at all, or stay pure prose to control scope?

## 10. Acceptance checklist
- [ ] `curriculum.ts` migration done, prerequisite ids audited, site builds.
- [ ] `content.mdx` covers all five engines per §4 and passes `pnpm lint` (incl. MDX no-raw-`<p>`).
- [ ] `ModelScalePlayground`: stat switching, log/linear, missing-data and low-confidence rendering.
- [ ] `TechniqueTimeline`: bars + benchmark selection + has/lacks colouring + blurbs; correlation caveat visible without interaction.
- [ ] `EfficiencyPlayground`: sourced magnitudes, separated serving/hardware bars, non-multiplying caption.
- [ ] Training-data section uses the researched, legally careful phrasing; Enron claim verified or dropped.
- [ ] Alignment section numbers verified against the research report.
- [ ] Mini playgrounds carry the "intuition only" framing.
- [ ] Every hard number matches the data file; unknowns render as unknown.
- [ ] `notebooks/real-ai.ipynb` runs end-to-end without the optional download; `pnpm test:notebooks` passes.
- [ ] Voice pass against `docs/style/voice.md`.
