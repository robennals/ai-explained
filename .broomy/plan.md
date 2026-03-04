# Plan: Positional Encoding as Its Own Chapter

## Why a Separate Chapter

Positional encoding is conceptually distinct from attention. The original attention paper (Vaswani et al., 2017) treated position as a separate concern — sinusoidal encodings added to embeddings before attention even runs. RoPE (2021) and ALiBi (2022) integrate position into attention, but the core question — "how do we tell the model where words are?" — is its own challenge that deserves dedicated treatment. Multi-head attention, by contrast, is a simple extension ("do it several times") and stays in the attention chapter.

## Structural Changes

### Attention chapter (chapter 7)
- Remove all positional encoding content (lines 62-125 of content.mdx)
- Remove the RotationPositionWidget and RoPEToyTokensWidget from the attention chapter
- End with multi-head attention, then a brief teaser: "There's one problem we haven't solved — our attention mechanism has no idea where words are. That's the next chapter."

### New chapter: Positional Encoding (new, between 7 and 9)
- Add to `curriculum.ts` as a new chapter (slug: `positions`, depends on attention)
- Update transformer chapter (9) to depend on this new chapter instead of (or in addition to) attention
- Create `src/app/(tutorial)/positional-encoding/` with page.tsx, content.mdx, widgets.tsx

## New Chapter Content Flow

### 1. Opening: The Position Problem
Set up the problem (adapted from current lines 62-67): attention is position-blind. "cat bla dog it" and "dog bla cat it" give identical scores. The model can't tell which noun is closer.

### 2. The Simplest Fix: Distance Penalties (ALiBi)
- Obvious idea: subtract `m · |i-j|` from each attention score
- This is ALiBi (Attention with Linear Biases), used by BLOOM, MPT
- Different heads get different slopes m (some local, some broad)
- Limitations:
  1. Per-head, not per-query — every query gets the same distance falloff
  2. Linear and additive — limited expressivity
  3. Empirically outperformed by RoPE at scale

### 3. The Rotation Trick
- Introduce the core idea: instead of adding a distance penalty after the dot product, encode position inside the vectors themselves by rotating them
- Keep the RotationPositionWidget showing same-gap/different-gap
- Keep the RoPEToyTokensWidget showing rotation helping "it" find the closer noun

### 4. Pairs of Dimensions
**Critical pedagogical point:** Be very explicit that RoPE takes two dimensions of the vector, treats them as the X and Y coordinates of a 2D point, and **rotates that point**. NOT multiplying each dimension by a separate sine wave. The distinction matters because:
- Rotation preserves the length (magnitude) of the 2D pair
- Both dimensions get mixed together, not independently scaled
- The dot product between two 2D vectors depends on the angle between them

Content:
- 128-dim Q/K vector → 64 pairs, each treated as a 2D point and rotated
- Different pairs rotate at different speeds (fast to slow)
- Solves wrap-around: no two positions share the same angle combination across all pairs (clock analogy)
- **Honest about modulation:** At different positions, each pair's dot-product contribution is modulated by distance. Fast pairs decay rapidly; slow pairs barely change. The model distributes signals accordingly.

### 5. How Queries Choose Their Distance Sensitivity
- Key advantage over ALiBi: per-query, not per-head
- Query concentrating signal in fast-rotating pairs → distance-sensitive
- Query concentrating signal in slow-rotating pairs → distance-insensitive
- Falls out naturally from learned Q/K weight matrices
- **New widget: RoPEDistanceSensitivityWidget**

### 6. Does Rotation Tell Us Direction?
- cos(θ) = cos(-θ), so rotation encodes distance but not direction
- Causal masking handles direction

### 7. Content and Position Stay Separated
- Trimmed version of current "Doesn't Rotation Destroy the Content?"
- Keep the KeyInsight: content lives in magnitudes, position lives in angles

### 8. Scaling to Huge Context Windows
- θ_base parameter, YaRN, NTK-aware scaling
- Keep as-is

## New Widget: RoPEDistanceSensitivity

**Purpose:** Show how different query vectors produce different attention-vs-distance curves depending on signal distribution across fast/slow dimension pairs.

**Design:**
- 3 dimension pairs: Fast (30°/pos), Medium (10°/pos), Slow (2°/pos)
- Two preset buttons: "Distance-sensitive" and "Distance-insensitive"
- 3 sliders to control signal magnitude per pair (0-1)
- 3 mini SVG circles showing the 2D rotation per pair at a reference distance
- SVG bar chart: attention weight vs distance [1, 2, 3, 5, 10, 20]
- Dynamic insight text

**Math:** For distance d, pair p: contribution = w_p² · cos(d · speed_p · π/180). Sum across pairs, softmax over distances.

**Presets:**
- Distance-sensitive: fast=1.0, medium=0.1, slow=0.1
- Distance-insensitive: fast=0.1, medium=0.1, slow=1.0

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/curriculum.ts` | Add new chapter entry, update transformer dependency |
| `src/app/(tutorial)/positions/page.tsx` | **CREATE** chapter page |
| `src/app/(tutorial)/positions/content.mdx` | **CREATE** chapter content |
| `src/app/(tutorial)/positions/widgets.tsx` | **CREATE** widget imports |
| `src/components/widgets/positions/RoPEDistanceSensitivity.tsx` | **CREATE** new widget |
| `src/app/(tutorial)/attention/content.mdx` | Remove positional encoding sections, add teaser |
| `src/app/(tutorial)/attention/widgets.tsx` | Remove RoPE widget registrations |
| `src/app/(tutorial)/attention/page.tsx` | Remove RoPE widgets from components |

**Move (not delete) from attention widgets:**
- `src/components/widgets/attention/RoPEToyTokens.tsx` → reference from new chapter
- `src/components/widgets/attention/RotationPosition.tsx` → reference from new chapter

(These widget files can stay in `widgets/attention/` and be imported from the new chapter's widgets.tsx — no need to physically move them.)

## Verification
1. `pnpm dev` — check both chapters read naturally, navigation works between them
2. Test new widget: presets, sliders, bar chart, reset
3. Test that attention chapter still works without the removed content
4. `pnpm lint`
5. `pnpm build`
