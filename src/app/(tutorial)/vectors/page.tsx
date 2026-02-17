import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  VectorExamplesWidget,
  AnimalPropertyExplorerWidget,
  Vector1DExplorerWidget,
  Vector2DExplorerWidget,
  Vector3DExplorerWidget,
  AnimalDirectionMagnitudeWidget,
  DotProductAnalogiesWidget,
  DotProductExplorerWidget,
  NeuronDotProductWidget,
} from "./widgets";

export const metadata = {
  title: "Vectors — Learn AI by Messing About",
  description:
    "A vector is just a list of numbers — but lists of numbers can describe position, color, animals, and anything else. See how the dot product measures alignment and how neurons use it to detect directions.",
};

export default function ChapterVectors() {
  const { prev, next } = getAdjacentChapters("vectors");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            VectorExamplesWidget,
            AnimalPropertyExplorerWidget,
            Vector1DExplorerWidget,
            Vector2DExplorerWidget,
            Vector3DExplorerWidget,
            AnimalDirectionMagnitudeWidget,
            DotProductAnalogiesWidget,
            DotProductExplorerWidget,
            NeuronDotProductWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
