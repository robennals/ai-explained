# Attention Chapter Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the attention chapter into four small build-up steps (match scores → softmax → values → sink), each adding one concept. Replaces the current toy widget progression and reorders sections so softmax appears before percentages and values appear immediately after the K/Q toy.

**Architecture:** Extract attention math (`dot`, `softmax`, `weightedSum`) into a unit-tested helper module. Build four toy widgets, each one tiny step beyond the previous, sharing the math module. Move the `Softmax`, `Values`, and `Multi-headed attention` sections of `content.mdx` to come *before* the BERT/Live real-model widgets. Add a new "When Nothing Matches: The Sink" section. Keep `BertAttention`, `LiveAttention`, `QKVProjection`, `WhyAttentionMatters`, `SoftmaxExplorer` widgets unchanged.

**Tech Stack:** Next.js 16 App Router, MDX, React 19, TypeScript, Tailwind 4, Playwright (E2E), Vitest (new — for unit-testing math helpers).

**Reference spec:** `docs/superpowers/specs/2026-05-01-attention-revision-design.md`

---

## File structure

**Create:**
- `vitest.config.ts` — vitest config, jsdom-free (we only test pure functions)
- `src/components/widgets/attention/toyMath.ts` — `dot`, `softmax`, `weightedSum`
- `src/components/widgets/attention/toyMath.test.ts` — unit tests for the math
- `src/components/widgets/attention/ToyAttentionScores.tsx` — step 1 widget
- `src/components/widgets/attention/ToyAttentionSoftmax.tsx` — step 2 widget
- `src/components/widgets/attention/ToyAttentionSink.tsx` — step 4 widget

**Modify:**
- `package.json` — add vitest devDependency, add `test` script
- `src/components/widgets/attention/ToyAttentionValues.tsx` — restrict sentence selector, add `dog blah dog it` example, add "two dogs more confident" callout, swap inline math for `toyMath.ts` imports
- `src/app/(tutorial)/attention/widgets.tsx` — register new widgets, deregister retired ones
- `src/app/(tutorial)/attention/content.mdx` — rewrite section order and prose
- `tests/attention.spec.ts` — update Playwright test to reference new widget structure

**Delete:**
- `src/components/widgets/attention/ToyAttention.tsx` — replaced by Scores/Softmax/Sink trio
- `src/components/widgets/attention/ToyVocabTable.tsx` — folded into `ToyAttentionScores`
- `src/components/widgets/attention/ToyValueTable.tsx` — folded into `ToyAttentionValues`
- `src/components/widgets/attention/ToyValues.tsx` — already-unused (check first)

**Unchanged:**
- `src/components/widgets/attention/WhyAttentionMatters.tsx`
- `src/components/widgets/attention/SoftmaxExplorer.tsx`
- `src/components/widgets/attention/BertAttention.tsx`
- `src/components/widgets/attention/LiveAttention.tsx`
- `src/components/widgets/attention/QKVProjection.tsx`

---

## Task 1: Add vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: Add `test` script to `package.json`**

In the `"scripts"` block, add a `test` line:

```json
"test": "vitest run"
```

So the scripts block becomes:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint && bash scripts/lint-mdx-no-raw-p.sh",
  "test": "vitest run",
  "sync-r2": "bash scripts/sync-r2.sh",
  "sync-r2:apply": "bash scripts/sync-r2.sh --apply",
  "test:notebooks": "jupyter nbconvert --to notebook --execute --ExecutePreprocessor.timeout=300 notebooks/*.ipynb --output-dir /tmp/notebook-test-output"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Verify vitest runs (with no tests yet)**

Run: `pnpm test`
Expected: `No test files found, exiting with code 1` (or similar). That's fine — there are no tests yet.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest for unit-testing pure helpers"
```

---

## Task 2: Math helpers with TDD

**Files:**
- Create: `src/components/widgets/attention/toyMath.ts`
- Create: `src/components/widgets/attention/toyMath.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/widgets/attention/toyMath.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { dot, softmax, weightedSum } from "./toyMath";

describe("dot", () => {
  it("returns the sum of element-wise products", () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(dot([1, 0], [0, 1])).toBe(0);
  });

  it("works with 1-dim vectors", () => {
    expect(dot([3], [1])).toBe(3);
    expect(dot([0], [1])).toBe(0);
  });
});

describe("softmax", () => {
  it("returns a uniform distribution for equal scores", () => {
    const result = softmax([2, 2, 2, 2]);
    expect(result).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("is shift-invariant", () => {
    const a = softmax([3, 0, 0, 0]);
    const b = softmax([4, 1, 1, 1]);
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));
  });

  it("matches expected weights for [3, 0, 0, 0]", () => {
    const result = softmax([3, 0, 0, 0]);
    expect(result[0]).toBeCloseTo(0.870, 3);
    expect(result[1]).toBeCloseTo(0.0433, 3);
    expect(result[2]).toBeCloseTo(0.0433, 3);
    expect(result[3]).toBeCloseTo(0.0433, 3);
  });

  it("matches expected weights for [3, 0, 3, 0] (two-match case)", () => {
    const result = softmax([3, 0, 3, 0]);
    expect(result[0]).toBeCloseTo(0.476, 3);
    expect(result[1]).toBeCloseTo(0.0238, 3);
    expect(result[2]).toBeCloseTo(0.476, 3);
    expect(result[3]).toBeCloseTo(0.0238, 3);
  });

  it("sums to 1 for any input", () => {
    const inputs = [
      [1, 2, 3],
      [-5, 0, 5],
      [100, 100, 100],
      [0, 0, 0, 0, 0, 0],
    ];
    for (const input of inputs) {
      const result = softmax(input);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 6);
    }
  });

  it("is numerically stable for large scores", () => {
    const result = softmax([1000, 999]);
    expect(result[0]).toBeCloseTo(0.7311, 3);
    expect(result[1]).toBeCloseTo(0.2689, 3);
  });
});

