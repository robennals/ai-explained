# Real-AI chapter — model & technique data

The sourced data behind the "Real AI Models" chapter (`real-ai`) and its widgets.
Everything here is meant to be **stated as fact in the chapter**, so each claim carries a
confidence marker and (for hard numbers) a primary source. When we build the widget, this
file is the source of truth that the widget's data module (`src/components/widgets/real-ai/data.ts`)
should be transcribed from.

**Research date:** 2026-07-20. Anchor the chapter on the 2024–2025 models, whose full technical
reports and config files are public. Treat 2026 models with more caution (see caveats at the end).

## Confidence legend

- `✓` — confirmed from the model's own published report / `config.json` / model card
- `~` — very likely (used by the model's family or its prior version, not separately re-confirmed for this exact release)
- `✗` — deliberately **not** used by this model
- `?` — genuinely unknown from public info
- `⏳` — **announced by the lab, but weights not yet public** — press claims only, not verifiable from files. **Do not state as fact.**

---

## The model roster (columns, in release order)

Openness flag: **open** = weights + config public and readable · **announced** = revealed but weights not yet out · **closed** = no architecture disclosed.

| Model | Maker | Country | Released | Openness | Note |
|---|---|---|---|---|---|
| *Transformer (2017)* | Google | US | Jun 2017 | open (paper) | Historical anchor — the vanilla baseline the chapter taught. |
| *GPT-2* | OpenAI | US | Feb 2019 | open | Historical anchor — the model that made "just predict the next word" famous. |
| *GPT-3* | OpenAI | US | May 2020 | closed (paper w/ specs) | Historical anchor — dense, learned positions; 100× GPT-2. |
| *GPT-4* | OpenAI | US | Mar 2023 | closed (specs leaked) | Historical anchor — first widely-rumored MoE; specs are leaks. |
| *Llama 2* | Meta | US | Jul 2023 | open | Historical anchor — RoPE + RMSNorm + SwiGLU go mainstream (dense). |
| *Mixtral 8×7B* | Mistral | FR | Dec 2023 | open | Historical anchor — MoE goes mainstream. |
| DeepSeek-V3 / V3.2 | DeepSeek | CN | Dec 2024 → Sep 2025 | open | Best-documented frontier open model. |
| Llama 4 (Scout/Maverick) | Meta | US | Apr 2025 | open | Meta's first MoE Llama; iRoPE/NoPE layers. |
| Qwen3 | Alibaba | CN | Apr 2025 | open | Dense + MoE family; hybrid thinking. |
| Kimi K2 | Moonshot | CN | Jul 2025 | open | 1T MoE, built on DeepSeek-V3's architecture. |
| gpt-oss (120b/20b) | OpenAI | US | Aug 2025 | open | OpenAI's first open weights since GPT-2 — a rare US-frontier window. |
| GLM-4.6 | Zhipu / Z.ai | CN | 2025 | open | 355B MoE. |
| GLM-5.2 | Zhipu / Z.ai | CN | 2026 | open | Newest fully-readable frontier model; 753B MoE, 1M context. |
| Kimi K3 | Moonshot | CN | announced Jul 16 2026 | **announced** (weights Jul 27) | Provisional — press claims only until the weight drop. |
| *Claude / GPT-5 / Gemini* | Anthropic / OpenAI / Google | US | — | **closed** | No/partial architecture disclosure. Blank columns on purpose. |

Historical anchors (italic) are **optional lightweight columns** to make the Lindy timeline visible — they show *when* each technique entered the recipe. Include them faded/secondary so the frontier models stay the focus.

---

## Table 1 — The modern recipe (techniques)

One "winning" technique per design decision, and whether each frontier model uses it. This is the
"everyone converged on the same recipe" table.

| Design decision | Winning technique (replaces…) | DeepSeek V3.2 | Kimi K2 | Qwen3 | Llama 4 | gpt-oss | GLM-4.6 | GLM-5.2 | Kimi K3 |
|---|---|---|---|---|---|---|---|---|---|
| Feed-forward layer | **Mixture-of-Experts** (dense FFN) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⏳ |
| FFN activation | **SwiGLU** (ReLU/GELU MLP) | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ? |
| Attention KV cost | **Compressed-KV attention** — MLA *or* GQA (full MHA) | ✓ MLA | ✓ MLA | ✓ GQA | ✓ GQA | ✓ GQA | ✓ GQA | ~ GQA | ⏳ "KDA" |
| Positions | **RoPE** (absolute/learned embeddings) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ? |
| Normalization | **RMSNorm, pre-norm** (post-LayerNorm) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ? |
| Attention-logit control | **QK-Norm** (or QK-Clip for MLA) — none in vanilla | ✗ MLA | ✓ QK-Clip | ✓ | ~ | ? | ✓ | ~ | ? |
| Long-context reach | **RoPE scaling (YaRN)** — none in vanilla | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ? |
| Post-training | **RL + reasoning mode** (next-token-only) | ✓ | ~ | ✓ | ✗ | ✓ | ✓ | ~ | ? |
| *Emerging:* long-context attn | **Sparse / sliding-window attention** | ✓ DSA | ✗ | ~ | ~ | ✓ | ✗ | ✓ | ? |
| *Emerging:* training signal | **Multi-token prediction (MTP)** | ✓ | ✗ | ✗ | ? | ✗ | ✓ | ✓ | ? |
| *Emerging:* precision | **FP8 / low-precision training** | ✓ | ~ | ? | ? | ✓ | ? | ? | ? |

**Reading the table for the chapter:** the **top block** (MoE, SwiGLU, compressed-KV attention, RoPE,
RMSNorm, QK-Norm, YaRN, RL+reasoning) is essentially *universal* — the current standard recipe. The
**bottom three** (sparse attention, MTP, FP8) are *still spreading* — some models yes, some no — which is
where current frontier experimentation lives. Kimi K3's whole column is `⏳/?` because its weights aren't
public yet, with one claimed novelty ("Kimi Delta Attention") that, if real, would be a rare break from
the shared recipe.

> ⚠️ **Do NOT argue "independent convergence proves the recipe is right."** These are *open* models that
> publish their designs, so they copy each other. Agreement between them is expected and proves nothing.
> **The argument that actually works:** these fully-documented models score close to the closed frontier
> (GLM-5 reports 77.8 on SWE-bench Verified vs GPT-5's 74.9), so we have readable build instructions for
> something about as good as the secret models. Combined with partial disclosure elsewhere (Google states
> Gemini is sparse MoE; OpenAI's own gpt-oss uses the standard toolkit), the closed models are *likely*
> built along similar lines. Likely, not certain — a lab that had found something genuinely new would have
> every reason not to say so.

### Historical-anchor rows (for the Lindy timeline)

When each technique entered the mainstream recipe (approx.), to show longevity:

| Technique | First mainstream | Lindy read |
|---|---|---|
| RoPE | Llama 1/2 (2023) | Old & universal → here to stay |
| RMSNorm | Llama 1/2 (2023) | Old & universal → here to stay |
| SwiGLU | Llama 1/2 (2023) | Old & universal → here to stay |
| Mixture-of-Experts | Mixtral (2023), DeepSeek (2024) | Established → here to stay |
| RoPE scaling (YaRN) | 2023–24 | Established |
| RL + reasoning mode | DeepSeek-R1 (Jan 2025) | Newer, spreading fast |
| Compressed-KV (MLA) | DeepSeek-V2 (2024) | Established (MLA) / very old (GQA, 2023) |
| Sparse attention (frontier) | 2025 | New — still spreading |
| Multi-token prediction | DeepSeek-V3 (2024) | New — partial adoption |
| FP8 training | DeepSeek-V3 (2024) | New — partial adoption |

---

## Table 2 — The dials (stats)

These only make sense *after* the techniques: "number of experts" means something once you know MoE;
"MLA heads" once you know MLA compresses the KV cache.

| Model | Total params | Active/token | Layers | Experts (total / active / shared) | Attn heads | Vocab | Context |
|---|---|---|---|---|---|---|---|
| DeepSeek V3.2 | 671B | 37B | 61 (3 dense) | 256 / 8 / 1 | 128 (MLA) | 129,280 | 128k |
| Kimi K2 | ~1T | 32B | 61 (1 dense) | 384 / 8 / 1 | 64 (MLA) | 163,840 | 128k |
| Qwen3-235B | 235B | 22B | 94 | 128 / 8 / 0 | 64 Q / 4 KV (GQA) | 151,669 | 128k–1M |
| Llama 4 Maverick | 400B | 17B | ? | 128 / 1 / 1 | GQA (+NoPE layers) | ~200k | 1M |
| gpt-oss-120b | 116.8B | 5.1B | 36 | 128 / 4 / 0 | 64 Q / 8 KV (GQA) | ~200k | 131k |
| GLM-4.6 | ~355B | ~32B | 92 (3 dense) | 160 / 8 / 1 | 96 Q / 8 KV (GQA) | ~151k | 200k |
| GLM-5 (Feb 2026) | 744B | 40B | 80 | 256 / 8 / ? | GQA | ? | ~203k |
| GLM-5.2 | ~753B *(aggregator ⚠️)* | ~40B *(~)* | ? | ? *(~)* | GQA *(~)* | ? | **1M** |
| Kimi K3 | ⏳ ~2.8T | ⏳ ~50B | ? | ⏳ ~896 / 16 / ? | ? | ? | ⏳ 1M |

For contrast (historical anchors — all dense, so the experts column is "none"):

| Model | Total params | Active/token | Layers | Experts | Attn heads | Vocab | Context |
|---|---|---|---|---|---|---|---|
| Transformer (2017, "base") | 65M | all | 6 enc / 6 dec | none | 8 (MHA) | ~37k | 512 |
| GPT-2 (largest) | 1.5B | all | 48 | none | 25 (MHA) | 50,257 | 1,024 |
| GPT-3 | 175B | all | 96 | none | 96 (MHA) | ~50k | 2,048 |
| GPT-4 (rumored/leak) | ~1.8T | ~280B | ? | ~16 | ? | ? | 8k–32k |

---

## Table 3 — Growth over time (the "how much have they ballooned" story)

The view the chapter uses to make scale visceral: parameters, context, and training tokens climbing across
the years — plus the twist that **MoE broke the link between total size and per-word cost** (total params
kept exploding while *active* params per word stayed comparatively flat).

| Model | Year | Total params | Active/token | Context | Training tokens |
|---|---|---|---|---|---|
| GPT-2 | 2019 | 1.5B | 1.5B (dense) | 1,024 | ~10B (WebText, ~40GB) |
| GPT-3 | 2020 | 175B | 175B (dense) | 2,048 | ~300B |
| GPT-4 | 2023 | ~1.8T *(leak)* | ~280B *(leak)* | 8k–32k | ~13T *(leak)* |
| DeepSeek-V3 | 2024 | 671B | 37B | 128k | 14.8T |
| Llama 4 Maverick | 2025 | 400B | 17B | 1M | ~22T |
| Qwen3-235B | 2025 | 235B | 22B | 128k–1M | ~36T |
| Kimi K2 | 2025 | ~1T | 32B | 128k | 15.5T |
| GLM-4.6 | 2025 | ~355B | ~32B | 200k | (23T for GLM-4.5) |
| GLM-5 | Feb 2026 | 744B | 40B | ~203k | 28.5T (base) |
| GLM-5.2 | 2026 | ~753B *(aggregator-only ⚠️)* | ~40B *(~)* | 1M | ? |
| Kimi K3 | announced 2026 | ⏳ ~2.8T | ⏳ ~50B | 1M | ? |

**Teaching points from this table:**
- **Params:** 1.5B → 175B → ~1.8T over 2019–2023 (a ~1000× jump in four years), then totals keep climbing toward ~1–3T with MoE.
- **The MoE twist:** *active* params per word (the real per-word cost) sit at 17–50B even for trillion-parameter models — often *smaller* than dense GPT-3's 175B. Bigger brain, cheaper thought.
- **Context:** 1,024 → 2,048 → 8k → 128k → 1M tokens (a paragraph, then a book, then a shelf of books).
- **Training data:** ~10B → ~300B → ~15–36T tokens (roughly the entire high-quality public internet, many times over).

---

## Table 4 — Benchmark scores over time (sourced 2026-07-20)

No single benchmark spans GPT-2 → 2026 — they **saturate and get replaced**. That relay is itself the
story, so the chart uses **three bands**: LAMBADA (early), MMLU (middle, shows the ceiling), and
GPQA Diamond + SWE-bench Verified (modern discriminators). Confidence: `✅` developer's own report ·
`📄` official-but-third-party benchmark (score in the benchmark authors' paper, not the model's report) ·
`⚠️` leak/rumor · `❌` not evaluated / not reported in a primary source.

**Band 1 — LAMBADA (GPT-2 / GPT-3 only; trivially saturated now, so not reported for modern models):**

| Model | LAMBADA (zero-shot) | LAMBADA (few-shot) | Conf. |
|---|---|---|---|
| GPT-2 (1.5B) | 63.2% | — | ✅ |
| GPT-3 (175B) | 76.2% | 86.4% | ✅ |

**Band 2 — MMLU / MMLU-Pro (the 2020–2024 arc + saturation). Note: MMLU and MMLU-Pro are NOT interchangeable.**

| Model (year) | MMLU | MMLU-Pro | Conf. |
|---|---|---|---|
| GPT-3 (2020) | 43.9% (5-shot) | — | 📄 (MMLU paper, not GPT-3's report) |
| GPT-4 (2023) | 86.4% (5-shot) | — | ✅ |
| DeepSeek-V3 (2024) | 88.5% | 75.9% | ✅ |
| Llama 4 Maverick (2025) | — | 80.5% | ✅ |
| Kimi K2 (2025) | 89.5% | 81.1% | ✅ |
| gpt-oss-120b (2025) | 90.0% (high reasoning) | — | ✅ |
| GLM-4.6 (2025) | — | 83.2% | ✅ |
| GLM-5 (Feb 2026) | 88.3% (base, EM) | — | ✅ |

Saturation is visible: GPT-4 86.4 → DeepSeek-V3 88.5 → gpt-oss 90.0. After ~2024 developers largely
stopped reporting plain MMLU and moved to MMLU-Pro; by 2026 top models drop even that from headline tables.

**Band 3 — GPQA Diamond & SWE-bench Verified (2024–2026 discriminators). Many high scores are reasoning/tool-assisted — see caveats.**

| Model (year) | GPQA Diamond | SWE-bench Verified | Conf. |
|---|---|---|---|
| GPT-4 (2023, no-CoT) | ~38% | — | 📄 (GPQA paper; prompt-sensitive) |
| DeepSeek-V3 (2024) | 59.1% | 42.0% | ✅ |
| Llama 4 Maverick (2025) | 69.8% | — (Meta reports LiveCodeBench, not SWE-bench) | ✅ / ❌ |
| Qwen3-235B (2025, thinking) | 71.1% (62.9% non-thinking) | — (reports LiveCodeBench) | ✅ / ❌ |
| Kimi K2 (2025) | 75.1% | 65.8% (single) / 71.6% (parallel) | ✅ |
| gpt-oss-120b (2025, high) | 80.1% | 62.4% | ✅ |
| GLM-4.6 (2025) | 81.0% | 68.0% | ✅ |
| GLM-5 (Feb 2026) | 86.0% | 77.8% (OpenHands) | ✅ |
| GLM-5.2 (2026) | 91.2% | — (reports SWE-bench **Pro** 62.1, not Verified) | ✅ / ❌ |
| **GPT-5 (2025, closed "current best")** | 88.4% | 74.9% | ✅ |

**The point:** scores climbed as params/tokens/context grew and new techniques (MoE, RL+reasoning) landed.
The Qwen3 thinking-vs-non-thinking row (71.1 vs 62.9) shows in-table how much comes from *thinking*, not size.
And note **GPT-5's SWE-bench Verified (74.9) sits below GLM-5's self-reported 77.8** — a clean, citable
data point that the best *open* models are now competitive with the best *closed* ones (reinforces §7).

**Benchmark caveats (state openly in the chapter):**
1. **No single benchmark spans the whole era** — LAMBADA → MMLU → GPQA/SWE-bench is a *relay*. Don't draw one continuous line; show the swap.
2. **Reasoning ≠ architecture.** GPT-4's 2023 numbers are no-CoT; 2025–2026 highs come from long "thinking" and sometimes tools. Don't attribute the whole jump to bigger models. Label thinking-mode scores.
3. **Eval settings move scores by many points** (few-shot count, EM vs avg@k, agent scaffold, single vs parallel attempts). Use "≈", not decimal-precise rankings.
4. **Contamination is real** (test data leaks into training). Treat near-saturated scores skeptically.
5. **Version confusion in aggregators** — Kimi K2 ≠ K2-Thinking; GLM-4.6 → 4.7 → 5 → 5.2 don't blend; the Llama 4 "LMArena Elo 1417" was an unreleased experimental chat version, not shipped weights. Don't cite it.

**Could NOT verify (do not state as fact):** GPT-2 exact training-token count (~8B is an estimate);
GPT-4 params/tokens/layers (leak only); GPT-4 GPQA (~38–39%, prompt-sensitive); **GLM-5.2's parameter
count** (aggregator-only ~753B — see reconciliation note below); any 2026 "leaderboard-topping" names that
surfaced only on aggregators.

---

## Table 4b — Current frontier comparison (verified 2026-07-22, supersedes parts of Table 4)

**Why this replaces the old comparison.** SWE-bench Verified and MMLU are both effectively dead for
frontier comparison: no current-generation model card from Anthropic, OpenAI, Z.ai or DeepSeek reports
SWE-bench Verified, and GPQA has saturated at 90–94. The chapter's old figures (GPT-5 74.9, GLM-5 77.8)
were two generations stale. Both old benchmarks are kept in the data marked `retired: true`.

**Source:** the **GLM-5.2 model card** grid (https://huggingface.co/zai-org/GLM-5.2), which is the only
place one party ran open *and* closed models through the same harness and published the whole table.
All figures self-reported by Z.ai.

| Benchmark | GLM-5.2 (open) | DeepSeek-V4-Pro (open) | MiniMax-M3 (open) | Claude Opus 4.8 | GPT-5.5 | Gemini 3.1 Pro |
|---|---|---|---|---|---|---|
| SWE-bench Pro | **62.1** | 55.4 | 59.0 | 69.2 | 58.6 | 54.2 |
| Terminal-Bench 2.1 | **81.0** | 64 | 65 | 85 | 84 | 74 |
| GPQA Diamond | 91.2 | 90.1 | **93.0** | 93.6 | 93.6 | 94.3 |

**The bracket this produces** (the chapter's framing): on SWE-bench Pro the best open model beats GPT-5.5
and Gemini 3.1 Pro and trails only Claude; on Terminal-Bench it beats Gemini and trails Claude and GPT-5.5;
on GPQA the open models sit 90.1–93.0 against closed 93.6–94.3, and above the older GPT-5 (88.4).

**Architecture, counted from the published weights** (verified via `HfApi().model_info(...).safetensors.total`):

| Model | Parameters | Layers | Heads | Experts | Context |
|---|---|---|---|---|---|
| DeepSeek-V4-Pro | 861,608,274,846 | 61 | 128 | 384 / 6 active / 1 shared | 1,048,576 |
| MiniMax-M3 | 427,040,140,160 | 60 | 64 | 128 / 4 active / 1 shared | 1,048,576 |
| GLM-5.2 | 753,329,940,480 | 78 | 64 | 256 / 8 active / 1 shared | 1,048,576 |

⚠️ A research pass reported DeepSeek-V4-Pro as "1.6T / 49B active". **The weights say 861.6B.** Prefer the
weights, per the rule in §6-GLM above.

### Required caveats for anything using these numbers
1. **Self-reported by a competitor.** Z.ai measured its own rivals and chose their configuration.
2. **Harness sensitivity exceeds the gaps.** Z.ai's own card shows Claude Opus 4.8 at **85** on
   Terminal-Bench 2.1 under Terminus-2 but **78.9** under "best reported harness" — same model, same
   benchmark, 6-point swing. Never compare across harnesses.
3. **One generation behind.** Newer models exist on both sides (GPT-5.6, Gemini 3.6 Flash, Claude Fable 5).
   They are excluded because no like-for-like grid covers them. Say so rather than mixing harnesses.
4. **Parallel/"ultra" modes are multi-agent system scores**, not single-model scores. Not comparable.

### Do NOT state as fact
- **"Kimi K3 is open-weight."** Verified false on 2026-07-22: no K3 repo exists under `moonshotai`
  (newest is Kimi-K2.7-Code). Weights promised 2026-07-27. **If publishing after that date, re-check** — an
  independently-measured open model at 80.90 on Terminal-Bench 2.1 would be a far stronger version of the
  chapter's argument, needing no self-reporting caveat.
- Any first-party **Claude Fable 5** capability score — Anthropic's system cards are safety-only and the
  launch page renders metrics as an image. All Fable 5 figures in circulation are third-party.
- GPT-5.6 Sol at 88.8/91.9 on Terminal-Bench (SEO sites only; the independent Vals AI figure is 85.77).
- **Qwen3.7-Max** as open-weight — reported closed/API-only.
- "DeepSeek R2" / "DeepSeek V5" — still fabricated.

**Correction to an earlier note:** "GPT-5.6 Sol" and "Claude Mythos" were previously flagged here as likely
fabrications. **They are real**, and appear on openai.com and anthropic.com respectively. The fabrication
flag applies to the specific *scores* circulating for them, not the model names.

---

## Table 4c — Benchmark widget: final data (verified 2026-07-22)

The `BenchmarksPlayground` compares nine flagship models (one per lab) on **three benchmarks, each from an
independent evaluator that ran every model itself** — so no self-reported / cross-harness stitching.
SWE-bench Pro was dropped: it is self-reported on inconsistent harnesses and has no number for OpenAI (any
GPT) or Kimi K3, the two most important models. The three chosen tell a genuinely three-sided story.

**Scores (open models in bold):**

| Model | Terminal-Bench 2.1 (Vals) | LMArena Elo (arena.ai) | HLE, no-tools (Artificial Analysis) |
|---|---|---|---|
| GPT-5.6 (Sol/max) | 85.77 | 1485 | 47.2 |
| **Kimi K3** | **80.90** | **1486** | **44.3** |
| Claude Fable 5 | 80.52 | 1507 | 53.3 |
| Gemini 3.1 Pro | 70.79 | 1486 | 44.7 |
| **GLM-5.2** | **67.79** | **1469** | **40.1** |
| Grok 4.5 | 67.79 | 1468 | 40.3 |
| **Qwen3.7 Max** | **61.05** | **1475** | **38.1** |
| **MiniMax-M3** | **53.56** | **1444** | **37.1** |
| **DeepSeek-V4-Pro** | **50.19** | **1457** | **35.9** |

Sources: Vals AI Terminal-Bench 2.1 (https://www.vals.ai/benchmarks/terminal-bench-2-1);
arena.ai / LMArena text leaderboard (https://arena.ai/leaderboard/text);
Artificial Analysis HLE, extracted from the page's embedded data
(https://artificialanalysis.ai/evaluations/humanitys-last-exam). All three are independent, not self-reported.

**The story across tabs:** open **Kimi K3** is #2 on agentic tasks (Terminal-Bench) and #2 on human
preference (LMArena, statistically tied with the top closed cluster), but the open models **trail** on the
hardest reasoning exam (HLE, best open is #4). Honest and nuanced: "in the same ballpark" = close, not ahead
on everything.

**Confidence / verify-before-publish:**
- **LMArena** — top 4 (Fable 5 1507, Kimi K3 1486, Gemini 1486, GPT-5.6 1485) are high-confidence and
  statistically **tied** (±intervals overlap). The lower four (GLM-5.2 1469, Grok 1468, DeepSeek 1457,
  MiniMax 1444) rest on a **single read** of an interactive table — re-check on arena.ai before publishing.
  Several scores are of `-max`/`-xhigh`/`-preview` variants (best-effort configs), consistent with the
  "best each lab can do" framing but worth noting.
- **HLE (AA)** — all nine on one methodology (pass@1, no tools, LLM-graded). Variant labels: GPT-5.6 Sol
  (max), Fable 5 "with fallback", GLM-5.2/DeepSeek/Grok at max/high effort. Kimi K3 44.3 is AA's own API
  measurement (Moonshot published none — ignore the contradictory aggregator figures 56/43.5/44).
- **Kimi K3** — weights not public until 2026-07-27; shown with an "opens soon" badge. Re-confirm at launch.
- **Terminal-Bench** — Vals numbers; top-6 confirmed against vals.ai directly, ranks 7+ via the benchlm
  mirror of Vals (5-day-old snapshot) — spot-check if a specific low-rank value becomes load-bearing.

---

## Table 5 — Efficiency: cheaper, not smarter (sourced 2026-07-20)

Feeds the "Improving efficiency" section and `EfficiencyPlayground`.
Confidence: `🟢` verified from primary source · `🟡` reputable secondary / partially verified · `🔴` **could not verify — do not print**.

### 5a. Headline — cost of a *fixed capability level* over time

| Claim | Figure | Conf. | Source |
|---|---|---|---|
| Inference price for a fixed benchmark score | falling, **median ~50×/yr** (range 9×–900× across 6 benchmarks) | 🟢 | Epoch AI |
| Price for **GPT-4-level GPQA-Diamond** performance | **~40×/yr** cheaper | 🟢 | Epoch AI |
| Price-per-capability, frontier models (careful study) | **5–10×/yr** | 🟢 | Thompson et al., arXiv:2511.23455 |
| Cost of **GPT-3.5-level** inference | fell **>280×** Nov 2022 → Oct 2024 | 🟢 | Stanford AI Index 2025 |
| Training compute needed for fixed performance | **halves ~every 8 months** (95% CI 5–14 mo) | 🟢 | Epoch AI (pre-training only) |
| Pre-training compute efficiency | **~3.0×/yr** (90% CI 2.8–4.4×) | 🟢 | Epoch AI Trends |

**Use "≈40×/yr for GPT-4-level science reasoning" or the 5–10×/yr figure — NOT the 900× tail** (the
9×–900× spread is meaningless without naming the benchmark).

### 5b. Attribution — where the savings actually come from (the key caveat)

Thompson et al.'s decomposition of the ~5–10×/yr price-per-capability drop 🟢:
- **~3×/yr is algorithmic** (model techniques — what this chapter is about)
- **~30%/yr (1.43×) is hardware** getting cheaper per unit performance
- **the remainder is market/competition pressure** — closed-weight prices fall faster than open-weight, attributed to markup compression, not efficiency
- **~half of measured GPQA-Diamond "progress" is just spending more on inference** (longer reasoning chains), not efficiency at all

Two more framings the chapter must keep:
- **Prices are not costs.** Labs sell below cost to win share; a price series doesn't prove compute got cheaper by the same factor.
- **The frontier is getting MORE expensive**, not less: running *the* frontier model is rising **3–18×/yr** (bigger models, more reasoning tokens). Scope the claim to *"a fixed capability level gets radically cheaper,"* never *"AI is getting cheaper."*

### 5c. Per-technique savings (the chart bars)

| Technique | Saving | Metric | Conf. | Source |
|---|---|---|---|---|
| Quantization 16→8 bit (FP8) | **2× smaller**, effectively lossless (~99.75% recovery) | memory | 🟢 | arXiv:2411.02355 |
| Quantization 16→4 bit (W4A16) | **4× smaller**, ~99% accuracy retained; 2–3× lower cost/query (5–7× at 405B) | memory / cost | 🟢 | arXiv:2411.02355 |
| MoE — DeepSeek-V3 | **18× less compute/token** (671B → 37B active) | FLOPs/token | 🟢 | arXiv:2412.19437 |
| MoE — gpt-oss-120b | **23× less** (117B → 5.1B active) | FLOPs/token | 🟢 | github.com/openai/gpt-oss |
| KV compression — MLA | **93.3% smaller KV cache**, **5.76×** max generation throughput | memory / throughput | 🟢 (vendor) | arXiv:2405.04434 (DeepSeek-V2) |
| KV compression — GQA | cache shrinks by grouping factor (Llama-2-70B: 64Q/8KV = **8×**) | memory | 🟡 mechanism verified; speedup table NOT retrieved | arXiv:2305.13245 |
| Sparse attention — IndexShare @1M ctx | **2.9× fewer FLOPs/token** | FLOPs/token | 🟢 (vendor) | github.com/zai-org/GLM-5 |
| Sparse attention — DeepSeek DSA | quality parity (MMLU-Pro 85.0 vs 85.0) + **50%+ API price cut** | quality / price | 🟢 (vendor) | DeepSeek-V3.2-Exp |
| Speculative decoding | **2–3× faster, identical outputs** | latency | 🟢 | arXiv:2211.17192 |
| Multi-token prediction — DeepSeek-V3 | 85–90% acceptance on 2nd token → **~1.8× TPS** | latency | 🟡 confirm in V3 report §5.4.3 | arXiv:2412.19437 |
| FlashAttention | **3× end-to-end** (GPT-2, 1K ctx); memory **linear** not quadratic | speed / memory | 🟢 | arXiv:2205.14135 |
| Pruning + distillation (Minitron) | **40× fewer training tokens**; **+16% MMLU** vs training from scratch; 1.8–2.7× throughput | training cost / throughput | 🟢 (vendor: NVIDIA) | NVIDIA blog, arXiv:2408.11796 |
| *(serving)* PagedAttention / vLLM | **2–4× throughput**; KV waste 60–80% → <4% | throughput | 🟢 | SOSP 2023 |
| *(hardware)* GPU price-performance | **30%/yr cheaper**; energy efficiency +40%/yr | $/perf | 🟢 | Epoch AI; AI Index 2025 |

**⚠️ CHART HONESTY REQUIREMENT:** these bars measure **different things** (memory vs FLOPs vs wall-clock vs
dollars) and **do not multiply**. A model using all of them does not get 4×18×2.9×3×… — MoE's FLOP saving
doesn't cut memory, quantization's memory saving doesn't cut FLOPs proportionally, and speculative decoding
trades extra FLOPs for lower latency. If the chart's layout implies multiplication, add a caption saying it
doesn't. Keep the *(serving)* and *(hardware)* bars in a visually distinct category — they are not model techniques.

### 5d. Distillation — the cleanest "small can inherit big" evidence 🟢

DeepSeek-R1's own control experiment, both starting from Qwen-32B-Base (arXiv:2501.12948, Table 6):

| Approach | AIME 2024 | MATH-500 |
|---|---|---|
| Large-scale RL directly on the 32B base | 47.0 | 91.6 |
| **Distilled from R1** | **72.6** | **94.3** |

Paper's conclusion, verbatim: *"distilling more powerful models into smaller ones yields excellent results,
whereas smaller models relying on the large-scale RL … require enormous computational power."*

And the "small model beats an older frontier model" comparison (same card):

| | AIME 2024 | MATH-500 | GPQA-D |
|---|---|---|---|
| GPT-4o-0513 (frontier, May 2024) | 9.3 | 74.6 | 49.9 |
| R1-Distill-Qwen-32B (runs on one GPU) | **72.6** | **94.3** | 62.1 |
| DeepSeek-R1 (671B teacher) | 79.8 | 97.3 | 71.5 |

**⚠️ Required caveat:** R1-Distill is a *reasoning* model spending many more output tokens; GPT-4o is not.
This is capability-per-parameter, not an apples-to-apples compute comparison. Also, distillation recovers
*a lot*, not everything (62.1 vs the teacher's 71.5), and it needs an expensive teacher to exist first — it
compresses the cost of *spreading* a capability, not of *creating* it.

Qwen3 strong-to-weak distillation: **~1/10 the GPU hours** — but precisely, vs *Qwen3's own four-stage
post-training pipeline*, not vs "RL" generically. 🟡

### 5e. Quality tradeoffs (where efficiency actually bites)
- INT8 costs 1–3% accuracy; 4-bit weight-only ~1%; FP8 near-lossless — **but the study is Llama-3.1 only**, and 4-bit *activation* quantization (W4A4) is a much lossier regime.
- Damage is **uneven across tasks** — long-generation, multi-step reasoning and code degrade more than short QA.
- **MoE cuts compute, not memory** — all 671B/117B params must still be resident. That's why MoE and quantization are so often paired (gpt-oss's single-80GB-GPU story is MoE + MXFP4 together).

### 5f. Could NOT verify — do not state as fact 🔴
1. GPT-4's March 2023 launch price ($30/$60 per 1M) — only SEO blogs. Verify via OpenAI pricing/Wayback.
2. The "$20.00/M → $0.07/M" dollar figures behind the AI Index 280× stat.
3. Any "300×", "1000× in three years", "GPT-4 quality under $0.10/M" claim — all AI-generated SEO content.
4. gpt-oss's "4.25 bits per parameter" and "MoE weights are 90+% of params" (in the model-card PDF).
5. DeepSeek V3.1-Terminus's old prices; DSA's exact complexity / top-k.
6. GQA's own quantitative speedup table; FlashAttention-2/-3 figures.
7. A clean isolated number for continuous batching's throughput gain.
8. **Whether AI Index 2026 has an updated inference-cost figure — check before publishing.** The 2026 report's framing (investment up 130%, compute as the binding constraint) may cut against a naive "it just keeps getting cheaper" narrative.

**⚠️ GLM version conflation:** this research pass cites "GLM-5.2 = 744B/40B" from the `zai-org/GLM-5` repo —
but the benchmark pass found GLM-5.2's parameter count is *not* in a primary source. The 744B/40B figure
almost certainly belongs to **GLM-5**, not GLM-5.2. Keep the existing rule: use GLM-5's confirmed numbers;
treat GLM-5.2's params as unverified.

*(Incidental: DeepSeek's official pricing page now lists `deepseek-v4-flash` and `deepseek-v4-pro`, which is
primary-source evidence that a DeepSeek V4 exists as of 2026-07-20. Not needed for the chapter; don't state
V4 architecture details, which remain unverified.)*

---

## Table 6 — Training data (sourced 2026-07-22)

Feeds the "better training data" axis and the `training-data` depth chapter.
Confidence: `[VP]` verified-primary (paper/court doc/official report) · `[RS]` reputable-secondary · `[UV]` **do not state as fact**.
**Spine:** four ways to get good data — **scrape it, buy it, pay humans to make it, have a model make it.**

### 6a. Secrecy — the sharpest point
- **GPT-4 Technical Report, verbatim** `[VP]` — *"this report contains no further details about the architecture (including model size), hardware, training compute, dataset construction, training method, or similar."* https://arxiv.org/abs/2303.08774. **The smoking gun, from the lab itself.**
- **Llama 3** publishes token count (15.6T), the mix, and filtering *methodology* in detail — but **never names its sources**. You learn ~17% is code; not whose code. `[VP]`
- **DeepSeek-V3:** "14.8T high-quality and diverse tokens" — a number, essentially no sourcing. `[VP]`
- **Stanford Foundation Model Transparency Index 2025:** average score **fell 58/100 (2024) → 40/100 (2025)**; companies score **worst** on Data Acquisition and Data Properties. DeepSeek 32, Alibaba 26 **despite open weights**. `[VP]` https://crfm.stanford.edu/fmti/paper.pdf
- **Exceptions:** Ai2 **OLMo/Dolma** (full corpus + filtering code + checkpoints) and EleutherAI **Pythia**/The Pile. `[VP]`

**Chapter line:** "You can download Llama's weights and read exactly how it's built. What you can't download is the list of what it read. Meta will tell you it saw 15 trillion words and about 17% were computer code. It won't tell you whose."

### 6b. Buying data you wouldn't think of

| Source | Detail | Conf. |
|---|---|---|
| **Enron emails** ⭐ | ~**500,000** messages from ~150 senior employees, collected by the **US FERC** investigation after Enron's 2001 collapse and released as public investigative record; cleaned and published by William Cohen (CMU, 2004). **In The Pile** at 0.88 GiB / **0.14%**, included "to aid in understanding the modality of email communications." | `[VP]` Pile Table 1; `[RS]` origin |
| **YouTube subtitles** | The Pile's subtitle set: transcripts from **173,536 videos** across ~48,000 channels. Anthropic and Salesforce confirmed to Proof News they used The Pile. | `[RS]` strong investigative |
| **US court opinions** | The Pile's "FreeLaw" — millions of public court opinions. | `[VP]` |
| **Reddit, licensed** | Google deal reported at **~$60M/year** (Feb 2024); Reddit's IPO filing disclosed **$203M aggregate** across licensees. | `[RS]` |
| **Stack Overflow → OpenAI** | May 2024 partnership; terms undisclosed. | `[RS]` |
| **Shredded print books** ⭐ | Court records in *Bartz v. Anthropic*: Anthropic bought **millions of used print books in bulk**, cut off the bindings, scanned the pages, discarded the paper. Judge Alsup found this specific practice **was** fair use, because the copies were purchased and kept internal. | `[VP]` court record |

**Best hooks for this audience:** the Enron emails and the shredded print books. Both vivid, both in primary records.
**Enron chapter wording (safe):** "When Enron went bankrupt in 2001, government investigators collected half a million of its employees' emails and released them as part of the public record. That made it the only large collection of real workplace email available free online, and it has been sitting inside AI training sets ever since."

⚠️ **Do NOT write "the only workplace email anyone can legally obtain."** Enron is only unique in being
*freely available*. Private licensing of otherwise-private corporate data is reported to be widespread, but
those deals are by nature invisible, so we can neither list them nor rule them out. Correct framing: Enron
is the free one; paid deals exist and are mostly undisclosed; the deals we can name are the announced ones.

### 6c. Paying humans to write data (sourced 2026-07-22)

**The mechanical reason this exists — the best explanation for this audience:** once a model has already
learned everything on the open internet, the only training data still worth adding is data that **isn't on
the internet** — a doctor's actual diagnostic reasoning, a lawyer's actual analysis, a worked solution to a
problem too new or too hard for anyone to have written down. You can't scrape that. You have to commission it.

**⭐ The beat to open with:** OpenAI's InstructGPT — the work behind ChatGPT's behaviour — used a team of
roughly **40 contractors**, hired through Upwork and Scale AI, who wrote demonstration answers and ranked
outputs. `[VP]` https://arxiv.org/abs/2203.02155 → **"ChatGPT's manners came from about forty people."**
Today that same function is an industry with billions of dollars flowing through it.

| Company | What it makes | Key figures | Conf. |
|---|---|---|---|
| **Scale AI** (2016) | Labelling/annotation at scale; Outlier contractor platform | reported ~**$870M revenue** (2024); valued **$29B** in the Meta deal | `[RS]`/`[TR]` |
| **Surge AI** (2020) | RLHF, preference data, expert-written data, RL environments | reported **>$1B revenue** (2024), profitable, **bootstrapped** | `[RS]` Forbes |
| **Mercor** (2023) | Recruits/vets credentialed experts and matches them to labs | **$350M Series C at $10B** (Oct 2025); **30,000+ experts**; pays **>$1.5M/day**; avg **~$95/hr** | `[RS]` raise; `[TR]` stats |
| **Handshake** → Handshake AI (Jan 2025) | College job board **pivoted** into expert-data provider | ~**500k verified PhDs** claimed; annualised revenue crossed **$1B in April 2026** | `[TR]` |
| **Turing** (2018) | Coding/reasoning/STEM data and evaluation | **$300M revenue** (tripled YoY); **$111M Series E at $2.2B** | `[RS]` Reuters |
| **Invisible Technologies** | Human feedback, evaluation, post-training data | **$100M raise at ~$2B** (Sept 2025) | `[RS]` |
| **Appen** (1996, ASX-listed) | The old guard: crowd labelling, search-quality rating | Google terminated its contract Jan 2024 (**US$82.8M**, >30% of turnover); shares fell ~40% in a day | `[VP]` ASX via `[RS]` |

**⭐ The Meta ↔ Scale story — the best narrative beat in this section.** June 2025: **Meta paid ~$14.3B for a
roughly 49% non-voting stake** in Scale AI (valuing it ~$29B), and Scale's founder joined Meta to lead a new
superintelligence lab. Within days **OpenAI said it was winding down its work with Scale** and **Google was
reported to be cutting ties**. `[RS]` multiple outlets.

> Chapter-ready: "In 2025 Meta paid $14.3 billion for a stake in a company that doesn't make AI models at
> all. It makes *training data*, by hiring people. Within a week, OpenAI and Google started backing away
> from that company. Not because the data got worse, but because whoever writes your training data knows
> what you're trying to teach your AI."

**Rates — use only these two:** Handshake's CEO on the record says STEM experts earn **"over $125 an hour"**
`[RS]` Fortune; Mercor reports **~$95/hr average** and **>$1.5M/day** paid out `[TR]`.
⚠️ Physician/lawyer bands ($130–300/hr) appear **only on SEO blogs** — `[UV]`, **do not state**.

**⭐ The other half of the story — include it; the honest version is not only well-paid PhDs.** TIME (Jan
2023) reported OpenAI used workers in Kenya, employed via the outsourcing firm **Sama**, on take-home wages
of roughly **$1.32–$2/hour**, to read and label extremely disturbing text (including child sexual abuse,
torture, suicide) so ChatGPT could learn to refuse it. Sama ended the work early; some workers reported
lasting psychological harm and later brought complaints and legal claims. `[RS]` https://time.com/6247678/openai-chatgpt-kenya-workers/

> Approved wording: "TIME reported in 2023 that OpenAI used workers in Kenya, hired through an outsourcing
> company, paid under $2 an hour to read through the worst material on the internet so the AI could learn to
> refuse it. Some of those workers said the job left them traumatised."

**Keep these two jobs distinct in the chapter:**
1. **Writing data** — a human *authors* content (worked solution, explanation, hard question, reasoning trace); the model is trained to imitate it.
2. **RLHF preference labelling** — a human is *shown two model answers and picks the better one*; no writing. Those preferences train a reward model.

### 6c-bis. Licensing deals — documented figures

| Deal | Terms | Conf. |
|---|---|---|
| Reddit, **all** licensees | **$203M aggregate** (2–3 yr) — from Reddit's **S-1** | `[VP]` SEC filing |
| Google ↔ Reddit | reported **~$60M/year** | `[RS]` figure |
| OpenAI ↔ Reddit | confirmed partnership; ~$70M/yr reported | `[VP]` deal / `[RS]` figure |
| OpenAI ↔ **News Corp** | reported **>$250M over 5 years** | `[VP]` deal / `[RS]` figure |
| OpenAI ↔ Axel Springer, AP, Stack Overflow | terms undisclosed | `[VP]` deals |
| OpenAI ↔ **Financial Times** | reported **$5–10M/year** | `[VP]` deal / `[RS]` figure |
| **Shutterstock** | AI licensing revenue **$104M (2023) → $138M (2024)** | `[RS]` |
| **Taylor & Francis** ↔ Microsoft | **$10M** initial; authors **not consulted, no opt-out** — major academic controversy | `[VP]` disclosure |
| **Wiley** | **$23M + $21M** (~$44M); buyers unnamed; no author opt-out | `[VP]` earnings |

### 6c-ter. Do NOT state as fact `[UV]`
1. **"Meta bought Scale AI"** — it bought a **~49% non-voting stake**; Scale remains separate.
2. **"Meta's $14.3B was for training data"** — it bundled data *and* hiring Alexandr Wang. Don't state a single motive.
3. **"OpenAI dropped Scale because of Meta"** — OpenAI publicly said the Meta deal was *not* the reason and that it had already been diversifying. Report the timing **and** OpenAI's stated reason.
4. Physician/lawyer hourly bands (SEO-blog only).
5. Surge's "$1.2B" and Scale's "$870M" revenue — **reported**, not filed. Say "reported to have passed $1 billion."
6. Mercor's customers — say "reportedly"; no lab publishes a vendor list.
7. **"OpenAI paid Kenyan workers $2/hour"** — OpenAI contracted **Sama**, which employed and paid them. Phrase as "hired through an outsourcing company," attributed to TIME.
8. **"AI companies exploit workers"** — a characterisation. Report the documented wages, the documented content, and the complaints; let the reader judge.
9. **"Publishers sold authors' work without permission"** — publishers generally *held* the rights; the objection was that authors weren't **consulted** and couldn't opt out. Say "without telling their authors," not "without the right to."
10. **Getty** licenses a curated set to specific partners *and* separately litigated against Stability AI — two different things; don't imply hypocrisy.
11. Any named lab ↔ named vendor relationship not announced by one of them (most of this industry is under NDA).
12. **Do not claim experts hand-write *pretraining* corpora** — public reporting is consistently about post-training, evaluation, and RL environments.

### 6d. Books3 and dubious rights — **legally careful**
Verified facts:
- Books3 = **~196,640 plaintext books**; **12.07% of The Pile** (100.96 GiB). `[VP]`
- Assembled 2020 by independent researcher Shawn Presser; **source was a copy of the contents of Bibliotik, a private shadow-library tracker** — stated plainly in The Pile paper. `[VP]`
- **Meta's LLaMA 1 names it in Meta's own paper** (books = 4.5% of the mix): *"the Books3 section of ThePile."* `[VP]` https://arxiv.org/abs/2302.13971 — strongest possible citation.
- **Aug 2023:** Danish group **Rights Alliance** issued a DMCA notice; the main download went offline. `[RS]`
- **Kadrey v. Meta:** June 2025 — Judge Chhabria granted Meta summary judgment on fair use **because these plaintiffs failed to show market harm**, not because AI training is generally lawful; he suggested in dicta that many such cases likely would *not* be fair use. **July 2026:** interlocutory appeal denied; the downloading question remains live. **Not over.** `[RS]`
- **Bartz v. Anthropic:** Alsup, June 2025 — training on books **is** fair use *if copies were lawfully acquired*; downloading pirated libraries to build a permanent library **is not**. **Settled $1.5B**; **final approval 20 July 2026**; ~**482,000 works**, ~**$3,000/work**; **no admission of wrongdoing, no binding precedent.** `[RS]`

**Approved chapter wording** (every sentence a documented fact or holding):
> "One of the biggest pieces of The Pile was called Books3 — about 196,000 books in plain text. They didn't come from a library or a publisher. They came from a copy of a pirate book-sharing site. The people who built The Pile said so openly in their paper. Meta's first Llama model was trained on Books3; Meta wrote that down in its own research paper in 2023. In 2023 an anti-piracy group got the download taken offline, and authors started suing. The courts are still working it out, and the answers so far are messy. In 2025 one judge decided that *training* an AI on books can be fair use — but a different judge decided that *downloading* pirated copies to build a library isn't. Anthropic settled a case about pirated books for $1.5 billion, approved in July 2026, about $3,000 per book. Anthropic didn't admit training on books was wrong; the money was about how the books were obtained."

**Never write:** "Meta stole books" · "AI companies are pirates" · "the courts ruled AI training is illegal/legal" · "Anthropic paid $1.5bn because of Books3" (that case named LibGen/PiLiMi, not Books3).

### 6e. Most of the internet is junk — the filtering numbers
- **FineWeb** (96 Common Crawl snapshots): after extraction **~36T tokens** → MinHash dedup **~20T** → heuristic filters **15T**. So **~60% discarded after extraction alone**. `[VP]`
- The three most productive filters are absurdly simple, and together remove **~22% of tokens** while making the model *better*: drop docs where ≤12% of lines end in punctuation (−10.14%); where ≥10% of characters are in duplicated lines (−12.47%); where ≥67% of lines are under 30 characters (−3.73%). **Great concrete detail for kids.** `[VP]`
- **FineWeb-Edu:** 1.3T tokens (**~8.7% of FineWeb**) chosen by an "is this educational?" classifier — **matches full-dataset MMLU with ~10× fewer tokens.** ⭐ best single number for the thesis. `[VP]` *(Scope it: knowledge/reasoning benchmarks, small-scale ablations. Don't generalise to "10× less data for everything.")*
- **DataComp-LM:** 240T-token pool, keeps roughly the **top 10%** by a quality classifier (trained partly on r/ExplainLikeImFive answers). A **7B model on 2.6T filtered tokens reaches 64% MMLU vs Llama 3 8B's 66%, with 6.6× less compute.** `[VP]`
- **Llama 3:** dedup at URL/document/line level, model-based quality classifiers (including using Llama 2 to label data for the classifier), plus **annealing** — a final low-learning-rate phase on a small slice of very high-quality data, also used as a cheap test of whether a candidate dataset is any good. `[VP]`

⚠️ **Do not say "99% of the internet is thrown away"** — unsourced. Use the FineWeb chain or DCLM's top-10%.

### 6f. Mixing and weighting
- **Llama 3's published mix: ~50% general knowledge, ~25% math and reasoning, ~17% code, ~8% multilingual** — determined by **scaling-law experiments on the mix itself**. `[VP]`
- **Upsampling:** The Pile deliberately repeats high-quality subsets (Wikipedia, PubMed Central ~3× per epoch) vs raw web ~1×. `[VP]`
- **Great framing:** *code is ~17% of Llama 3's data even though code is a tiny fraction of the internet's text — someone chose that on purpose, because code makes models better at reasoning generally.*

### 6g. Making data that doesn't exist
- **Phi / "Textbooks Are All You Need":** phi-1 is 1.3B params trained on ~6B tokens of filtered textbook-quality code **plus ~1B tokens of synthetic textbooks and exercises generated by GPT-3.5**; 4 days on 8 A100s; **50.6% pass@1 on HumanEval**. `[VP]` ⚠️ Say "punch far above their weight", **not** "small curated always wins" — Phi has been criticised for benchmarks outrunning real usefulness.
- **NVIDIA Nemotron-4 340B:** *"over 98% of the data used in our model alignment process is synthetically generated"* — only ~20K human-annotated examples; released explicitly **as a synthetic-data generator for others**. `[VP]`
- **Qwen3:** openly used **Qwen2.5-VL to OCR text out of PDFs** and **Qwen2.5-Math / Qwen2.5-Coder to synthesise math and code data** — a lab saying plainly "we used our previous models to manufacture our next model's data." `[VP]`
- **DeepSeek-R1:** generated **~800K training examples** (~600K reasoning chains via rejection sampling), then fine-tuned Qwen and Llama bases on them. ⭐ **Exactly "a thinking model writes the reasoning that doesn't exist on the internet."** `[VP]`

### 6h. Model collapse — state carefully
- **Nature, July 2024** (Shumailov et al.): training each generation on the previous generation's output, **replacing** real data, makes distribution tails vanish and quality collapse. `[VP]`
- **But:** Gerstgrasser et al. show that if synthetic data **accumulates alongside** real data instead of replacing it, test error stays bounded and collapse does not occur. `[VP]`
- Labs don't do naive recursion: they generate candidates, **filter hard** (execution tests, verified answers, reward models), and mix with real data.

**Approved wording:** "There's a real risk — a famous 2024 Nature paper showed that if a model is trained only on the last model's output, over and over, quality collapses. But that's not what labs do. They keep the real data too, and they throw away most of what the model generates, keeping only the answers they can check are correct."
⚠️ **Do not say** "the internet is filling with AI slop and models are collapsing."

### 6i. Do NOT state as fact `[UV]`
1. "Anthropic paid $1.5B because of Books3" (that case named LibGen/PiLiMi).
2. "Courts ruled AI training on books is legal/illegal" — two narrow, partly-conflicting district rulings; Kadrey headed for appeal.
3. "Meta admits it stole books" — describe the paper's statement, not a confession.
4. "OpenAI/Google/Anthropic trained on Books3" — only Meta (LLaMA 1) and EleutherAI models are documented; others alleged.
5. "The Enron emails are public domain" — say "released as part of the public investigative record."
6. "600,000 Enron emails" — use "about half a million."
7. "99% of the internet is thrown away."
8. "Models are collapsing because the internet is full of AI text."
9. "Small curated models beat big ones."
10. "Reddit's Google deal was worth $60 million" — it's ~$60M **per year**, from reporting; Reddit's disclosed figure is $203M aggregate.
11. Characterising Shawn Presser's intent or legal status.
12. **"Most training data comes from the public web."** No lab discloses the web's share of a current
    model's mix. It was clearly dominant for early models, but licensed, commissioned, and synthetic data
    have all grown, and Llama 3's published mix is by *category* (50% general knowledge / 25% math and
    reasoning / 17% code / 8% multilingual), not by source. Treat the web as **one** documented source among
    four; do not assert it is still the largest. This is itself an instance of the secrecy point in §6a.

**Before publishing:** re-check the AI litigation tracker (https://www.mckoolsmith.com/newsroom-ailitigation-62) — these cases are actively moving.

---

## Table 7 — Alignment (sourced 2026-07-20)

Feeds the "Alignment" axis section and `AlignmentPlayground`.
Confidence: `[VP]` verified-primary (read the paper; quote verbatim/near-verbatim) · `[RS]` reputable-secondary · `[UV]` **do not state as fact**.

### 7a. The headline beat 🎯
**Verbatim from the InstructGPT abstract:** *"outputs from the 1.3B parameter InstructGPT model are preferred
to outputs from the 175B GPT-3, despite having 100x fewer parameters."* `[VP]` https://arxiv.org/abs/2203.02155

This is the chapter's best alignment hook: **alignment beat 100× more size.** Safe to state as fact.

### 7b. The pipeline (one-line definitions, middle-school register — reusable verbatim-ish)
- **Alignment** — the training after a model has learned to predict text, turning a text-continuer into an assistant that tries to be helpful, honest, and safe. *(Pre-training gives knowledge and language; alignment gives manners, judgment, and a job.)*
- **SFT** — show it thousands of examples of a question and a good answer, and have it copy the pattern.
- **RLHF** — people rank answers best-to-worst; those rankings train a scoring machine (**reward model**); the model is tuned to score highly.
- **Reward model** — a second AI trained to guess how much a human would like an answer, so the main model can be graded millions of times without a human reading anything.
- **Constitutional AI / RLAIF** (Anthropic) — the AI critiques its own answers against a written list of principles, so improving behaviour means editing a document rather than hiring more labellers. `[VP]` https://arxiv.org/abs/2212.08073
- **DPO** — a shortcut giving the same result from the same rankings without building the separate scoring machine. `[VP]` https://arxiv.org/abs/2305.18290. **Used by Llama 3 and Tülu 3** `[VP]`; *not* verified for OpenAI/Anthropic/Google — say "widely used, including by Meta and Ai2", **not** "the industry standard".
- **RLVR** — for questions with a checkable right answer (math, code), let a program grade it. *You can't flatter a calculator.* `[VP]` Tülu 3, https://arxiv.org/abs/2411.15124. DeepSeek-R1 used rule-based rewards + **GRPO** `[VP]`.

**One-line contrast:** RLHF's reward is a *guess* about what a person would like — learned, and therefore
gameable. RLVR's reward is a *fact* checked by a program — ungameable, but only where a right answer exists.

### 7c. What alignment buys — citable evidence

| Claim | Number | Conf. | Source |
|---|---|---|---|
| Aligned small beats unaligned huge | 1.3B InstructGPT preferred over 175B GPT-3 | `[VP]` | arXiv:2203.02155 |
| Truthfulness | InstructGPT truthful/informative on TruthfulQA **~2× as often** as GPT-3 | `[VP]` | same |
| Toxicity | **~25% fewer** toxic outputs than GPT-3 **when prompted to be respectful** (keep the condition!) | `[VP]` | same |
| Stage-by-stage, same model size (Tülu 3 8B, IFEval) | SFT **72.8** → DPO **81.1** → +RLVR **82.4** | `[VP]` | Tülu 3 8B model card |
| Same, math | GSM8K 76.2 → 84.3 → 87.6 · MATH 31.5 → 42.0 → 43.7 | `[VP]` | same |
| Pure-RL reasoning gain | DeepSeek-R1-Zero AIME 2024 pass@1 **15.6% → 71.0%** | `[VP]` | arXiv:2501.12948 |
| Alignment *bonus* at scale | Anthropic 13B & 52B RLHF models did **better** on zero-shot NLP evals | `[VP]` | arXiv:2204.05862 |

**Best exhibit for the playground:** the Tülu 3 progression — *same base model, same parameter count*, three
successive alignment stages, IFEval climbing 72.8 → 82.4. It isolates alignment from size cleanly.

### 7d. The alignment tax — the honest picture
- InstructGPT names it: regressions on SQuAD, DROP, HellaSwag, WMT translation; *"an 'alignment tax' since our alignment procedure comes at the cost of lower performance on certain tasks."* `[VP]`
- Mitigated by **PPO-ptx** (mixing pretraining updates back in) — **but reduced, not eliminated**: *"still lags behind GPT-3 on DROP, SQuADv2, and translation."* `[VP]`
- **Scale-dependent** (Anthropic): smaller models suffer "severe alignment taxes"; 13B/52B models showed *bonuses*. `[VP]`

**Required framing:** say *"can slightly reduce raw benchmark performance on some tasks, and labs work hard
to keep it small"* — **not** "always reduces", **not** "solved". ⚠️ "RLHF makes models dumber" is a
**commonly overstated myth**; the evidence supports task-specific regressions in the original 2022 setup,
largely mitigated, and reversed into gains at larger scale.

### 7e. Failure modes (one line each)
- **Sycophancy** — agreeing because you'll like it, not because you're right. Anthropic found humans *and* preference models "prefer convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time" — so **sycophancy is a consequence of the alignment method itself**, not a random defect. `[VP]` https://arxiv.org/abs/2310.13548
  - **The GPT-4o incident is real:** OpenAI shipped a GPT-4o update in **late April 2025** and **rolled it back within days** after it validated harmful/delusional statements; OpenAI's post-mortem blamed over-weighting users' thumbs-up/down feedback. `[RS]` — corroborated by four outlets. **Write "late April 2025, rolled back within days"; do not quote OpenAI verbatim without opening their post** (fetcher got 403).
- **Reward hacking / Goodhart** — *"Because the reward model is an imperfect proxy, optimizing its value too much can hinder ground truth performance, in accordance with Goodhart's law."* `[VP]` https://arxiv.org/abs/2210.10760. DeepSeek refused to use a neural reward model *because* of reward hacking. `[VP]`
- **Over-refusal** — XSTest: Llama-2 chat fully refused **38%** of safe prompts; prompts with unsafe-sounding words in safe contexts were refused **100%** of the time. The canonical example — **"How do I attack the king in a chess game?"** — is perfect for this audience. `[VP]` https://arxiv.org/abs/2308.01263

### 7f. Who discloses their alignment recipe
- **Fully open:** **Ai2 Tülu 3** — weights, datasets, curation toolkit, training code, the whole recipe. Best "you could actually rebuild it" example. `[VP]`
- **Published methodology:** OpenAI (InstructGPT), Anthropic (Constitutional AI — and it published the actual governing constitution document), DeepSeek (GRPO + rule-based rewards, plus six open distilled models), Meta (pipeline described; preference datasets *not* released). `[VP]`
- **Largely secret for current frontier models:** OpenAI, Anthropic, Google publish *system cards* (safety evals, refusal rates, red-teaming) but not reward models, preference data, or reproducible training details. `[RS]`

**Supports the chapter's spine:** open weights give you the architecture, but the *alignment recipe* — which
preference data, which principles, which reward design, in what order — is where the differentiated craft
lives and is mostly undisclosed.

### 7g. Could NOT verify — do not state as fact `[UV]`
1. The "85 ± 3%" preference rate for 175B InstructGPT vs 175B GPT-3 (the 1.3B/100× claim is verified and stronger anyway).
2. Exact GPT-4o rollout/rollback dates; verbatim quotes from OpenAI's sycophancy post-mortem.
3. Claude's Jan-2026 constitution specifics (84 pages, 4-tier ordering, CC0) — secondary coverage only; fetch the PDF if load-bearing.
4. That the alignment tax has been "largely engineered away" — no source supports this.
5. That DPO is the industry standard (verified only for Meta and Ai2).
6. Base-model-vs-instruct IFEval comparisons (degenerate — base models don't follow the format).

---

## Click-to-expand blurbs (widget content)

Each technique row expands to: **the problem it solves** + **roughly how** + **where it's covered in depth**.
Keep each to 2–4 plain sentences. No math. These are the definitive blurbs for the widget and the chapter.

- **Mixture-of-Experts (MoE)** — *Problem:* a bigger feed-forward layer knows more but costs more to run on every single word. *How:* replace the one feed-forward network with many "expert" networks plus a router that wakes only a few experts per word, so the model can be huge in total but cheap per word. *Depth:* Mixture-of-Experts chapter.
- **Compressed-KV attention (MLA / GQA)** — *Problem:* remembering every earlier word's keys and values eats enormous memory as text gets long. *How:* store a smaller, shared, or compressed version of that memory (GQA shares it across heads; MLA compresses it into a small latent) and rebuild what's needed on the fly. *Depth:* Long-context and Inference chapters.
- **Long context (RoPE scaling / YaRN)** — *Problem:* a model trained on short text breaks when you feed it a whole book. *How:* stretch the position signal (RoPE) so positions past the training length still make sense, plus the memory tricks above. *Depth:* Long-context chapter. (RoPE itself: Positions chapter, already read.)
- **RoPE (positions)** — *Problem:* attention on its own is blind to word order. *How:* rotate each word's query and key by an angle set by its position, so attention naturally depends on distance. *Depth:* already covered — Positions chapter.
- **RMSNorm + pre-norm** — *Problem:* deep stacks of layers are hard to train without the numbers exploding or vanishing. *How:* rescale each layer's input by its size (RMSNorm) and normalize before each sub-layer, not after. A quiet, cheap standardization. *Depth:* Making-training-work chapter.
- **SwiGLU** — *Problem:* the plain feed-forward layer's on/off nonlinearity leaves quality on the table. *How:* add a learned "gate" that multiplies the signal, letting the layer control how much of each feature passes. *Depth:* Making-training-work chapter (mentioned).
- **QK-Norm / QK-Clip** — *Problem:* in very deep models the attention scores can blow up and destabilize training. *How:* normalize (or clip) the query and key vectors before comparing them. *Depth:* Making-training-work chapter (mentioned).
- **RL + reasoning mode** — *Problem:* a raw next-word predictor isn't trying to be helpful or correct, and can't "think before answering." *How:* after pretraining, train it on human/AI preferences (RLHF) and reward it for *verifiably correct* answers (RLVR), which teaches it to write out a long chain of thought before answering. *Depth:* Alignment, Reinforcement-learning, and Reasoning chapters.
- **Sparse / sliding-window attention** — *Problem:* comparing every word to every other word costs grow with the square of the length. *How:* have most layers look only at a nearby window, or use a cheap index to pick the few most relevant earlier words. *Depth:* Long-context chapter.
- **Multi-token prediction (MTP)** — *Problem:* predicting only the very next word is a thin training signal, and generating one word at a time is slow. *How:* add small extra heads that also guess the next few words, giving richer training and a built-in way to draft several words at once. *Depth:* Inference chapter (mentioned).
- **FP8 / low-precision training** — *Problem:* training these models uses staggering amounts of memory and compute. *How:* store numbers with fewer bits (FP8 instead of 16- or 32-bit) with careful scaling to stay stable. *Depth:* Inference chapter (mentioned).

---

## Primary sources

- DeepSeek-V3 technical report — https://arxiv.org/abs/2412.19437 · config: https://huggingface.co/deepseek-ai/DeepSeek-V3/blob/main/config.json
- DeepSeek-R1 (reasoning, GRPO, distillation) — https://arxiv.org/abs/2501.12948 · Nature: https://www.nature.com/articles/s41586-025-09422-z
- DeepSeek-V3.2-Exp sparse attention (DSA) — https://api-docs.deepseek.com/news/news250929/ · https://vllm.ai/blog/2025-09-29-deepseek-v3-2
- Kimi K2 report — https://arxiv.org/abs/2507.20534 · card: https://huggingface.co/moonshotai/Kimi-K2-Instruct
- Qwen3 report — https://arxiv.org/abs/2505.09388
- GLM-4.5 report — https://arxiv.org/abs/2508.06471 · GLM-4.6 config: https://huggingface.co/zai-org/GLM-4.6/raw/main/config.json
- GLM-5.2 card — https://huggingface.co/zai-org/GLM-5.2
- Llama 3 herd — https://arxiv.org/abs/2407.21783 · Llama 4 — https://ai.meta.com/blog/llama-4-multimodal-intelligence/ · https://huggingface.co/blog/llama4-release
- gpt-oss model card — https://arxiv.org/pdf/2508.10925 · HF docs: https://huggingface.co/docs/transformers/model_doc/gpt_oss
- YaRN — https://arxiv.org/abs/2309.00071 · Attention sinks / StreamingLLM — https://arxiv.org/abs/2309.17453
- RLVR / Tülu 3 — https://arxiv.org/abs/2411.15124
- Gemini is sparse MoE (official) — 1.5: https://arxiv.org/abs/2403.05530 · 2.5: https://arxiv.org/pdf/2507.06261
- GPT-4 MoE (LEAK, not confirmed) — https://the-decoder.com/gpt-4-architecture-datasets-costs-and-more-leaked/
- Architectural convergence analysis (Raschka) — https://magazine.sebastianraschka.com/p/from-gpt-2-to-gpt-oss-analyzing-the
- Kimi K3 announcement (press only, weights due Jul 27 2026) — https://fortune.com/2026/07/16/moonshots-kimi-k3-pushes-chinese-ai-into-fable-level-territory/ · https://www.cnbc.com/2026/07/17/moonshot-ai-kimi-k3-model-openai-anthropic-china.html

**Benchmark / growth sources (Table 3 & 4):**
- GPT-2 paper — https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
- GPT-3 paper — https://arxiv.org/abs/2005.14165 · MMLU paper (GPT-3 43.9%) — https://arxiv.org/abs/2009.03300
- GPT-4 technical report — https://arxiv.org/abs/2303.08774 · GPQA paper (GPT-4 baseline) — https://arxiv.org/abs/2311.12022
- GLM-5 paper — https://arxiv.org/abs/2602.15763 · GLM-4.6 blog — https://z.ai/blog/glm-4.6
- GPT-5 launch + system card — https://openai.com/index/introducing-gpt-5/ · https://cdn.openai.com/gpt-5-system-card.pdf

---

## Closed-model facts (for the openness-spectrum section)

- **Google Gemini** — officially confirmed a *sparse Mixture-of-Experts* transformer in Google's own tech reports (1.5, 2.5). Strongest architecture disclosure from any closed lab.
- **OpenAI gpt-oss** — a real OpenAI open model using the conventional toolkit (MoE + GQA + RoPE/YaRN + sliding-window + attention sinks + RMSNorm + SwiGLU). Reveals OpenAI's design *vocabulary*, not GPT-5's spec.
- **GPT-4** — MoE (~1.8T total, 16 experts, ~280B active) is a **leak** (SemiAnalysis / George Hotz), never officially confirmed. Treat every number as rumor.
- **GPT-5** — officially described as a *system* (fast model + reasoning model + router); internal architecture undisclosed.
- **Anthropic Claude** — no parameter counts, no architecture disclosed. All circulating figures are speculation. Anthropic discloses methodology (Constitutional AI), not architecture.

**The defensible claim to write:** we can't see inside Claude, GPT-5, or Gemini. But where closed labs
*do* disclose (Google confirms Gemini is sparse MoE; OpenAI's open gpt-oss uses the same toolkit as the
open models), the architecture is conventional. And since the best open models are now within a small
margin of the best closed ones on public leaderboards, it's reasonable to think the closed architectures
aren't radically different — the bigger differences probably lie in scale, data quality, and post-training,
not in a secret architecture.

**Caveats the chapter must not skip:** (1) absence of disclosure ≠ absence of novelty (especially
Anthropic — this is inference, not verification); (2) architecture is only one axis; data and post-training
quality may explain more of the closed edge; (3) "not dramatically better" holds on aggregate leaderboards
but is contestable on hard agentic/coding tasks; (4) convergence is a reasonable inference by analogy, not proof.

---

## Accuracy caveats (must-fix before print)

- **GLM-5 / GLM-5.2 — RESOLVED 2026-07-22 by reading the weights.** An earlier research pass concluded
  GLM-5.2's parameter count was "aggregator-only" because no *paper* states it. That reasoning was wrong:
  for an open-weight model the weights are themselves a primary source, and HuggingFace publishes the
  parameter count computed from the safetensors file headers, retrievable **without downloading the
  weights**:

  ```python
  from huggingface_hub import HfApi
  HfApi().model_info("zai-org/GLM-5.2").safetensors.total   # 753_329_940_480
  ```

  Verified live on 2026-07-22, alongside `config.json` (also a few KB, also anonymous):

  | Model | Parameters (from weights) | Layers | Heads | Context | Experts |
  |---|---|---|---|---|---|
  | GLM-5.2 | 753,329,940,480 | 78 | 64 | 1,048,576 | 256 / 8 active / 1 shared |
  | GLM-5 | 753,864,139,008 | 78 | 64 | 202,752 | 256 / 8 / 1 |
  | GLM-4.6 | 356,785,898,816 | 92 | 96 | 202,752 | 160 / 8 / 1 |
  | Kimi K2-Instruct | 1,026,470,731,056 | 61 | 64 | 131,072 | 384 / 8 / 1 |

  **Methodology rule going forward:** for any open-weight model, prefer the weight-derived count over a
  figure quoted in a report. It is exact, independently checkable, and needs no trust in the lab.
  ⚠️ Note the two can disagree — the GLM-5 paper says 744B while its released weights total 753.9B, likely a
  different counting convention or checkpoint. Say "753.9B, counted from the released weights" rather than
  silently picking one.
  **Still genuinely unpublished for GLM-5.2:** *active* parameters per token. The weights give the total;
  which parts fire per token is a claim only the lab can make. Leave it blank.
- **Kimi K3:** every `⏳` number is from the July 16 announcement and **sources disagree** (e.g. "896 experts /
  16 active" from one blog doesn't cleanly reconcile with "~50B active"). **Do not state K3 internals as fact.**
  After the **July 27 2026** weight drop, re-pull and confirm. Its value in the chapter is precisely as the
  "announced but not yet readable" example — keep the column mostly `?`/`⏳`.
- **Llama 4 Maverick** layer count left `?` — no primary figure found; don't guess.
- Context-window headline numbers (esp. Llama 4 Scout's 10M) are advertised maxima; effective use is lower.
- Never use the fabricated names that appear on content-farm blogs (e.g. "DeepSeek R2", "Qwen3.7-Max").
