import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  Transform1DWidget,
  Transform2DWidget,
  BasisVectorViewWidget,
  DimensionProjectionWidget,
  NeuronVsMatrixWidget,
  ActivationEffectWidget,
} from "./widgets";

export const metadata = chapterMetadata("matrix-math");

export default function Chapter05() {
  const { prev, next } = getAdjacentChapters("matrix-math");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            Transform1DWidget,
            Transform2DWidget,
            BasisVectorViewWidget,
            DimensionProjectionWidget,
            NeuronVsMatrixWidget,
            ActivationEffectWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
