import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  WordNumberLineWidget,
  CombinedNumberLineWidget,
  Simple2DScatterWidget,
  EmbeddingPlaygroundWidget,
  WordPairSpectrumWidget,
  EmbeddingLayerDiagramWidget,
  EmbeddingClassifierWidget,
} from "./widgets";

export const metadata = {
  title: "Embeddings and Vector Spaces — AI Explained",
  description:
    "From one-hot to learned representations. Word analogies, semantic structure, and exploring the geometry of meaning.",
};

export default function Chapter04() {
  const { prev, next } = getAdjacentChapters("04-embeddings");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WordNumberLineWidget,
            CombinedNumberLineWidget,
            Simple2DScatterWidget,
            EmbeddingPlaygroundWidget,
            WordPairSpectrumWidget,
            EmbeddingLayerDiagramWidget,
            EmbeddingClassifierWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
