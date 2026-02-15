import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  LossFunctionComparisonWidget,
  GradientDescentVisualizerWidget,
  OverfittingPlaygroundWidget,
  RegularizationSliderWidget,
  DropoutVisualizerWidget,
  SaddlePointIllusionWidget,
} from "./widgets";

export const metadata = {
  title: "Learning from Mistakes — Learn AI by Messing About",
  description:
    "The loss function defines what 'wrong' means. Gradient descent finds the way downhill. Train too well and the model memorizes instead of learning.",
};

export default function Chapter08() {
  const { prev, next } = getAdjacentChapters("08-learning-from-mistakes");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            LossFunctionComparisonWidget,
            GradientDescentVisualizerWidget,
            OverfittingPlaygroundWidget,
            RegularizationSliderWidget,
            DropoutVisualizerWidget,
            SaddlePointIllusionWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