describe("weightedSum", () => {
  it("blends value vectors by weights", () => {
    const weights = [0.5, 0.5];
    const values = [
      [1, 0],
      [0, 1],
    ];
    expect(weightedSum(weights, values)).toEqual([0.5, 0.5]);
  });

  it("matches expected step-3 result for cat blah blah it", () => {
    // it.q=[3], keys=[1,0,0,0], values=[[1,0],[0,0],[0,0],[0,0]]
    const w = softmax([3, 0, 0, 0]);
    const v = [
      [1, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0.870, 3);
    expect(result[1]).toBeCloseTo(0, 6);
  });

  it("matches expected step-3 result for dog blah dog it (two dogs)", () => {
    // it.q=[3], keys=[1,0,1,0], values=[[0,1],[0,0],[0,1],[0,0]]
    const w = softmax([3, 0, 3, 0]);
    const v = [
      [0, 1],
      [0, 0],
      [0, 1],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(0.952, 3);
  });

  it("matches expected step-4 sink result for blah blah blah it", () => {
    // it.q=[3,1], all keys=[0,1] → scores=[1,1,1,1] → uniform 25%
    // values: blah=[0,0,1], blah=[0,0,1], blah=[0,0,1], it=[0,0,1]
    const w = softmax([1, 1, 1, 1]);
    const v = [
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(0, 6);
    expect(result[2]).toBeCloseTo(1, 6);
  });
});
```

- [ ] **Step 2: Run the tests — should fail with "Cannot find module"**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './toyMath'` or similar.

- [ ] **Step 3: Implement `toyMath.ts`**

Create `src/components/widgets/attention/toyMath.ts`:

```ts
/**
 * Dot product of two equal-length vectors.
 */
export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Numerically stable softmax. Subtracts the max before exponentiating.
 */
export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * Linear combination of value vectors weighted by `weights`.
 * Assumes all value vectors share the same dimension and weights.length === values.length.
 */
export function weightedSum(weights: number[], values: number[][]): number[] {
  const dim = values[0].length;
  const result = new Array<number>(dim).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let d = 0; d < dim; d++) {
      result[d] += weights[i] * values[i][d];
    }
  }
  return result;
}
```

- [ ] **Step 4: Run the tests — should pass**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/attention/toyMath.ts src/components/widgets/attention/toyMath.test.ts
git commit -m "feat(attention): extract toy attention math with unit tests"
```

---

## Task 3: ToyAttentionScores widget (step 1)

**Files:**
- Create: `src/components/widgets/attention/ToyAttentionScores.tsx`

This widget shows raw dot product scores only — no percentages, no softmax. Keys and queries are 1/0. All four tokens are clickable. The widget shows BOTH key and query for every token, including the selected one.

- [ ] **Step 1: Create `ToyAttentionScores.tsx`**

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data — step 1: 1-dim keys/queries, 1/0 values                     */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];
  query: number[];
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const CAT: Token = {
  label: "cat", key: [1], query: [0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [1], query: [0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], query: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], query: [1],
  color: "text-purple-600 dark:text-purple-400",
};

const PROPS = ["noun"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "blah dog blah it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [BLA, BLA, BLA, IT] },
];

/* ------------------------------------------------------------------ */
/*  Arrow helpers                                                     */
/* ------------------------------------------------------------------ */

const HUE = 240;

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  score: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ToyAttentionScores() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(3); // default: "it" of first sentence
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(3);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    // default to last "it" position; if no "it", select last token
    const newTokens = SENTENCES[idx].tokens;
    const itIdx = newTokens.map((t, i) => (t.label === "it" ? i : -1)).filter((i) => i >= 0);
    setSelected(itIdx.length > 0 ? itIdx[itIdx.length - 1] : newTokens.length - 1);
  };

  const scores = selected !== null
    ? tokens.map((t) => dot(tokens[selected].query, t.key))
    : null;
  const hasSelection = selected !== null;

  // Compute arrows from selected token to others, weighted by score
  useEffect(() => {
    if (!hasSelection || !scores || !rowRef.current) {
      const raf = requestAnimationFrame(() => setArrows([]));
      return () => cancelAnimationFrame(raf);
    }

    const raf = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fromEl = cardRefs.current.get(selected!);
      if (!fromEl) { setArrows([]); return; }
      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
      const fromY = fromRect.top - rowRect.top;

      const newArrows: Arrow[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (i === selected) continue;
        const s = scores![i];
        if (s <= 0) continue;
        const toEl = cardRefs.current.get(i);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX, fromY,
          toX: toRect.left + toRect.width / 2 - rowRect.left,
          toY: toRect.top - rowRect.top,
          score: s,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [hasSelection, selected, scores, sentIdx, tokens]);

  const arcPad = 50;

  return (
    <WidgetContainer
      title="Match Scores"
      description={'Click any token to see its raw match scores against every key. No percentages yet.'}
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Token row */}
        <div className="relative" ref={rowRef}>
          {arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker id="scores-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HUE}, 75%, 55%, 0.7)`} />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.1, 80);
                const midX = (a.fromX + a.toX) / 2;
                const midY = Math.min(a.fromY, a.toY) - arcHeight;
                return (
                  <path
                    key={i}
                    d={`M ${a.fromX} ${a.fromY} Q ${midX} ${midY} ${a.toX} ${a.toY}`}
                    fill="none"
                    stroke={`hsla(${HUE}, 75%, 55%, 0.7)`}
                    strokeWidth={2}
                    markerEnd="url(#scores-arrowhead)"
                  />
                );
              })}
            </svg>
          )}

          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const score = scores?.[i];

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 130 }}>
                  <button
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    onClick={() => setSelected(isSelected ? null : i)}
                    className={`rounded-lg border-2 px-4 py-2 transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                  </button>

                  {/* Always show key + query for every token */}
                  <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                    <VectorCard
                      name=""
                      emoji=""
                      properties={PROPS}
                      values={tok.key}
                      barMax={1}
                      animate={false}
                      labelWidth="w-10"
                      barWidth="w-10"
                      className="text-xs w-full"
                      label="KEY"
                    />
                    <VectorCard
                      name=""
                      emoji=""
                      properties={PROPS}
                      values={tok.query}
                      barColor="var(--color-accent)"
                      barMax={1}
                      animate={false}
                      labelWidth="w-10"
                      barWidth="w-10"
                      className="text-xs w-full"
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />

                    {/* Score row — shown only when something is selected */}
                    {hasSelection && score != null && (
                      <div className="text-center font-mono text-[10px] text-muted leading-tight">
                        <span>[{tokens[selected!].query.join(", ")}]</span>
                        {" · "}
                        <span>[{tok.key.join(", ")}]</span>
                        {" = "}
                        <span className="font-bold text-foreground">{score}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation when nothing is asking */}
        {hasSelection && tokens[selected!].query.every((q) => q === 0) && (
          <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-muted">
            <span className="font-bold text-foreground">{tokens[selected!].label}</span> isn&apos;t asking
            anything in this head — its query is all zeros. Every match score is 0.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build` (or wait until later — typescript will catch errors during build)

For now, just verify the file has no TS errors by opening it in your editor or running `pnpm lint`.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/attention/ToyAttentionScores.tsx
git commit -m "feat(attention): add ToyAttentionScores widget (step 1)"
```

---

## Task 4: ToyAttentionSoftmax widget (step 2)

**Files:**
- Create: `src/components/widgets/attention/ToyAttentionSoftmax.tsx`

Same vector schema as Step 1 (1-dim, 1/0 keys), but with a query-magnitude toggle (1 ↔ 3) and softmax percentages displayed.

- [ ] **Step 1: Create `ToyAttentionSoftmax.tsx`**

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot, softmax } from "./toyMath";

interface Token {
  label: string;
  key: number[];
  baseQuery: number[]; // 0 or 1, scaled by query magnitude when computing
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const CAT: Token = {
  label: "cat", key: [1], baseQuery: [0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [1], baseQuery: [0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], baseQuery: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], baseQuery: [1],
  color: "text-purple-600 dark:text-purple-400",
};

const PROPS = ["noun"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "blah dog blah it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
];

const HUE = 240;

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HUE}, 75%, 55%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HUE}, 80%, 50%, ${alpha})`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

export function ToyAttentionSoftmax() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(3);
  const [queryMag, setQueryMag] = useState<number>(1); // 1 or 3
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(3);
    setQueryMag(1);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    const newTokens = SENTENCES[idx].tokens;
    const itIdx = newTokens.map((t, i) => (t.label === "it" ? i : -1)).filter((i) => i >= 0);
    setSelected(itIdx.length > 0 ? itIdx[itIdx.length - 1] : newTokens.length - 1);
  };

  // Effective query for the selected token, scaled by queryMag
  const scaledQuery = (tok: Token): number[] =>
    tok.baseQuery.map((q) => q * queryMag);

  const scores = selected !== null
    ? tokens.map((t) => dot(scaledQuery(tokens[selected]), t.key))
    : null;
  const weights = scores ? softmax(scores) : null;
  const hasSelection = selected !== null;

  useEffect(() => {
    if (!hasSelection || !weights || !rowRef.current) {
      const raf = requestAnimationFrame(() => setArrows([]));
      return () => cancelAnimationFrame(raf);
    }

    const raf = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fromEl = cardRefs.current.get(selected!);
      if (!fromEl) { setArrows([]); return; }
      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
      const fromY = fromRect.top - rowRect.top;

      const newArrows: Arrow[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (i === selected) continue;
        const w = weights![i];
        if (w < 0.01) continue;
        const toEl = cardRefs.current.get(i);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX, fromY,
          toX: toRect.left + toRect.width / 2 - rowRect.left,
          toY: toRect.top - rowRect.top,
          weight: w,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [hasSelection, selected, weights, sentIdx, tokens]);

  const arcPad = 50;

  return (
    <WidgetContainer
      title="Adding Softmax"
      description={'Now apply softmax to turn match scores into percentages. Try cranking the query magnitude up to 3 and watch the leak shrink.'}
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Query magnitude toggle */}
        <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
          <span className="text-xs font-semibold uppercase text-muted">it&apos;s query magnitude:</span>
          {[1, 3].map((m) => (
            <button
              key={m}
              onClick={() => setQueryMag(m)}
              className={`rounded-full px-4 py-1 font-mono text-sm font-bold transition-colors ${
                queryMag === m
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              [{m}]
            </button>
          ))}
        </div>

        {/* Token row */}
        <div className="relative" ref={rowRef}>
          {arrows.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 10 }}>
              <defs>
                <marker id="softmax-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HUE}, 75%, 55%, 0.7)`} />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.1, 80);
                const midX = (a.fromX + a.toX) / 2;
                const midY = Math.min(a.fromY, a.toY) - arcHeight;
                const strokeWidth = 1.5 + a.weight * 1.5;
                return (
                  <path
                    key={i}
                    d={`M ${a.fromX} ${a.fromY} Q ${midX} ${midY} ${a.toX} ${a.toY}`}
                    fill="none"
                    stroke={weightToStroke(a.weight)}
                    strokeWidth={strokeWidth}
                    markerEnd="url(#softmax-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const weight = weights?.[i];
              const isTarget = weight != null && weight > 0.01 && !isSelected;
              const queryShown = isSelected ? scaledQuery(tok) : tok.baseQuery;

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 130 }}>
                  <button
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    onClick={() => setSelected(isSelected ? null : i)}
                    className={`rounded-lg border-2 px-4 py-2 transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                  </button>

                  <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                    <VectorCard
                      name="" emoji="" properties={PROPS} values={tok.key}
                      barMax={1} animate={false}
                      labelWidth="w-10" barWidth="w-10" className="text-xs w-full" label="KEY"
                    />
                    <VectorCard
                      name="" emoji="" properties={PROPS} values={queryShown}
                      barColor="var(--color-accent)"
                      barMax={3} animate={false}
                      labelWidth="w-10" barWidth="w-10" className="text-xs w-full"
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />

                    {hasSelection && scores && (
                      <div className="text-center font-mono text-[10px] text-muted leading-tight">
                        <span>[{scaledQuery(tokens[selected!]).join(", ")}]</span>
                        {" · "}
                        <span>[{tok.key.join(", ")}]</span>
                        {" = "}
                        <span className="font-bold text-foreground">{scores[i]}</span>
                      </div>
                    )}

                    {weight != null && (
                      isTarget ? (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
                          style={{ backgroundColor: weightToPill(weight) }}
                        >
                          {pct(weight)}
                        </span>
                      ) : (
                        <span className={`font-mono text-[10px] font-bold ${isSelected ? "text-accent" : "text-muted"}`}>
                          {pct(weight)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contextual explanation */}
        {hasSelection && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            {queryMag === 1 ? (
              <>With query magnitude <strong>1</strong>, the noun match is only twice as strong as no-match. Softmax distributes attention fairly evenly — over half leaks to filler. Try magnitude <strong>3</strong>.</>
            ) : (
              <>With query magnitude <strong>3</strong>, the noun match is much stronger. Softmax now puts most attention on the matching noun. A small leak remains (≈4% per filler) because softmax always allocates 100%.</>
            )}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/attention/ToyAttentionSoftmax.tsx
git commit -m "feat(attention): add ToyAttentionSoftmax widget (step 2) with query magnitude toggle"
```

---

## Task 5: Modify ToyAttentionValues for step 3

**Files:**
- Modify: `src/components/widgets/attention/ToyAttentionValues.tsx`

Changes: restrict sentence selector to it-with-match cases, add `dog blah dog it` example, swap inline math for `toyMath` imports, add a "two dogs → more confident" callout that activates on the two-of-a-kind sentences.

- [ ] **Step 1: Replace `SENTENCES` and the math imports**

In `src/components/widgets/attention/ToyAttentionValues.tsx`, replace the math section and SENTENCES constant.

Find:
```tsx
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function weightedSum(weights: number[], values: number[][]): number[] {
  const dim = values[0].length;
  const result = new Array(dim).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let d = 0; d < dim; d++) {
      result[d] += weights[i] * values[i][d];
    }
  }
  return result;
}
```

Replace with (at top of file, alongside other imports):

```tsx
import { dot, softmax, weightedSum } from "./toyMath";
```

(Remove the inline math definitions entirely.)

- [ ] **Step 2: Replace `SENTENCES` constant**

Find:
```tsx
const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "blah dog blah it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [BLA, BLA, BLA, IT] },
  { label: "cat it dog it", tokens: [CAT, IT, DOG, IT] },
];
```

Replace with:

```tsx
const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "blah dog blah it", tokens: [BLA, DOG, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "dog blah dog it", tokens: [DOG, BLA, DOG, IT] },
];
```

(Removes the `blah blah blah it` and `cat it dog it` cases, which are step-4 territory. Adds `dog blah dog it` for the "two dogs → more confident" payoff.)

- [ ] **Step 3: Add the "two-of-a-kind" callout block**

Right above the closing `</WidgetContainer>` (after the `Result` block, around line 388), add this new block:

```tsx
{/* "Two of a kind" callout — fires only on dog-blah-dog-it (or similar) */}
{hasSelection && (() => {
  const counts = tokens.reduce<Record<string, number>>((acc, t) => {
    if (t.label === "cat" || t.label === "dog") acc[t.label] = (acc[t.label] ?? 0) + 1;
    return acc;
  }, {});
  const repeated = Object.entries(counts).find(([, n]) => n >= 2);
  if (!repeated) return null;
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
      Two <strong>{repeated[0]}</strong>s in the sentence — the result is sharper than with just one
      because softmax&apos;s denominator dilutes the leak. More matches → more confident.
    </div>
  );
})()}
```

- [ ] **Step 4: Update the widget description**

Find:
```tsx
<WidgetContainer
  title="Attention + Values"
  description={'See how attention weights blend token values into a result.'}
```

Replace with:
```tsx
<WidgetContainer
  title="Attention + Values"
  description={'See how attention weights blend token values into a result. Try the two-dog sentence — the result is sharper than with one dog.'}
```

- [ ] **Step 5: Update the prompt-when-nothing-selected text**

Find (near the bottom):
```tsx
{!hasSelection && (
  <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center text-sm text-muted">
    Click &ldquo;it&rdquo; to see how attention weights blend values.
  </div>
)}
```

Keep as-is — the message is still accurate.

- [ ] **Step 6: Verify the changes compile**

Run: `pnpm lint`
Expected: passes (or at most warnings, no errors).

- [ ] **Step 7: Commit**

```bash
git add src/components/widgets/attention/ToyAttentionValues.tsx
git commit -m "feat(attention): tighten ToyAttentionValues sentences, add two-dog confidence callout, use shared math"
```

---

## Task 6: ToyAttentionSink widget (step 4)

**Files:**
- Create: `src/components/widgets/attention/ToyAttentionSink.tsx`

The full sink mechanism: 2-D keys/queries (noun, sink), 3-D values (cat, dog, nothing), all tokens clickable, all sentences (including blah-only) selectable, plain-English explanation box.

- [ ] **Step 1: Create `ToyAttentionSink.tsx`**

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot, softmax, weightedSum } from "./toyMath";

interface Token {
  label: string;
  key: number[];     // [noun, sink]
  query: number[];   // [noun, sink]
  value: number[];   // [cat, dog, nothing]
  color: string;
  hexColor: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const CAT: Token = {
  label: "cat",
  key: [1, 1], query: [0, 1], value: [1, 0, 0],
  color: "text-amber-600 dark:text-amber-400", hexColor: "#d97706",
};
const DOG: Token = {
  label: "dog",
  key: [1, 1], query: [0, 1], value: [0, 1, 0],
  color: "text-blue-600 dark:text-blue-400", hexColor: "#2563eb",
};
const BLA: Token = {
  label: "blah",
  key: [0, 1], query: [0, 1], value: [0, 0, 1],
  color: "text-foreground/40", hexColor: "#9ca3af",
};
const IT: Token = {
  label: "it",
  key: [0, 1], query: [3, 1], value: [0, 0, 1],
  color: "text-purple-600 dark:text-purple-400", hexColor: "#9333ea",
};

const KQ_PROPS = ["noun", "sink"];
const VALUE_PROPS = ["cat", "dog", "nothing"];

const SENTENCES: Sentence[] = [
  { label: "cat blah blah it", tokens: [CAT, BLA, BLA, IT] },
  { label: "cat blah dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "dog blah dog it", tokens: [DOG, BLA, DOG, IT] },
  { label: "blah blah blah it", tokens: [BLA, BLA, BLA, IT] },
];

const HUE = 240;

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HUE}, 75%, 55%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HUE}, 80%, 50%, ${alpha})`;
}

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

function describeOutput(v: number[]): string {
  const [cat, dog, nothing] = v;
  if (nothing > 0.85) return "no useful info gathered — pure fallback.";
  if (cat > 0.7 && dog < 0.1) return `mostly cat, with about ${Math.round(nothing * 100)}% sink leak.`;
  if (dog > 0.7 && cat < 0.1) return `mostly dog, with about ${Math.round(nothing * 100)}% sink leak.`;
  if (cat > 0.3 && dog > 0.3) return `${Math.round(cat * 100)}% cat, ${Math.round(dog * 100)}% dog — the model isn't sure.`;
  return `${Math.round(cat * 100)}% cat, ${Math.round(dog * 100)}% dog, ${Math.round(nothing * 100)}% nothing.`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

export function ToyAttentionSink() {
  const [sentIdx, setSentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(3);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setSelected(3);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    setSelected(SENTENCES[idx].tokens.length - 1); // default to last token
  };

  const scores = selected !== null
    ? tokens.map((t) => dot(tokens[selected].query, t.key))
    : null;
  const weights = scores ? softmax(scores) : null;
  const output = weights ? weightedSum(weights, tokens.map((t) => t.value)) : null;
  const hasSelection = selected !== null;

  useEffect(() => {
    if (!hasSelection || !weights || !rowRef.current) {
      const raf = requestAnimationFrame(() => setArrows([]));
      return () => cancelAnimationFrame(raf);
    }

    const raf = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fromEl = cardRefs.current.get(selected!);
      if (!fromEl) { setArrows([]); return; }
      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
      const fromY = fromRect.top - rowRect.top;

      const newArrows: Arrow[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (i === selected) continue;
        const w = weights![i];
        if (w < 0.01) continue;
        const toEl = cardRefs.current.get(i);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX, fromY,
          toX: toRect.left + toRect.width / 2 - rowRect.left,
          toY: toRect.top - rowRect.top,
          weight: w,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [hasSelection, selected, weights, sentIdx, tokens]);

  const arcPad = 50;

  return (
    <WidgetContainer
      title="Attention with Sink"
      description={'Click any token, try any sentence. The sink dimension gives attention somewhere to go when nothing matches.'}
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Token row */}
        <div className="relative" ref={rowRef}>
          {arrows.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 10 }}>
              <defs>
                <marker id="sink-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HUE}, 75%, 55%, 0.7)`} />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const dx = Math.abs(a.toX - a.fromX);
                const arcHeight = Math.min(arcPad + dx * 0.1, 80);
                const midX = (a.fromX + a.toX) / 2;
                const midY = Math.min(a.fromY, a.toY) - arcHeight;
                const strokeWidth = 1.5 + a.weight * 1.5;
                return (
                  <path
                    key={i}
                    d={`M ${a.fromX} ${a.fromY} Q ${midX} ${midY} ${a.toX} ${a.toY}`}
                    fill="none"
                    stroke={weightToStroke(a.weight)}
                    strokeWidth={strokeWidth}
                    markerEnd="url(#sink-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          )}

          <div className="flex justify-center gap-3" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isSelected = selected === i;
              const weight = weights?.[i];
              const isTarget = weight != null && weight > 0.01 && !isSelected;

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 140 }}>
                  <button
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    onClick={() => setSelected(isSelected ? null : i)}
                    className={`rounded-lg border-2 px-4 py-2 transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 border-border bg-surface"
                        : "border-border bg-surface hover:border-foreground/20"
                    }`}
                  >
                    <span className={`text-lg font-bold ${tok.color}`}>{tok.label}</span>
                  </button>

                  <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                    <VectorCard
                      name="" emoji="" properties={KQ_PROPS} values={tok.key}
                      barMax={1} animate={false}
                      labelWidth="w-12" barWidth="w-10" className="text-xs w-full" label="KEY"
                    />
                    <VectorCard
                      name="" emoji="" properties={KQ_PROPS} values={tok.query}
                      barColor="var(--color-accent)"
                      barMax={3} animate={false}
                      labelWidth="w-12" barWidth="w-10" className="text-xs w-full"
                      label="QUERY"
                      labelColor="var(--color-accent)"
                    />
                    <VectorCard
                      name="" emoji="" properties={VALUE_PROPS} values={tok.value}
                      barColor={tok.hexColor}
                      barMax={1} animate={false}
                      labelWidth="w-12" barWidth="w-10" className="text-xs w-full"
                      label="VALUE"
                    />

                    {hasSelection && scores && (
                      <div className="text-center font-mono text-[10px] text-muted leading-tight">
                        score = <span className="font-bold text-foreground">{scores[i]}</span>
                      </div>
                    )}

                    {weight != null && (
                      isTarget ? (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
                          style={{ backgroundColor: weightToPill(weight) }}
                        >
                          {pct(weight)}
                        </span>
                      ) : (
                        <span className={`font-mono text-[10px] font-bold ${isSelected ? "text-accent" : "text-muted"}`}>
                          {pct(weight)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result vector */}
        {hasSelection && output && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <span className="text-xs font-semibold uppercase text-muted">Result for &ldquo;{tokens[selected!].label}&rdquo;:</span>
            <VectorCard
              name="" emoji="" properties={VALUE_PROPS} values={output}
              barColor="#059669"
              barMax={1} animate={false}
              labelWidth="w-12" barWidth="w-12" className="text-xs"
              label="OUTPUT"
              labelColor="#059669"
            />
          </div>
        )}

        {/* Plain-English explanation */}
        {hasSelection && output && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            <strong>What this means: </strong>
            {tokens[selected!].label === "it"
              ? `it was looking for a noun. ${describeOutput(output)}`
              : `${tokens[selected!].label} isn’t asking the noun-finding question, so this head is idle for it. ${describeOutput(output)}`}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Verify the unit tests still pass with the new vector schemas**

Run: `pnpm test`
Expected: all tests still pass (we're only adding consumers, not changing the math).

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/attention/ToyAttentionSink.tsx
git commit -m "feat(attention): add ToyAttentionSink widget (step 4) with sink dimension"
```

---

## Task 7: Wire new widgets into widgets.tsx, remove retired ones

**Files:**
- Modify: `src/app/(tutorial)/attention/widgets.tsx`

- [ ] **Step 1: Replace `widgets.tsx`**

Replace the entire file with:

```tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const WhyAttentionMatters = dynamic(
  () => import("@/components/widgets/attention/WhyAttentionMatters").then((m) => m.WhyAttentionMatters),
  { ssr: false }
);

const ToyAttentionScores = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionScores").then((m) => m.ToyAttentionScores),
  { ssr: false }
);

const SoftmaxExplorer = dynamic(
  () => import("@/components/widgets/attention/SoftmaxExplorer").then((m) => m.SoftmaxExplorer),
  { ssr: false }
);

const ToyAttentionSoftmax = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionSoftmax").then((m) => m.ToyAttentionSoftmax),
  { ssr: false }
);

const ToyAttentionValues = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionValues").then((m) => m.ToyAttentionValues),
  { ssr: false }
);

const ToyAttentionSink = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionSink").then((m) => m.ToyAttentionSink),
  { ssr: false }
);

const BertAttention = dynamic(
  () => import("@/components/widgets/attention/BertAttention").then((m) => m.BertAttention),
  { ssr: false }
);

const LiveAttention = dynamic(
  () => import("@/components/widgets/attention/LiveAttention").then((m) => m.LiveAttention),
  { ssr: false }
);

const QKVProjection = dynamic(
  () => import("@/components/widgets/attention/QKVProjection").then((m) => m.QKVProjection),
  { ssr: false }
);

function WidgetSlot({ children, tryIt, label }: { children: React.ReactNode; tryIt?: React.ReactNode; label?: string }) {
  return (
    <Suspense
      fallback={
        <div className="my-8 flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted">
          Loading widget...
        </div>
      }
    >
      <TryItProvider content={tryIt} label={label}>
        {children}
      </TryItProvider>
    </Suspense>
  );
}

export function WhyAttentionMattersWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <WhyAttentionMatters />
    </WidgetSlot>
  );
}

export function ToyAttentionScoresWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionScores />
    </WidgetSlot>
  );
}

