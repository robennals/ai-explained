# Attention Chapter Revision — Design

**Date:** 2026-05-01
**Scope:** `src/app/(tutorial)/attention/content.mdx` and widgets under `src/components/widgets/attention/`.

## Context

An 11-year-old test reader hit several confusion points in the attention chapter:

1. The first toy uses noun-key=3 instead of 1 — but softmax hasn't been introduced yet, so the choice is unmotivated.
2. The first attention playground only lets you click "it." Other tokens are visibly inert.
3. In `blah blah blah it`, "it" attends to itself with no explanation.
4. "it" doesn't have a value, which feels arbitrary.
5. Percentages appear in the toy widget without softmax having been explained.
6. In BERT, the "pronoun" head does sensible things for "it" but weird things for non-pronoun tokens (e.g., "the" → "the", "anyway" → "was not but"). The kid noticed and the chapter doesn't address it.
7. The `Values` playground shows up many sections after the first attention playground, and feels like a near-duplicate the reader has already seen.
8. The "Where the vectors come from" section uses long words the reader had forgotten and a diagram that isn't fully self-explanatory.

The unifying root cause for issues 1, 3, 5 is that **softmax is taught too late**. The unifying root cause for issues 2, 3, 4, 6 is that **the chapter has no concept of an attention sink** (where attention goes when nothing relevant is around, or when a head doesn't apply to the current token). Issue 7 is a layout problem caused by interleaving real-model widgets (BERT, Live) between the K/Q toy and the values toy.

## Goals

- A reader who has just finished the previous chapter and has no more help than the chapter itself can build the entire attention mechanism from dot products to multi-head, with each step adding only one new idea on top of what they already understand.
- Every visible behavior in every widget has a sentence in the prose explaining it. No "ugly hacks" hiding things.
- Real-model widgets (BERT, Live, QKVProjection) come *after* the toy is fully built, so they have nothing left to be mysterious about — and the prose around BERT can name what each weird-looking pattern is (e.g., a head's sink behavior).
- This is **Approach B** in the brainstorm: light reorder + new sink section + surgical widget fixes. Heavier rework of BERT or QKVProjection is deferred (Approach C) and only escalated to if a re-test still confuses the reader.

## Approach summary

Restructure the chapter into four small steps that each add one concept, then plug the existing real-model material in afterwards.

```
1. Some Words Need Other Words            (unchanged)
2. Building Attention: Match Scores       (NEW step 1 — raw dot products, 1/0 vectors)
3. Softmax: Dividing Your Attention       (MOVED UP — explainer, then return to toy and crank up query)
4. Values: What Did You Find?             (MOVED UP — value blending, "two dogs → more confident")
5. When Nothing Matches: The Sink         (NEW step 4 — sink dim in keys/queries/values)
6. Multi-Headed Attention                 (MOVED UP — concept before BERT)
7. Attention in a Real Model (BERT)       (existing, with new prose explaining sinks)
8. A Live Attention Model                 (unchanged)
9. Where the Vectors Come From            (simplified prose; diagram unchanged for now)
10. What We've Built                      (existing recap, updated to match new flow)
```

## Vector designs across the four toy steps

The toy vocabulary stays at four tokens — **cat**, **dog**, **blah** (filler), **it** (pronoun) — through all four steps. Each step extends the vector schema from the previous step. Every cell shows what the reader sees at that step; numbers were chosen to give pedagogically clean softmax results in a 4-token sentence.

### Step 1 — raw dot products only, no percentages

Single-dimension keys and queries, all 1/0.

| Token | Key (advertises) | Query (looks for) |
|------|------|------|
| cat  | [1] | [0] |
| dog  | [1] | [0] |
| blah | [0] | [0] |
| it   | [0] | [1] |

Reader behavior:
- Click "it" in `cat blah blah it`: scores `[1, 0, 0, 0]`. Visible as raw match scores. No percentages.
- Click "cat" in any sentence: scores `[0, 0, 0, 0]`. The widget labels this honestly: "cat isn't asking anything in this head."
- Self-attention is in the math (it.q · it.k = 0 · 1 = 0), and visibly so — the selected token's key is shown alongside everyone else's.

### Step 2 — softmax, then crank up the query

After the standalone softmax explainer, return to the toy. First show what softmax does to keys/queries left at 1/0:

`softmax([1, 0, 0, 0]) ≈ [0.475, 0.175, 0.175, 0.175]` — 47% on cat, 53% leaking to filler.

This is the motivating problem. Reader sees "47% isn't crisp enough — half of attention leaks to filler." Solution: turn up the *query magnitude* — leave the keys at 1/0 (they describe the world), make the asker care more.

| Token | Key | Query |
|------|------|------|
| cat  | [1] | [0] |
| dog  | [1] | [0] |
| blah | [0] | [0] |
| it   | [0] | [3] |

`softmax([3, 0, 0, 0]) ≈ [0.87, 0.04, 0.04, 0.04]` — 87% on cat. The leak is small but real, and we leave it visible.

The widget at this step shows percentages and lets the reader toggle the query magnitude (1 → 3) to see the leak shrink. This is where softmax stops being abstract and starts being attention.

### Step 3 — values added

Same keys and queries as step 2. New 2-dim value vector for each token.

| Token | Value (cat-ness, dog-ness) |
|------|------|
| cat  | [1, 0] |
| dog  | [0, 1] |
| blah | [0, 0] |
| it   | [0, 0] |

Sentence selector restricted to "it" sentences with at least one noun match (`cat blah blah it`, `cat blah dog it`, `dog blah dog it`). Behaviors:

- `cat blah blah it`: result ≈ [0.87, 0] = "mostly cat."
- `cat blah dog it`: result ≈ [0.476, 0.476] = "half cat, half dog — the model isn't sure which."
- `dog blah dog it`: result ≈ [0, 0.95] = "almost pure dog."

Compare `dog blah blah it` (one dog, result ≈ [0, 0.87]) with `dog blah dog it` (two dogs, result ≈ [0, 0.95]). **Two of the same noun → more confident**, because softmax's denominator dilutes the leak. This is the first place we hammer that property.

`it`'s value is `[0, 0]` — the chapter must explicitly call this out (don't hide it). "it" carries no cat-ness or dog-ness. Step 4 will give it a non-zero "nothing" dimension; for now, `[0, 0]` means "nothing useful gathered yet."

The chapter promises here: "what if there's no noun to find? We'll come back to that." Don't let the reader select `blah blah blah it` yet.

### Step 4 — the sink

Add a second dimension to keys and queries (sink), and a third dimension to values (nothing). Every token gets a small constant in the sink dimension.

| Token | Key (noun, sink) | Query (noun, sink) | Value (cat, dog, nothing) |
|------|------|------|------|
| cat  | [1, 1] | [0, 1] | [1, 0, 0] |
| dog  | [1, 1] | [0, 1] | [0, 1, 0] |
| blah | [0, 1] | [0, 1] | [0, 0, 1] |
| it   | [0, 1] | [3, 1] | [0, 0, 1] |

This is the unified design. All tokens are clickable, all sentences (including `blah blah blah it`) are selectable. Concrete behaviors:

- `cat blah blah it`, click "it": scores `[4, 1, 1, 1]` → softmax `[0.87, 0.04, 0.04, 0.04]`. Result ≈ [0.87 cat, 0, 0.13 nothing] — mostly cat with some I-don't-know fallback. (Softmax is shift-invariant, so this is the same distribution as step 2's `[3, 0, 0, 0]`.)
- `dog blah dog it`, click "it": scores `[4, 1, 4, 1]` → softmax `[0.476, 0.024, 0.476, 0.024]`. Result ≈ [0, 0.95 dog, 0.05 nothing] — the second dog drowns out the sink. Reinforce the step-3 confidence property: more matches → smaller sink leak.
- `blah blah blah it`, click "it": scores `[1, 1, 1, 1]` → uniform 25% each. Result = [0, 0, 1] — pure "nothing." Honest fallback. The chapter answers issue 3 directly: "softmax always allocates 100%. If nothing matches better than the sink, attention spreads evenly across the sinks, and you gather no useful information."
- Click "blah" in any sentence: blah's query `[0, 1]` matches every key in the sink dim → uniform 25%. Result ≈ mostly nothing. The widget labels this honestly: "blah isn't asking the noun-finding question, so this head is idle for it."

