# Context chapter — implementation plan

Date: 2026-08-28
Design: `docs/superpowers/specs/2026-08-27-context-chapter-redesign.md` (Rev 3)

Goal: rebuild the existing `context` chapter to the Rev-3 design — five sections
(KV cache → subagents → compression → quadratic wall → making big windows
affordable), management-not-contents thesis, short paragraphs, subagents as the
cache-reuse hero.

## Status (2026-08-28)

Implemented and verified (`pnpm test` 81 pass · `lint` · `build` green):

- Task 2 — content.mdx rewritten to the five sections, then tightened to ≤3 short
  paragraphs per section with the intro-wording fixes.
- Task 3 — widgets.tsx / page.tsx rewired to the five-widget set.
- Task 4/5 — `SubagentContext` and `Compression` widgets built (logic + tests).
- **KV widget rebuilt** (was "reuse"): `KVCacheWidget` is now a step-through with
  a cache column and cached/computing/plain colouring; logic `kvcache.ts`
  (`buildSteps`) + tests.
- **Shared step-through pattern** — KV cache, subagent (tabs + cache column), and
  compression (budget bar) all use the same Back/Next stepped-context format.
  Subagent shows the sub-context below the main one and starts from a cached
  skill; compression fills the window, summarises, starts a fresh agent, deletes
  the old. The quadratic-wall and sparse-attention widgets stay interactive
  calculators (not stepped).

Still open: Task 1 (curriculum move — awaits branch merge), Task 6 (reused-widget
copy pass for SparseIndexer/AttentionCost), Task 7 (quiz + glossary), Task 8 (RAG
→ Agents), Task 9 (notebook), Task 10 (delete retired widget files + `rob-review`).
The two new widgets are first-draft and want a design/polish pass.

## Global constraints

- Chapter follows Chat Models / Reasoning / Agents. Reference, don't re-teach:
  statelessness, tools, skills, memory, reasoning traces. Use the dashed-message
  convention.
- Voice: `docs/style/voice.md`, plus short sentences / short paragraphs, no walls
  of text, no first-person "I", ≤1 em-dash per paragraph. Playgrounds do the
  heavy lifting.
- Widget house style: deterministic logic in a plain `.ts` module with a
  colocated vitest `.test.ts`; the `.tsx` is a thin layer over `WidgetContainer`
  and shared controls; hand-authored fake data, not a real model; one clear knob
  with a "try this" surprise; readable text.
- Verification gates before "done": `pnpm test`, `pnpm lint`, `pnpm build`,
  `pnpm glossary:build`. (Notebook + playwright optional per task below.)

## Widget map

| § | Widget | Action |
|---|--------|--------|
| 1 | `KVCacheWidget` (`kvcache.ts` / `KVCacheWidget.tsx`) | **reuse**; light reframe so it reads as "the cache is a prefix reused across a growing conversation" |
| 2 | `SubagentContextWidget` | **build new** |
| 3 | `CompressionWidget` | **build new** |
| 4 | `AttentionCostWidget` (`cost.ts` / `AttentionCost.tsx`) | **reuse as-is** |
| 5 | `SparseIndexerWidget` (`indexer.ts` / `SparseIndexer.tsx`) | **reuse**; ensure copy emphasizes the *shared* index (across heads + layers), tiny keys, runs rarely |

Retire (stop importing; delete files in the cleanup task): `LocalVsGlobal`,
`PagedCache`, `RetrievalWidget`, and their logic modules (`attentionReach.*`,
`paging.*`, `retrieval.*`, `corpus.ts`, `haystack.ts`). RAG material (`corpus`,
`retrieval`) moves to the Agents chapter — see Task 8.

## Tasks

### Task 1 — Curriculum move
Move `context` to id 13 (immediately after `agents`), `prerequisites: [12]`,
`title: "Context"`, `subtitle: "Getting the right information"`, `ready: true`.
Shift every `id >= 13` up by one and remap prerequisite ids with the same table.
Update `curriculum.test.ts` expectations. **Coordinate with `chapter/chat`**,
which still lists context at id 28 — this is the reconciliation point; do the
actual renumber when the branches merge, not before, to avoid a two-way conflict.
Until then, keep context building at its current id on this branch.

