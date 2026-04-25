# Transformer chapter overview-first redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new bird's-eye `TransformerOverview` widget (token×layer grid with residual + attention edges, click-to-inspect cells and layers), reorder Chapter 9 so the new widget leads, drop six widgets and two prose sections, and fold residual / layer-norm / feed-forward into short prose subsections under the existing `TransformerBlockDiagram`.

**Architecture:** The new widget reads from the existing `astronaut-example.ts` and reuses its `LayerDef.label` strings. A pure data module derives an edge list (typed, validated at import). A presentational `Grid` component renders an SVG; a `Popup` component renders a speech-bubble HTML overlay anchored to a cell or layer label. The top-level `TransformerOverview` owns selection state and wires the two together. No new state libraries, no new test frameworks.

**Tech Stack:** Next.js 16 App Router, React 19, MDX, Tailwind 4, SVG (no D3 needed for this widget), Playwright for e2e tests. Validation pattern follows the existing `validateExample` style.

**Spec:** `docs/superpowers/specs/2026-04-24-transformer-chapter-overview-redesign.md`

---

## File structure

New files (all under `src/components/widgets/transformers/TransformerOverview/`):

- `index.ts` — re-exports the public component.
- `TransformerOverview.tsx` — top-level client component. Owns selection state. Renders `WidgetContainer` + `Grid` + `Popup`.
- `Grid.tsx` — pure presentational SVG grid (cells, residual edges, attention edges, layer labels). Receives selection state as props; emits clicks via callbacks.
- `Popup.tsx` — speech-bubble overlay with directional pointer. Receives anchor coordinates and content as props.
- `geometry.ts` — single source of truth for layout constants (cell width, gap, layer y-positions, column x-positions, view-box dimensions). Pure data, no React.
- `edges.ts` — derives `{ residuals, attention }` edge lists from `astronautExample`. Includes `validateOverviewEdges()` that throws at import time on causality violations or unknown token indices.
- `layer-summaries.ts` — per-layer 1–2 sentence descriptions written for middle-school reading level. Keyed by layer id.

Modified files:

- `src/components/widgets/transformers/TransformerInAction/index.ts` — no change (keeps exporting `TransformerInAction` and `VectorSubspaceFig`).
- `src/app/(tutorial)/transformers/widgets.tsx` — remove dynamic imports / wrappers for the seven dropped widgets; add `TransformerOverviewWidget`.
- `src/app/(tutorial)/transformers/content.mdx` — full rewrite per the new outline.
- `tests/transformers.spec.ts` — add tests for the new widget; keep existing TransformerInAction tests as-is.

Files left alone but referenced:

- `src/components/widgets/transformers/TransformerInAction/astronaut-example.ts` — read-only data source.
- `src/components/widgets/transformers/TransformerInAction/types.ts` — types may be re-imported by `edges.ts`.

Files **not** deleted in this plan (component files for dropped widgets stay on disk, just unused):

- `MicroTransformer.tsx`, `DepthComparison.tsx`, `LiveTransformer.tsx`, `TransformerXRay.tsx`, `PrefixAttention.tsx`, `ResidualConnection.tsx`, `LayerNorm.tsx`, plus their data files.

---

## Task 1: Scaffold the empty widget folder

**Files:**
- Create: `src/components/widgets/transformers/TransformerOverview/index.ts`
- Create: `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`

- [ ] **Step 1: Create the empty component**

`src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`:

```tsx
"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";

export function TransformerOverview() {
  return (
    <WidgetContainer title="A Transformer At a Glance">
      <div className="p-6 text-sm text-muted">Loading…</div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Create the index re-export**

`src/components/widgets/transformers/TransformerOverview/index.ts`:

```ts
export { TransformerOverview } from "./TransformerOverview";
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm build`
Expected: Build succeeds (the component is unused so far; that's fine).

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/
git commit -m "scaffold TransformerOverview widget"
```

---

## Task 2: Define geometry constants

**Files:**
- Create: `src/components/widgets/transformers/TransformerOverview/geometry.ts`

- [ ] **Step 1: Write geometry.ts**

```ts
// Single source of truth for the overview grid's pixel layout.
// Coordinates are in the SVG's local viewBox space.

import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";

export const CELL_WIDTH = 50;
export const CELL_HEIGHT = 22;
export const COL_GAP = 4;
export const COL_STRIDE = CELL_WIDTH + COL_GAP; // 54

export const FIRST_COL_X = 140; // left gutter for layer labels = 0..120
export const ROW_GAP = 65; // vertical distance between consecutive layer rows

// Bottom row (L0) sits at this y. Layers stack upward.
export const L0_Y = 430;

// Layer order from bottom to top, indexed by row from L0..L6.
export const LAYER_ORDER: LayerId[] = ["L0", "L1", "L2", "L3", "L4", "L5", "Predict"];

export function layerRowY(layer: LayerId): number {
  const idx = LAYER_ORDER.indexOf(layer);
  if (idx < 0) throw new Error(`Unknown layer ${layer}`);
  return L0_Y - idx * ROW_GAP;
}

export function columnX(tokenIndex: number): number {
  return FIRST_COL_X + tokenIndex * COL_STRIDE + CELL_WIDTH / 2; // cell center
}

export function columnLeft(tokenIndex: number): number {
  return FIRST_COL_X + tokenIndex * COL_STRIDE;
}

// View box. The right padding leaves room for the predict output box.
export const VIEW_WIDTH = 940;
export const VIEW_HEIGHT = 460;
```

