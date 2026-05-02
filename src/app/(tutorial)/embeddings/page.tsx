import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  CombinedNumberLineWidget,
  Simple2DScatterWidget,
  EmbeddingPlaygroundWidget,
  WordPairSpectrumWidget,
  EmbeddingLayerDiagramWidget,
  EmbeddingClassifierWidget,
  EmbeddingArithmeticWidget,
  TokenizationPlaygroundWidget,
} from "./widgets";

export const metadata = chapterMetadata("embeddings");

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
            EmbeddingArithmeticWidget,
            TokenizationPlaygroundWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
