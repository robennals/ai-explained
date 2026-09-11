# Chapter: Context — redesign draft

Status: draft for review. Supersedes the section arc in
`2026-07-24-context-chapter-design.md`.
Date: 2026-08-27 · Rev 2: 2026-08-28 · Rev 3: 2026-08-28

## What changed and why

The original chapter opened on attention cost ("The Wall") — the most abstract
idea in the chapter, and the last thing a reader has any feel for. This redesign
reorders it as a **problem → relief cascade**, and sharpens what the chapter is
*about*.

Rev 2 (2026-08-28) folds in a round of feedback:

- **Thesis sharpened** — this chapter is about how you **manage** the context, not
  about what goes in it. The previous three chapters already covered the
  contents.
- **RAG removed.** It is really a kind of tool use ("what you put in"), so it
  belongs in the Agents chapter, not here. Flagged for that chapter.
- **"What's in the window" ingredient-toggle cut** — same reason (contents, not
  management). A sentence of motivation replaces the playground.
- **Caching corrected by research.** Production KV caching is prefix-based:
  reusable blocks must sit at a fixed front position to be reused, and there is no
  shipped "page an isolated block in anywhere." So the framing is "keep reused
  stuff up front; the conversation grows at the end and can only be compressed or
  offloaded to a subagent," not "swap independent pages." (Position-independent
  chunk reuse is a research idea — see findings.)
- **Short paragraphs.** Middle-school audience: short sentences, short
  paragraphs, bullets where useful, playgrounds doing the heavy lifting. No walls
  of text. Added as a prose constraint.

Rev 3 (2026-08-28), after the caching research landed:

- **Subagents are now the hero of cache reuse.** The KV cache is presented simply
  as caching a **prefix**. To reuse a big cached skill, you start a **subagent**
  whose context *begins* with that skill (so it is the cached prefix) plus small
  custom instructions, and it returns just the result. The old "keep a reusable
  block up front" section is folded into this; `PagedCacheWidget` is folded into
  the subagent widget.
- **Pageable KV blocks** get a one-line research aside: not supported by any
  mainstream model at time of writing, which is *why* the subagent trick is used.
- **Attention findings applied** — GLM IndexShare (shared index, ~3× less work at
  1M) and Kimi's linear/hybrid (3:1), with the MiniMax-M2 reversal as the "linear
  is weaker" evidence.

Rev 4 (2026-08-28) — **the live draft now lives in
`src/app/(tutorial)/context/content.mdx`** (implemented and verified: `pnpm
test`/`lint`/`build` green). Treat that file as the source of truth for wording;
the DRAFT PROSE below is kept for reference but is longer than the shipped copy.

- **Intro wording** — "hidden text added to the conversation"; context defined as
  "all the text a model can see while it answers your prompt."
- **Prose tightened** — each section is now ≤3 short paragraphs; playgrounds carry
  the load (middle-school reader).
- **KV widget rebuilt** — a step-through of the three-round conversation with a
  separate **cache column** and messages coloured plain-text / computing / cached,
  so the reader watches each turn reuse the cached prefix and compute only the new
  message and reply. Logic in `kvcache.ts` (`buildSteps`) with tests.

Rev 5 (2026-08-28) — resolve the "stateless yet cached" confusion:

- **New section "Your app and the server"** before the KV cache — a client on your
  device holds the conversation and sends a **stateless** completion request to a
  remote server that keeps no memory between requests. This is what makes
  "stateless" and "cached" consistent.
- **New section "A shared, temporary cache"** after the KV widget — the cache is
  server-side, shared across clients (so the system prompt / tool list is usually
  already cached, sometimes from other users), most-recently-used, space-limited,
  and expiring (come back hours later and it is recomputed).
- Subagent and compression widgets rebuilt as step-throughs (the shared pattern);
  subagent uses top tabs + a cache column and shows the sub-context below the
  main; compression fills the window, summarises, starts a fresh agent, deletes
  the old.

### Placement

The `chapter/chat` branch split its material into **three** chapters, so the run
into this one is now:

