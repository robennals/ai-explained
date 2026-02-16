# Plan: Chapter 1 Improvements from Kid Test-Read

**Context**: A 10-year-old test reader found several points of confusion in the computation chapter. These changes make the chapter more accessible to younger readers without dumbing it down.

---

## 1. Simplify character-encoding text + add callouts in widget

**Problem**: "e = 101" confused him (why not 5?). He doesn't know what Unicode is.

**File: `src/app/(tutorial)/computation/content.mdx` line 29**

Replace:
> **Text** is numbers. Every character has a number assigned to it (that's what Unicode is). The letter "H" is 72. The letter "e" is 101. Your text message is a sequence of numbers.

With:
> **Text** is numbers. Every character has a number assigned to it — the letter "H" has a number, so does "e", even the space between words. Your text message is a sequence of numbers.

**File: `src/components/widgets/computation/NumbersEverywhere.tsx` — TextTab**

Add an info callout below the character cards that explains:
- Characters use a system called **Unicode** that covers symbols, emoji, and every language — so numbers are bigger than alphabet positions
- Uppercase and lowercase get different numbers (A = 65, a = 97) — to a computer they're as different as "A" and "7"

Style: left-accent-border box with `bg-accent/5`, matching widget visual language.

---

## 2. Pulsing clickable elements + introduce playgrounds in text

**Problem**: He didn't realize the tabs were clickable.

### 2a. Pulse animation

**File: `src/app/globals.css`**

Add a `@keyframes gentle-pulse` animation that subtly pulses a box-shadow using the accent color, plus a `.pulse-hint` utility class.

**File: `src/components/widgets/computation/NumbersEverywhere.tsx`**

- Add `hasInteracted` state (default `false`), set to `true` on first tab click
- Apply `pulse-hint` class to non-active tab buttons while `!hasInteracted`
- Same pattern in `LookupTableExplosion.tsx` for its Image/Text/Sound type tabs

### 2b. Introduce playgrounds in text

**File: `src/app/(tutorial)/computation/content.mdx`**

Replace the "Try it yourself:" line before the first widget with:

> Throughout this tutorial, you'll find interactive **playgrounds** like the one below. These aren't just pictures — you can click on the tabs, type, drag sliders, and experiment. Try it yourself:

---

## 3. Image tab improvements

**Problem**: Unclear how numbers form rows. Editing feels disconnected from the numbers.

**File: `src/components/widgets/computation/NumbersEverywhere.tsx` — ImageTab**

Rework the number display area:
- **Row separators**: Each row gets a label (`Row 0`, `Row 1`...) and a bottom border. Clear visual grouping.
- **Pills**: Each RGB triplet wrapped in a `rounded-full` pill with subtle background
- **Color swatches**: A tiny colored square before each triplet
- **Flash on edit**: When a cell is painted, its corresponding pill briefly highlights (`bg-accent/20` with `transition-colors`). Use a `flashCell` state + 400ms timeout.

---

## 4. Exact-match target in Parameter Playground

**Problem**: The sin+cos target can't be exactly matched by a cubic. Kid gets frustrated thinking he can't do it.

**File: `src/components/widgets/computation/ParameterPlayground.tsx`**

Change target to an achievable cubic:
```js
function targetFn(x) {
  return 0.2 + 0.7 * x - 0.15 * x * x - 0.25 * x * x * x;
}
const BEST_FIT = { a: 0.2, b: 0.7, c: -0.15, d: -0.25 };
```

This curve still looks interesting (has a local max, local min, inflection point) but the kid CAN match it exactly. Approximation is introduced in later chapters.

---

## 5. Explicit finite inputs in lookup table section

**Problem**: Not obvious WHY a lookup table could theoretically work (because inputs are finite).

**File: `src/app/(tutorial)/computation/content.mdx` — "The Lazy Solution" section**

Before "Problem solved... right?", insert a paragraph making the finite insight explicit:

> This might sound crazy, but think about it: **the number of possible inputs is always finite**. A 512×512 image has a fixed number of pixels, and each pixel has a fixed number of possible colors — so there's a definite, countable number of possible 512×512 images. A text message has a maximum length, and each character comes from a finite set — so there's a finite number of possible messages. Since the inputs are finite, you could — in principle — list every one and write the correct answer next to it.

This creates the satisfying "wait, actually..." moment when the widget reveals the numbers are impossibly large.

---

## Files to modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Add `gentle-pulse` keyframe + `.pulse-hint` class |
| `src/app/(tutorial)/computation/content.mdx` | Simplify character-encoding text; add playground intro; expand finite-inputs paragraph |
| `src/components/widgets/computation/NumbersEverywhere.tsx` | TextTab: Unicode/case callout. ImageTab: row separators, pills, swatches, flash. Tabs: pulse hint |
| `src/components/widgets/computation/ParameterPlayground.tsx` | Change target to achievable cubic |
| `src/components/widgets/computation/LookupTableExplosion.tsx` | Add pulse hint to type tabs (same pattern) |

## Implementation order

1. `globals.css` — pulse animation (no dependencies)
2. `ParameterPlayground.tsx` — two-line target function change
3. `content.mdx` — all three text edits
4. `NumbersEverywhere.tsx` — callout, image tab rework, pulse (largest change)
5. `LookupTableExplosion.tsx` — pulse on tabs

## Verification

- `pnpm dev` and visually check each widget in the chapter
- Confirm tabs pulse until first click, then stop
- Confirm TextTab shows Unicode callout with uppercase/lowercase note
- Confirm ImageTab shows pills with color swatches, rows separated, flash on paint
- Confirm ParameterPlayground target can be matched to error ≈ 0.0000
- Confirm content.mdx reads naturally without mentioning specific character codes
- `pnpm lint` passes
- `pnpm build` succeeds