- [ ] **Step 2: Verify the file type-checks**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/geometry.ts
git commit -m "add geometry constants for overview widget"
```

---

## Task 3: Derive and validate the edge list

**Files:**
- Create: `src/components/widgets/transformers/TransformerOverview/edges.ts`

- [ ] **Step 1: Write edges.ts**

```ts
import { astronautExample } from "@/components/widgets/transformers/TransformerInAction/astronaut-example";
import type {
  ExampleData,
  HeadCard,
  LayerId,
  NonPredictLayerId,
} from "@/components/widgets/transformers/TransformerInAction/types";

export interface ResidualEdge {
  /** Layer this edge enters (the consumer's layer). */
  toLayer: LayerId;
  /** Token column. Same column for source and consumer. */
  tokenIndex: number;
}

export interface AttentionEdge {
  /** Layer this edge enters. Source is on the previous layer of the same column. */
  toLayer: NonPredictLayerId;
  /** Consumer's token column (right-hand endpoint, must be >= fromTokenIndex). */
  toTokenIndex: number;
  /** Source token column on the layer below. */
  fromTokenIndex: number;
  /** [0..1]. Drives stroke thickness. */
  weight: number;
  /** Stable id of the head this edge came from. */
  headId: string;
}

export interface OverviewEdges {
  residuals: ResidualEdge[];
  attention: AttentionEdge[];
}

const NON_PREDICT_LAYERS: NonPredictLayerId[] = ["L1", "L2", "L3", "L4", "L5"];

function buildResiduals(data: ExampleData): ResidualEdge[] {
  const out: ResidualEdge[] = [];
  // L0 -> L1, L1 -> L2, ..., L4 -> L5: every column.
  const transitions: { toLayer: LayerId }[] = [
    { toLayer: "L1" }, { toLayer: "L2" }, { toLayer: "L3" }, { toLayer: "L4" }, { toLayer: "L5" },
  ];
  for (const { toLayer } of transitions) {
    for (let i = 0; i < data.tokens.length; i++) {
      out.push({ toLayer, tokenIndex: i });
    }
  }
  // L5 -> Predict: only the last token's column (the prediction slot).
  out.push({ toLayer: "Predict", tokenIndex: data.tokens.length - 1 });
  return out;
}

function buildAttention(data: ExampleData): AttentionEdge[] {
  const out: AttentionEdge[] = [];
  for (let i = 0; i < data.tokens.length; i++) {
    const token = data.tokens[i];
    for (const layerId of NON_PREDICT_LAYERS) {
      const cards = token.headCards[layerId];
      if (!cards) continue;
      for (const [headId, card] of Object.entries(cards) as [string, HeadCard][]) {
        for (const pull of card.pulls) {
          out.push({
            toLayer: layerId,
            toTokenIndex: i,
            fromTokenIndex: pull.fromTokenIndex,
            weight: pull.weight,
            headId,
          });
        }
      }
    }
  }
  return out;
}

export function buildOverviewEdges(data: ExampleData): OverviewEdges {
  const edges = { residuals: buildResiduals(data), attention: buildAttention(data) };
  validateOverviewEdges(edges, data);
  return edges;
}

export function validateOverviewEdges(edges: OverviewEdges, data: ExampleData): void {
  const errs: string[] = [];
  for (const e of edges.attention) {
    if (e.fromTokenIndex < 0 || e.fromTokenIndex >= data.tokens.length) {
      errs.push(`attention edge fromTokenIndex out of range: ${e.fromTokenIndex}`);
    }
    if (e.toTokenIndex < 0 || e.toTokenIndex >= data.tokens.length) {
      errs.push(`attention edge toTokenIndex out of range: ${e.toTokenIndex}`);
    }
    if (e.fromTokenIndex > e.toTokenIndex) {
      errs.push(
        `attention edge violates causal mask at ${e.toLayer}: from #${e.fromTokenIndex} to #${e.toTokenIndex}`
      );
    }
    if (e.weight < 0 || e.weight > 1) {
      errs.push(`attention edge weight out of [0,1]: ${e.weight}`);
    }
  }
  for (const e of edges.residuals) {
    if (e.tokenIndex < 0 || e.tokenIndex >= data.tokens.length) {
      errs.push(`residual edge tokenIndex out of range: ${e.tokenIndex}`);
    }
  }
  if (errs.length > 0) {
    throw new Error(`TransformerOverview edge validation failed:\n  - ${errs.join("\n  - ")}`);
  }
}

// Build at module init so a bad edit fails fast in dev.
export const overviewEdges: OverviewEdges = buildOverviewEdges(astronautExample);
```

- [ ] **Step 2: Verify it compiles and the validator passes**

Run: `pnpm build`
Expected: Build succeeds. (Any causality violation in the data would throw at import.)

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/edges.ts
git commit -m "derive and validate overview edges from astronaut example"
```

---

## Task 4: Write per-layer summaries

**Files:**
- Create: `src/components/widgets/transformers/TransformerOverview/layer-summaries.ts`

- [ ] **Step 1: Write the summaries**

```ts
import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";

/**
 * Short, middle-school-friendly summaries shown when the user clicks a layer label.
 * Keep each summary to 1-2 short sentences. They should describe what a reader can
 * see happening in that row of the grid, not generic transformer theory.
 */
export const LAYER_SUMMARIES: Record<LayerId, string> = {
  L0: "Each cell here is just the dictionary meaning of that word, before any layer has run.",
  L1: "Every word grabs a copy of the word right before it. That gives each word a tiny bit of context about its neighbour.",
  L2: "Words that belong somewhere in the scene reach back to the scene's location. Astronaut, looked, and sky all pull from Mars; saw and her split between Mars and the sky.",
  L3: "The pronoun her looks back to find who she is — and pulls in the astronaut.",
  L4: "Same trick as L1 — every word pulls its neighbour again. But now those neighbours carry everything the middle layers added, so blue effectively gets a freshly-enriched her.",
  L5: "Each word inside a verb's object reaches back to its verb. Sky to looked. Her to saw. Blue splits half-saw, half-her.",
  Predict: "The model reads only the last word's row and matches it against every word it knows. The closest match is the next-word guess.",
};
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/layer-summaries.ts
git commit -m "add per-layer summaries for overview widget"
```

