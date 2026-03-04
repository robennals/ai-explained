import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  CombinedNumberLineWidget,
  Simple2DScatterWidget,
  EmbeddingPlaygroundWidget,
  WordPairSpectrumWidget,
  EmbeddingLayerDiagramWidget,
  EmbeddingClassifierWidget,
  TokenizationPlaygroundWidget,
} from "./widgets";

export const metadata = {
  title: "From Words to Meanings — Learn AI Layer by Layer",
  description:
    "From one-hot to learned representations. Word analogies, semantic structure, and exploring the geometry of meaning.",
};

export default function Chapter04() {
  const { prev, next } = getAdjacentChapters("embeddings");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            CombinedNumberLineWidget,
            Simple2DScatterWidget,
            EmbeddingPlaygroundWidget,
            WordPairSpectrumWidget,
            EmbeddingLayerDiagramWidget,
            EmbeddingClassifierWidget,
            TokenizationPlaygroundWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
