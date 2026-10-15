import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  CombinedNumberLineWidget,
  Simple2DScatterWidget,
  EmbeddingPlaygroundWidget,
  WordPairSpectrumWidget,
  EmbeddingLayerDiagramWidget,
  EmbeddingTrainerWidget,
  EmbeddingClassifierWidget,
  EmbeddingArithmeticWidget,
  TokenizationPlaygroundWidget,
} from "./widgets";

export const metadata = chapterMetadata("embeddings");

export default function Chapter04() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="embeddings" />
        <Content
          components={{
            CombinedNumberLineWidget,
            Simple2DScatterWidget,
            EmbeddingPlaygroundWidget,
            WordPairSpectrumWidget,
            EmbeddingLayerDiagramWidget,
            EmbeddingTrainerWidget,
            EmbeddingClassifierWidget,
            EmbeddingArithmeticWidget,
            TokenizationPlaygroundWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="embeddings" />
    </article>
  );
}