### Task 2 — content.mdx rewrite
Replace with the Rev-3 draft prose (intro + 5 sections + closing). Short
paragraphs. Widgets referenced: `KVCacheWidget`, `SubagentContextWidget`,
`CompressionWidget`, `AttentionCostWidget`, `SparseIndexerWidget`. No `#` heading
(ChapterHeader supplies the title). No raw `<p>`.

### Task 3 — widgets.tsx + page.tsx rewiring
`widgets.tsx`: export exactly the five widgets above; drop the three retired.
`page.tsx`: pass the five components to `<Content components={…}>`.

### Task 4 — SubagentContextWidget (new)
Logic `subagent.ts` (+ `.test.ts`): model a token budget. Two modes for a task
that needs a big skill:
- **inline:** context = conversation + skill (reprocessed) + work-mess; budget
  climbs and the skill is not reused.
- **subagent:** main context = conversation only (small); subagent context =
  cached skill (reused, ~free) + short instructions + its own mess; returns a
  short summary that lands in the main context.
Widget shows both, side by side or via a toggle, with a token meter for the main
context and a "reused from cache" marker on the skill prefix. One knob: inline vs
subagent. Try-this: watch the main context stay small and the skill get reused.
Optionally a second example: a long reasoning task returning just the answer.

### Task 5 — CompressionWidget (new)
Logic `compression.ts` (+ `.test.ts`): a conversation of N turns filling a fixed
budget bar. A **Compress** action replaces the oldest run of turns with a short
summary token-block; budget bar drops; the recent turns and the summary remain.
One knob: compress (or a slider for how aggressively). Try-this: grow past the
limit, compress, watch the window free up and note what detail the summary drops.
Keep the "feels like sleep" idea in the prose, not the widget.

### Task 6 — Reused-widget copy pass
`KVCacheWidget`: ensure the framing matches "cache = prefix, reused across a
growing conversation." `SparseIndexerWidget`: ensure copy says the index is
shared across heads and layers, uses tiny keys, and runs rarely; numbers ≈ top
~2,048 tokens, ~3× less work at 1M. `AttentionCostWidget`: no change expected.

### Task 7 — Quiz + glossary
`quiz.mdx`: refresh questions to the five new sections (KV cache/prefix,
subagent cache-reuse, compression, quadratic cost, sparse/linear attention).
Glossary: keep `kv-cache`, `sparse-attention`, `mla`, `indexshare`,
`pagedattention`(?) — add `prefix-cache`, `subagent`, `context-compression`,
`linear-attention`, `sliding-window-attention`. Remove/relocate `rag`,
`semantic-search`, `local-attention` if now unused here. Run `glossary:build` +
`glossary:audit`.

### Task 8 — RAG relocation note (Agents chapter)
Leave a note / issue for `chapter/chat`'s Agents chapter to absorb RAG (semantic
retrieval as a form of tool use), reusing `corpus.ts` / `retrieval.ts` /
`RetrievalWidget.tsx` if wanted. Not built here.

### Task 9 — Notebook
Update `notebooks/context.ipynb` to mirror the new sections (KV-cache prefix
reuse; a subagent-style prefix-reuse demo; a compression/summarise step; the
attention-cost numbers; a sparse-index toy). Defer if it slows the prose review;
flag as follow-up.

### Task 10 — Cleanup + verify
Delete retired widget files and their tests once nothing imports them. Run the
full gate: `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm glossary:build`. Then
`rob-review`.

## Sequencing

2 + 3 + 4 + 5 land the viewable draft (do these first; Tasks 4/5 can run in
parallel as independent widget builds). 6 polishes reused widgets. 7 + 9 are
content follow-ups. 1 + 8 + 10 are coordination/cleanup. Task 1 waits on the
branch merge.

## Open coordination items

- **Curriculum reconciliation** with `chapter/chat` (context id 13 vs its current
  id 28).
- **RAG** ownership handed to the Agents chapter.