**Transformers (9) → Chat Models (10) → Reasoning (11) → Agents (12) → Context (13).**

`context` moves to **id 13, immediately after `agents`**, with
`prerequisites: [12]`. Every existing chapter with `id >= 13` shifts up by one,
and prerequisite ids are remapped with the same table (not by eye).

**Curriculum reconciliation (coordinate with `chapter/chat`):** that branch
currently still lists `context` at the end as id 28, titled "Context
Management". When the branches merge, context is repositioned to id 13 and
retitled (`title: "Context"`, `subtitle: "Getting the right information"`). Slugs
do not change, so `<Ch slug=…>` cross-references need no edits.

### Chapter thesis

The previous three chapters *filled* the context: conversation, reasoning, tools,
skills, memory — all of it text in front of the model. This chapter is about
**managing** that pile:

- reuse the work so the model isn't re-reading the same words forever (KV cache;
  subagents that start from a cached prefix);
- keep the pile small enough to fit (subagents, compression);
- make attention itself cheap enough that a giant window is possible at all
  (sparse and linear attention).

If a section is about *what to put in the window*, it belongs in an earlier
chapter, not this one.

### Builds on the previous three chapters

Reference these, do not re-teach them:

- **Chat Models** — a conversation is one token stream the model completes; the
  system prompt is text at the top. Its **Repeated Turns** section already
  teaches statelessness in full (the app re-sends the whole conversation every
  turn, "reading it again … as though for the first time") and explicitly names
  the KV cache, forward-referencing *this* chapter. A message drawn with a
  **dashed outline** is one the human never sees — reuse that convention here.
- **Reasoning** — a reasoning model writes hidden thinking tokens; "its own
  output becomes its working memory." A reasoning trace is just more text in the
  context.
- **Agents** — an agent is model + harness + loop. Tool results, skills, and
  memory all arrive as text; a **skill** loads on demand (one line until used);
  **memory** carries notes *between* conversations.

De-duplication rules for the writer:

- Do **not** re-teach statelessness or the re-send-every-turn mechanic, and do
  **not** build a "watch the transcript grow" widget — Chat Models' Repeated
  Turns (`RepeatedTurnsWidget`) does both and hands the KV cache to this chapter.
  Open directly on the KV cache; a one-line recap is enough.
- Do **not** re-teach tools, skills, or memory. Reference them.
- Agents' **memory** carried facts *between* conversations. This chapter's
  compression/subagent sections are the opposite problem — a *single*
  conversation grown too big. Keep them distinct.

### Decisions resolved

- **Positioning** — follows Agents (id 13). Prereqs `[12]`.
- **Scope** — management, not contents (see thesis).
- **RAG** — **removed** from this chapter; belongs in Agents (a form of tool
  use). Note it there.
- **Ingredient toggle** — **cut**; contents, not management.
- **Caching / subagents** — present the KV cache as always caching a **prefix**.
  To reuse a big cached skill, start a **subagent** whose context *begins* with
  that skill (the cached prefix) plus a few custom instructions; it returns just
  the result. So subagents are the smart way to reuse cache and keep the main
  context clean. Briefly note that pageable / position-independent KV blocks are a
  research idea with no mainstream support at time of writing.
- **IndexShare (GLM-5.2)** — index shared across heads (DSA) and across layers
  (IndexShare), tiny keys, runs rarely; top ~2,048 tokens; ~2.9× fewer FLOPs at
  1M. Confirmed.
- **Linear attention (Kimi)** — cite **Kimi Linear / KDA**, a 3:1 layer-
  interleaved hybrid (not a range split); weaker alone, so paired with periodic
  full-attention layers (MiniMax-M2 reverted to full attention). GLM (sparse) vs
  Kimi (linear) is a real divergence.
- **Local/sliding-window (Gemma)** — a third technique, mentioned in the same
  section.
- **Title** — keep.

### Widget reuse map

