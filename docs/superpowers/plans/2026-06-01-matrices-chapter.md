# Matrices Chapter Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the unpublished `matrix-math` chapter as `matrices`, teaching that *a matrix is many dot products at once (a stack of detectors)*, showing a neural-net layer and attention are both matrix multiplication, with a fun 2D/3D-rotation aside that explains why GPUs run AI.

**Architecture:** A new pure-math module (`matrixMath.ts`, unit-tested with vitest) backs three React widgets — `DetectorStack` (the reusable core: matrix-as-stacked-dot-products, with inverse round-trip, activation step, and an attention preset), `MatrixComposition` (two matrices collapse into one), and `Transform2D3D` (a tabbed 2D/3D playground with an activation toggle, merged from the existing `Transform2D` + `Transform3D`). The chapter is rewritten in `content.mdx` on the curriculum's shared animal-vector framing. The folder, curriculum entry, glossary, appendix links, and companion notebook are renamed `matrix-math` → `matrices`.

**Tech Stack:** Next.js 16 (App Router), MDX (`@next/mdx`, remark-math/rehype-katex), React client widgets (`useState`, SVG, no canvas lib), Tailwind 4, vitest (unit), Playwright (smoke/e2e), Jupyter (companion notebook).

---

## Reference Facts (read before starting)

**Animal data** — `src/components/widgets/vectors/vectorData.ts` exports:
- `ANIMAL_DOMAIN: VectorDomain` with `properties: ["big","scary","hairy","cuddly","fast","fat"]` (6 dims) and 9 `items` (Bear, Rabbit, Shark, Mouse, Eagle, Elephant, Snake, Cat, Dog), each `{ name, emoji, values: number[6] }`, **unit-normalized** (self dot product ≈ 1).
- Helpers: `vecDot(a, b)`, `vecMagnitude(v)`, `vecNormalize(v)`.
- Types: `interface VectorItem { name: string; emoji: string; values: number[] }`, `interface VectorDomain { id: string; label: string; properties: string[]; items: VectorItem[] }`.
- Import: `import { ANIMAL_DOMAIN, vecDot, type VectorItem } from "@/components/widgets/vectors/vectorData";`

**Shared widget components** — `src/components/widgets/shared/`:
- `WidgetContainer({ title: string; description?: string; onReset?: () => void; children })` from `WidgetContainer.tsx`. Same file exports `TryItProvider({ content, label?, children })`.
- `SliderControl({ label: ReactNode; value; min; max; step?; onChange; onCommit?; formatValue?; ticks? })`.
- `SelectControl({ label; value; options: {value,label}[]; onChange })`.
- `ToggleControl({ label: string; checked: boolean; onChange: (b) => void })`.
- `WidgetTabs({ tabs: {id,label}[]; activeTab; onTabChange })` from `WidgetTabs.tsx`.

**Page-wiring pattern** (see `src/app/(tutorial)/vectors/widgets.tsx` + `page.tsx`): widgets are `dynamic(() => import(...).then(m => m.X), { ssr: false })`, wrapped in a `WidgetSlot` (Suspense + `TryItProvider`), exported as `XWidget({ children })`, and mapped into `<Content components={{ ... }} />`.

**MDX components** (`mdx-components.tsx`): `<Lead>`, `<KeyInsight>`, `<Callout type? title?>`, `<TryItInPyTorch notebook>`. **Never use raw `<p>`** (lint fails). Use `×` not `·`; reuse Vectors' animal/property names.

**Testing:**
- Unit (vitest, node env, `src/**/*.test.ts`): `pnpm test`. Pattern: `src/components/widgets/attention/toyMath.test.ts`.
- Smoke (Playwright): `tests/chapter-smoke.spec.ts` has a `CHAPTERS` array of `{ slug, h1Contains, widgetTitles }`. Run: `npx playwright test` (needs dev server).
- Lint: `pnpm lint`. Build: `pnpm build`. Notebooks: `pnpm test:notebooks`.

**Rename surface** (chapter is NOT `ready`, so no live URL / no redirects needed):
- `src/lib/curriculum.ts` (slug/title/subtitle/prerequisites)
- folder `src/app/(tutorial)/matrix-math/` → `matrices/` (`page.tsx`, `content.mdx`, `widgets.tsx`)
- `notebooks/matrix-math.ipynb` → `matrices.ipynb`
- `src/content/glossary/{matrix,matrix-multiplication,relu}.mdx` (`firstAppearance`)
- `src/app/(tutorial)/appendix-pytorch/content.mdx` (two `/matrix-math` links)

