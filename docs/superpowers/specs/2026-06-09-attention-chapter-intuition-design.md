# Attention chapter: intuition-first rework

**Date:** 2026-06-09
**Status:** Approved (author asked to proceed straight through to implementation)

## Problem

A reader reported the attention chapter is much harder than the chapters before it, and pinpointed the **"Match Scores"** section as where it became too much. The root cause: the chapter *formalizes before it motivates*. "Match Scores" opens straight into formal query/key vocabulary, two new vectors at once, a 1/0 encoding, the dot product, and a meta-caveat about anthropomorphizing — with no everyday anchor first. Every earlier chapter earned its abstraction with a concrete everyday hook (the Vectors chapter builds a "bear detector" before any formula). Attention skips that step.

Goal: make the chapter as intuitive as the others. Lead with the everyday idea of *looking something up*, name query/key/value in plain English before any math, then formalize onto warmed-up ground. Remove math that buries the intuition.

## What the reader already knows (footing)

Chapter order: … vectors → embeddings → next-word-prediction → **attention** → positions → transformers.

The **Vectors** chapter already established two ideas this rework leans on:
- **Dot product = how much two vectors agree** (similarity).
- **The "detector" framing** (vectors.mdx:95, 126): a unit vector says "I'm looking for bear-like things," and its **magnitude is how sensitive the detector is.** A query *is* a detector. The attention chapter's later "crank up the query magnitude" move is the *same sensitivity lever* — but currently never says so.

## New section order

| # | Section | Status | Widget |
|---|---|---|---|
| 0 | **Some Words Need Other Words** (problem hook) | keep, trim | WhyAttentionMatters |
| 1 | **Looking Things Up** (everyday retrieval; names Q/K/V) | NEW | — (3×3 table) |
| 2 | **Words Look Things Up Too** (reframe word examples as Q/K/V) | reworked | WhyAttentionMatters (Q/K/V-enhanced) |
| 3 | **Matching Queries with Keys** (was "Match Scores") | reworked | ToyAttentionScores |
| 4 | **Dividing Your Attention** (softmax) | keep | SoftmaxExplorer, ToyAttentionSoftmax |
| 5 | **Where Does Attention Go When Nothing Matches?** (sink) | de-math | ToyAttentionSink |
| 6 | **What Did You Find?** (values) | keep | ToyAttentionValues |
| 7 | **Where the Vectors Come From** (model learns Q/K/V) | keep, move up | — |
| 8 | **Multi-Headed Attention** (expanded) | expand | KeyInsight |
| 9 | **What We've Built** (recap → positions) | keep, update | — |

### §0 — Some Words Need Other Words (problem first)
Keep the existing short hook (bank / it ambiguity, WhyAttentionMatters widget). Motivation-first: the reader should feel the itch (words are ambiguous, you must look back to the *right* earlier word) before the everyday solution arrives. Trim only.

### §1 — Looking Things Up (NEW)
The everyday on-ramp. Before any math, establish the universal pattern of looking information up:
- You have **an idea of what you want to find** — a **query**.
- Each source **advertises what kind of thing it has** — a **key**.
- When you pick a source, you get **what it actually contains** — a **value**.

Lead with the **book** (crispest key≠value split), then **search**, then **friend**:
- **Book:** query = what you want to know; key = the title/cover; value = what's inside.
- **Search:** query = what you type; key = what the engine knows about each page; value = the page that comes back.
- **Friend:** query = your question; key = what you think they know about; value = everything they could tell you.

Render as a small **3×3 table** (query/key/value × book/search/friend) so the parallel structure is visible at a glance. The key≠query asymmetry falls out for free: what you're *looking for* is a different kind of thing from what a source *advertises*.

### §2 — Words Look Things Up Too (reworked)
Apply §1 to words. A word, to be understood, "asks a question" of other words and "offers an answer" to others. Reframe the motivating examples as **one clean query→key→value triple each** (one question per word — multiple questions is saved for multi-head):
- **"it" → glass:** query "what thing are we talking about?"; glass's key "I'm the thing being talked about"; value "glass."
- **"opened" → chef:** query "who did this action?"; chef's key "I did the action"; value "chef."

