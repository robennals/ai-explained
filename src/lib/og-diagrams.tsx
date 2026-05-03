// Maps chapter slug → ReactNode rendered in the OG card for that chapter.
// The diagram mounts in its initial state; the OG route's CSS frames it.
// Chapters without an entry get a clean text-only OG card.
//
// Each entry can wrap the widget in a container that scales it (CSS `zoom`)
// to fill the 1200×630 canvas. Scale factors are tuned per-widget by visual
// inspection of the captured PNG.
//
// To swap a chapter's OG diagram, edit its `case` below and re-run
// `pnpm og:capture` (with the prod or dev server running).

import type { ReactNode } from "react";
import { ImageTab } from "@/components/widgets/computation/NumbersEverywhere";
import { SmoothVsRuggedWidget } from "@/app/(tutorial)/optimization/widgets";
import { NeuronFreePlayWidget } from "@/app/(tutorial)/neurons/widgets";
import { AmplifiedAnimalExplorerWidget } from "@/app/(tutorial)/vectors/widgets";
import { EmbeddingClassifierWidget } from "@/app/(tutorial)/embeddings/widgets";
import { BigramExplorerWidget } from "@/app/(tutorial)/next-word-prediction/widgets";
import { ToyAttentionScoresWidget } from "@/app/(tutorial)/attention/widgets";
import { RotationToyTokensWidget } from "@/app/(tutorial)/positions/widgets";
import { TransformerOverviewWidget } from "@/app/(tutorial)/transformers/widgets";

export interface OgDiagram {
  /** Rendered inside the OG card. */
  node: ReactNode;
}

// Wraps a widget in a CSS zoom container so it fills more of the 1200×630
// canvas. Zoom is non-standard but works in Chromium (which Playwright uses).
function zoomed(zoom: number, children: ReactNode): ReactNode {
  return (
    <div
      style={{
        zoom,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

export function getOgDiagram(slug: string): OgDiagram | null {
  switch (slug) {
    case "computation":
      // Image tab from Numbers Everywhere — pixel grid is the visual hook.
      return { node: zoomed(2.0, <ImageTab />) };
    case "optimization":
      // Two side-by-side landscapes — smooth vs. rugged.
      return { node: zoomed(1.4, <SmoothVsRuggedWidget />) };
    case "neurons":
      // Your First Neuron — the canonical perceptron playground.
      return { node: zoomed(1.5, <NeuronFreePlayWidget />) };
    case "vectors":
      // Animal trait sliders — squeezed narrower so the responsive widget
      // reflows taller and fills more of the canvas.
      return {
        node: (
          <div style={{ width: 720 }}>
            <AmplifiedAnimalExplorerWidget />
          </div>
        ),
      };
    case "embeddings":
      // Classifier heatmap — colorful + visual, less text-heavy than arithmetic.
      return { node: zoomed(1.4, <EmbeddingClassifierWidget />) };
    case "next-word-prediction":
      // Probability bars — zoomed to fill canvas.
      return { node: zoomed(1.6, <BigramExplorerWidget />) };
    case "attention":
      // Toy attention — cat ← it arrow with KEY/QUERY values. No zoom:
      // the SVG arc uses absolute coordinates that mis-align under CSS
      // zoom. The crop script upscales the trimmed content to fill.
      return { node: <ToyAttentionScoresWidget /> };
    case "positions":
      // "Applying Rotation to a Dimension" — visual rotation of a single
      // dimension pair, less wide than WordOrderMatters.
      return { node: <RotationToyTokensWidget /> };
    case "transformers":
      // Layer-by-layer overview of a small transformer.
      return { node: zoomed(1.5, <TransformerOverviewWidget />) };
    default:
      return null;
  }
}