export function SoftmaxExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <SoftmaxExplorer />
    </WidgetSlot>
  );
}

export function ToyAttentionSoftmaxWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionSoftmax />
    </WidgetSlot>
  );
}

export function ToyAttentionValuesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionValues />
    </WidgetSlot>
  );
}

export function ToyAttentionSinkWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionSink />
    </WidgetSlot>
  );
}

export function QKVProjectionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <QKVProjection />
    </WidgetSlot>
  );
}

export function BertAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <BertAttention />
    </WidgetSlot>
  );
}

export function BertAttentionNoPositionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <BertAttention excludeHeads={["Next word", "Previous word"]} />
    </WidgetSlot>
  );
}

export function LiveAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <LiveAttention />
    </WidgetSlot>
  );
}
```

This removes `ToyVocabTableWidget`, `ToyAttentionWidget`, `ToyValuesWidget`, `ToyValueTableWidget`, `AttentionPlaygroundWidget`, `PatternAttentionWidget`, `AttentionStepThroughWidget`, `MultiHeadWidget` — all of which are no longer referenced from MDX after Task 8.

- [ ] **Step 2: Verify lint still passes**

Run: `pnpm lint`
Expected: passes (the unreferenced imports for removed widgets are gone, MDX file still references the old names but we'll fix that next).

Note: This step's lint might fail because content.mdx still references old widget names. That's expected — Task 8 fixes the MDX. Don't commit until both are done.

- [ ] **Step 3: Wait to commit until Task 8 is also complete (mdx + widgets are linked changes)**

---

## Task 8: Rewrite content.mdx with new section order

**Files:**
- Modify: `src/app/(tutorial)/attention/content.mdx`

This is the biggest single change. Replace the file with the new section flow.

- [ ] **Step 1: Replace `src/app/(tutorial)/attention/content.mdx`**

Full new contents:

```mdx
# Paying Attention