End conceptually: the word pulls in the value it found to build a richer understanding of itself. (Mechanism comes in §6; here it's just the idea.)

**Deliberately hold back "bank"** — it naturally wants to ask *two* questions ("river?" and "money?"), which is the motivation for multi-head in §8, not a single-head example.

### §3 — Matching Queries with Keys (was "Match Scores")
Now make it precise.
- **Recap the dot product** from the Vectors chapter in one or two plain sentences: it measures how much two vectors agree.
- **Query = a detector** ("I'm looking for noun-ish things"); **dot product = the match** ("how much your question agrees with what this thing advertises"). This reconnects to the Vectors chapter and pre-loads the later magnitude move.
- Keys and queries are **vectors** (call them vectors/detectors, **not** "an embedding" — avoid colliding with the Embeddings chapter). In general they're many-dimensional, one dimension per thing you might look for or advertise. **For the toy example, use a one-dimensional version: a single "noun" dimension.** This frames noun-only honestly as the minimal case, not as what attention "really" is.
- **Demote the anthropomorphizing hedge** ("the token isn't really asking; the model asks on its behalf") to a single light parenthetical here, not the opening line.
- Keep the existing ToyAttentionScores widget and the key≠query payoff ("what you offer isn't what you're looking for").

### §4 — Dividing Your Attention (softmax)
Keep largely as-is (SoftmaxExplorer, ToyAttentionSoftmax). One addition: when "crank up the query magnitude" appears, tie it explicitly back to the **detector-sensitivity lever** from §3 / the Vectors chapter (bigger magnitude = a more sensitive detector), so the move reads as familiar rather than arbitrary.

### §5 — Where Does Attention Go When Nothing Matches? (de-math)
This becomes the densest spot once §1–3 are gentle. Keep the **concept** in the main flow — softmax always spends 100%, even when nothing matches, so leftover attention needs a harmless place to go; models use a **sink**. Push the heavier construction (the `[0.5, 0.5]` two-dimension "none" mechanics) into a lighter aside / the widget caption rather than the main spine. The reader needs the *idea* of a sink to follow later sections; they don't need the full construction in the main read.

### §6 — What Did You Find? (values)
Keep as-is (ToyAttentionValues). Value names were already planted in §1–2, so the third vector no longer arrives unannounced.

### §7 — Where the Vectors Come From
Keep (the model *learns* Q/K/V projections via gradient descent). Move it up to sit right after the toy mechanism is built, answering the natural "but who decides what each word advertises?" before multi-head.

### §8 — Multi-Headed Attention (expanded)
Open with **"bank"**: it genuinely wants to ask two different questions ("are we talking about a river?" and "are we talking about money?"). A single head only lets a token ask **one** question and offer **one** answer. So you need more than one.

**Analogy (author's refinement):** it's not just "ask different experts different questions." In real life you have **several friends, and you ask different questions to different people.** Each head is a separate **venue for asking** — one head = one question/answer relationship; multiple heads = several such relationships running in parallel. Then the existing KeyInsight and the per-head sink note.

### §9 — What We've Built
Keep the recap; update the numbered list to match the new order; keep the lead-in to the positions chapter (attention has no idea *where* words are).

## Widget change: WhyAttentionMatters gains Q/K/V

`src/components/widgets/attention/WhyAttentionMatters.tsx` already holds the three examples and an `enrichedMeaning` field. Add **additive** optional fields per example — `query`, `keyText`, `value` — and a small display block that shows the selected word's query, the target word's key, and the value gathered. Low-risk, no behavior change to existing arrow/measurement logic. If it proves risky, fall back to prose-only and leave the widget unchanged.

## Constraints

- **Voice guide** (`docs/style/voice.md`): no first-person "I"/"me" in chapter prose; "we" only for collaborative actions; em-dashes at most one per paragraph and only when nothing else fits; no "It's not X, it's Y"; no drumroll phrases; strip AI vocabulary; keep the author's bullet/list bolding. New prose follows these from the start. For sections kept "as before," preserve the author's existing wording — surgical edits only.
- **MDX:** never raw `<p>` tags (use `<Lead>` or `<div>`). Lint checks this.
- **Notation** (memory): reuse the chapter's established notation; don't invent subscripts.
- **Notebook:** the companion notebook mirrors the chapter section by section. Mechanisms are unchanged (only exposition order changes), so code stays; check whether section-comment narrative/order needs light updates to match.

## Out of scope

- No change to the softmax/value/sink mechanics themselves.
- No new widgets beyond the WhyAttentionMatters enhancement.
- No changes to other chapters.
