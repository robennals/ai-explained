// Maps chapter slug → ReactNode rendered in the OG card for that chapter.
// The diagram mounts in its initial state; the OG route's CSS frames it.
// Chapters without an entry get a clean text-only OG card.
//
// To swap a chapter's OG diagram, edit its `case` below and re-run
// `pnpm og:capture` (with the dev or prod server running).

import type { ReactNode } from "react";
import { NumbersEverywhereWidget } from "@/app/(tutorial)/computation/widgets";
import { Gradient2DCurveWidget } from "@/app/(tutorial)/optimization/widgets";
import { NetworkOverviewWidget } from "@/app/(tutorial)/neurons/widgets";
import { AmplifiedAnimalExplorerWidget } from "@/app/(tutorial)/vectors/widgets";
import { EmbeddingArithmeticWidget } from "@/app/(tutorial)/embeddings/widgets";
import { BigramExplorerWidget } from "@/app/(tutorial)/next-word-prediction/widgets";
import { ToyAttentionWidget } from "@/app/(tutorial)/attention/widgets";
import { WordOrderMattersWidget } from "@/app/(tutorial)/positions/widgets";
import { TransformerOverviewWidget } from "@/app/(tutorial)/transformers/widgets";

export interface OgDiagram {
  /** Rendered inside the OG card. */
  node: ReactNode;
}

export function getOgDiagram(slug: string): OgDiagram | null {
  switch (slug) {
    case "computation":
      return { node: <NumbersEverywhereWidget /> };
    case "optimization":
      return { node: <Gradient2DCurveWidget /> };
    case "neurons":
      return { node: <NetworkOverviewWidget /> };
    case "vectors":
      return { node: <AmplifiedAnimalExplorerWidget /> };
    case "embeddings":
      return { node: <EmbeddingArithmeticWidget /> };
    case "next-word-prediction":
      return { node: <BigramExplorerWidget /> };
    case "attention":
      return { node: <ToyAttentionWidget /> };
    case "positions":
      return { node: <WordOrderMattersWidget /> };
    case "transformers":
      return { node: <TransformerOverviewWidget /> };
    default:
      return null;
  }
}
