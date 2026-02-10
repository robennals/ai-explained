import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  Transform1DWidget,
  Transform2DWidget,
  BasisVectorViewWidget,
  DimensionProjectionWidget,
  NeuronVsMatrixWidget,
} from "./widgets";

export const metadata = {
  title: "Matrix Math and Linear Transformations — AI Explained",
  description:
    "Every neural network layer is a geometric transformation. See how matrices rotate, scale, and shear space — and why that's the same thing as a layer of neurons.",
};

export default function Chapter04() {
  const { prev, next } = getAdjacentChapters("04-matrix-math");

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
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
