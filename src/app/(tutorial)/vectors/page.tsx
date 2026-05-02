import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  VectorPropertyExplorerWidget,
  UnitVectorExplorerWidget,
  DotProduct2DWidget,
  DotProductComparisonWidget,
  NeuronDotProductWidget,
  AmplifiedAnimalExplorerWidget,
  VectorMixerWidget,
  DirectionMagnitudeExplorerWidget,
} from "./widgets";

export const metadata = chapterMetadata("vectors");

export default function ChapterVectors() {
  const { prev, next } = getAdjacentChapters("vectors");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            VectorPropertyExplorerWidget,
            UnitVectorExplorerWidget,
            DotProduct2DWidget,
            DotProductComparisonWidget,
            NeuronDotProductWidget,
            AmplifiedAnimalExplorerWidget,
            VectorMixerWidget,
            DirectionMagnitudeExplorerWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
