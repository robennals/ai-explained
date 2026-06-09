import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  DetectorStackWidget,
  LayerDetectorWidget,
  MatrixGridWidget,
  MatrixCompositionWidget,
  AttentionMatmulWidget,
  Transform2D3DWidget,
  VectorOrientationWidget,
} from "./widgets";

export const metadata = chapterMetadata("matrices");

export default function Chapter05() {
  const { prev, next } = getAdjacentChapters("matrices");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            DetectorStackWidget,
            LayerDetectorWidget,
            MatrixGridWidget,
            MatrixCompositionWidget,
            AttentionMatmulWidget,
            Transform2D3DWidget,
            VectorOrientationWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
