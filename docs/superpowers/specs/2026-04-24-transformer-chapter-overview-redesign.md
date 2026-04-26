# Transformer chapter — overview-first redesign

**Date:** 2026-04-24
**Status:** Spec, awaiting implementation plan

## Summary

Rework Chapter 9 (`/transformers`) so a middle-schooler can build a deep intuition for how a transformer thinks, in a clear progression:

1. A new bird's-eye **overview widget** that shows the whole stack as a token×layer grid, with attention as variable-weight edges and residuals as bold same-token edges. Click any cell for its representation; click any layer label for a layer-level summary. Drives the entire mental model.
2. The existing `TransformerInAction` (astronaut walk-through), unchanged.
3. The existing `TransformerBlockDiagram` (the block internals), repositioned **after** the two playgrounds, with residual / layer-norm / feed-forward folded in as short prose subsections (no dedicated widgets).
4. The existing `VectorSubspaceFig` ("how can one vector hold many ideas"), unchanged, placed after the block diagram.
5. "Big Picture" recap + `TryItInPyTorch`, kept.

Six widgets and two prose sections are dropped. Every sentence in what remains earns its space.

## Goals

- A transformer's "shape" — stacked layers, per-layer attention, residual flow, single next-word readout — is graspable in under a minute by a middle-schooler.
- The new overview is the chapter's emotional anchor: it should make the rest feel like zooming in, not piling on.
- The astronaut example carries through the whole chapter so the reader is always referring to one concrete sentence.
- No section is tutorial padding — every paragraph adds an idea the reader cannot get from the widget alone.

## Non-goals

- No changes to model weights, training, or any of the runtime PyTorch material.
- No new prose for `TransformerBlockDiagram`'s content in this spec — the text rewrite for that widget is explicitly deferred to a follow-up.
- No new playgrounds beyond the overview widget. Additional playgrounds may be added later only if a draft section feels dry.

## Final chapter outline

In order:

1. **Lead** — one or two sentences. What makes a transformer different from any earlier piece of the book.
2. **A bird's-eye view of a transformer** — new overview widget + surrounding prose. The neural-network analogy ("the wiring changes for every sentence") is surfaced here.
3. **A transformer in action** — existing `TransformerInAction`. Heading and surrounding prose tightened, but the widget itself is unchanged.
4. **Inside one transformer block** — existing `TransformerBlockDiagram`. Three short prose subsections folded in:
   - **Residual connection** — replaces the dedicated widget; explains why each layer adds rather than overwrites.
   - **Layer normalization** — replaces the dedicated widget; one paragraph on keeping the numbers manageable.
   - **Feed-forward network** — kept as today, possibly trimmed.
5. **How can one vector hold many ideas?** — existing prose + `VectorSubspaceFig`, unchanged.
6. **The Big Picture** — recap list, kept.
7. **TryItInPyTorch** — kept.

### Dropped from the chapter

Widgets removed (component files may stay in the repo, but their MDX usage and dynamic imports are removed from this chapter):

- `MicroTransformer`
- `DepthComparison`
- `LiveTransformer`
- `TransformerXRay`
- `PrefixAttention`
- `ResidualConnection`
- `LayerNorm`

Prose sections removed:

- "From Tiny to Titan"
- "A Nuance: Prompt vs Generation"

The `CausalMask` widget is already not used in the chapter — no action needed.

## New overview widget — design

### Where it lives

- New widget at `src/components/widgets/transformers/TransformerOverview/` (its own folder; pattern follows `TransformerInAction/`).
- Dynamically imported and wrapped via `widgets.tsx` and named `TransformerOverviewWidget` in MDX.
- Reuses the astronaut example data from `TransformerInAction/astronaut-example.ts` — the same 13 tokens, the L0 input row, the five transformer layers L1–L5, and the Predict readout (seven rows total), and the same per-token reps and head pulls. **Source of truth:** the `tokens[i].reps[Lk]` and `tokens[i].headCards[Lk][headId].pulls` already in that file.

### Layout

A token × layer grid rendered as SVG, with surrounding HTML for the popup overlay.

- Columns: one per token (13 for the astronaut sentence). Cell width 50px, uniform across all rows including the input row.
- Rows, bottom to top: `L0` (input embeddings) → `L1` … `L5` → `Predict`.
- Layer name labels in a left gutter; no separate header row above the grid.
- Each cell shows its token name.
- The Predict row contains a single cell on the last token's column (the prediction slot), plus a small "→ planet" output box to its right showing the model's top guess (data: `astronautExample.predictions[0]`).