| § | Widget | Status |
|---|--------|--------|
| — | (statelessness) | none — Chat Models' `RepeatedTurnsWidget` covers it |
| 1 | `KVCacheWidget` | **rebuilt** — step-through of the multi-round conversation; separate cache column; text coloured plain / computing / cached, prefix reused each turn |
| 2 | `SubagentContextWidget` | **new build** — subagent context starts with a cached skill (cache reuse) and keeps mess out |
| 3 | `CompressionWidget` | **new build** — summarize old turns; window frees up |
| 4 | `AttentionCostWidget` | reuse as-is |
| 5 | `SparseIndexerWidget` | reuse — emphasize the shared index |

Retired: `RetrievalWidget` (RAG → Agents chapter), `ContextIngredientsWidget`
(cut), `PagedCacheWidget` (folded into the subagent widget), `LocalVsGlobal`
(folded into §5 prose), `StatelessLoopWidget` (never built; Chat Models covers
it). Two new builds: `SubagentContextWidget`, `CompressionWidget`.

### RESEARCH FINDINGS (resolved 2026-08-28)

**Caching / paging (for §2–§4).** Production KV caching is **strictly
prefix-based** across Anthropic, OpenAI, Gemini, vLLM, and SGLang. A cached
block is only reused when everything before it is byte-identical.

- Anthropic: up to **4 cache breakpoints**, ordered `tools → system → messages`;
  TTL 5 min / 1 hr; changing content invalidates the cache for everything after
  it. OpenAI: automatic, prefix-only, 1024-token minimum. Gemini: cached content
  is a **prefix** (explicit `CachedContent` reused across requests, ~2k-token
  min). vLLM/SGLang: block-hash / radix-tree, still prefix-based.
- **You cannot** cache an isolated block and reuse it at an arbitrary position.
  "Pages that can't see each other," position-independent chunks, and
  "page a block in and out" are **research** (CacheBlend, APE, Block-Attention,
  EPIC; one experimental LMCache feature), **not** a shipped API capability.
- **Honest best practice for the chapter:** keep the reusable stuff — system
  prompt, tools, a fetched skill/file — in a **fixed position at the front, in a
  stable order**, and let only the conversation grow at the **end**. That is what
  makes the cache hit, across turns and across conversations. Breakpoints let a
  few stable front sections each be cached so appending never re-bills them.
