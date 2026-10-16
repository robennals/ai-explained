# Mobile widget usability: audit and plan

> **Status (2026-10-16):** phases 1–3 below are implemented. A follow-up readability pass also brought every widget to at least 10px text and 24px tap targets on a 390px phone. Still open: the ongoing mobile test and the analytics check.

**Summary.** Every widget in the 14 published chapters was checked at phone size (390×844, touch on) on 2026-10-15. **None is unusable on a phone, but about 20 are frustrating.** The problems cluster in a handful of shared components and recurring patterns, so roughly six shared fixes cover most of them. A Playwright test (with an allowlist of known problems) then stops new problems from being introduced.

The audit does **not** support "Optimization and Neural Networks widgets are broken" as the main cause of the mobile drop-off after Computation. Computation and Optimization have no broken widgets, only friction. Before treating widgets as the whole story, check the GA split described in [Check the analytics](#check-the-analytics).

## How the audit was done

- **Measured every widget automatically.** A scratch Playwright spec loaded each chapter on a production build and recorded, per widget: content clipped past the right edge, hidden width in sideways-scrolling areas, tappable things under 24px or 32px, and the smallest rendered text (including SVG text after scaling). It also took a screenshot of each widget.
- **Reviewed each widget by hand.** Agents read each widget's screenshot and source, then drove the doubtful ones with real touch events: taps, drags, and whether the page scrolled during a drag.

## What's wrong, grouped by cause

### Shared components (fix once, helps many widgets)

1. **`SliderControl` is hard to grab** (`src/components/widgets/shared/SliderControl.tsx`, used by 34 widgets). The thumb is 16px and the touch strip is 20px tall. The fixed label (96px) and value (48px) columns leave about 170px of track on a phone. Touch dragging itself works, because the slider already sets `touch-none`.
2. **`WidgetTabs` hides later tabs** (`shared/WidgetTabs.tsx`). The tab row scrolls sideways with no hint that more tabs exist; up to 665px is hidden (Five ways to tell a model…). Labels get cut mid-word. "Go to Next Tab" softens this. Affects about 15 widgets.
3. **`VectorCard` doesn't fit a phone** (`vectors/VectorCard.tsx`). It is `shrink-0 overflow-hidden` with fixed label, bar and value widths (about 182–196px). In 2- and 3-column grids, numbers and bar ends are silently clipped. In Combining Vectors, the modifier bars are completely invisible. Affects 5 of 9 Vectors widgets.

### Recurring patterns (need a per-widget change, but the same change each time)

4. **SVG text shrinks below readable size.** Drawings 500–680 units wide are scaled down to about 350px, so `fontSize` 8–11 renders at 4.5–8px. Examples: Embedding as a Network Layer (4.5px), Your First Neuron (4.6px), 1D Transformation (5.8px), Mixing Rotation Speeds (5.2px), Parameter Playground (7.7px). The `useSvgScale` hook already exists, but few widgets use it.
5. **Token rows hide the token that matters.** Five attention and positions widgets put the sentence in a sideways scroller, and the query word "it" (near the end) starts off-screen. The guiding arcs point off-screen.
6. **Text boxes under 16px** (seven widgets in Embeddings and Next-Word Prediction). iOS Safari zooms the page whenever one is focused. This was inferred from known Safari behaviour, not reproduced (Chromium doesn't do it).
7. **Side-by-side layouts that never stack.** The Row View (sliders clipped 34px) and Sharp vs. Smooth (fixed `width={420}` SVG, caption cut off on both sides).
8. **Controls far from what they change.** Mixing Rotation Speeds has 16 sliders above the chart. In A Transformer In Action, "Next layer" ends up about 1,550px below the passage. In Embedding Arithmetic, 18 preset chips push the results off-screen.
9. **Wording says "click" or "hover".** Several instructions say this; it should be "tap" or neutral wording.

### One-off problems

- **Numbers Everywhere (chapter 1, first widget):** painting uses mouse events only, so dragging a finger across the grid paints nothing and scrolls the page; a tap paints one pixel. The text says "Hover over a pixel… click or drag". Highlighting is hover-only.
- **Your First Neuron / Neurons as Smooth Logic:** sliders are drawn inside the SVG via `foreignObject` and shrink to about 41×3px. These are the main hands-on widgets of the Neural Networks chapter.
- **A Transformer At a Glance:** the layer popup is clipped off the left and bottom of the screen.
- **Sigmoid Explorer:** `touch-none` covers the whole chart, so a swipe on it can't scroll the page.
- **Two Dimensions of Meaning:** word labels overlap at phone width (bear/mole, whale/jellyfish), and the tab's own text refers to that pair.
- **Changing Dimensions:** a raw escape shows in the description on every screen size (not just phones).

### Per-widget ratings

HARD = works but frustrating; COSMETIC = minor. Unlisted widgets are OK. No widget was rated BROKEN.

| Chapter | HARD | COSMETIC |
|---|---|---|
| Computation | Numbers Everywhere, Parameter Playground | Function Machine (tabs), Lookup Table Explosion |
| Optimization | — | Measuring the Error, Search: Blind vs. Guided, Smooth vs. Non-Smooth, Gradients in Real Life, Gradient: Slope Points Downhill |
| Neural Networks | Your First Neuron, Neurons as Smooth Logic, Sharp vs. Smooth | A Neural Network, The Artificial Neuron, Sigmoid Function, Gates Wired Together, Two Neurons Solve XOR |
| Vectors | Describing Things with Vectors, Combining Vectors, What and How Much | Measuring Similarity, A Neuron Is a Dot Product, Bias Shifts |
| Matrices | 1D Transformation, The Row View | Changing Dimensions, Neurons = Matrix Mult., Activation Functions |
| Embeddings | Two Dimensions of Meaning, Embedding Arithmetic, Embedding as a Network Layer | One Dimension…, Try a Real Embedding, Word Pair Spectrum, Tokenizer, Learn an Embedding |
| Next-Word Prediction | — | Guess the Next Word, Bigram Explorer, Neural Network Predictor |
| Attention | Query Key and Value, Scoring the Match, Gathering the Value | Softmax Explorer, Attention Sink |
| Positions | ALiBi, Rotation Applied to a Dimension, Mixing Rotation Speeds | Shapes of Distance Falloff, Rotation and Dot Product |
| Transformers | At a Glance, In Action | — |
| Post-training → Agents | — | Tool-use loop, Loading a skill, Remembering (text wrapping) |

## The plan

Ordered by reader impact: early chapters first, since that's where the drop-off is, and shared fixes before one-offs.

**Phase 1: shared fixes and chapter 1 (small, high leverage)**
1. **`SliderControl`:** touch area at least 32px tall, a 22–24px thumb, and the label stacked above the track below the `sm` breakpoint so the track gets the full width.
2. **`WidgetTabs`:** wrap tabs onto two lines on narrow screens (or add an edge fade plus a "2 / 4" counter), and use tighter padding.
3. **Global 16px rule** for `input`, `textarea` and `select` below `sm` (in `globals.css`).
4. **Numbers Everywhere:** move painting to pointer events with `touch-action: none` on the grid only; change the wording to "tap"; show the selected pixel's values next to the grid on phones.
5. **Parameter Playground:** scale the legend text with `useSvgScale` (sliders are covered by item 1).
6. **"Click"/"hover" → "tap"** wording sweep across widget text.

**Phase 2: chapters 2–5**
7. **SVG text:** apply `useSvgScale` (or a narrower mobile viewBox) to the widgets listed under pattern 4, starting with Optimization and Neural Networks.
8. **Neuron sliders:** on phones, move the `foreignObject` MiniSliders out of the SVG into a normal stacked list of `SliderControl`s (one shared fix for both widgets).
9. **`VectorCard`:** flexible bar width (`flex-1 min-w-0`, no `shrink-0`), and stack the card grids to one column below `sm`.
10. **Stack the layouts:** Sharp vs. Smooth (viewBox + `w-full`) and The Row View (`grid-cols-1 sm:grid-cols-2`).
11. **Sigmoid Explorer:** move `touch-none` from the whole SVG to just the drag strip.

**Phase 3: later chapters**
12. **Token-row auto-scroll hook** that keeps the query token and the selected token in view (five widgets), plus a sticky label column.
13. **Transformer widgets:** clamp the At a Glance popup inside the screen; on phones, show In Action's attention table as stacked cards and put "Next layer" near the passage.
14. **Controls near the output:** a sticky chart in Mixing Rotation Speeds; presets collapsed into a dropdown in Embedding Arithmetic.
15. **Remaining cosmetic items** from the table above.

## Keeping it fixed: an ongoing mobile test

**A Playwright suite that fails when a widget gets worse on a phone**, with an allowlist so it can start passing today.

- **New `mobile` project in `playwright.config.ts`:** 390×844, `isMobile`, `hasTouch`. A `tests/mobile-widgets.spec.ts` reads the published chapters from `curriculum.ts` (so new chapters are covered automatically) and, for every `.widget-container`, checks:
  - **No horizontal page overflow**, and nothing clipped past the widget's right edge (except inside a deliberate sideways scroller).
  - **Rendered text at least 9px** (SVG text measured after scaling). Raise this to 10–11px as the fixes land.
  - **Tappable elements at least 24px** in their smaller dimension.
  - **Text inputs at least 16px.**
  - **No tabs hidden off-screen** in the tab row.
- **Allowlist file** (`tests/mobile-widgets.allowlist.ts`): `{ widget title → rule → reason }`, seeded with today's failures. The test fails on any **new** violation, and also on an allowlisted one that no longer happens, so the list shrinks as fixes land and can't go stale.
- **Static check in `pnpm lint`** (a script like `scripts/lint-mdx-no-raw-p.sh`): flag `onMouseDown`/`onMouseMove`/`onMouseEnter` in `src/components/widgets/` without a pointer or click handler in the same file. Mouse-only handlers caused the one real touch failure found, and the browser test can't detect them.
- **Screenshots as artifacts, not assertions.** The suite saves each widget's phone screenshot under `test-results/` for eyeballing. Pixel-comparison snapshots would be too flaky to assert on.
- **Where it runs:** the repo has no CI workflows. Options are `pnpm test:mobile` run locally before merging (through `heavy run`), or a new GitHub Actions workflow that builds and runs it. A workflow is the only way to make it truly ongoing.
- **Gotcha:** every Playwright run empties `test-results/` by default, so parallel runs wipe each other's screenshots. Give the mobile suite its own `outputDir`.

## Check the analytics

The site already sends `widget_interact`, `section_reached` and `chapter_complete` events. Split by device, these answer the real question directly:
- **Do mobile readers interact with specific widgets much less than desktop readers?** If so, those widgets are the friction points.
- **Where in Computation do mobile readers stop?** Is it right after a particular widget, or evenly throughout?
- **Does mobile traffic come from different sources** (e.g. social links, with lower intent)? That would explain a drop-off on every page, not just at widgets.

The GA4 tools weren't connected in this session (see `docs/analytics.md`, "Querying from Claude", step 4).