---

## Task 1: Rename `matrix-math` → `matrices` (keep old content working)

Mechanical rename only; the chapter keeps its existing (old) content and widgets so the build stays green. Title/subtitle/prereqs updated here too.

**Files:**
- Modify: `src/lib/curriculum.ts` (the `slug: "matrix-math"` chapter object, ~line 117)
- Rename: `src/app/(tutorial)/matrix-math/` → `src/app/(tutorial)/matrices/`
- Modify: `src/app/(tutorial)/matrices/page.tsx`
- Modify: `src/app/(tutorial)/matrices/content.mdx` (only the `<TryItInPyTorch notebook=...>` line)
- Rename: `notebooks/matrix-math.ipynb` → `notebooks/matrices.ipynb`
- Modify: `src/content/glossary/matrix.mdx`, `matrix-multiplication.mdx`, `relu.mdx`
- Modify: `src/app/(tutorial)/appendix-pytorch/content.mdx`

- [ ] **Step 1: Move the chapter folder and notebook with git**

```bash
git mv "src/app/(tutorial)/matrix-math" "src/app/(tutorial)/matrices"
git mv notebooks/matrix-math.ipynb notebooks/matrices.ipynb
```

- [ ] **Step 2: Update the curriculum entry**

In `src/lib/curriculum.ts`, replace the matrix-math chapter object (id 10) with:

```ts
  {
    id: 10,
    slug: "matrices",
    title: "A Thousand Questions at Once",
    subtitle: "Matrices",
    prerequisites: [7],
    description:
      "A matrix is just many dot products at once — a stack of detectors. That single idea is a neural-network layer, it's attention, and it's the 3D-rotation math GPUs were built for, which is why the chips made for videogames ended up running AI.",
  },
```

- [ ] **Step 3: Update `page.tsx` slug references**

In `src/app/(tutorial)/matrices/page.tsx`, change both slug strings (leave widget imports untouched for now):

```tsx
export const metadata = chapterMetadata("matrices");
// ...
  const { prev, next } = getAdjacentChapters("matrices");
```

- [ ] **Step 4: Point the chapter at the renamed notebook**

In `src/app/(tutorial)/matrices/content.mdx`, change the last component:

```mdx
<TryItInPyTorch notebook="matrices">
```

- [ ] **Step 5: Update glossary `firstAppearance`**

In each of `src/content/glossary/matrix.mdx`, `matrix-multiplication.mdx`, `relu.mdx`, change the frontmatter line:

```
firstAppearance: matrices
```

- [ ] **Step 6: Fix the appendix links**

In `src/app/(tutorial)/appendix-pytorch/content.mdx`, replace both occurrences of `](/matrix-math)` with `](/matrices)`.

```bash
grep -n "/matrix-math" "src/app/(tutorial)/appendix-pytorch/content.mdx"
```

Expected after edit: no matches.

- [ ] **Step 7: Verify no stale references remain in shipped content**

Run:
```bash
grep -rn "matrix-math" src/ notebooks/ --include="*.tsx" --include="*.ts" --include="*.mdx" --include="*.ipynb" | grep -v node_modules
```
Expected: only matches inside `notebooks/matrices.ipynb` body text (fixed in Task 12); none in `src/`.

- [ ] **Step 8: Build**

Run: `pnpm build`
Expected: PASS, with a route `/matrices` (no `/matrix-math`).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Rename matrix-math chapter to matrices (mechanics)"
```

---

## Task 2: Pure matrix-math module (`matrixMath.ts`) — TDD

The math behind every widget, isolated and unit-tested.

**Files:**
- Create: `src/components/widgets/matrices/matrixMath.ts`
- Test: `src/components/widgets/matrices/matrixMath.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/widgets/matrices/matrixMath.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { matVecMul, matMul, invert, relu, sigmoid, applyActivation } from "./matrixMath";

describe("matVecMul", () => {
  it("computes each row's dot product with the vector", () => {
    expect(matVecMul([[1, 0], [0, 1]], [3, 4])).toEqual([3, 4]);
    expect(matVecMul([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7]);
  });
});

describe("matMul", () => {
  it("multiplies identity to return the original", () => {
    const m = [[1, 2], [3, 4]];
    expect(matMul([[1, 0], [0, 1]], m)).toEqual(m);
  });
  it("composes two 2x2 matrices", () => {
    expect(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]]);
  });
});