<Lead>
In the last chapter, we saw that predicting the next word requires understanding — but our models could only look at a fixed window of recent words. What if the model could *choose* which earlier words to focus on? That idea, called attention, is the breakthrough that makes modern AI work. And it's built entirely from things you already know.
</Lead>

## Some Words Need Other Words

You often can't tell what a word means without looking at other words in the sentence. The word "bank" could be a place for money or the side of a river — you need to see the words around it to know which one. A pronoun like "it" makes no sense on its own — you have to look back and find what it refers to.

This is something our fixed-window model from the last chapter can't do well. It sees the last few words and has no way to reach back and pick out the *specific* earlier words that matter.

<WhyAttentionMattersWidget>
Each sentence has a highlighted word. Follow the arrows to see which other words you need to look at in order to understand it. Flip through the examples — each shows a different reason why "looking back selectively" is essential.
</WhyAttentionMattersWidget>

Every one of these examples requires the same ability: given a word, *choose* which other words in the sentence are relevant to understanding it. Not the nearest words. Not a fixed window. The *right* words, wherever they happen to be.

This is what **attention** does. It gives the model the ability to look at every word that came before and decide which ones matter for the word it's currently processing. Let's build it up one small step at a time.

## Step 1: Match Scores

We need each token to be able to ask a question and find the other tokens that answer it. Imagine a tiny vocabulary of just four tokens: **cat**, **dog**, **blah** (a filler word), and **it** (a pronoun). Our goal is to work out what noun **it** is referring to.

