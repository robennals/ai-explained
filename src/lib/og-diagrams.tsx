// Maps chapter slug → ReactNode rendered in the OG card for that chapter.
// The diagram mounts in its initial state; the OG route's CSS frames it.
// Chapters without an entry get a clean text-only OG card.

import type { ReactNode } from "react";
import { NumbersEverywhereWidget } from "@/app/(tutorial)/computation/widgets";

export interface OgDiagram {
  /** Rendered inside the OG card. */
  node: ReactNode;
}

export function getOgDiagram(slug: string): OgDiagram | null {
  switch (slug) {
    case "computation":
      return { node: <NumbersEverywhereWidget /> };
    default:
      return null;
  }
}