---

## Task 5: Render the static SVG grid (no interactions yet)

**Files:**
- Create: `src/components/widgets/transformers/TransformerOverview/Grid.tsx`
- Modify: `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`

- [ ] **Step 1: Implement Grid.tsx (cells + edges, no interactions)**

```tsx
"use client";

import { astronautExample } from "@/components/widgets/transformers/TransformerInAction/astronaut-example";
import type { LayerId, NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { overviewEdges } from "./edges";
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  LAYER_ORDER,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  columnLeft,
  columnX,
  layerRowY,
} from "./geometry";

const ATT_COLOR = "#2563eb";
const RES_COLOR = "#ea580c";
const NON_PREDICT_LAYERS: NonPredictLayerId[] = ["L0", "L1", "L2", "L3", "L4", "L5"];

interface GridProps {
  selectedCell: { tokenIndex: number; layer: LayerId } | null;
  selectedLayer: LayerId | null;
  onCellClick: (tokenIndex: number, layer: LayerId) => void;
  onLayerLabelClick: (layer: LayerId) => void;
}

export function Grid({ selectedCell, selectedLayer, onCellClick, onLayerLabelClick }: GridProps) {
  const tokens = astronautExample.tokens;
  const lastIdx = tokens.length - 1;

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="block w-full max-w-[960px] mx-auto"
      role="img"
      aria-label="Stacked transformer layers showing attention and residual edges across the astronaut sentence."
    >
      <defs>
        <marker id="ov-att" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={ATT_COLOR} />
        </marker>
        <marker id="ov-res" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={RES_COLOR} />
        </marker>
      </defs>

      {/* Layer labels in the left gutter */}
      {LAYER_ORDER.slice().reverse().map((layer) => {
        const layerDef = astronautExample.layers.find((l) => l.id === layer);
        const label = layerDef ? layerDef.label : "Tokens";
        const y = layerRowY(layer) + 16;
        const isSelected = selectedLayer === layer;
        return (
          <g key={`label-${layer}`}>
            <text
              x={120}
              y={y}
              textAnchor="end"
              fontSize={11}
              fontWeight={layer === "L0" ? 600 : 400}
              fill={isSelected ? "#92400e" : "#374151"}
              style={{ cursor: "pointer" }}
              onClick={() => onLayerLabelClick(layer)}
              role="button"
              tabIndex={0}
              aria-label={`${label} — click to see what this layer does`}
            >
              {label}
            </text>
            <text x={120} y={y + 12} textAnchor="end" fontSize={9} fill="#9ca3af">
              {layer}
            </text>
          </g>
        );
      })}

      {/* Residual edges */}
      {overviewEdges.residuals.map((e, i) => {
        const x = columnX(e.tokenIndex);
        const yEnd = layerRowY(e.toLayer) + CELL_HEIGHT + 1; // arrow tip at bottom of consumer cell
        const fromLayer = LAYER_ORDER[LAYER_ORDER.indexOf(e.toLayer) - 1];
        const yStart = layerRowY(fromLayer); // top of source cell
        return (
          <line
            key={`res-${i}`}
            x1={x}
            y1={yStart}
            x2={x}
            y2={yEnd}
            stroke={RES_COLOR}
            strokeWidth={1.8}
            markerEnd="url(#ov-res)"
          />
        );
      })}

      {/* Attention edges */}
      {overviewEdges.attention.map((e, i) => {
        const xFrom = columnX(e.fromTokenIndex);
        const xTo = columnX(e.toTokenIndex);
        const yStart = layerRowY(LAYER_ORDER[LAYER_ORDER.indexOf(e.toLayer) - 1]);
        const yEnd = layerRowY(e.toLayer) + CELL_HEIGHT + 1;
        const yMid = (yStart + yEnd) / 2 - 8;
        const path = `M ${xFrom} ${yStart} C ${xFrom} ${yMid}, ${xTo} ${yMid}, ${xTo} ${yEnd}`;
        return (
          <path
            key={`att-${i}`}
            d={path}
            stroke={ATT_COLOR}
            strokeWidth={Math.max(1, e.weight * 2.4)}
            fill="none"
            markerEnd="url(#ov-att)"
          />
        );
      })}

      {/* Cells */}
      {NON_PREDICT_LAYERS.map((layer) =>
        tokens.map((tok, i) => {
          const isSelected = selectedCell?.tokenIndex === i && selectedCell?.layer === layer;
          const isInputRow = layer === "L0";
          return (
            <g key={`cell-${layer}-${i}`}>
              <rect
                x={columnLeft(i)}
                y={layerRowY(layer)}
                width={CELL_WIDTH}
                height={CELL_HEIGHT}
                rx={4}
                fill={isSelected ? "#fde68a" : isInputRow ? "#eef2ff" : "#fafafa"}
                stroke={isSelected ? "#b45309" : isInputRow ? "#c7d2fe" : "#d1d5db"}
                strokeWidth={isSelected ? 2 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => onCellClick(i, layer)}
                role="button"
                tabIndex={0}
                aria-label={`${tok.token} at ${layer}`}
              />
              <text
                x={columnX(i)}
                y={layerRowY(layer) + 16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={isInputRow || isSelected ? 600 : 400}
                fill={isSelected ? "#92400e" : isInputRow ? "#1e3a8a" : "#374151"}
                pointerEvents="none"
              >
                {tok.token}
              </text>
            </g>
          );
        })
      )}

      {/* Predict cell (last token's column only) */}
      <rect
        x={columnLeft(lastIdx)}
        y={layerRowY("Predict")}
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        rx={4}
        fill={selectedCell?.layer === "Predict" ? "#fde68a" : "#dbeafe"}
        stroke={selectedCell?.layer === "Predict" ? "#b45309" : "#2563eb"}
        strokeWidth={1.5}
        style={{ cursor: "pointer" }}
        onClick={() => onCellClick(lastIdx, "Predict")}
        role="button"
        tabIndex={0}
        aria-label={`Predict cell at ${tokens[lastIdx].token}`}
      />
      <text
        x={columnX(lastIdx)}
        y={layerRowY("Predict") + 15}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill="#1e3a8a"
        pointerEvents="none"
      >
        → next
      </text>

      {/* Predict output box */}
      <rect x={858} y={34} width={74} height={34} rx={6} fill="#bfdbfe" stroke="#1d4ed8" />
      <text x={895} y={48} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1e3a8a">
        {astronautExample.predictions[0]?.token ?? "?"}
      </text>
      <text x={895} y={60} textAnchor="middle" fontSize={9} fill="#1e3a8a">
        (top guess)
      </text>
      <line x1={838} y1={51} x2={858} y2={51} stroke="#1d4ed8" strokeWidth={2} markerEnd="url(#ov-att)" />
    </svg>
  );
}
```