Each token gets two vectors:

- A **key** — what this token is *advertising* about itself.
- A **query** — what this token is *looking for* in other tokens.

Both vectors here are just one number: a 1 means "noun" or "looking for a noun", a 0 means "no". Cat and dog advertise themselves as nouns. Blah doesn't advertise anything. It is *looking for* a noun.

To score how well a query matches a key, multiply the matching numbers and add them up. That's the **dot product** from Chapter 4. A score of 1 means a match. A score of 0 means no match.

<ToyAttentionScoresWidget>
Click any token to see its raw match scores against every key — including its own. Click "it" to see it match cat (score 1) and miss blah (score 0). Click "cat" to see something different: cat isn't asking anything, so every score is 0. The widget always shows both the key (what each token advertises) and the query (what each token is looking for).
</ToyAttentionScoresWidget>

What you advertise isn't the same as what you're looking for. A pronoun needs to find nouns without being mistaken for one itself. That's why keys and queries are separate.

## Step 2: Softmax — Dividing Your Attention

Match scores are useful, but the model can't just keep piling them up. Each token has a fixed budget of attention — 100% — and needs to *divide* that budget among all the candidates. We need to turn raw scores into percentages that add up to 1.

The function for this is called **softmax**. Think of it as a competition: bigger numbers dominate, smaller numbers get squeezed, and the result is a set of percentages.