- Sources: [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
  · [OpenAI](https://openai.com/index/api-prompt-caching/)
  · [Gemini](https://ai.google.dev/gemini-api/docs/caching)
  · [vLLM APC](https://docs.vllm.ai/en/v0.8.1/design/automatic_prefix_caching.html)
  · [CacheBlend/EuroSys'25](https://blog.lmcache.ai/en/2025/03/31/cacheblend-best-paper-acm-eurosys25-enabling-100-kv-cache-hit-rate-in-rag/)

**Efficient attention (for §6).**

- **GLM-5.2 IndexShare** — built on **DeepSeek Sparse Attention (DSA)** + MLA. A
  tiny **lightning indexer** (dim 128, ~64 heads, FP8) scores past tokens and
  selects the **top ~2,048**; full attention runs only over those. Selection is
  **shared across heads** (DSA) and — the "share" in IndexShare — **reused across
  4 adjacent layers** (1 full indexer + 3 reuse), so the indexer barely runs.
  **~2.9× fewer per-token FLOPs at 1M** context (not an end-to-end 2.9× speedup).
  Context 200K→~1M. This confirms the user's "shared across heads+layers, small
  keys, runs rarely." Sources:
  [Raschka](https://sebastianraschka.com/blog/2026/glm-5-2-indexshare.html) ·
  [vLLM DSA](https://vllm.ai/blog/2025-09-29-deepseek-v3-2) ·
  [DeepSeek-V3.2 report](https://arxiv.org/abs/2512.02556)
- **Kimi (Kimi Linear / KDA)** — a **layer-interleaved hybrid at 3:1** (3 linear
  "Kimi Delta Attention" layers : 1 full-attention MLA layer). **Correction:** it
  is *not* a long-range-linear / short-range-full split — both layer types see
  the whole sequence; the periodic full layers keep the global view. ~75%
  KV-cache reduction, up to 6× decode at 1M. "Kimi K3" specifics are
  secondary-sourced; cite the primary **Kimi Linear** paper. Sources:
  [Kimi Linear (arXiv 2510.26692)](https://arxiv.org/abs/2510.26692)
- **Linear is weaker → always hybridized with full attention.** MiniMax-01/M1
  used Lightning Attention **7:1**, then **MiniMax-M2 reverted to full attention**
  ("not production-ready"), then went sparse-selection in M3. Confirms the "works
  less well" framing. Sources:
  [MiniMax-M1](https://arxiv.org/abs/2506.13585) ·
  [MiniMax on M2](https://www.minimax.io/news/why-did-m2-end-up-as-a-full-attention-model)
- **Gemma sliding window** — Gemma 3 interleaves local (window 1,024) and global
  at **5:1**. Source:
  [Gemma 3 report](https://arxiv.org/pdf/2503.19786)
- **Big picture** — three camps: sparse-selection (DeepSeek DSA, GLM IndexShare,
  MiniMax-M3), linear/hybrid (Kimi KDA 3:1, MiniMax-01/M1 7:1), sliding-window
  (Gemma 5:1). GLM vs Kimi is a genuine fork; sparse-selection is currently
  gaining momentum.

### Prose constraints

`docs/style/voice.md` applies. Additionally, for this chapter:

- **Short.** Short sentences, short paragraphs (aim 2–3 sentences). Never a wall
  of text. Middle-school reader.
- Let the **playgrounds** do the heavy lifting; use bullets when a list is
  clearer than prose.
- No first-person "I"/"me". At most one em-dash per paragraph.

---

# DRAFT PROSE

*(Free-standing intro — no `#` heading.)*

The last three chapters built a chat assistant one piece at a time. Every piece
turned out to be the same stuff: text placed in front of the model.

The conversation is text (Chat Models). The model's own thinking is text it
writes and reads back (Reasoning). Tool results, skills, and saved notes are text
too (Agents).

All of it together is the **context**: everything the model sees for one
prediction.

Those chapters filled the context up. This one is about keeping it under control
— reusing work so the model isn't re-reading the same words forever, keeping the
pile small enough to fit, and making attention cheap enough that a giant window
is even possible.

## Reusing the work: the KV cache

Chat Models ended on a problem. The model is stateless, so the app re-reads the
whole conversation for every reply. That sounds hopelessly wasteful.

The fix is the **KV cache**.

When the model reads a token, it works out some values for it — the keys and
values from the Attention chapter. Those values depend only on that token and the
ones before it.

So as long as the earlier text has not changed, the values are the same as last
turn. The model saves them and reuses them instead of working them out again.

There is one catch, and the rest of the chapter hangs on it: a token's saved
values are only valid if everything *before* it is unchanged. Add to the end and
the cache holds. Change something early and every saved value after it is wrong.

Put simply, the cache is a **prefix** of the context. The unchanging front — the
system prompt, the tools, whatever you place first — is worked out once and reused
on every later turn. Only the new text at the end is fresh work.

<KVCacheWidget>
Add turns to a conversation and watch each earlier turn stay cached and reused,
so only your newest message is actually processed. Watch the cost per turn next
to what re-reading everything would cost.
</KVCacheWidget>

## Subagents: reuse the cache and keep it clean

Subagents are the smart way to manage context, and they do two jobs at once.

The first is keeping the mess out. Some jobs are big and messy: read forty files,
try ten searches, chase down a bug. Do that in your main conversation and it
floods with junk you will never need again.

A **subagent** is a fresh copy of the model with its own empty context. You hand
it the job. It fills *its* window with the mess, does the work, and hands back a
short answer. Your main context stays small and clean.

The second job is subtler, and it is where the cache pays off. Say a task needs a
big **skill** — a long document of instructions — that is already in the cache
from an earlier use. You cannot reuse that cache in the middle of your
conversation, because the cache only holds for an unchanged prefix, and your
conversation is different every time.

So you start the subagent's context *with the skill*. The skill is the prefix, so
its cached work is reused for free. After it you add only a few lines: what you
want this subagent to do. The subagent runs cheaply and returns just the result.

That is the trick. A subagent lets you build a fresh context that begins with
something already cached, so a huge skill costs almost nothing to reuse.

Subagents help with long **reasoning**, too. A trace can run for pages, full of
false starts and dead ends. Let a subagent do the thinking and it comes back with
just the answer — or the answer plus a short, clean write-up of the reasoning
worth keeping. The dead ends never reach your context.

(Researchers are working on "pageable" blocks of cache you could slot in anywhere,
in any order. At the time of writing no mainstream model supports that, so
starting a subagent with the cached block up front is how it is done.)

<SubagentContextWidget>
Give the assistant a task that needs a big skill. Watch it spin up a subagent
whose context starts with that skill — reused straight from the cache — followed
by a few lines of instructions. The subagent returns a short answer, and your main
context never grew. Then do it inline instead and watch the skill get reprocessed
and the window balloon.
</SubagentContextWidget>

## When the pile still grows: compression

Subagents keep new mess out, but your own conversation still grows. Every new
turn, tool result, and line of reasoning adds to the end.

When it gets too big to fit, you **compress** it: replace a long stretch of old
turns with a short summary, and carry on with the gist.

This is one of several things a model does that feel oddly like sleep. Take a huge
pile from immediate memory, squeeze it down to the part worth keeping, and wake up
fresh without the clutter. More sleep-like tricks turn up in later chapters.

<CompressionWidget>
Let a conversation grow past the limit, then summarize its old turns into a short
note. Watch the window free up while the thread survives — and see which details
the summary drops.
</CompressionWidget>

## The quadratic wall

Everything so far manages *what* sits in the window. There is a second problem
underneath: can the model even afford to run attention over a giant window?

From the Attention chapter, every token compares itself with every other token.
Double the window and you quadruple the comparisons. This is **quadratic**
growth.

At a million tokens it is brutal — the comparisons run into the trillions, for a
single answer, in every attention head of every layer.

<AttentionCostWidget>
Slide the window toward a million tokens, at the real size of a modern model, and
watch the energy and dollar cost of one answer climb: past a phone charge, past a
fridge left running all day.
</AttentionCostWidget>

## Making big windows affordable

A million-token window sounds impossible at that cost. Yet GLM, DeepSeek and Kimi
ship them. They do not run the naive algorithm.

Most of those comparisons come out near zero anyway. A token does not need to
score all million others, only the few that matter. Different models cut the cost
in different ways.

- **Sparse, indexed attention (GLM).** A cheap **index** shortlists the couple of
  thousand tokens worth scoring, and full attention runs only over the shortlist.
  The clever part is in the name: the same shortlist is **shared** across many
  attention heads and reused across several layers, and the index uses tiny,
  low-precision keys — so it barely adds any cost. The result is roughly **three
  times less work** at a million-token window.
- **Linear attention (Kimi).** A different bet: swap most layers for a cheaper
  kind of attention whose cost grows in a straight line instead of a square. On
  its own it works less well, so it is mixed with ordinary full-attention layers,
  a few sprinkled in to keep the global picture. (One lab, MiniMax, tried going
  mostly-linear, then switched back to full attention because it was not reliable
  enough — so this is still a live bet.)
- **Sliding-window (Gemma).** Most layers look only at nearby tokens; every fifth
  layer or so looks at everything.

Different bets, one goal: break the quadratic wall so the window can be as big as
the work needs. It is worth noting that GLM and Kimi picked *different* bets, even
though frontier models otherwise keep converging.

<SparseIndexerWidget>
Turn the shared index on and watch the comparisons — and the cost meter from the
last playground — collapse, while the one token the model actually needs still
gets found.
</SparseIndexerWidget>

## Closing

The model never changed. It is still the next-token predictor from the
Transformers chapter, reading text and guessing what comes next.

What changed is everything around it: a cache so it need not re-read, subagents
that start from a cached block so a big skill is reused for almost nothing,
compression when the conversation itself grows too big, and sparse attention so a
giant window is affordable at all.

Context is not a feature of the model. It is the craft of deciding what to put in
front of it, and what to leave out.
