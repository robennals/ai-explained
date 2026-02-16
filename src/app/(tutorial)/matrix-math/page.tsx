import { ChapterNav } from "@/components/layout/ChapterNav";
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

export const metadata = {
  title: "Matrix Math and Linear Transformations — Learn AI by Messing About",
  description:
    "Every neural network layer is a geometric transformation. See how matrices rotate, scale, and shear space — and why that's the same thing as a layer of neurons.",
};

export default function Chapter05() {
  const { prev, next } = getAdjacentChapters("05-matrix-math");

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