<SoftmaxExplorerWidget>
Drag the sliders. Try "All equal" — everyone gets 25%. Try "Moderate, rest silent" — A wins by default because nobody else is saying anything. Try "Moderate meets loud" — B drowns out A. The gaps between scores matter more than the absolute values. Softmax cares about who's loudest *relative to everyone else*.
</SoftmaxExplorerWidget>

Now apply softmax to the dot products from step 1. With keys and queries at 1/0, "it" against `cat blah blah it` gets scores `[1, 0, 0, 0]`, which softmax turns into roughly `[47%, 18%, 18%, 18%]`. That's the right shape — cat wins — but more than half the attention leaks to the filler tokens. Not great.

The fix is to crank up the *query magnitude*. The keys still describe what each token is, but the asker is allowed to care more loudly. With "it"'s query at 3 instead of 1, the scores become `[3, 0, 0, 0]`, and softmax turns those into roughly `[87%, 4%, 4%, 4%]`. Much sharper.

<ToyAttentionSoftmaxWidget>
Toggle the query magnitude between 1 and 3. At 1, attention leaks all over the place. At 3, "it" puts most of its attention on the noun. There's still a small leak — softmax always allocates 100%, so a few percent always go to the losers. That tiny leak is honest and we'll come back to it.
</ToyAttentionSoftmaxWidget>

The leak isn't a bug. Softmax is *fuzzy*. Real attention is fuzzy. The model is never 100% sure of anything.

## Step 3: Values — What Did You Find?

So far attention tells us *where to look* — which tokens are relevant. But we also need *what to gather* from those tokens.

Each token gets a third vector: a **value**. The key and query decide who talks to whom. The value is what gets said. For our pronoun example, the value encodes which animal the token represents: cat's value is `[1, 0]`, dog's value is `[0, 1]`, and filler tokens have nothing to share, so their value is `[0, 0]`.

Attention then blends these values using the softmax weights as a recipe. If "it" pays 87% attention to "cat" and 4% to each filler, the result is roughly `[0.87, 0]` — strongly cat-flavored, with a small leak toward zero from the fillers.

<ToyAttentionValuesWidget>
Click "it" in `cat blah blah it` — the result is mostly cat. Try `cat blah dog it` — now the result is half cat, half dog, because "it" matched both nouns equally and the model can't tell which. Try `dog blah dog it` — *two* dogs, and the result is sharper than with just one dog: about 95% dog. More matches → more confident, because softmax's denominator dilutes the leak.
</ToyAttentionValuesWidget>

That last point matters. Two of the same noun produces a *more* confident answer than one, not a doubled one. Softmax-weighted blending stays in the same value-space as the input, no matter how many matches there are. Match dog twice, you get dog. Match dog and cat, you get half-dog-half-cat. The mechanism never produces "double dog."

There are still two cases this doesn't handle. What if there's no noun to find at all (`blah blah blah it`)? And what about the tokens that *aren't* asking the noun-finding question — what does this mechanism do for them? We'll handle both in one move.

## Step 4: When Nothing Matches — The Sink

Softmax always allocates 100% somewhere. That's a problem when there's nothing to allocate it *to*. If "it" is in `blah blah blah it`, every dot product is 0, and softmax just spreads attention evenly across the fillers — gathering nothing useful but reporting full confidence in that nothing.

The fix is to give attention a sensible place to go when no real match is available. We add an extra **sink** dimension to the keys and queries, and an extra **nothing** dimension to the values. Every token's key has a small constant in the sink dimension, every token's query is willing to fall back to it, and every token's value has a "nothing useful here" component the sink can deliver.

| Token | Key (noun, sink) | Query (noun, sink) | Value (cat, dog, nothing) |
|------|------|------|------|
| cat  | [1, 1] | [0, 1] | [1, 0, 0] |
| dog  | [1, 1] | [0, 1] | [0, 1, 0] |
| blah | [0, 1] | [0, 1] | [0, 0, 1] |
| it   | [0, 1] | [3, 1] | [0, 0, 1] |