describe("invert", () => {
  it("inverts the identity to itself", () => {
    expect(invert([[1, 0], [0, 1]])).toEqual([[1, 0], [0, 1]]);
  });
  it("inverse times original is identity (within tolerance)", () => {
    const m = [[4, 7], [2, 6]];
    const inv = invert(m)!;
    const prod = matMul(inv, m);
    expect(prod[0][0]).toBeCloseTo(1, 6);
    expect(prod[0][1]).toBeCloseTo(0, 6);
    expect(prod[1][0]).toBeCloseTo(0, 6);
    expect(prod[1][1]).toBeCloseTo(1, 6);
  });
  it("returns null for a singular matrix", () => {
    expect(invert([[1, 2], [2, 4]])).toBeNull();
  });
});

describe("activations", () => {
  it("relu clips negatives to zero", () => {
    expect(relu(-3)).toBe(0);
    expect(relu(2)).toBe(2);
  });
  it("sigmoid maps 0 to 0.5 and is monotonic", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 6);
    expect(sigmoid(10)).toBeGreaterThan(sigmoid(1));
  });
  it("applyActivation maps a function over a vector", () => {
    expect(applyActivation([-1, 0, 2], relu)).toEqual([0, 0, 2]);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm test -- matrixMath`
Expected: FAIL — `Cannot find module './matrixMath'`.

- [ ] **Step 3: Implement the module**

Create `src/components/widgets/matrices/matrixMath.ts`:

```ts
// Pure matrix helpers shared by the matrices-chapter widgets.
// A matrix is a number[][] in row-major order: matrix[r][c].

/** Multiply a matrix by a vector: each row's dot product with `vec`. */
export function matVecMul(matrix: number[][], vec: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, v, i) => sum + v * vec[i], 0));
}

/** Standard matrix product. `a` is m×n, `b` is n×p, result is m×p. */
export function matMul(a: number[][], b: number[][]): number[][] {
  const m = a.length;
  const n = b.length;
  const p = b[0].length;
  const out: number[][] = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      const aik = a[i][k];
      for (let j = 0; j < p; j++) out[i][j] += aik * b[k][j];
    }
  }
  return out;
}

/**
 * Invert a square matrix via Gauss-Jordan elimination.
 * Returns null if the matrix is singular (not invertible).
 */
export function invert(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Augment [matrix | identity].
  const aug = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let col = 0; col < n; col++) {
    // Partial pivot: find the largest-magnitude entry in this column.
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < 1e-9) return null; // singular
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const pv = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