- [ ] **Step 2: Wire the grid into TransformerOverview.tsx (no interactions yet — pass no-ops)**

Replace `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { Grid } from "./Grid";

interface CellSelection {
  tokenIndex: number;
  layer: LayerId;
}

export function TransformerOverview() {
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>(null);

  const handleCellClick = useCallback((tokenIndex: number, layer: LayerId) => {
    setSelectedCell({ tokenIndex, layer });
    setSelectedLayer(null);
  }, []);

  const handleLayerLabelClick = useCallback((layer: LayerId) => {
    setSelectedLayer(layer);
    setSelectedCell(null);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedCell(null);
    setSelectedLayer(null);
  }, []);

  return (
    <WidgetContainer title="A Transformer At a Glance" onReset={handleReset}>
      <div className="overflow-x-auto">
        <Grid
          selectedCell={selectedCell}
          selectedLayer={selectedLayer}
          onCellClick={handleCellClick}
          onLayerLabelClick={handleLayerLabelClick}
        />
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 3: Wire the widget into the chapter for visual verification (temporary placement at the top)**

Modify `src/app/(tutorial)/transformers/widgets.tsx`. Add the dynamic import and wrapper. Keep the existing widgets in place for now (they'll be removed in Task 11).

```tsx
const TransformerOverview = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerOverview").then(
      (m) => m.TransformerOverview
    ),
  { ssr: false }
);

// ... below the existing exports, add:
export function TransformerOverviewWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TransformerOverview />
    </WidgetSlot>
  );
}
```

You'll also need to add `TransformerOverview/index.ts` to the index of TransformerOverview folder (already done in Task 1). Confirm `index.ts` has `export { TransformerOverview } from "./TransformerOverview";`.

- [ ] **Step 4: Add a temporary call site at the top of `content.mdx` for smoke testing**

Add immediately above the existing first `<TransformerBlockDiagramWidget>`:

```mdx
<TransformerOverviewWidget>
Click any cell to see its meaning at that layer. Click a layer name on the left to see what that layer does.
</TransformerOverviewWidget>
```

- [ ] **Step 5: Run the dev server and visually verify**

Run: `pnpm dev`
Open: `http://localhost:3000/transformers`
Expected:
- The new widget renders at the top of the page.
- 13 token cells across the bottom, 5 transformer rows above, plus the small Predict cell on `blue`'s column.
- Amber vertical residual arrows at every column for every transition.
- Blue attention arcs only — no arrow ever leans leftward at the top end.
- Token name visible inside every cell.
- Clicking does nothing yet.

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/Grid.tsx \
        src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx \
        src/app/\(tutorial\)/transformers/widgets.tsx \
        src/app/\(tutorial\)/transformers/content.mdx
git commit -m "render static overview grid for visual verification"
```

---

## Task 6: First Playwright test — widget renders

**Files:**
- Modify: `tests/transformers.spec.ts`

- [ ] **Step 1: Add a failing test for the overview widget**

Append to `tests/transformers.spec.ts`:

```ts
test.describe("Transformers chapter — A Transformer At a Glance widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("overview widget renders with all 13 token cells in the input row", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
    await expect(widget).toBeVisible();
    // Spot-check a few token labels — they appear once per row, so the total count is high.
    await expect(widget.getByText("On", { exact: true }).first()).toBeVisible();
    await expect(widget.getByText("astronaut", { exact: true }).first()).toBeVisible();
    await expect(widget.getByText("blue", { exact: true }).first()).toBeVisible();
    // Predict output box.
    await expect(widget.getByText("(top guess)")).toBeVisible();
  });
});
```

- [ ] **Step 2: Start the dev server in the background**

Run: `pnpm dev` (run in the background; tests target localhost:3000).

- [ ] **Step 3: Run the test**

Run: `npx playwright test transformers.spec.ts -g "overview widget renders"`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/transformers.spec.ts
git commit -m "add e2e test: overview widget renders with token cells"
```