Now run attention on `blah blah blah it` again. With no nouns to match, every score is 1 (just the sink dimension), softmax goes uniform 25%, and the blended value is pure `[0, 0, 1]` — "no useful info gathered." Honest fallback. The same mechanism handles tokens that aren't asking the question: click "blah" and it gathers nothing too, because its query has no noun-component to rule out the sink.

<ToyAttentionSinkWidget>
Click any token, try any sentence. `cat blah blah it` → mostly cat with a small sink leak. `dog blah dog it` → sharper, because the second dog drowns out the sink. `blah blah blah it` → pure nothing. Click "blah" → idle, because this head doesn't apply to it. Every behavior the widget shows comes from the same dot-product-and-softmax mechanism we built up over the last three steps.
</ToyAttentionSinkWidget>

Real attention heads in real models can pick a different sink. Some attend to the previous word as a default. Some park on a special start-of-sentence token. Some park on punctuation. The idea is the same: when this head doesn't have anything useful to say about a token, attention has to go somewhere harmless. We'll see this in BERT in a moment.

## Multi-Headed Attention

An **attention head** is one full attention computation — one set of keys, queries, and values, learning one pattern of which words attend to which.

Real models don't run just one head. They run many in parallel, each with its own keys, queries, and values, each free to learn a different pattern. This is called **multi-headed attention**. Each head produces its own new representation of every token; those per-head outputs are then combined into a single representation that gets passed on.

Why bother with more than one head? Understanding a sentence requires many kinds of questions at once: What does this pronoun refer to? What's the subject of this verb? What clause does this word belong to? Multi-headed attention lets the model ask all of these at the same time, with each head specializing in a different relationship.

<KeyInsight>
Multiple attention heads let the model ask many different questions in parallel. Each head has its own key, query, and value weights, so each learns to attend to a different kind of relationship — pronouns, grammar, structure, semantics. **The model doesn't need to choose one kind of attention; it gets all of them at once.**
</KeyInsight>

In real models, every head also has its own sink behavior, because no single head can apply to every token in every sentence. A pronoun-resolving head will be on-task for pronouns and idle for everything else. That idle behavior is what the sink is for.

## Attention in a Real Model

Below are real attention weights from **BERT**, a well-known language model. BERT has multiple attention heads, and each one has learned a different pattern. Click on any word and switch between heads to see what each one focuses on:

<BertAttentionNoPositionWidget>
Click "it" and try the "Self / pronoun" head — notice how it splits attention among the nouns, trying to figure out which one matters. Then try the "Broad context" head to see a different pattern.
</BertAttentionNoPositionWidget>

When a head isn't on-task for a particular token, it doesn't get to opt out. It still has to allocate 100% somewhere, so it parks attention on a sink. In the "Self / pronoun" head, the sink looks like *attend to yourself* for most tokens — the real pronoun-resolution behavior only kicks in when the token actually is a pronoun. The weird-looking patterns for non-pronoun tokens are the head being idle, not broken.

No one told these heads what patterns to learn — each one discovered its role through training, because different kinds of attention are all useful for predicting language.

## A Live Attention Model

The BERT widget above shows pre-recorded attention weights, extracted in Python and frozen into a table of canned sentences. We did it that way because the full BERT model is too large to easily run in your browser. In the widget below, we instead show a tiny model that runs live in your browser. It was trained to predict the next word in a small collection of children's stories. You can type whatever sentence you like and see what each of the 48 attention heads pays attention to for each word.

<LiveAttentionWidget>
Each cell in the grid is one attention head — 48 heads in total, six layers of eight. Click around. Some heads' behavior is easy to name: one always attends to the previous word, another snaps to a recent period or comma. Others do something you can almost-but-not-quite describe. Some look like noise. That's the honest picture: these heads weren't designed, they were learned. The model kept whatever patterns turned out to be useful for predicting the next word, with no requirement that those patterns make sense to a human. Some happen to. Some don't.
</LiveAttentionWidget>

## Where the Vectors Come From

We've been talking about query, key, and value vectors — but where do they actually come from? The answer is small: a set of learned weights, the same kind of weighted-sum layer we already met in Chapter 3.

Each token starts as an embedding vector. To get the query, key, and value vectors, we feed that embedding through three separate sets of weights — one set for each vector. Each set takes the embedding as input and computes a weighted sum for each output. There's no activation function this time, just the weighted sums.

<QKVProjectionWidget>
Click different tokens to see how the same three sets of weights produce different Q, K, V vectors for each token. Notice that "cat" and "dog" (similar embeddings) produce similar outputs, while "it" (very different embedding) produces very different vectors. Use the Focus buttons to highlight one set at a time. Thicker lines mean larger weights; dashed lines mean negative weights.
</QKVProjectionWidget>

In a model with multiple attention heads, each head gets its own three sets of weights, so each head translates the same embedding into its own private Q, K, V vectors. That's how different heads end up looking for different things.

## What We've Built

Let's take stock. Attention is:

1. **Match scores** — Each query and key combine via dot product to score how relevant each token is to each other token.
2. **Softmax** — Turn relevance scores into percentages that add up to 100%.
3. **Values** — A third vector from each token, blended together using the softmax weights.
4. **The sink** — An extra dimension that gives attention somewhere honest to go when nothing relevant is around.
5. **Multiple heads** — Run many attention patterns in parallel, each specializing in a different relationship.

Every piece is something we already understood from earlier chapters. Attention is just a clever wiring of familiar operations.

But there's a problem we haven't solved. Did you notice? Our attention mechanism has no idea *where* words are — it only knows *what* they are. "The dog chased the cat" and "the cat chased the dog" produce identical attention scores. Worse, in a long document, a word at the other end of the book gets treated the same as a word in the same sentence — the model has no sense of proximity at all. In the next chapter, we'll fix this with an elegant trick involving rotation.

<TryItInPyTorch notebook="attention">
Compute dot-product attention from scratch, build query/key/value projections, visualize attention heatmaps on real sentences, implement multi-head attention, and see how scrambled word order doesn't change attention scores — a problem we'll solve in the next chapter.
</TryItInPyTorch>
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: passes. Watch for the no-raw-`<p>` MDX check — the new content uses `<Lead>` and tables, which are fine.

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit Tasks 7 and 8 together**

```bash
git add src/app/(tutorial)/attention/widgets.tsx src/app/(tutorial)/attention/content.mdx
git commit -m "feat(attention): rewrite chapter into 4-step build-up; rewire widgets"
```

---

## Task 9: Delete retired widget files

**Files:**
- Delete: `src/components/widgets/attention/ToyAttention.tsx`
- Delete: `src/components/widgets/attention/ToyVocabTable.tsx`
- Delete: `src/components/widgets/attention/ToyValueTable.tsx`
- Delete: `src/components/widgets/attention/ToyValues.tsx`

These widgets are no longer referenced anywhere after Tasks 7-8. Verify, then delete.