The 13% leak in case 1 is intentionally visible. It reinforces "softmax is fuzzy, real attention is fuzzy."

The chapter at this step also notes that real models don't always use self-as-sink — heads also park on punctuation, on a sentence-start token, or on the previous word. This is the bridge to BERT's "pronoun head does weird things for non-pronouns."

## Widget plan

Four toy widgets, each one tiny step beyond the previous. Reusing as much UI as possible — they're all variations on the same row-of-tokens-with-arrows-and-cards layout that `ToyAttention` already has.

| Widget | Status | Replaces / based on |
|------|------|------|
| `WhyAttentionMatters` | unchanged | — |
| `ToyAttentionScores` | new (step 1) | replaces `ToyVocabTable`; reuses `ToyAttention` layout but strips percentages and softmax |
| `SoftmaxExplorer` | unchanged, moved up | — |
| `ToyAttentionSoftmax` | new (step 2) | extends `ToyAttentionScores` with percentages and a query-magnitude toggle (1 ↔ 3) |
| `ToyAttentionValues` | modified (step 3) | existing widget; restrict sentence selector to it-with-match cases; add `dog blah dog it` example; add explicit "two dogs → more confident" callout |
| `ToyAttentionSink` | new (step 4) | extends `ToyAttentionValues` with a 2nd key/query dim and 3rd value dim; all tokens clickable; all sentences selectable; explanation box that names what each result means |
| `BertAttention` | prose-only changes around it | widget unchanged for now |
| `LiveAttention` | unchanged | — |
| `QKVProjection` | unchanged for now | escalate to redesign only if re-test still fails |

The current `ToyAttention` widget (the K/Q-only attention playground that comes after `ToyVocabTable`) is retired in favor of the four-stage progression above. Its arrow-overlay and card-row code is the basis for `ToyAttentionScores`, `ToyAttentionSoftmax`, and `ToyAttentionSink`.

