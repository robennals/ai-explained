import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  OptimizationGameWidget,
  ErrorMeasurementWidget,
  SmoothRealWorldWidget,
  SmoothVsRuggedWidget,
  GradientRealWorldWidget,
  Gradient2DCurveWidget,
} from "./widgets";

export const metadata = {
  title: "The Power of Incremental Improvement — Learn AI by Messing About",
  description:
    "Evolution, the scientific method, and gradient descent are all the same algorithm. Reliable tiny improvements, repeated billions of times.",
};

export default function Chapter02() {
  const { prev, next } = getAdjacentChapters("optimization");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            OptimizationGameWidget,
            ErrorMeasurementWidget,
            SmoothRealWorldWidget,
            SmoothVsRuggedWidget,
            GradientRealWorldWidget,
            Gradient2DCurveWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