- [ ] **Step 1: Verify the widgets are unused**

Run each separately:

```bash
grep -rn "ToyAttention[^SVN]" src/ tests/ --include="*.tsx" --include="*.ts" --include="*.mdx"
grep -rn "ToyVocabTable" src/ tests/ --include="*.tsx" --include="*.ts" --include="*.mdx"
grep -rn "ToyValueTable" src/ tests/ --include="*.tsx" --include="*.ts" --include="*.mdx"
grep -rn "ToyValues\b" src/ tests/ --include="*.tsx" --include="*.ts" --include="*.mdx"
```

Expected: only the file definitions themselves, no consumers. (The first grep excludes ToyAttentionScores/Softmax/Values/Sink/Sink.)

If any consumer remains, fix that first before deleting.

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/widgets/attention/ToyAttention.tsx
git rm src/components/widgets/attention/ToyVocabTable.tsx
git rm src/components/widgets/attention/ToyValueTable.tsx
git rm src/components/widgets/attention/ToyValues.tsx
```

- [ ] **Step 3: Run lint + build**

```bash
pnpm lint
pnpm build
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(attention): delete retired toy widgets"
```

---

## Task 10: Update Playwright test

**Files:**
- Modify: `tests/attention.spec.ts`

The existing Playwright test only smoke-tests the LiveAttention widget. Add a smoke check for the new four-widget toy progression so future regressions get caught.

- [ ] **Step 1: Read the existing test file**

Run: `cat tests/attention.spec.ts`

- [ ] **Step 2: Add a new test block**

Add this block at the end of the file, **before** the closing of the existing `test.describe(...)` if any, or as a new `test.describe` if it's at file level. Looking at the current file, the existing block is `test.describe("Attention chapter — Live Attention widget", ...)`. Add a sibling `test.describe`:

```ts
test.describe("Attention chapter — toy widget progression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attention");
  });

  test("all four toy widgets render with their distinctive titles", async ({ page }) => {
    // Step 1: Match Scores
    await expect(
      page.locator(".widget-container").filter({ hasText: "Match Scores" })
    ).toBeVisible();

    // Step 2: Adding Softmax
    await expect(
      page.locator(".widget-container").filter({ hasText: "Adding Softmax" })
    ).toBeVisible();

    // Step 3: Attention + Values
    await expect(
      page.locator(".widget-container").filter({ hasText: "Attention + Values" })
    ).toBeVisible();

    // Step 4: Attention with Sink
    await expect(
      page.locator(".widget-container").filter({ hasText: "Attention with Sink" })
    ).toBeVisible();
  });

  test("step-1 widget computes match score 1 for it→cat in cat blah blah it", async ({ page }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Match Scores" });

    await expect(widget).toBeVisible();

    // The default sentence is "cat blah blah it" with "it" auto-selected,
    // so the match score against cat should be 1.
    // We look for a text that includes "= 1" within the widget.
    await expect(widget.getByText(/=\s*1$/m).first()).toBeVisible();
  });

  test("step-4 sink widget shows 100% for blah blah blah it pure-fallback case", async ({ page }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Attention with Sink" });

    await expect(widget).toBeVisible();

    // Click the "blah blah blah it" preset
    await widget.getByRole("button", { name: "blah blah blah it" }).click();

    // The "What this means" callout should mention pure fallback
    await expect(widget.getByText(/no useful info gathered/i)).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the Playwright tests**

In one terminal: `pnpm dev`
In another: `npx playwright test tests/attention.spec.ts`

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/attention.spec.ts
git commit -m "test(attention): smoke-check the four-step toy widget progression"
```

---

## Task 11: Final verification + manual walk-through

**Files:** none (verification only)

- [ ] **Step 1: Run all automated checks**

```bash
pnpm lint
pnpm build
pnpm test
npx playwright test tests/attention.spec.ts
```

Expected: all four pass cleanly.

- [ ] **Step 2: Start the dev server and walk through the chapter**

```bash
pnpm dev
```

Open `http://localhost:3000/attention` and walk through the chapter section by section. Check each item:

- **Section "Some Words Need Other Words"**: WhyAttentionMatters widget renders, you can flip through examples.
- **Section "Step 1: Match Scores"**: ToyAttentionScores widget renders. Click each token in `cat blah blah it` — only "it" produces non-zero scores. No percentages anywhere.
- **Section "Step 2: Softmax"**: SoftmaxExplorer renders, then ToyAttentionSoftmax. Toggle query magnitude 1 ↔ 3 and watch the percentages tighten from ≈47% to ≈87%.
- **Section "Step 3: Values"**: ToyAttentionValues renders. Click `dog blah dog it` and confirm the result is roughly 95% dog and the "two dogs → more confident" callout shows.
- **Section "Step 4: Sink"**: ToyAttentionSink renders. Try every preset including `blah blah blah it`. Confirm the pure-nothing fallback. Click "blah" and confirm the "idle for it" message.
- **Section "Multi-Headed Attention"**: prose renders with the KeyInsight box.
- **Section "Attention in a Real Model"**: BertAttention renders, sink-bridge paragraph reads naturally.
- **Section "A Live Attention Model"**: LiveAttention renders.
- **Section "Where the Vectors Come From"**: QKVProjection renders.
- **Section "What We've Built"**: numbered recap renders.

- [ ] **Step 3: Confirm the kid-feedback issues are addressed**

Cross-reference the spec's Context section:

1. ✅ "Why 3, not 1?" — answered by step 2's query-magnitude toggle.
2. ✅ "Only 'it' is clickable" — every token clickable in all four toy widgets.
3. ✅ "'it' attends to itself in blah blah blah it" — answered by step 4 sink section.
4. ✅ "'it' doesn't have a value" — step 4 gives "it" a `[0, 0, 1]` value (the nothing dimension) and explains it.
5. ✅ "Where do percentages come from?" — softmax now appears before percentages.
6. ✅ "BERT pronoun head doing weird things for non-pronouns" — sink bridge paragraph in BERT section.
7. ✅ "Values playground feels redundant" — values now immediately follow the K/Q toy.
8. ✅ "Where vectors come from is confusing" — surgically simplified prose; "single-layer neural network" replaced with "set of learned weights, the same kind of weighted-sum layer we met in Chapter 3."

- [ ] **Step 4: Final cleanup commit (if any tweaks needed during walk-through)**

If walking through revealed any small fixes (typos, off-by-one in sentence selectors, etc.), commit them now:

```bash
git add -p   # selectively stage
git commit -m "fix(attention): minor tweaks from manual walk-through"
```

If nothing came up, skip this step.

---

## Plan complete

When all tasks above are checked off, the chapter has been restructured per the spec. The next step (out of scope for this plan) is to:

1. Have the original 11-year-old test reader read the new chapter and report back.
2. If specific issues remain, decide whether to escalate to Approach C (BERT widget rework, QKV diagram redo).
3. Open a follow-up PR to sync `notebooks/attention.ipynb` with the new chapter structure.