---

## Task 7: Add the cell-click popup

**Files:**
- Create: `src/components/widgets/transformers/TransformerOverview/Popup.tsx`
- Modify: `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`

- [ ] **Step 1: Create Popup.tsx**

```tsx
"use client";

import type { ReactNode } from "react";

interface PopupProps {
  /** Cell or label center, in viewBox coordinates. */
  anchorX: number;
  anchorY: number;
  /** "below" = popup sits above the anchor, with pointer underneath; "above" reverses. */
  pointerDirection: "below" | "above";
  /** SVG viewBox dimensions, used to convert anchor coords into CSS percentages. */
  viewWidth: number;
  viewHeight: number;
  title: ReactNode;
  body: ReactNode;
  onClose: () => void;
}

export function Popup({
  anchorX,
  anchorY,
  pointerDirection,
  viewWidth,
  viewHeight,
  title,
  body,
  onClose,
}: PopupProps) {
  // The SVG is rendered with width=100% and aspect-ratio preserved (viewBox).
  // Convert the anchor's viewBox coords to percentages so the popup follows on resize.
  const leftPct = (anchorX / viewWidth) * 100;
  const topPct = (anchorY / viewHeight) * 100;

  // Popup is positioned with its tip at (leftPct, topPct).
  // pointerDirection "below" means the tip is at the bottom edge of the popup.
  const transform =
    pointerDirection === "below"
      ? "translate(-50%, calc(-100% - 8px))"
      : "translate(-50%, 8px)";

  return (
    <div
      className="absolute z-10 w-[300px] rounded-lg border border-amber-700 bg-white p-3 text-xs text-foreground shadow-lg"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, transform }}
      role="dialog"
      aria-modal="false"
    >
      <div className="mb-1 flex items-baseline justify-between">
        <div className="font-semibold text-amber-900">{title}</div>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground"
          aria-label="Close popup"
        >
          ✕
        </button>
      </div>
      <div className="leading-relaxed">{body}</div>
      {/* Pointer triangle */}
      <div
        className="absolute h-3 w-3 rotate-45 border border-amber-700 bg-white"
        style={
          pointerDirection === "below"
            ? { left: "50%", bottom: "-7px", transform: "translateX(-50%) rotate(45deg)", borderTop: "none", borderLeft: "none" }
            : { left: "50%", top: "-7px", transform: "translateX(-50%) rotate(45deg)", borderBottom: "none", borderRight: "none" }
        }
        aria-hidden="true"
      />
    </div>
  );
}
```

- [ ] **Step 2: Wire the popup into TransformerOverview.tsx for cell selection**

Replace the body of `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`:

```tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { astronautExample } from "@/components/widgets/transformers/TransformerInAction/astronaut-example";
import type { LayerId, NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { Grid } from "./Grid";
import { Popup } from "./Popup";
import { columnX, layerRowY, VIEW_WIDTH, VIEW_HEIGHT } from "./geometry";

interface CellSelection {
  tokenIndex: number;
  layer: LayerId;
}

export function TransformerOverview() {
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>(null);

  const handleCellClick = useCallback((tokenIndex: number, layer: LayerId) => {
    setSelectedCell({ tokenIndex, layer });
    setSelectedLayer(null);
  }, []);

  const handleLayerLabelClick = useCallback((layer: LayerId) => {
    setSelectedLayer(layer);
    setSelectedCell(null);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedCell(null);
    setSelectedLayer(null);
  }, []);

  const cellPopup = useMemo(() => {
    if (!selectedCell) return null;
    const tok = astronautExample.tokens[selectedCell.tokenIndex];
    const layerDef = astronautExample.layers.find((l) => l.id === selectedCell.layer);
    const layerLabel = layerDef ? layerDef.label : selectedCell.layer;
    const isPredict = selectedCell.layer === "Predict";
    let bodyText: string;
    if (isPredict) {
      const top = astronautExample.predictions
        .slice(0, 3)
        .map((p) => `${p.token} (${Math.round(p.probability * 100)}%)`)
        .join(", ");
      bodyText = `Top guesses for the next word: ${top}.`;
    } else {
      bodyText = tok.reps[selectedCell.layer as NonPredictLayerId];
    }
    return {
      anchorX: columnX(selectedCell.tokenIndex),
      anchorY: layerRowY(selectedCell.layer),
      title: (
        <span>
          {tok.token}
          <span className="ml-1 font-normal text-muted">
            · after {selectedCell.layer} ({layerLabel})
          </span>
        </span>
      ),
      body: bodyText,
    };
  }, [selectedCell]);

  return (
    <WidgetContainer title="A Transformer At a Glance" onReset={handleReset}>
      <div className="relative overflow-x-auto">
        <Grid
          selectedCell={selectedCell}
          selectedLayer={selectedLayer}
          onCellClick={handleCellClick}
          onLayerLabelClick={handleLayerLabelClick}
        />
        {cellPopup && (
          <Popup
            anchorX={cellPopup.anchorX}
            anchorY={cellPopup.anchorY}
            pointerDirection="below"
            viewWidth={VIEW_WIDTH}
            viewHeight={VIEW_HEIGHT}
            title={cellPopup.title}
            body={cellPopup.body}
            onClose={() => setSelectedCell(null)}
          />
        )}
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 3: Visually verify**

Run: `pnpm dev` (if not still running).
Open: `http://localhost:3000/transformers`
Click `her` at L3 (third row from the bottom of the empty rows).
Expected: A speech-bubble popup appears, pointing at the cell, with the L3 rep text including "Her refers to the astronaut".

- [ ] **Step 4: Add an e2e test**

