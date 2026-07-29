# Context Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new unified tutorial chapter, `context` ("Getting the Right Information"), placed right after Transformers, covering how transformers handle huge inputs (KV cache, local vs. global attention, sparse attention / DSA + IndexShare, paged cache) and how systems/agents fill the window (RAG vs. agentic grep, agent context management), with 6 interactive widgets and a companion notebook.

**Architecture:** Follow the existing chapter pattern exactly (`src/app/(tutorial)/<slug>/` with `page.tsx` + `content.mdx` + `widgets.tsx` + `quiz.mdx` + `QuizContent.tsx`; widgets under `src/components/widgets/context/`). Every widget's deterministic core is a pure, hand-authored-data TypeScript module with a colocated vitest test (the `attention/toyMath.ts` + `toyMath.test.ts` pattern); the React component is a thin, legible presentation layer on top. No real model is used anywhere — all data is small and author-written so the mechanism is visible.

**Tech Stack:** Next.js 16 (App Router), MDX (`@next/mdx`, remark-math, rehype-katex, rehype-pretty-code), React 19 client widgets, D3 + Framer Motion + Radix UI, Tailwind CSS 4, vitest (unit), Playwright (e2e), Jupyter (notebook).

## Global Constraints

Every task's requirements implicitly include this section.

- **Voice:** Follow `docs/style/voice.md`. No personal "I"/"me" in chapter prose. No "It's not X, it's Y". At most one em-dash per paragraph, only when nothing else fits. No drumroll phrases ("Here's the thing", "Let's dive in", etc.). Strip AI vocabulary ("remarkable", "elegant", "magical", "robust", "leverage", "in essence", "fundamentally", "delve", "tapestry", ...). Don't overuse tricolons as a rhythmic backbone. Keep author-style leading-sentence bolding inside bullet/numbered lists.
- **MDX:** Never use raw `<p>` tags in MDX (causes hydration errors). Use `<Lead>` for intro paragraphs or `<div>` for block wrappers. `pnpm lint` enforces this.
- **Widgets — readable text:** All labels, token text, and numbers must be comfortably legible; no tiny type. Prefer few large elements over many small ones. Legible on a phone.
- **Widgets — fake data, not a model:** Use small, hand-authored data so the mechanism is visible and deterministic. Never load or run a real model.
- **Widgets — fun + one clear knob:** Each is a playground with a knob whose effect is immediately visible, plus a "try this" prompt (passed as children to the widget wrapper) leading to a surprise.
- **Accuracy guardrails:** 1M context = GLM-5.2 / IndexShare (not DeepSeek; DSA is 128K). DSA top-k = 2048; indexer itself is O(L²) but cheap. IndexShare reuses the indexer's picks every 4 layers → ~2.9× fewer FLOPs at 1M. Gemma 3 = 5 local (1024-window) : 1 global (Gemma 2 was 1:1, 4096). PagedAttention block ≈ 16 tokens; waste 60–80% → <4%. Present Kimi K3 cautiously ("as reported by Moonshot"); use Kimi K2 + MLA as the solid example. Soften secondary-source percentages. Frame closed models (Claude/OpenAI) as undisclosed but presumably similar to GLM-5.2's documented method.
- **Dev server:** Do NOT start or kill a dev server. The user runs their own on :3000. If a running app is needed for Playwright/screenshots, ask the user.
- **Import alias:** `@/*` → `./src/*`.
- **Commit style:** End commit messages with the two Co-Authored-By / Claude-Session trailers used in this repo.

## File Structure

Created:
- `src/app/(tutorial)/context/page.tsx` — chapter wrapper.
- `src/app/(tutorial)/context/content.mdx` — the article (7 beats).
- `src/app/(tutorial)/context/widgets.tsx` — dynamic imports + `WidgetSlot`s.
- `src/app/(tutorial)/context/quiz.mdx` — quiz questions.
- `src/app/(tutorial)/context/QuizContent.tsx` — quiz client wrapper.
- `src/components/widgets/context/cost.ts` (+ `.test.ts`) — quadratic-wall math.
- `src/components/widgets/context/QuadraticWall.tsx` — widget 1.
- `src/components/widgets/context/kvcache.ts` (+ `.test.ts`) — KV cache work model.
- `src/components/widgets/context/KVCache.tsx` — widget 2.
- `src/components/widgets/context/attentionReach.ts` (+ `.test.ts`) — local/global cost + reach.
- `src/components/widgets/context/LocalVsGlobal.tsx` — widget 3.
- `src/components/widgets/context/haystack.ts` — hand-authored token data for the indexer.
- `src/components/widgets/context/indexer.ts` (+ `.test.ts`) — top-k + IndexShare + FLOP model.
- `src/components/widgets/context/SparseIndexer.tsx` — widget 4 (centerpiece).
- `src/components/widgets/context/paging.ts` (+ `.test.ts`) — block allocation / waste / sharing.
- `src/components/widgets/context/PagedCache.tsx` — widget 5.
- `src/components/widgets/context/corpus.ts` — hand-authored retrieval corpus.
- `src/components/widgets/context/retrieval.ts` (+ `.test.ts`) — keyword vs. semantic scoring.
- `src/components/widgets/context/Retrieval.tsx` — widget 6.
- `notebooks/context.ipynb` — companion notebook.
- `src/lib/curriculum.test.ts` — new vitest test for the renumbering invariants.

Modified:
- `src/lib/curriculum.ts` — reposition/renumber, remove `long-context`.
- Glossary source (see Task 11 for exact location discovered at build time).

## Notes on plan style

The deterministic logic modules and their tests are given as **complete code** (they are the true TDD units). The React widget components and MDX prose are given as **precise specifications** — exact controls, labels, "try this" text, data, layout, and the template to copy (`WidgetContainer` + shared controls + the Attention chapter widgets). This is deliberate: the visual/copy layer needs a voice/design pass and is built by following the established pattern, not by transcribing final JSX from a plan. Each widget task still ends with concrete verification (lint + build + the widget renders).

---

### Task 1: Curriculum renumber + remove long-context

**Files:**
- Modify: `src/lib/curriculum.ts`
- Test: `src/lib/curriculum.test.ts` (create)

**Interfaces:**
- Consumes: existing `chapters` array and helpers in `curriculum.ts`.
- Produces: `context` at `id: 10` positioned after `transformers`; `matrix-math`=11, `training`=12, `mixture-of-experts`=13; `long-context` removed; ids 1–26 contiguous; every `prerequisites` id still refers to an existing chapter.