The current `ToyValueTable` widget (the standalone values table that precedes `ToyAttentionValues`) is retired — values are introduced inside `ToyAttentionValues` itself.

### Behavior shared across the four toy widgets

- All four show key + query columns for **every** token, including the selected one. The current chapter swaps the selected token's display to query-only and only shows keys for others; this fix addresses issue from son's feedback ("show the key of the selected item just like the other keys").
- All four make every token clickable. Clicking a non-asking token shows real (often uniform) attention with an explanation, not an inert UI.
- Steps 2-4 show percentages; step 1 shows raw scores only.
- Steps 3-4 show the blended value vector below the row, with an explanation box reading the result in plain English ("mostly cat", "half cat, half dog", "nothing useful gathered").

## Section-level prose direction

### 2. Building Attention: Match Scores

Single section that introduces keys, queries, and dot products with the step-1 vectors. The reader leaves this section knowing: every token has a key (what it advertises) and a query (what it's looking for); a dot product scores how well a query matches a key; bigger score means better match. No mention of softmax or percentages yet.

### 3. Softmax: Dividing Your Attention

Standalone softmax explainer first (existing prose + `SoftmaxExplorer` widget). Then return to the toy: "if we run softmax on our dot products, here's what happens with key-query=1." Show the leak. Then introduce the fix: scale up the query magnitude to 3. Reader sees the leak shrink. End with a sentence noting the leak doesn't fully disappear — that's softmax being honest.

### 4. Values: What Did You Find?

Existing prose, lightly rewritten to fit the new arrival point. The existing `ToyAttentionValues` widget gets modified: restrict the sentence selector to it-with-match cases for now, and add the `dog blah dog it` example. Add a paragraph after the widget making the "two dogs → more confident" point explicitly: this is softmax's denominator at work, the same property that will let the sink mechanism work cleanly in the next section.

End the section with an explicit promise: "what if there's no noun to find? Or what if a token isn't even asking the noun-finding question? We need a sensible answer in both cases."

### 5. When Nothing Matches: The Sink

New section. Introduces the sink dimension across keys, queries, values. The widget (`ToyAttentionSink`) lets the reader try every case: a clean noun-match (small leak), two-noun confusion (split + small leak), no-match-at-all (uniform sink → pure "nothing"), and clicking a non-asker (uniform sink → idle head).

Final paragraph names the bridge to real models: real heads can pick a different sink — the previous word, a sentence-start token, punctuation. Same idea, different parking spot.

### 6. Multi-Headed Attention

Existing content, moved up to here from its current position. Now naturally introduces "real models run many of these mechanisms in parallel, each looking for a different thing." This sets up BERT.

### 7. Attention in a Real Model (BERT)

Existing widget unchanged. Add one paragraph before or after the widget that explicitly addresses the kid's BERT confusion: "When a head doesn't apply to a token — like the pronoun head looking at the word 'the' — it doesn't get to opt out. It still has to assign 100% somewhere, so it parks attention on a sink. In this BERT head, the sink looks like 'attend to yourself' for most tokens, with the real pronoun-resolution behavior only kicking in for actual pronouns. The weird-looking patterns for non-pronoun tokens are the head being idle, not broken."

### 8. A Live Attention Model

Existing prose, unchanged.

### 9. Where the Vectors Come From

Surgical simplification. Replace "single-layer neural network" (which the kid had forgotten by chapter 5) with "a small set of learned weights — the same kind of weighted-sum layer we used in chapter 3." Keep the existing `QKVProjection` widget. Trim any extra jargon in the prose. Don't redo the diagram for now (deferred to Approach C).

### 10. What We've Built

Existing recap structure, updated to match the new flow. The five-step recap currently lists Q/K/V → dot products → softmax → weighted sum → multiple heads. Replace with: match scores → softmax → values → sink → multiple heads. Keep the existing closing transition to positions/RoPE.

## Out of scope

- Redesigning the BERT widget itself (head selection, head naming, examples). Approach C, deferred.
- Redesigning the QKV projection diagram. Approach C, deferred.
- Notebook updates. Pre-existing convention: notebooks mirror the chapter section by section, so `notebooks/attention.ipynb` needs follow-on updates *after* this chapter revision lands. Track separately; not part of this design.
- Touching anything outside the attention chapter (no changes to other chapters, the curriculum index, or the homepage).

## Verification

- `pnpm dev` and read through the chapter end-to-end. Every visible widget behavior is explained by surrounding prose.
- Every step's vectors produce the percentages claimed in this design (within rounding). Spot-check `dog blah dog it` (95% dog) and `blah blah blah it` (100% nothing) at step 4.
- `pnpm lint` and `pnpm build` pass.
- `npx playwright test` passes (if any tests reference the old widget names, update them).
- Re-test with the original 11-year-old reader. Every issue from the Context section has a corresponding place in the new chapter that addresses it.

## Open follow-ups

- After re-test, decide whether to escalate to Approach C (BERT widget rework, QKV diagram rework). Capture the kid's reactions in a follow-up doc next to this one.
- Notebook sync. Probably one PR, after the chapter prose stabilizes.