Append to `tests/transformers.spec.ts`:

```ts
test("clicking 'her' at L3 shows the resolved-pronoun rep", async ({ page }) => {
  const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
  // Click the 'her' cell on the L3 row. Cells are aria-labeled "her at L3".
  await widget.getByLabel("her at L3").click();
  // Popup body contains the L3 rep text.
  await expect(widget.getByText("Her' refers to the astronaut", { exact: false })).toBeVisible();
  // Title contains the layer label.
  await expect(widget.getByText("Resolve pronouns", { exact: false }).first()).toBeVisible();
});
```

- [ ] **Step 5: Run the test**

Run: `npx playwright test transformers.spec.ts -g "clicking 'her' at L3"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/Popup.tsx \
        src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx \
        tests/transformers.spec.ts
git commit -m "add cell-click popup with rep + e2e test"
```

---

## Task 8: Add the layer-label-click popup

**Files:**
- Modify: `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`

- [ ] **Step 1: Wire the layer popup**

In `TransformerOverview.tsx`, add a second `useMemo` for the layer popup, and render it when `selectedLayer` is set:

```tsx
import { LAYER_SUMMARIES } from "./layer-summaries";
// ... existing imports

// Inside the component, after cellPopup useMemo:
const layerPopup = useMemo(() => {
  if (!selectedLayer) return null;
  const layerDef = astronautExample.layers.find((l) => l.id === selectedLayer);
  const layerLabel = layerDef ? layerDef.label : selectedLayer;
  return {
    anchorX: 120, // right edge of the left-gutter labels
    anchorY: layerRowY(selectedLayer) + 11,
    title: (
      <span>
        {selectedLayer} — {layerLabel}
      </span>
    ),
    body: LAYER_SUMMARIES[selectedLayer],
  };
}, [selectedLayer]);
```

And after the cell popup in the JSX:

```tsx
{layerPopup && (
  <Popup
    anchorX={layerPopup.anchorX}
    anchorY={layerPopup.anchorY}
    pointerDirection="above"
    viewWidth={VIEW_WIDTH}
    viewHeight={VIEW_HEIGHT}
    title={layerPopup.title}
    body={layerPopup.body}
    onClose={() => setSelectedLayer(null)}
  />
)}
```

- [ ] **Step 2: Visually verify**

Open: `http://localhost:3000/transformers`
Click the "Resolve pronouns" label on the left.
Expected: Popup with the L3 summary appears, pointing at the label.

- [ ] **Step 3: Add an e2e test**

Append to `tests/transformers.spec.ts`:

```ts
test("clicking the 'Resolve pronouns' label shows the layer summary", async ({ page }) => {
  const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
  await widget.getByLabel(/Resolve pronouns — click to see what this layer does/).click();
  // The popup body matches the layer summary.
  await expect(widget.getByText("pronoun her looks back to find who she is", { exact: false })).toBeVisible();
});
```

- [ ] **Step 4: Run the test**

Run: `npx playwright test transformers.spec.ts -g "Resolve pronouns"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx \
        tests/transformers.spec.ts
git commit -m "add layer-label popup with summary + e2e test"
```

---

## Task 9: Highlight source cells when a cell is selected

**Files:**
- Modify: `src/components/widgets/transformers/TransformerOverview/Grid.tsx`
- Modify: `src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx`

- [ ] **Step 1: Compute the set of source cells in TransformerOverview.tsx**

Add to `TransformerOverview.tsx`:

```tsx
import { overviewEdges } from "./edges";
import type { NonPredictLayerId } from "@/components/widgets/transformers/TransformerInAction/types";

// Inside the component:
const sourceCells = useMemo(() => {
  if (!selectedCell) return new Set<string>();
  const out = new Set<string>();
  // Residual: the same column on the layer below.
  const layerOrder = ["L0", "L1", "L2", "L3", "L4", "L5", "Predict"] as const;
  const idx = layerOrder.indexOf(selectedCell.layer as typeof layerOrder[number]);
  if (idx > 0) {
    const below = layerOrder[idx - 1];
    out.add(`${below}:${selectedCell.tokenIndex}`);
  }
  // Attention sources at this layer, this column.
  if (selectedCell.layer !== "L0" && selectedCell.layer !== "Predict") {
    const layer = selectedCell.layer as NonPredictLayerId;
    for (const e of overviewEdges.attention) {
      if (e.toLayer === layer && e.toTokenIndex === selectedCell.tokenIndex) {
        const fromLayer = layerOrder[idx - 1];
        out.add(`${fromLayer}:${e.fromTokenIndex}`);
      }
    }
  }
  return out;
}, [selectedCell]);
```

Pass `sourceCells` to `<Grid>`.

- [ ] **Step 2: Render source-cell highlight in Grid.tsx**

Add `sourceCells: Set<string>` to the `GridProps`. Inside the cell render, add a `isSourceCell` flag and a softer highlight style:

```tsx
const key = `${layer}:${i}`;
const isSourceCell = sourceCells.has(key);
// In the rect:
fill={isSelected ? "#fde68a" : isSourceCell ? "#fef3c7" : isInputRow ? "#eef2ff" : "#fafafa"}
stroke={isSelected ? "#b45309" : isSourceCell ? "#d97706" : isInputRow ? "#c7d2fe" : "#d1d5db"}
strokeWidth={isSelected ? 2 : isSourceCell ? 1.5 : 1}
```

- [ ] **Step 3: Visually verify**

Click `her` at L3.
Expected: `astronaut` at L2 lights up with a soft amber (the attention source), and `her` at L2 lights up too (the residual source).

- [ ] **Step 4: Add an e2e test**