- [ ] **Step 1: Write the failing test**

Create `src/lib/curriculum.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chapters, getMainChapters, getChapter } from "./curriculum";

describe("curriculum ordering", () => {
  it("has no long-context chapter (absorbed into context)", () => {
    expect(getChapter("long-context")).toBeUndefined();
  });

  it("places context at id 10, right after transformers", () => {
    const context = getChapter("context");
    const transformers = getChapter("transformers");
    expect(transformers?.id).toBe(9);
    expect(context?.id).toBe(10);
  });

  it("renumbers the shifted chapters", () => {
    expect(getChapter("matrix-math")?.id).toBe(11);
    expect(getChapter("training")?.id).toBe(12);
    expect(getChapter("mixture-of-experts")?.id).toBe(13);
    expect(getChapter("inference")?.id).toBe(14);
    expect(getChapter("hallucination")?.id).toBe(26);
  });

  it("has contiguous main-chapter ids 1..N in array order", () => {
    const main = getMainChapters();
    main.forEach((c, i) => expect(c.id).toBe(i + 1));
  });

  it("every prerequisite id refers to an existing chapter", () => {
    const ids = new Set(chapters.map((c) => c.id));
    for (const c of chapters) {
      for (const p of c.prerequisites) expect(ids.has(p)).toBe(true);
    }
  });

  it("context is marked ready", () => {
    expect(getChapter("context")?.ready).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/curriculum.test.ts`
Expected: FAIL (context is id 27, long-context still present, ids not contiguous).

- [ ] **Step 3: Edit `curriculum.ts`**

- Move the `context` object so it appears immediately after the `transformers` object in the array; set its `id: 10`, `prerequisites: [9]`, and `ready: true`. Update its `subtitle` to `"Context"` and keep/adjust the `description` so it reads as the unified chapter (long context + retrieval), e.g.: `"Attention compares every word to every other, so a million-token window should be impossible. Sparse attention, KV caching, and retrieval are the tricks that make it work — and let agents feed themselves the right facts."`
- Delete the `long-context` object entirely.
- Renumber: `matrix-math` `id: 11`, `training` `id: 12`, `mixture-of-experts` `id: 13`. Leave `inference` (14) through `hallucination` (26) and the appendix entries unchanged.
- Reorder the array so `id` ascends in array order (context between transformers(9) and matrix-math(11), then training, moe, inference, ...).
- Do NOT change any `prerequisites` array — verified that none reference a changed id.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/curriculum.test.ts`
Expected: PASS (all 6).

- [ ] **Step 5: Typecheck the change compiles**

Run: `pnpm lint`
Expected: no new errors from `curriculum.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/curriculum.ts src/lib/curriculum.test.ts
git commit -m "Reposition context chapter after transformers; remove long-context

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BxHLhtDe6uhWdndtrhCrjd"
```

---

### Task 2: Chapter scaffolding (renders end-to-end, empty beats)

**Files:**
- Create: `src/app/(tutorial)/context/page.tsx`, `content.mdx`, `widgets.tsx`, `quiz.mdx`, `QuizContent.tsx`
- Test: `tests/chapter-smoke.spec.ts` already smoke-tests all ready chapters; this task makes `context` pass it.

**Interfaces:**
- Consumes: `chapterMetadata`, `getAdjacentChapters`, `ChapterNav`, MDX components (`Lead`, `Callout`, `KeyInsight`, `TryItInPyTorch`).
- Produces: a routeable `/context` page that builds. `widgets.tsx` exports one `WidgetSlot`-wrapped component per widget (added incrementally in later tasks); for now export nothing extra.

- [ ] **Step 1: Create `page.tsx`** by copying the Attention `page.tsx` structure: import `Content`, `QuizContent`, `ChapterNav`, `chapterMetadata("context")`, `getAdjacentChapters("context")`, render `<article>` with `<Content components={{}} />`, `<QuizContent />`, `<ChapterNav prev next />`. Name the component `Chapter10`.

- [ ] **Step 2: Create `widgets.tsx`** copying the Attention `widgets.tsx` header (the `"use client"`, `dynamic`, `Suspense`, `TryItProvider`, `WidgetSlot` helper). No widget exports yet.

- [ ] **Step 3: Create `QuizContent.tsx`** identical to Attention's (imports `./quiz.mdx` as `QuizMDX`, returns `<QuizMDX />`).

- [ ] **Step 4: Create `quiz.mdx`** with a single placeholder question following `docs/plans/quiz-writing-guide.md` format (replaced fully in Task 10) so the page builds.

- [ ] **Step 5: Create `content.mdx`** with the `# Getting the Right Information` H1, a `<Lead>` intro paragraph, and the seven `##` section headings (empty bodies for now): "The Wall", "Don't Redo the Past", "Most Words Don't Need Most Words", "Pick the Words That Matter", "Memory in Pages", "What Goes In the Window", "An Agent Minding Its Own Context". No raw `<p>`.

- [ ] **Step 6: Build**

Run: `pnpm build`
Expected: build succeeds; `/context` route is generated.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tutorial)/context"
git commit -m "Scaffold context chapter page, widgets shell, quiz stub

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BxHLhtDe6uhWdndtrhCrjd"
```

---

### Task 3: Widget 1 — QuadraticWall (beat 1) + beat-1 prose

**Files:**
- Create: `src/components/widgets/context/cost.ts`, `cost.test.ts`, `QuadraticWall.tsx`
- Modify: `src/app/(tutorial)/context/widgets.tsx`, `page.tsx`, `content.mdx`

**Interfaces:**
- Produces: `pairwiseComparisons(n: number): number`, `linearReference(n: number, perToken: number): number`, `formatCount(n: number): string`. Widget export `QuadraticWallWidget`.

- [ ] **Step 1: Write the failing test** — `cost.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pairwiseComparisons, linearReference, formatCount } from "./cost";

describe("pairwiseComparisons", () => {
  it("is n squared (every token vs every token)", () => {
    expect(pairwiseComparisons(1)).toBe(1);
    expect(pairwiseComparisons(10)).toBe(100);
    expect(pairwiseComparisons(1000)).toBe(1_000_000);
  });
  it("quadruples when the input doubles", () => {
    expect(pairwiseComparisons(2000)).toBe(4 * pairwiseComparisons(1000));
  });
});

