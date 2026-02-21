import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  VectorPropertyExplorerWidget,
  UnitVectorExplorerWidget,
  DotProduct2DWidget,
  DotProductComparisonWidget,
  NeuronDotProductWidget,
} from "./widgets";

export const metadata = {
  title: "Describing the World with Numbers — Learn AI Layer by Layer",
  description:
    "A vector is just a list of numbers — but lists of numbers can describe animals, characters, food, and anything else. See how the dot product measures similarity and how neurons use it to detect patterns.",
};

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
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