Append to `tests/transformers.spec.ts`:

```ts
test("clicking 'her' at L3 highlights its astronaut and her sources at L2", async ({ page }) => {
  const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
  await widget.getByLabel("her at L3").click();
  // The astronaut cell at L2 should have the source-cell stroke color #d97706.
  const astronautAtL2 = widget.getByLabel("astronaut at L2");
  await expect(astronautAtL2).toHaveAttribute("stroke", "#d97706");
  // The 'her' cell at L2 (residual source) likewise.
  const herAtL2 = widget.getByLabel("her at L2");
  await expect(herAtL2).toHaveAttribute("stroke", "#d97706");
});
```

- [ ] **Step 5: Run the test**

Run: `npx playwright test transformers.spec.ts -g "highlights its astronaut and her sources"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/transformers/TransformerOverview/Grid.tsx \
        src/components/widgets/transformers/TransformerOverview/TransformerOverview.tsx \
        tests/transformers.spec.ts
git commit -m "highlight source cells when a cell is selected + e2e test"
```

---

## Task 10: Drop the seven unused widgets from `widgets.tsx`

**Files:**
- Modify: `src/app/(tutorial)/transformers/widgets.tsx`

- [ ] **Step 1: Remove dynamic imports and exports for the dropped widgets**

In `src/app/(tutorial)/transformers/widgets.tsx`, delete:

- The `dynamic(() => import(... "CausalMask" ...))` block and its `CausalMaskWidget` export.
- Same for: `ResidualConnection`, `LayerNorm`, `MicroTransformer`, `DepthComparison`, `LiveTransformer`, `TransformerXRay`, `PrefixAttention`.

Keep:
- `TransformerBlockDiagram` (still used in the new chapter outline).
- `TransformerInAction` and `VectorSubspaceFig` (kept).
- `TransformerOverview` (newly added).

- [ ] **Step 2: Run the type checker**