describe("linearReference", () => {
  it("is perToken * n", () => {
    expect(linearReference(1000, 2048)).toBe(2_048_000);
  });
});

describe("formatCount", () => {
  it("uses short human units", () => {
    expect(formatCount(1_000_000)).toBe("1M");
    expect(formatCount(2_500_000_000)).toBe("2.5B");
    expect(formatCount(1_000_000_000_000)).toBe("1T");
    expect(formatCount(950)).toBe("950");
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm test src/components/widgets/context/cost.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `cost.ts`:**

```ts
export function pairwiseComparisons(n: number): number {
  return n * n;
}

export function linearReference(n: number, perToken: number): number {
  return n * perToken;
}

export function formatCount(n: number): string {
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [scale, suffix] of units) {
    if (n >= scale) {
      const v = n / scale;
      return `${Number.isInteger(v) ? v : Number(v.toFixed(1))}${suffix}`;
    }
  }
  return String(n);
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm test src/components/widgets/context/cost.test.ts` → PASS.

- [ ] **Step 5: Build the widget `QuadraticWall.tsx`** (`"use client"`, wrap `<WidgetContainer title="The cost of looking at everything">`). Spec:
  - One large `SliderControl` for **context length** (label "Words in context"), range 1 → 1,000,000 on a **log scale** (map slider 0–100 to log10). Show the current length in large type (`formatCount`).
  - Two big number read-outs, stacked and clearly labeled: **"Full attention: N comparisons"** (`formatCount(pairwiseComparisons(n))`) and a reference **"Growing in a straight line: N"** (`formatCount(linearReference(n, 2048))`).
  - A simple bar or D3 area comparing the two on a log y-axis so the quadratic curve visibly runs away from the line. Big axis labels.
  - Reset via `onReset` back to a small length (e.g. 100).
  - "Try this" children (in MDX): "Drag toward a million words. Full attention needs about a trillion comparisons for every layer, for every new word. Find the length where it stops being practical."

- [ ] **Step 6: Wire into `widgets.tsx`** — add `dynamic(() => import("@/components/widgets/context/QuadraticWall").then(m => m.QuadraticWall), { ssr: false })` and export `QuadraticWallWidget` via `WidgetSlot` (label "Explore it"). Register it in `page.tsx`'s `components={{ QuadraticWallWidget }}`.

- [ ] **Step 7: Write beat-1 prose** in `content.mdx` under "The Wall": recall from Transformers that attention has every word look at every other word; state the all-pairs cost (double the words → quadruple the work); land the puzzle (a million words ≈ a trillion comparisons per layer, yet models read whole books and codebases — how?). Place `<QuadraticWallWidget>...</QuadraticWallWidget>` with the "try this" text. Keep to the voice guide.

- [ ] **Step 8: Verify** — Run: `pnpm test src/components/widgets/context/cost.test.ts && pnpm lint && pnpm build` → all pass.

- [ ] **Step 9: Commit** (`git add` the new widget files + chapter files; message "Add QuadraticWall widget and beat 1 prose" + trailers).

---

### Task 4: Widget 2 — KVCache (beat 2) + beat-2 prose

**Files:**
- Create: `src/components/widgets/context/kvcache.ts`, `kvcache.test.ts`, `KVCache.tsx`
- Modify: `widgets.tsx`, `page.tsx`, `content.mdx`

**Interfaces:**
- Produces: `keyValueWork(promptLen: number, generated: number, cache: boolean): number`, `cacheMemory(promptLen: number, generated: number): number`. Widget export `KVCacheWidget`.

Work model (author's rule, exact and inspectable): generating token *t* (1-indexed) needs the keys/values of all `promptLen + (t - 1)` prior tokens.
- Without cache: each step recomputes them all → `Σ_{t=1..generated} (promptLen + t - 1)`.
- With cache: step 1 computes the `promptLen` prompt keys once, then each generated step computes exactly 1 new key/value → `promptLen + generated`.
- Cache memory (in KV entries): `promptLen + generated` (grows linearly), independent of cache toggle (that's the point — the cost you pay to avoid recompute).

- [ ] **Step 1: Write the failing test** — `kvcache.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { keyValueWork, cacheMemory } from "./kvcache";

describe("keyValueWork", () => {
  it("without cache recomputes the whole history each step", () => {
    // prompt 2, generate 3: (2)+(3)+(4) = 9
    expect(keyValueWork(2, 3, false)).toBe(9);
  });
  it("with cache computes the prompt once then one per new token", () => {
    // prompt 2, generate 3: 2 + 3 = 5
    expect(keyValueWork(2, 3, true)).toBe(5);
  });
  it("cache savings grow with length", () => {
    const without = keyValueWork(10, 100, false);
    const withC = keyValueWork(10, 100, true);
    expect(without).toBeGreaterThan(withC * 5);
  });
});

describe("cacheMemory", () => {
  it("grows linearly with total tokens", () => {
    expect(cacheMemory(10, 0)).toBe(10);
    expect(cacheMemory(10, 90)).toBe(100);
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm test src/components/widgets/context/kvcache.test.ts`.

- [ ] **Step 3: Implement `kvcache.ts`:**

```ts
export function keyValueWork(promptLen: number, generated: number, cache: boolean): number {
  if (cache) return promptLen + generated;
  let work = 0;
  for (let t = 1; t <= generated; t++) work += promptLen + (t - 1);
  return work;
}

export function cacheMemory(promptLen: number, generated: number): number {
  return promptLen + generated;
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Build `KVCache.tsx`** (`WidgetContainer title="Don't redo the past"`). Spec:
  - A short fixed prompt shown as a row of large word-chips (e.g. `The cat sat on the`), then a "Generate" button that appends generated word-chips one at a time (author-scripted continuation: `mat`, `and`, `purred`, ...), animating with Framer Motion.
  - A `ToggleControl` "Reuse cached words" (on = cache).
  - As words generate, show a big running counter **"Key/value computations so far"** = `keyValueWork(promptLen, generatedSoFar, cache)`, and a growing **"Cache memory"** bar = `cacheMemory`. When cache is off, visibly re-highlight every prior chip each step (recompute); when on, highlight only the new chip.
  - A large side-by-side total after generating N: "Without cache: X. With cache: Y." so the gap is obvious.
  - Reset clears generated words and counters.
  - "Try this": "Generate a dozen words with reuse off, then on. Watch how without the cache the model redoes all its earlier work every single step, while the cache turns that into one small step per word."

- [ ] **Step 6: Wire into `widgets.tsx` + `page.tsx`** (export `KVCacheWidget`).

- [ ] **Step 7: Beat-2 prose** under "Don't Redo the Past": generation happens one word at a time; each new word's attention needs the keys/values of all earlier words; recomputing them every step is wasteful; cache them the first time and reuse (the KV cache); the catch is memory — the cache grows with every word and becomes the real cost of long context (motivates the next beats). Place `<KVCacheWidget>`.

- [ ] **Step 8: Verify** — `pnpm test src/components/widgets/context/kvcache.test.ts && pnpm lint && pnpm build`.

- [ ] **Step 9: Commit** ("Add KVCache widget and beat 2 prose" + trailers).

---

### Task 5: Widget 3 — LocalVsGlobal (beat 3) + beat-3 prose

**Files:**
- Create: `src/components/widgets/context/attentionReach.ts`, `attentionReach.test.ts`, `LocalVsGlobal.tsx`
- Modify: `widgets.tsx`, `page.tsx`, `content.mdx`

**Interfaces:**
- Produces:
  - `type LayerKind = "local" | "global"`
  - `layerCost(kind: LayerKind, seqLen: number, window: number): number` — local `= seqLen * window`, global `= seqLen * seqLen`.
  - `totalCost(layers: LayerKind[], seqLen: number, window: number): number`.
  - `reachableDistance(layers: LayerKind[], window: number, seqLen: number): number` — starting from a single token, each local layer extends how far information can travel by `window` (each side); a global layer makes the whole `seqLen` reachable at once. Capped at `seqLen`.
  - `gemma3Layers(blocks: number): LayerKind[]` — repeats `[local×5, global]` `blocks` times.
  - Widget export `LocalVsGlobalWidget`.

- [ ] **Step 1: Write the failing test** — `attentionReach.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { layerCost, totalCost, reachableDistance, gemma3Layers } from "./attentionReach";

describe("layerCost", () => {
  it("local scales with window, global with sequence", () => {
    expect(layerCost("local", 1000, 8)).toBe(8000);
    expect(layerCost("global", 1000, 8)).toBe(1_000_000);
  });
});

describe("reachableDistance", () => {
  it("each local layer extends reach by one window", () => {
    expect(reachableDistance(["local", "local"], 4, 100)).toBe(8);
  });
  it("a global layer reaches the whole sequence", () => {
    expect(reachableDistance(["local", "global", "local"], 4, 100)).toBe(100);
  });
  it("caps at the sequence length", () => {
    expect(reachableDistance(["local", "local"], 400, 100)).toBe(100);
  });
});

describe("gemma3Layers", () => {
  it("is five local then one global, repeated", () => {
    expect(gemma3Layers(1)).toEqual(["local","local","local","local","local","global"]);
    expect(gemma3Layers(2)).toHaveLength(12);
  });
});

describe("totalCost", () => {
  it("sums per-layer costs", () => {
    expect(totalCost(["local","global"], 1000, 8)).toBe(8000 + 1_000_000);
  });
});
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Implement `attentionReach.ts`:**

```ts
export type LayerKind = "local" | "global";

export function layerCost(kind: LayerKind, seqLen: number, window: number): number {
  return kind === "local" ? seqLen * window : seqLen * seqLen;
}

export function totalCost(layers: LayerKind[], seqLen: number, window: number): number {
  return layers.reduce((sum, k) => sum + layerCost(k, seqLen, window), 0);
}

export function reachableDistance(layers: LayerKind[], window: number, seqLen: number): number {
  let reach = 0;
  for (const k of layers) {
    reach = k === "global" ? seqLen : reach + window;
    if (reach >= seqLen) return seqLen;
  }
  return Math.min(reach, seqLen);
}

export function gemma3Layers(blocks: number): LayerKind[] {
  const out: LayerKind[] = [];
  for (let i = 0; i < blocks; i++) out.push("local","local","local","local","local","global");
  return out;
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Build `LocalVsGlobal.tsx`** (`WidgetContainer title="Most words don't need most words"`). Spec:
  - A vertical stack of layer rows (start with 6). Each row has a big toggle between **Local** (a small sliding window) and **Global** (looks at everything). Preset buttons: "All global", "All local", **"Gemma 3 (5 local : 1 global)"** using `gemma3Layers`.
  - A `SliderControl` for **window size** (small integers, e.g. 1–8, so it's visible on a toy sequence of ~24 tokens).
  - Left: a row of ~24 token dots; when the reader hovers a layer, draw which tokens a chosen position can see in that layer (a window vs. all). Big, clear arcs/highlights.
  - Two large read-outs: **"Total cost"** (`totalCost`, `formatCount`) and **"How far a word can reach"** (`reachableDistance`, in tokens, capped note "= whole sequence"). The surprise: stacking cheap local layers still lets information travel far, at a fraction of all-global cost.
  - Reset to the Gemma preset.
  - "Try this": "Set every layer to Global — expensive. Now the Gemma pattern: five cheap local layers, one global. Notice a word can still reach clear across the text, because each local layer passes information a little further."  (Rewrite to avoid the banned word "Notice" — e.g. "A word can still reach clear across the text...".)

- [ ] **Step 6: Wire into `widgets.tsx` + `page.tsx`** (export `LocalVsGlobalWidget`).

- [ ] **Step 7: Beat-3 prose** under "Most Words Don't Need Most Words": most layers only need a nearby window; Gemma 3 interleaves 5 local (1024-word window) layers with 1 global layer (Gemma 2 alternated 1:1 with a 4096 window); cheap local layers shrink the cache; information still travels far because stacked local windows overlap. Place `<LocalVsGlobalWidget>`.

- [ ] **Step 8: Verify** — `pnpm test src/components/widgets/context/attentionReach.test.ts && pnpm lint && pnpm build`.

- [ ] **Step 9: Commit** ("Add LocalVsGlobal widget and beat 3 prose" + trailers).

---

### Task 6: Widget 4 — SparseIndexer (beat 4, CENTERPIECE) + beat-4 prose

**Files:**
- Create: `src/components/widgets/context/haystack.ts`, `indexer.ts`, `indexer.test.ts`, `SparseIndexer.tsx`
- Modify: `widgets.tsx`, `page.tsx`, `content.mdx`

**Interfaces:**
- `haystack.ts` produces hand-authored data:
  - `type Token = { id: number; text: string }`
  - `export const HAYSTACK: Token[]` — ~40 short, readable tokens forming a couple of tiny scenes (e.g. a story about a dog named Rex, a recipe, a phone number), so relevance is intuitive.
  - `export const QUERIES: { id: string; label: string; relevant: number[] }[]` — a few author-chosen queries (e.g. "Who is the dog?", "What's the phone number?"), each naming the token ids that truly matter. This is the "ground truth" the toy indexer scores toward.
- `indexer.ts` produces:
  - `scoreTokens(query: { relevant: number[] }, tokens: Token[]): { id: number; score: number }[]` — deterministic toy "lightning indexer": relevant ids get a high score with a little author-set variation, others low; this stands in for the real scoring network.
  - `topK(scores: { id: number; score: number }[], k: number): number[]` — ids of the top k by score (stable).
  - `indexShareLayers(nLayers: number, reuseEvery: number): boolean[]` — which layers recompute the indexer (`true`) vs. reuse the previous selection (`false`); index 0 is always `true`, then `true` every `reuseEvery`.
  - `flops(seqLen: number, k: number, nLayers: number, opts: { sparse: boolean; share: boolean; reuseEvery: number; indexerCost: number }): number` — dense `= nLayers * seqLen^2`; sparse per attention layer `= seqLen * k`; indexer cost per computed layer `= indexerCost * seqLen`; with share, only `ceil(nLayers/reuseEvery)` layers pay the indexer cost.
  - Widget export `SparseIndexerWidget`.

- [ ] **Step 1: Write the failing test** — `indexer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { HAYSTACK, QUERIES } from "./haystack";
import { scoreTokens, topK, indexShareLayers, flops } from "./indexer";

describe("haystack data", () => {
  it("has readable tokens and at least two queries with ground truth", () => {
    expect(HAYSTACK.length).toBeGreaterThanOrEqual(20);
    expect(QUERIES.length).toBeGreaterThanOrEqual(2);
    for (const q of QUERIES) expect(q.relevant.length).toBeGreaterThan(0);
  });
});

describe("scoreTokens + topK", () => {
  it("selects the query's relevant tokens when k covers them", () => {
    const q = QUERIES[0];
    const picked = topK(scoreTokens(q, HAYSTACK), q.relevant.length);
    for (const id of q.relevant) expect(picked).toContain(id);
  });
  it("topK never returns more than k", () => {
    const q = QUERIES[0];
    expect(topK(scoreTokens(q, HAYSTACK), 3).length).toBe(3);
  });
});

describe("indexShareLayers", () => {
  it("recomputes layer 0 then every reuseEvery-th layer", () => {
    expect(indexShareLayers(8, 4)).toEqual([true,false,false,false,true,false,false,false]);
  });
});

describe("flops", () => {
  it("sparse is far cheaper than dense at long context", () => {
    const dense = flops(1_000_000, 2048, 8, { sparse: false, share: false, reuseEvery: 4, indexerCost: 1 });
    const sparse = flops(1_000_000, 2048, 8, { sparse: true, share: false, reuseEvery: 4, indexerCost: 1 });
    expect(sparse).toBeLessThan(dense);
  });
  it("index sharing lowers cost versus recomputing every layer", () => {
    const noShare = flops(1_000_000, 2048, 8, { sparse: true, share: false, reuseEvery: 4, indexerCost: 4 });
    const share = flops(1_000_000, 2048, 8, { sparse: true, share: true, reuseEvery: 4, indexerCost: 4 });
    expect(share).toBeLessThan(noShare);
  });
});
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Implement `haystack.ts`** (hand-author ~40 short tokens across 2–3 mini-scenes and 3 queries with `relevant` id lists) **and `indexer.ts`:**

```ts
import type { Token } from "./haystack";

export function scoreTokens(query: { relevant: number[] }, tokens: Token[]): { id: number; score: number }[] {
  const rel = new Set(query.relevant);
  return tokens.map((t) => ({
    id: t.id,
    // Toy stand-in for a lightning indexer: relevant tokens score high, with a
    // small deterministic wobble so ties break stably; others score low.
    score: (rel.has(t.id) ? 100 : 10) - (t.id % 7),
  }));
}

export function topK(scores: { id: number; score: number }[], k: number): number[] {
  return [...scores]
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, k)
    .map((s) => s.id);
}

export function indexShareLayers(nLayers: number, reuseEvery: number): boolean[] {
  return Array.from({ length: nLayers }, (_, i) => i % reuseEvery === 0);
}

export function flops(
  seqLen: number,
  k: number,
  nLayers: number,
  opts: { sparse: boolean; share: boolean; reuseEvery: number; indexerCost: number }
): number {
  if (!opts.sparse) return nLayers * seqLen * seqLen;
  const attn = nLayers * seqLen * Math.min(k, seqLen);
  const computedLayers = opts.share ? Math.ceil(nLayers / opts.reuseEvery) : nLayers;
  const indexer = computedLayers * opts.indexerCost * seqLen;
  return attn + indexer;
}
```

Add `export type Token = { id: number; text: string };` to `haystack.ts`.

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Build `SparseIndexer.tsx`** (`WidgetContainer title="Pick the words that matter"`). Spec — this is the marquee widget, so make it especially clear and large:
  - A `SelectControl` to choose one of the author queries (big label, e.g. "What is the model looking for?").
  - The **haystack** rendered as a scrollable grid of large, readable word-chips. Chips the indexer selects light up boldly; unselected chips dim. When the query changes, animate the shortlist lighting up.
  - A `SliderControl` for **k** (how many words the indexer keeps), small range (e.g. 1–12 over this toy haystack). Under-shooting k should visibly miss some relevant chips; that's the intended discovery.
  - A short **stack of layers** (e.g. 8 small rows) with a `ToggleControl` **"Share the shortlist (IndexShare)"**. Off: every layer shows its own indexer pass (all recompute). On: layers group into blocks of 4; the first computes, the next three show "reusing" the same picks. Use `indexShareLayers(8, 4)`.
  - A big **FLOP meter** comparing Dense vs. Sparse vs. Sparse+Share using `flops(...)` at a large `seqLen` (e.g. 1,000,000), shown with `formatCount`, and a headline like "~Nx cheaper" derived from the ratio (should land near the ~2.9× story when share is on — tune `indexerCost`/`reuseEvery=4` so it does; do not hardcode 2.9).
  - Reset to first query, default k, share on.
  - "Try this": "Pick a question. The indexer scans every word and keeps only the few that matter. Turn k down until it starts missing the answer. Then switch on IndexShare and watch several layers agree to reuse one shortlist, dropping the cost again."

- [ ] **Step 6: Wire into `widgets.tsx` + `page.tsx`** (export `SparseIndexerWidget`).

- [ ] **Step 7: Beat-4 prose** under "Pick the Words That Matter" — the heart of the chapter:
  - The idea: instead of every word attending to every word, a small fast **indexer** scores which earlier words matter and keeps only the best few; full attention runs on that shortlist. Cost drops from "every word times every word" to "every word times a fixed shortlist."
  - Ground it in real systems: **DeepSeek's DSA** uses a "lightning indexer" and keeps the top **2,048** words (its own window is 128K); the indexer itself still looks at everything, but it's cheap.
  - **GLM-5.2's IndexShare**: neighboring layers want nearly the same words, so it runs the indexer once every 4 layers and reuses the picks — about **2.9× fewer computations at a million words**, which is what makes a **1-million-word** window practical at near-frontier quality.
  - **Open vs. closed** (land it here): Claude and OpenAI's models don't disclose how they do long context, but GLM-5.2 is an open model with fairly similar performance that documents its method, so it is reasonable to assume the closed models do something broadly similar.
  - Add a `<KeyInsight>` capturing the "wait, what?": a cheap index over a million words plus a shortlist the layers share is what turns an impossible trillion-comparison problem into a practical one.
  - Place `<SparseIndexerWidget>`.

- [ ] **Step 8: Verify** — `pnpm test src/components/widgets/context/indexer.test.ts && pnpm lint && pnpm build`.

- [ ] **Step 9: Commit** ("Add SparseIndexer centerpiece widget and beat 4 prose" + trailers).

---

### Task 7: Widget 5 — PagedCache (beat 5) + beat-5 prose

**Files:**
- Create: `src/components/widgets/context/paging.ts`, `paging.test.ts`, `PagedCache.tsx`
- Modify: `widgets.tsx`, `page.tsx`, `content.mdx`

**Interfaces:**
- Produces:
  - `blocksNeeded(tokens: number, blockSize: number): number` = `ceil(tokens / blockSize)`.
  - `pagedWaste(seqLens: number[], blockSize: number): number` — total unused slots in each sequence's last partial block, summed.
  - `contiguousWaste(seqLens: number[], reservedPerSeq: number): number` — each sequence reserves `reservedPerSeq` (the max possible length); waste `= Σ (reservedPerSeq - len)`.
  - `sharedBlocks(prefixLen: number, seqCount: number, blockSize: number): number` — blocks saved by sharing a common prefix across `seqCount` sequences `= (seqCount - 1) * floor(prefixLen / blockSize)`.
  - Widget export `PagedCacheWidget`.

- [ ] **Step 1: Write the failing test** — `paging.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { blocksNeeded, pagedWaste, contiguousWaste, sharedBlocks } from "./paging";

describe("blocksNeeded", () => {
  it("rounds up to whole blocks", () => {
    expect(blocksNeeded(17, 4)).toBe(5);
    expect(blocksNeeded(16, 4)).toBe(4);
    expect(blocksNeeded(0, 4)).toBe(0);
  });
});

describe("pagedWaste", () => {
  it("only the last partial block of each sequence is wasted", () => {
    // seq 17 -> blocks 5 -> 20 slots -> waste 3; seq 16 -> waste 0
    expect(pagedWaste([17, 16], 4)).toBe(3);
  });
});

describe("contiguousWaste", () => {
  it("wastes the whole reserved-minus-used gap", () => {
    // reserve 100 each, use 17 and 16 -> 83 + 84 = 167
    expect(contiguousWaste([17, 16], 100)).toBe(167);
  });
});

describe("sharedBlocks", () => {
  it("saves prefix blocks for all but the first sequence", () => {
    // prefix 32, 4 seqs, block 16 -> 2 blocks * 3 = 6
    expect(sharedBlocks(32, 4, 16)).toBe(6);
  });
});
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Implement `paging.ts`:**

```ts
export function blocksNeeded(tokens: number, blockSize: number): number {
  return Math.ceil(tokens / blockSize);
}

export function pagedWaste(seqLens: number[], blockSize: number): number {
  return seqLens.reduce((w, len) => w + (blocksNeeded(len, blockSize) * blockSize - len), 0);
}

export function contiguousWaste(seqLens: number[], reservedPerSeq: number): number {
  return seqLens.reduce((w, len) => w + (reservedPerSeq - len), 0);
}

export function sharedBlocks(prefixLen: number, seqCount: number, blockSize: number): number {
  return (seqCount - 1) * Math.floor(prefixLen / blockSize);
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Build `PagedCache.tsx`** (`WidgetContainer title="Memory in pages"`). Spec:
  - A **grid of physical blocks** (big squares), block size shown (use a small toy `blockSize`, e.g. 4, so a block visibly holds 4 word-slots).
  - 1–3 **sequences**, each a colored strip of tokens; an "Add word" button grows a sequence, filling its current block then grabbing a new (possibly non-adjacent) physical block; a **block table** panel maps each sequence's logical blocks → physical block numbers.
  - A `ToggleControl` **"Reserve one big contiguous chunk"** to contrast the naive scheme (each sequence reserves max length up front) with paging; show **wasted slots** for each via `contiguousWaste` vs `pagedWaste`, as big labeled numbers and shaded empty cells.
  - A button **"Share a common prompt"** that gives two sequences the same prefix and shows the shared physical blocks (one copy, `sharedBlocks` saved).
  - Reset clears sequences.
  - "Try this": "Grow two conversations. With one big reservation each, most of the memory sits empty. Switch to pages and the wasted space nearly vanishes — and a shared prompt can live in one place for both."

- [ ] **Step 6: Wire into `widgets.tsx` + `page.tsx`** (export `PagedCacheWidget`).

- [ ] **Step 7: Beat-5 prose** under "Memory in Pages": the KV cache is the memory hog; reserving one big block per request wastes most of it; PagedAttention (vLLM) borrows the operating system's paging idea — split the cache into small fixed blocks (~16 words), keep a table mapping each sequence's positions to scattered physical blocks (blocks like pages, words like bytes, requests like programs); waste falls from most of the memory to almost none, and identical blocks such as a shared prompt can be reused. Place `<PagedCacheWidget>`.

- [ ] **Step 8: Verify** — `pnpm test src/components/widgets/context/paging.test.ts && pnpm lint && pnpm build`.

- [ ] **Step 9: Commit** ("Add PagedCache widget and beat 5 prose" + trailers).

---

### Task 8: Widget 6 — Retrieval (beat 6) + beat-6 prose

**Files:**
- Create: `src/components/widgets/context/corpus.ts`, `retrieval.ts`, `retrieval.test.ts`, `Retrieval.tsx`
- Modify: `widgets.tsx`, `page.tsx`, `content.mdx`

**Interfaces:**
- `corpus.ts` produces hand-authored data:
  - `type Doc = { id: number; text: string; tags: string[] }` — ~8 short docs; `tags` are author-assigned meaning labels standing in for an embedding (e.g. a doc that says "the pup wouldn't stop barking" tagged `["dog","noise"]`).
  - `export const CORPUS: Doc[]`.
  - `export const EXAMPLE_QUERIES: { text: string; tags: string[] }[]` — including one that shares meaning but no words with its best doc, and one that shares an exact word.
- `retrieval.ts` produces:
  - `keywordScore(query: string, doc: Doc): number` — count of shared lowercased words.
  - `semanticScore(query: { tags: string[] }, doc: Doc): number` — count of shared tags (toy stand-in for cosine similarity of embeddings).
  - `rank<T>(docs: Doc[], score: (d: Doc) => number): { doc: Doc; score: number }[]` — sorted desc, stable.
  - Widget export `RetrievalWidget`.

- [ ] **Step 1: Write the failing test** — `retrieval.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CORPUS, EXAMPLE_QUERIES } from "./corpus";
import { keywordScore, semanticScore, rank } from "./retrieval";

describe("corpus data", () => {
  it("has docs with text and meaning tags", () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(5);
    for (const d of CORPUS) expect(d.tags.length).toBeGreaterThan(0);
  });
  it("includes a meaning-not-words query and an exact-word query", () => {
    expect(EXAMPLE_QUERIES.length).toBeGreaterThanOrEqual(2);
  });
});

describe("keywordScore", () => {
  it("counts shared words", () => {
    const doc = { id: 1, text: "the dog barked loudly", tags: [] };
    expect(keywordScore("dog barked", doc)).toBe(2);
    expect(keywordScore("cat meowed", doc)).toBe(0);
  });
});

describe("semanticScore", () => {
  it("counts shared meaning tags", () => {
    const doc = { id: 1, text: "the pup wouldn't stop", tags: ["dog", "noise"] };
    expect(semanticScore({ tags: ["dog"] }, doc)).toBe(1);
    expect(semanticScore({ tags: ["car"] }, doc)).toBe(0);
  });
});

describe("rank", () => {
  it("orders docs by score descending, stable on ties", () => {
    const ranked = rank(CORPUS, (d) => (d.id === CORPUS[0].id ? 5 : 0));
    expect(ranked[0].doc.id).toBe(CORPUS[0].id);
  });
});
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Implement `corpus.ts`** (hand-author ~8 short docs with meaning tags + 2 example queries as specified) **and `retrieval.ts`:**

```ts
import type { Doc } from "./corpus";

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function keywordScore(query: string, doc: Doc): number {
  const q = new Set(words(query));
  return words(doc.text).filter((w) => q.has(w)).length;
}

export function semanticScore(query: { tags: string[] }, doc: Doc): number {
  const q = new Set(query.tags);
  return doc.tags.filter((t) => q.has(t)).length;
}

export function rank(docs: Doc[], score: (d: Doc) => number): { doc: Doc; score: number }[] {
  return docs
    .map((doc) => ({ doc, score: score(doc) }))
    .sort((a, b) => b.score - a.score || a.doc.id - b.doc.id);
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Build `Retrieval.tsx`** (`WidgetContainer title="What goes in the window"`). Spec:
  - A big query box: either pick an `EXAMPLE_QUERIES` entry from a `SelectControl` or type free text (typing drives keyword; the selected example carries the meaning tags for semantic).
  - Two labeled columns side by side: **"Keyword search (grep)"** ranked by `keywordScore`, and **"Meaning search (embeddings)"** ranked by `semanticScore`. Show each doc as a readable card with its matched words/tags highlighted and its score.
  - The intended discovery: the meaning-not-words query ("who was making noise?") finds the "pup wouldn't stop barking" doc semantically but scores 0 on keyword; an exact identifier query is nailed by keyword. Make that contrast pop.
  - Reset to first example.
  - "Try this": "Ask 'who was making all that noise?'. Keyword search finds nothing — those exact words aren't there. Meaning search still finds the barking dog. Now search for an exact name and watch keyword win."

- [ ] **Step 6: Wire into `widgets.tsx` + `page.tsx`** (export `RetrievalWidget`).

- [ ] **Step 7: Beat-6 prose** under "What Goes In the Window": the window is finite, the world is not, so something must choose what to put in it. Two ways: **RAG** turns documents into embedding vectors in a database and pulls the nearest by meaning (builds on the Embeddings chapter); **agentic grep** has the model act like a developer — run a keyword search, open files, follow links, iterate — which stays fresh and exact for code (cite the "Is Grep All You Need?" finding that grep matched or beat vector search on code), and real systems combine both. Place `<RetrievalWidget>`.

- [ ] **Step 8: Verify** — `pnpm test src/components/widgets/context/retrieval.test.ts && pnpm lint && pnpm build`.

- [ ] **Step 9: Commit** ("Add Retrieval widget and beat 6 prose" + trailers).

---

### Task 9: Beat 7 prose — agents managing their own context

**Files:**
- Modify: `src/app/(tutorial)/context/content.mdx`

- [ ] **Step 1: Write beat-7 prose** under "An Agent Minding Its Own Context": a long-running agent fills its window with tool output and conversation, so it curates — **compaction** (summarize old turns into a short note), **memory files** (write durable facts to disk and re-read them when needed), and pulling in just what the current step needs via the retrieval from beat 6. Tie back: the architecture tricks (sparse attention, paging) make a big window possible; context management decides what deserves to be in it. Optionally include a small static diagram (an ASCII-free `<div>`-based or existing MDX component) — no new widget. Mention MLA / Kimi K2 (compressing the cache) and, cautiously and attributed to Moonshot, Kimi K3, as one line of "the frontier keeps pushing this."

- [ ] **Step 2: Add the notebook link** near the end: `<TryItInPyTorch notebook="context">...</TryItInPyTorch>` (component already exists in the MDX registry).

- [ ] **Step 3: Verify** — `pnpm lint && pnpm build`.

- [ ] **Step 4: Commit** ("Add beat 7 prose and notebook link" + trailers).

---

### Task 10: Quiz

**Files:**
- Modify: `src/app/(tutorial)/context/quiz.mdx`

- [ ] **Step 1: Read `docs/plans/quiz-writing-guide.md`** and an existing `quiz.mdx` (e.g. attention) to match the exact `Choice`/`Feedback` component format.

- [ ] **Step 2: Write ~5 questions** covering: why attention is quadratic; what the KV cache saves and its cost; local vs. global attention (Gemma); the sparse-attention indexer + IndexShare (the 1M-context story); RAG vs. grep. Each with plausible distractors and per-choice feedback per the guide. Replace the placeholder question.

- [ ] **Step 3: Verify** — `pnpm lint && pnpm build`; if the user's dev server is up, the `tests/quiz.spec.ts` pattern applies — otherwise skip e2e.

- [ ] **Step 4: Commit** ("Add context chapter quiz" + trailers).

---

### Task 11: Glossary terms

**Files:**
- Modify: the glossary source (discover exact path: inspect `scripts/build-glossary-index.mjs` and `src/app/(tutorial)/glossary/` to find where term definitions live).

- [ ] **Step 1: Locate the glossary term source** and read an existing entry to match format.

- [ ] **Step 2: Add entries** (short definition + chapter link `context`) for: context window, KV cache, sparse attention, lightning indexer (DSA), IndexShare, local / sliding-window attention, PagedAttention, RAG, semantic search, MLA. Reuse existing entries if some already exist (e.g. embeddings) rather than duplicating.

- [ ] **Step 3: Rebuild the glossary index** — Run: `pnpm glossary:build` then `pnpm glossary:audit` (fix anything the audit flags).

- [ ] **Step 4: Verify** — `pnpm lint && pnpm build`.

- [ ] **Step 5: Commit** ("Add context chapter glossary terms" + trailers).

---

### Task 12: Companion notebook

**Files:**
- Create: `notebooks/context.ipynb`

Mirror the chapter section by section (repo convention), with tiny NumPy/PyTorch demos and every term defined before use or referenced to its chapter (`docs/plans/pytorch-prerequisites.md`). No large downloads.

- [ ] **Step 1: Read `notebooks/attention.ipynb`** (and `docs/plans/notebook-philosophy.md`) to match structure, tone, and setup-cell conventions.

- [ ] **Step 2: Author cells** matching the beats:
  - Quadratic cost: build a random `L×d` toy "sequence", compute the full `L×L` attention-score matrix, and print how the number of scores grows as `L` doubles.
  - KV cache: a tiny loop generating tokens, showing the recompute-vs-reuse work counts (mirror `keyValueWork`).
  - Local vs global: mask an attention matrix to a sliding window vs. full; show the cost difference.
  - Sparse indexer: toy embeddings for a small "haystack", a cheap dot-product "indexer" score, `top-k` selection, and full attention on just the shortlist — reproducing beat 4 in code.
  - Retrieval: embed a few toy docs and a query, rank by cosine similarity vs. keyword overlap — mirror beat 6.

- [ ] **Step 3: Execute the notebook** — Run: `pnpm test:notebooks` (respect the load guard in `~/.claude/CLAUDE.md`; the script uses `.venv/bin/jupyter` if present). Confirm `context.ipynb` prints `PASS`.

- [ ] **Step 4: Commit** ("Add context companion notebook" + trailers).

---

### Task 13: Full verification + voice/design polish

**Files:**
- Modify: `src/app/(tutorial)/context/content.mdx` and widgets as needed.

- [ ] **Step 1: Voice pass** over `content.mdx` using the `docs/style/voice.md` checklist: search `—` (justify each), `It's not`/`not just`/`not only`, `Here's`/`Let's`, `Notice`, and thin bold in running prose. Fix tells surgically without rewriting the author's structure.

- [ ] **Step 2: Widget readability pass** — open each widget (ask the user to confirm their dev server is on :3000; do NOT start one) and check: text is large and legible, one clear knob, the "try this" surprise lands, works at mobile width. Fix sizing issues.

- [ ] **Step 3: Full test + build** — Run: `pnpm test && pnpm lint && pnpm build`. All green.

- [ ] **Step 4: Chapter smoke + nav** — confirm `tests/chapter-smoke.spec.ts` and `tests/chapter-metadata.spec.ts` cover the new chapter and pass (run Playwright only if the user confirms an app is running; otherwise note it for the user).

- [ ] **Step 5: Final commit** ("Polish context chapter prose and widgets" + trailers), then use `superpowers:finishing-a-development-branch` to decide merge/PR.

---

## Self-Review

**Spec coverage:** All 7 beats have tasks (3–9). All 6 widgets have logic-module TDD + component + wiring (Tasks 3–8). Curriculum renumber + long-context removal (Task 1). Scaffolding/build (Task 2). Quiz (10), glossary (11), notebook (12), voice/readability/verification (13). Accuracy guardrails are in Global Constraints and repeated in the relevant beats. Open-vs-closed framing is in beat 4 (Task 6, Step 7).

**Placeholder scan:** Logic modules and tests are complete code. Widget/prose steps are detailed specs by design (noted under "Notes on plan style") with exact labels, data shapes, and "try this" copy — not "TBD". Quiz/glossary tasks include a "read the existing format first" step because their exact file formats must be confirmed in-repo.

**Type consistency:** Module exports referenced across tasks (`formatCount` from `cost.ts` reused in Tasks 5/6; `Token` from `haystack.ts`; `Doc` from `corpus.ts`; `LayerKind`) are defined where first introduced and imported thereafter. Widget export names (`QuadraticWallWidget` … `RetrievalWidget`) match their `page.tsx` registration.