export function relu(x: number): number {
  return x > 0 ? x : 0;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Apply a scalar activation to every element of a vector. */
export function applyActivation(vec: number[], fn: (x: number) => number): number[] {
  return vec.map(fn);
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm test -- matrixMath`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/matrices/matrixMath.ts src/components/widgets/matrices/matrixMath.test.ts
git commit -m "Add pure matrix-math module with vitest coverage"
```

---

## Task 3: `DetectorStack` widget — the core (§1)

The reusable centerpiece. Renders a matrix as a stack of dot-product rows over a high-dimensional input vector. Built props-first so later tasks (§2 inverse, §3 activation, §5 attention) extend it via props rather than forking.

**Files:**
- Create: `src/components/widgets/matrices/DetectorStack.tsx`

**Design / props interface** (define all of this now even though later tasks use the optional fields):

```tsx
import { ANIMAL_DOMAIN, vecDot, type VectorItem } from "@/components/widgets/vectors/vectorData";
import { matVecMul, invert, relu, sigmoid, applyActivation } from "./matrixMath";

export interface DetectorStackProps {
  /** Domain whose `properties` label the input dimensions and whose `items` are pickable. Defaults to ANIMAL_DOMAIN. */
  domain?: typeof ANIMAL_DOMAIN;
  /** Fixed input-row label, e.g. "query" for the attention preset. Default lets the user pick an input item. */
  mode?: "detectors" | "round-trip" | "attention";
  title?: string;
  description?: string;
}
```

- [ ] **Step 1: Implement the core "detectors" mode**

Create `DetectorStack.tsx` as a `"use client"` component exporting `function DetectorStack(props: DetectorStackProps)`. Core behavior for `mode === "detectors"` (the default):

- State: `inputName` (selected input animal, default `"Cat"`), `rowNames: string[]` (the reference animals = matrix rows, default `["Bear", "Eagle", "Snake", "Dog"]`).
- Derive: `input = domain.items.find(i => i.name === inputName)!.values`; `matrix = rowNames.map(n => domain.items.find(i => i.name === n)!.values)`; `output = matVecMul(matrix, input)`.
- Render inside `<WidgetContainer title={title ?? "A Matrix Is Many Dot Products"} description={description ?? "Each row is one detector. One multiply runs them all."} onReset={...}>`:
  - An input-animal `SelectControl` (options from `domain.items`).
  - A reference-animal multi-pick: render each `domain.items` name as a toggle chip that adds/removes it from `rowNames` (cap at `domain.properties.length` = 6).
  - An SVG (follow the SVG conventions in `Transform2D.tsx`, ~lines 1-30, for `toSVG`/sizing) drawing, for each row: the row's animal emoji + name, its 6 property bars, a `×` against the input's 6 property bars, and the resulting dot-product score bar. This visually shows "row · input = one score".
  - An output vector card listing each reference animal and the score (`output[i]`), labelled e.g. "0.81 bear-like".
- Reset restores the defaults.

Keep the SVG/markup style consistent with existing matrices widgets (raw sliders/chips, Tailwind classes like `rounded-lg border border-border bg-surface`). No new dependencies.

- [ ] **Step 2: Type-check / lint**

Run: `pnpm lint`
Expected: PASS (no eslint errors; component compiles).

- [ ] **Step 3: Manual render check**

Wire it temporarily into the chapter to eyeball it (this wiring is finalized in Task 9, but verify early):

Run: `pnpm dev`, then open `http://localhost:3000/matrices` after temporarily adding the widget (or rely on Task 9). Confirm: changing the input animal updates every score; adding/removing reference animals adds/removes rows; scores match hand-computed `vecDot`.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/matrices/DetectorStack.tsx
git commit -m "Add DetectorStack widget (matrix as a stack of detectors)"
```

---

## Task 4: `DetectorStack` round-trip / inverse mode (§2)

Adds the "can you get the original back?" payoff to the same widget.

**Files:**
- Modify: `src/components/widgets/matrices/DetectorStack.tsx`

- [ ] **Step 1: Implement `mode === "round-trip"`**

When `mode === "round-trip"`:
- Let the user choose the **number of reference animals** (a `SliderControl` or chip count) from 3 to 6, pre-filled with distinct animals (default 6: `["Bear","Eagle","Snake","Dog","Rabbit","Elephant"]`).
- Compute `scores = matVecMul(matrix, input)`.
- If `rowNames.length === domain.properties.length` (square 6×6): `const inv = invert(matrix)`. If `inv` is non-null, `recovered = matVecMul(inv, scores)`; render a third card "Recovered animal" showing `recovered` next to the original `input`, and a callout "Lossless — the inverse matrix undoes it exactly." Compute and show the max abs difference (≈ 0).
- If fewer rows than dimensions (non-square) **or** `inv` is null: render "No way back — too few (or redundant) reference animals. Detail is lost." (the lossy case). Do not attempt recovery.

Keep the word "inverse" light: one sentence + the visible round-trip. No theory.

- [ ] **Step 2: Lint + render check**

Run: `pnpm lint` (Expected: PASS). Then in `pnpm dev`, with `mode="round-trip"` and 6 reference animals, confirm "Recovered" ≈ original; drop to 3 and confirm the lossy message appears.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/matrices/DetectorStack.tsx
git commit -m "DetectorStack: inverse round-trip (lossless vs lossy)"
```

---

## Task 5: `DetectorStack` activation step (§3 — a layer)

Shows a layer = matrix, then an activation applied to the whole output vector.

**Files:**
- Modify: `src/components/widgets/matrices/DetectorStack.tsx`

- [ ] **Step 1: Add an optional activation step**

Add a `ToggleControl` "Apply activation (ReLU)" available in `"detectors"` mode (off by default). When on:
- Compute `activated = applyActivation(output, relu)` and render an extra "After activation" column/card so the reader sees the bend applied to every output number at once.
- Add one line of helper copy: "A neural-network layer is exactly this: the matrix, then an activation function applied to the whole output vector."

(`relu`/`applyActivation` already imported from `./matrixMath`.)

- [ ] **Step 2: Lint + render check**

Run: `pnpm lint` (Expected: PASS). In `pnpm dev`, toggle activation and confirm negative-ish scores clip to 0 in the "After activation" view. (Animal scores are ≥0, so also demonstrate with a reference animal that produces a low score; ReLU leaves ≥0 values unchanged — copy should note ReLU's effect is visible mainly when scores can go negative, which learned matrices allow.)

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/matrices/DetectorStack.tsx
git commit -m "DetectorStack: optional activation step (layer = matrix + bend)"
```

---

## Task 6: `MatrixComposition` widget (§4 — why the bend can't be dropped)

Two matrix multiplies collapse into one; show the product matrix.

**Files:**
- Create: `src/components/widgets/matrices/MatrixComposition.tsx`

- [ ] **Step 1: Implement the widget**

Create `"use client"` `function MatrixComposition()`:
- Two editable small matrices `A` and `B` (use 3×3, integer-ish sliders −2..2, step 1, via raw inputs or `SliderControl`), defaulting to two non-trivial matrices.
- Compute `C = matMul(A, B)` (from `./matrixMath`).
- Render three grids: `A`, `B`, and the highlighted product `C`, with copy: "Stack two matrix layers with nothing between them and you can always replace them with this single matrix `C`. So depth alone buys nothing — until you add a nonlinear bend between them (that's the activation function)."
- Optional: a "with activation between" toggle that, when on, replaces the product with text "Now you *can't* collapse them — the bend in between makes the two layers do something no single matrix can." (No need to compute anything; the point is conceptual.)
- Wrap in `<WidgetContainer title="Two Matrices Make One" description="...">`.

- [ ] **Step 2: Lint + render check**

Run: `pnpm lint` (Expected: PASS). In `pnpm dev`, confirm editing `A` or `B` updates `C = A·B`, and `C` matches a hand check for the defaults.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/matrices/MatrixComposition.tsx
git commit -m "Add MatrixComposition widget (matrix x matrix = one matrix)"
```

---

## Task 7: `Transform2D3D` widget (§6 — fun aside + GPU story)

One tabbed playground merging the existing `Transform2D` and `Transform3D`, plus an activation toggle (absorbing the old `ActivationEffect`).

**Files:**
- Create: `src/components/widgets/matrices/Transform2D3D.tsx`
- Reuse (import internals, do not delete): `Transform2D.tsx`, `Transform3D.tsx`

- [ ] **Step 1: Refactor the two existing widgets into embeddable bodies**

`Transform2D` and `Transform3D` currently each render their own `<WidgetContainer>`. Extract their inner content into exported body components that take no container:
- In `Transform2D.tsx`: add `export function Transform2DBody()` containing everything currently inside `<WidgetContainer>`; keep `Transform2D()` as a thin wrapper rendering `<WidgetContainer ...><Transform2DBody/></WidgetContainer>` for backward compatibility.
- Do the same in `Transform3D.tsx` → `export function Transform3DBody()`.
- Each Body keeps its own internal state and presets; pass an optional `onReset` ref or expose nothing (the parent's reset can simply remount via `key`).

- [ ] **Step 2: Build the tabbed parent**

Create `Transform2D3D.tsx` (`"use client"`):
- `WidgetTabs` with tabs `[{id:"2d",label:"2D"},{id:"3d",label:"3D"}]`, `activeTab` state default `"2d"`.
- Render `<Transform2DBody/>` or `<Transform3DBody/>` by tab (use `key={activeTab}` to reset cleanly).
- Add a `ToggleControl` "Apply activation (sigmoid)" that, when on, warps the rendered shape by mapping transformed coordinates through `sigmoid` (port the warp logic from the existing `ActivationEffect.tsx` — it already interpolates polygon edges and applies sigmoid; reuse that approach in the 2D body). For the 3D body, applying activation can be a simpler per-vertex `sigmoid` on projected coords; if that proves fiddly, gate the toggle to the 2D tab only and label it accordingly.
- Wrap everything in `<WidgetContainer title="Spin It" description="The same matrix math rotates 2D and 3D worlds — which is why GPUs were built for games, and why they now run AI." onReset={...}>`.
- Presets stay fun (Rotate, Spin, Shear, Tumble); do **not** add basis-vector/projection explanatory text.

- [ ] **Step 3: Lint + render check**

Run: `pnpm lint` (Expected: PASS). In `pnpm dev`, confirm both tabs render (cat spins in 2D, chicken/shiba spins in 3D — models load from `./models/*.json`), and the activation toggle visibly warps the 2D shape.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/matrices/Transform2D3D.tsx src/components/widgets/matrices/Transform2D.tsx src/components/widgets/matrices/Transform3D.tsx
git commit -m "Add Transform2D3D playground (2D/3D tabs + activation toggle)"
```

---

## Task 8: Attention reuse instance (§5)

No new widget — reuse `DetectorStack` with an attention-flavored dataset so "keys × query = scores" is the same picture as §1.

**Files:**
- Modify: `src/components/widgets/matrices/DetectorStack.tsx` (add `mode === "attention"` support + a small inline token dataset)

- [ ] **Step 1: Add a tiny token domain and attention mode**

In `DetectorStack.tsx`, define an inline `VectorDomain` matching the Attention chapter's toy example:

```ts
const TOKEN_DOMAIN: VectorDomain = {
  id: "tokens",
  label: "Tokens",
  properties: ["noun", "none"],
  items: [
    { name: "cat",  emoji: "🐱", values: [1, 0] },   // key: a noun
    { name: "dog",  emoji: "🐕", values: [1, 0] },   // key: a noun
    { name: "blah", emoji: "💬", values: [0, 1] },   // key: not a noun
    { name: "it",   emoji: "🔎", values: [0, 0] },   // (query lives separately)
  ],
};
const IT_QUERY = [1, 0]; // "it" is looking for a noun
```

When `mode === "attention"`: rows are the **keys** of `cat/dog/blah`, the input is the fixed `IT_QUERY` (label the input row "query for 'it'"), and `output = matVecMul(keysMatrix, IT_QUERY)` is the match score per token. Reuse the same row-visual as `"detectors"`. Add copy: "Attention's match step is the same picture: stack the other tokens' keys as rows, multiply by this token's query, and out come the match scores — one matrix × vector per token. (The Q/K/V vectors are themselves made by matrix multiplies, and blending the values is one more.)"

- [ ] **Step 2: Lint + render check**

Run: `pnpm lint` (Expected: PASS). In `pnpm dev` with `mode="attention"`, confirm `it` scores 1 against cat/dog and 0 against blah.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/matrices/DetectorStack.tsx
git commit -m "DetectorStack: attention mode (keys x query = scores)"
```

---

## Task 9: Rewrite `content.mdx` + wire widgets

Replace the old content and widget wiring with the new chapter.

**Files:**
- Overwrite: `src/app/(tutorial)/matrices/content.mdx`
- Overwrite: `src/app/(tutorial)/matrices/widgets.tsx`
- Modify: `src/app/(tutorial)/matrices/page.tsx` (widget import list + components map)

- [ ] **Step 1: Rewrite `widgets.tsx`**

Replace `widgets.tsx` with dynamic wrappers for the new widget set, following the `vectors/widgets.tsx` pattern. Export wrappers:
- `DetectorStackWidget` (default `mode="detectors"`), `RoundTripWidget` (`mode="round-trip"`), `LayerDetectorWidget` (detectors mode with activation emphasis — or reuse `DetectorStackWidget`), `AttentionMatmulWidget` (`mode="attention"`), `MatrixCompositionWidget`, `Transform2D3DWidget`.

Each wrapper passes the right props into the dynamically imported component. Example:

```tsx
const DetectorStack = dynamic(
  () => import("@/components/widgets/matrices/DetectorStack").then((m) => m.DetectorStack),
  { ssr: false }
);

export function RoundTripWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <DetectorStack mode="round-trip" />
    </WidgetSlot>
  );
}
```

Do **not** export wrappers for the cut widgets (`Transform1D`, `BasisVectorView`, `DimensionProjection`, `HigherDimensions`, `NeuronVsMatrix`, `ActivationEffect`).

- [ ] **Step 2: Rewrite `content.mdx`**

Author the chapter per the spec's section order. Structure (use real prose in the voice of the Vectors/Neurons chapters; `<Lead>` for the cold open; `<KeyInsight>` for the spine; never raw `<p>`):

1. `# A Thousand Questions at Once`
2. `<Lead>` cold-open: the graphics card running ChatGPT was built to make videogames look good; the operation that spins a 3D dragon is the operation a neural net uses to think — matrix multiplication; promise to resolve why by the end.
3. **§1 You already know this** → prose recalling the bear-detector dot product, then `<DetectorStackWidget>` + try-it copy.
4. **§2 Can you get the original back?** → `<RoundTripWidget>` + inverse/lossless-vs-lossy copy.
5. **§3 A layer is a matrix (plus a bend)** → prose; reuse `<DetectorStackWidget>` (activation toggle) or `<LayerDetectorWidget>`; state clearly: layer = matrix, then activation on the whole output vector.
6. **§4 Why the bend can't be dropped** → `<MatrixCompositionWidget>` + matrix×matrix=matrix copy; `<KeyInsight>`.
7. **§5 Attention is a matrix multiply too** → `<AttentionMatmulWidget>` + keys×query copy + Q/K/V/value aside; callback to the Attention chapter.
8. **§6 Aside: the same math spins 2D & 3D — and that's why GPUs run AI** → prose resolving the cold open; `<Transform2D3DWidget>`.
9. **§7 What's next** → bridge to training; close with `<TryItInPyTorch notebook="matrices">...</TryItInPyTorch>`.

Match curriculum voice (`docs/style/voice.md`), `×` not `·`, reuse animal/property names, no first-person singular.

- [ ] **Step 3: Update `page.tsx` components map**

Update the import from `./widgets` and the `<Content components={{ ... }} />` map to exactly the new wrapper names used in `content.mdx`. Remove the old widget names.

- [ ] **Step 4: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: PASS — no raw-`<p>` violations, route `/matrices` builds, no missing-component errors from MDX.

- [ ] **Step 5: Full render check**

Run: `pnpm dev`, open `/matrices`. Walk every section; confirm each widget mounts and the prose reads coherently end-to-end.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tutorial)/matrices"
git commit -m "Rewrite matrices chapter content and widget wiring"
```

---

## Task 10: Unwire/cut the retired widgets

Keep the files on disk (per spec) but ensure nothing imports them and lint/build is clean.

**Files:**
- Verify-only: `Transform1D.tsx`, `BasisVectorView.tsx`, `DimensionProjection.tsx`, `HigherDimensions.tsx`, `NeuronVsMatrix.tsx`, `ActivationEffect.tsx`

- [ ] **Step 1: Confirm no remaining imports of cut widgets**

Run:
```bash
grep -rn "Transform1D\|BasisVectorView\|DimensionProjection\|HigherDimensions\|NeuronVsMatrix\|ActivationEffect" "src/app/(tutorial)/matrices" src/components/widgets/matrices/Transform2D3D.tsx
```
Expected: no matches in `matrices/` app folder or `Transform2D3D.tsx` (the files themselves may still self-reference; that's fine since they're unimported).

- [ ] **Step 2: Lint + build to confirm no unused-import or dead-route errors**

Run: `pnpm lint && pnpm build`
Expected: PASS. (Unimported widget files do not break the build.)

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add -A && git commit -m "Unwire retired matrices widgets" || echo "nothing to commit"
```

---

## Task 11: Playwright smoke test for the chapter

**Files:**
- Modify: `tests/chapter-smoke.spec.ts`

- [ ] **Step 1: Add the `matrices` case**

In the `CHAPTERS` array in `tests/chapter-smoke.spec.ts`, add (use the exact `WidgetContainer` titles you gave the widgets — update these strings to match your final titles):

```ts
  {
    slug: "matrices",
    h1Contains: "A Thousand Questions at Once",
    widgetTitles: ["A Matrix Is Many Dot Products"],
  },
```

Note: the smoke suite header comment scopes it to "chapters 2-9"; this chapter is id 10 but unpublished. Smoke-testing it is still valid because the route builds regardless of the `ready` flag. If `getAdjacentChapters`/nav filtering hides it, the page still renders at `/matrices` directly, which is what the smoke test visits.

- [ ] **Step 2: Run the smoke test**

Run (dev server must be up): `pnpm dev` in one shell, then `npx playwright test chapter-smoke -g "matrices"`
Expected: PASS — page loads with the h1 and the headline widget title is visible.

- [ ] **Step 3: Commit**

```bash
git add tests/chapter-smoke.spec.ts
git commit -m "Smoke test for matrices chapter"
```

---

## Task 12: Update the companion notebook

Mirror the chapter section-by-section, per the repo's notebook convention.

**Files:**
- Modify: `notebooks/matrices.ipynb`

- [ ] **Step 1: Fix metadata and links**

In `notebooks/matrices.ipynb`, replace `/matrix-math` → `/matrices` in the intro and footer cells, and update the stale title label ("Chapter 5: Matrix Math…") to reflect the new chapter title. Verify:
```bash
grep -n "matrix-math\|Matrix Math\|Chapter 5" notebooks/matrices.ipynb
```
Expected after edits: no `/matrix-math`; title text updated.

- [ ] **Step 2: Mirror the chapter mechanisms**

Update/replace code cells so each section with a real mechanism has matching PyTorch (per `docs/plans/pytorch-prerequisites.md` and the "notebook mirrors the chapter" convention):
- **Detectors as a matrix:** build a weight matrix whose rows are reference-animal vectors; show `matrix @ animal` (or `torch.matmul`) equals stacking `torch.dot` per row. Reuse the same 6 properties / animals as the chapter where practical.
- **Inverse round-trip:** `torch.linalg.inv(W) @ (W @ animal)` recovers `animal`; show a non-square `W` cannot be inverted (lossy).
- **A layer is `nn.Linear` + activation:** show `nn.Linear` weight is exactly the matrix, and a layer applies an activation (`relu`) to the whole output vector.
- **`matrix × matrix = matrix`:** `A @ B` equals a single matrix; note why a nonlinearity between layers prevents collapse.
- **Attention scores:** `keys @ query` gives per-token match scores (tie to the Attention chapter/notebook).

Every term must be defined before use or reference the chapter that covers it.

- [ ] **Step 3: Execute the notebook**

Run: `pnpm test:notebooks` (requires `pip install torch matplotlib jupyter tiktoken`)
Expected: PASS — `matrices.ipynb` executes without errors.

- [ ] **Step 4: Commit**

```bash
git add notebooks/matrices.ipynb
git commit -m "Update matrices companion notebook to mirror the chapter"
```

---

## Task 13: Final full verification

- [ ] **Step 1: Lint, unit, build**

Run: `pnpm lint && pnpm test && pnpm build`
Expected: all PASS.

- [ ] **Step 2: Full e2e**

Run: `pnpm dev` (one shell) + `npx playwright test`
Expected: PASS, including the new `matrices` smoke case and no regressions in `chapter-metadata`/`chapter-smoke`.

- [ ] **Step 3: No stale references anywhere shipped**

Run:
```bash
grep -rn "matrix-math" src/ notebooks/ tests/ --include="*.tsx" --include="*.ts" --include="*.mdx" --include="*.ipynb" | grep -v node_modules
```
Expected: no matches.

- [ ] **Step 4: Final commit (if anything outstanding)**

```bash
git add -A && git commit -m "Finalize matrices chapter restructure" || echo "clean"
```

---

## Self-Review Notes (author checklist, already applied)

- **Spec coverage:** cold-open (§Task 9 step 2), detector-stack core (T3), inverse round-trip (T4), layer = matrix + activation (T5), matrix×matrix collapse (T6), attention keys×query with Q/K/V aside (T8/T9), 2D/3D + GPU + activation toggle (T7/T9), rename incl. notebook/glossary/appendix (T1/T12), prereq bump to [7] (T1), cut widgets unwired but on disk (T10), voice/MDX rules (T9 step 2), verification incl. notebook (T11–T13). All spec sections map to a task.
- **Decisions locked** (were "plan to decide" in the spec): §3 reuses `DetectorStack` + activation step (no reframed `NeuronVsMatrix`; it is cut). §2 is one widget with a `round-trip` mode, not a second widget. §5 reuses `DetectorStack` (`attention` mode), no bespoke widget.
- **Type consistency:** widgets import `matVecMul/matMul/invert/relu/sigmoid/applyActivation` exactly as exported by `matrixMath.ts` (Task 2); `DetectorStackProps.mode` values `"detectors" | "round-trip" | "attention"` are used consistently across Tasks 3/4/5/8/9.
- **Open risk flagged in-task:** 3D-tab activation warp may be gated to 2D only (Task 7 step 2) if per-vertex sigmoid proves fiddly.