Run: `pnpm build`
Expected: Build succeeds. (`content.mdx` still references some of these widgets — that's OK; we'll fix in the next task. If the build fails because of missing `<MicroTransformerWidget>` etc. in MDX, that's expected — proceed to Task 11. If you want a cleaner intermediate state, do Tasks 10 and 11 in a single commit.)

If the build fails, skip the commit step here and continue to Task 11 instead.

- [ ] **Step 3: Commit (only if build passes; otherwise fold into Task 11)**

```bash
git add src/app/\(tutorial\)/transformers/widgets.tsx
git commit -m "remove dropped widgets from chapter widgets registry"
```

---

## Task 11: Rewrite `content.mdx` to the new outline

**Files:**
- Modify: `src/app/(tutorial)/transformers/content.mdx`

- [ ] **Step 1: Replace the entire file with the new structure**

Overwrite `src/app/(tutorial)/transformers/content.mdx` with:

```mdx
# One Architecture to Rule Them All

<Lead>
You've now seen every piece — embeddings, attention, position encoding, neural networks. The transformer wires them together in a way that turns out to be remarkably good at thinking. This chapter shows that wiring at three zoom levels: the whole stack at a glance, one sentence flowing through it, and finally one block in close-up.
</Lead>

## A Transformer At a Glance

Every box in the picture below is one word's representation at one layer. The bottom row is the input — just dictionary meanings. Each row above is what those representations look like after one transformer layer of work. **Amber arrows** carry each word's own information forward. **Blue arrows** are attention — at each layer, every word picks which earlier words it wants to listen to and pulls information from them. The blue arcs only ever lean rightward: a word can never see the future.

<TransformerOverviewWidget>
Click any cell to see what that word means at that point. Click a layer name on the left to see what the layer is doing.
</TransformerOverviewWidget>

This looks a lot like a regular neural network — boxes in layers, weighted edges between them. The big difference: in a normal neural network the wiring is fixed, learned once during training. Here the blue wiring is recomputed for every sentence. Attention is the model rewiring itself on the fly to suit the input.

## A Transformer In Action

Theory is one thing. Watching it actually work is another. The playground below is the same five layers as above, on the same sentence — but now you can see the **actual representation** the model carries for each word, written as plain English. Click a layer to step through; click a word to see exactly which earlier words contributed and what they added.

<TransformerInActionWidget>
Click **Next layer** to step through, or jump to any layer in the strip above the passage. **Previous-token** gives every word a copy of its predecessor. **Place in the scene** ties words to scene-locations. **Resolve pronouns** wires *her* to the astronaut. **Previous-token** (again) lets *blue* re-pull *her* with all the new context. **Find what verb acts on this** binds objects to their verbs. Click **Predict** to see the top guesses for the next word.
</TransformerInActionWidget>

The model never sees *Earth* spelled out. But by the last layer, *blue*'s representation says *a blue thing belonging to the astronaut on Mars, seen in the Martian sky* — and the embedding for *Earth* (a blue planet, home to humans, visible from other planets in our solar system) lines up almost exactly. That's where the prediction comes from.

## Inside One Transformer Block

Zooming in on one of those layer rows: each one is built from a few specific pieces, wired together in a specific pattern. Step through to see them.

<TransformerBlockDiagramWidget>
Click any box, or hit Next Block to step through. The grey box is one transformer block — a real model stacks many of these (GPT-3 stacks 96).
</TransformerBlockDiagramWidget>

### Residual connection

The red paths carry each word's previous representation forward, unchanged, and add the new layer's output on top. Without them, layer 50's output would have nothing to do with the original word. With them, each layer's contribution accumulates instead of overwriting. The model can also tune how big a contribution to add — small numbers tweak the representation, big numbers transform it.

### Layer normalization

Each layer adds something. After many layers, the numbers can grow huge. Layer normalization rescales the vector after each addition so its average is zero and its spread is about one. The pattern is preserved; only the overall loudness is reset.

### Feed-forward network

Attention lets words *talk to each other*. The feed-forward network lets each word *think to itself* — it processes one word's vector at a time, with no cross-talk. Researchers have found these layers act like memory: they store facts and associations the model picks up during training. Attention finds the relevant facts; the feed-forward layers retrieve them.

## How Can One Vector Hold So Many Ideas?

Each token's vector has thousands of dimensions. When attention pulls information in from another token, that information lands in a *different direction* of the vector — a different subspace — via the head's output projection. The original meaning and the pulled-in meaning coexist, because they point different ways. Nothing is overwritten.

The feed-forward network reads across the whole vector at once. It sees both the self-info and the pulled-in info, and can compose them into something richer. *Mars* plus *previous word was 'on'* becomes *Mars as a location someone is on*.

This is why each layer genuinely accumulates understanding. Attention brings new material in. The feed-forward composes it. Stack enough layers and ideas pile up, without erasing each other.

<VectorSubspaceFigWidget />

## The Big Picture

We've come a long way:

1. **Everything is numbers** ([Chapter 1](/computation)) — text, images, sound, all just lists of numbers.
2. **Small improvements add up** ([Chapter 2](/optimization)) — gradient descent finds good solutions step by step.
3. **Neural networks learn patterns** ([Chapter 3](/neurons)) — layers of neurons can learn anything.
4. **Vectors capture meaning** ([Chapter 4](/vectors)) — similar things end up with similar numbers.
5. **Embeddings give words geometry** ([Chapter 5](/embeddings)) — words live in a space where closeness equals similarity.
6. **Prediction requires understanding** ([Chapter 6](/next-word-prediction)) — to guess the next word, you have to *get* the sentence.
7. **Attention lets words talk** ([Chapter 7](/attention)) — each word chooses which others to listen to.
8. **Position encoding adds order** ([Chapter 8](/positions)) — so "dog bit man" isn't the same as "man bit dog".
9. **The transformer wires it all together** (this chapter) — and meaning emerges from prediction.

Same architecture, scaled up trillions of times, is what powers ChatGPT, Claude, and Gemini.

<TryItInPyTorch notebook="transformers">
Build a complete transformer from scratch in PyTorch. Train one on simple patterns, visualize what the attention heads learn, then train a bigger one on real stories and experiment with temperature and generation.
</TryItInPyTorch>
```

- [ ] **Step 2: Run the lint and build**

Run: `pnpm lint && pnpm build`
Expected: Both pass. The lint includes `lint-mdx-no-raw-p.sh`, which checks for raw `<p>` tags.

- [ ] **Step 3: Run the existing TransformerInAction tests**

Run: `npx playwright test transformers.spec.ts`
Expected: All tests pass — both the existing TransformerInAction tests and the new TransformerOverview tests.

- [ ] **Step 4: Visually verify the chapter end-to-end**

Open `http://localhost:3000/transformers` and read top to bottom:
- Lead is short and clear.
- Overview widget renders, all interactions work (cell click, layer label click, source highlight).
- TransformerInAction widget still works.
- TransformerBlockDiagram still works; the three folded subsections (Residual, Layer norm, Feed-forward) read tightly under it.
- VectorSubspaceFig renders.
- Big Picture list reads cleanly.
- Try-It-in-PyTorch link is intact.
- No reference to `MicroTransformer`, `DepthComparison`, `LiveTransformer`, `TransformerXRay`, or `PrefixAttention`.
- No dedicated `ResidualConnection` or `LayerNorm` widget.
- No "From Tiny to Titan" or "A Nuance: Prompt vs Generation" sections.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(tutorial\)/transformers/content.mdx
git commit -m "rewrite transformer chapter to the new overview-first outline"
```

---

## Task 12: Final verification sweep

- [ ] **Step 1: Full lint**

Run: `pnpm lint`
Expected: No errors.

- [ ] **Step 2: Full build**

Run: `pnpm build`
Expected: Build succeeds, no warnings about missing imports.

- [ ] **Step 3: Full Playwright run**

Run: `npx playwright test`
Expected: All tests pass (homepage, chapter01, transformers).

- [ ] **Step 4: Manual smoke test**

Open `http://localhost:3000/transformers`. Walk the chapter. For the new widget, specifically:
- Click each layer label on the left in turn — verify the right summary appears each time.
- Click `On` at L0 — verify the popup shows the L0 dictionary meaning.
- Click `astronaut` at L4 — verify the popup body matches the astronaut's L4 rep.
- Click `blue` at the Predict cell — verify it shows the top-3 prediction summary.
- Reset the widget — verify all selection clears.
- Resize the browser window — popup repositions correctly.

- [ ] **Step 5: Final commit if any cleanup happened**

If the manual smoke test surfaced anything, fix and commit. Otherwise this task ends with no commit.

---

## Self-review checklist

After all tasks pass:

- [ ] Spec section "Final chapter outline" maps to the rewritten `content.mdx` (Task 11).
- [ ] Spec section "Dropped from the chapter" maps to Task 10's removals + the omissions in `content.mdx`.
- [ ] Spec section "New overview widget — design" maps to Tasks 1–9 (geometry, edges, grid, popup, cell click, layer click, source highlight).
- [ ] Spec "Out of scope" items are not implemented (no `TransformerBlockDiagram` text rewrite; no widget file deletions; no extra playgrounds).
- [ ] No tests reference dropped widgets.
- [ ] Every code block in this plan was actually applied.