### Edges

Two visually distinct kinds of arrows, both with arrowheads, drawn from the layer below to the layer above (consumer is the upper cell):

- **Residual** — amber (`#ea580c`), bold (stroke-width ~1.8), straight vertical, one per cell per transition. Drawn for every column at every transition (L0→L1, …, L4→L5), plus L5→Predict only on the last token's column.
- **Attention** — blue (`#2563eb`), curved bezier, stroke-width proportional to the head's weight. Edge list is taken **verbatim** from the astronaut example's per-token `headCards[Lk][headId].pulls`. Half-weight pulls (e.g. saw and her each splitting between Mars and sky at L2; blue splitting between saw and her at L5) render visibly thinner. Arrows are causal — never lean leftward at the destination.

### Interactions

**Click a cell:**

- Cell highlights in amber (selected style: `#fde68a` fill, `#b45309` border).
- A speech-bubble popup appears, with a small triangular pointer aimed at the selected cell. Popup contents:
  - Header: token name + layer label (e.g. "her · after L3 (Resolve pronouns)").
  - Body: the token's rep at that layer (`tokens[i].reps[Lk]`).
  - Close button (✕). Clicking outside the popup also closes it.
- All cells that fed into the selected cell are also lit up with a softer highlight:
  - The same column on the layer below (residual source).
  - Every column the head(s) at this layer pulled from (attention sources, taken from `tokens[i].headCards[Lk]`).
- Selecting another cell moves the popup; closing returns to the unselected state.

**Click a layer label:**

- Layer label highlights.
- A speech-bubble popup appears, pointer aimed at the label. Popup contents:
  - Header: layer label (e.g. "L3 — Resolve pronouns").
  - Body: a short summary of what the layer does (1–2 sentences, written for middle-school reading level — these are new copy for this widget; do not reuse `LayerDef.description` verbatim if it is too long).
- Clicking outside or another layer label closes/swaps.

Cell popups and layer popups are mutually exclusive — opening one closes the other.

### Reset

`WidgetContainer`'s reset clears any selection and closes any popup.

### Accessibility

- Every cell and layer label is a real focusable button with `aria-label` describing its position (e.g. "her at layer 3 — click to inspect").
- Popup is rendered as a dialog with focus management.
- The SVG includes `role="img"` and a top-level `aria-label` describing the diagram.

### Surrounding prose

Two short paragraphs frame the widget:

- Before: one sentence framing the goal ("here's the whole architecture in one picture").
- After: the neural-network analogy. It looks like a neural network, but the blue wiring changes for every sentence — attention is the model rewiring itself on the fly to suit the input. This is the "aha" moment for the chapter.

## Other chapter changes

- `widgets.tsx` — remove imports and exports for the seven dropped widgets; add the new overview widget.
- `content.mdx` — rewrite per the outline above. New section bodies are kept tight (target: a typical section is 3–6 short sentences plus the widget). Re-use existing prose where it already passes the "earns its space" test.
- `src/lib/curriculum.ts` — chapter description may need a line touch-up if the current copy implies dropped widgets; otherwise unchanged.
- `notebooks/transformers.ipynb` — unchanged in this spec; revisit only if dropped sections were referenced.
- The seven dropped widget components stay on disk for now (they are not imported anywhere else in the chapter, and removing files is out of scope for this redesign). A later cleanup PR can delete them.

## Out of scope (deferred)

- **Rewriting the text inside `TransformerBlockDiagram`.** The user has flagged this as a follow-up. The block diagram itself stays as-is in this redesign; only its surrounding MDX prose changes.
- Deleting unused widget component files.
- Adding more interactive playgrounds beyond the overview widget.

## Migration order (rough)

A subsequent implementation plan will sequence the work, but the natural order is:

1. Build the new overview widget end-to-end (data, layout, edges, interactions) without touching `content.mdx` yet.
2. Update `widgets.tsx` to expose the new widget and stop exposing the seven dropped ones.
3. Rewrite `content.mdx` to the new outline.
4. Run `pnpm lint` (includes the raw-`<p>` MDX check), `pnpm build`, and Playwright tests.
5. Manually verify in the browser: read the chapter top-to-bottom, click every cell + every layer label in the new widget, confirm popups, source-cell highlights, and reset all behave as specified.

## Open questions

None at spec time. The TransformerBlockDiagram text rewrite is the only known follow-up and is explicitly deferred.
