import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
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

export const metadata = chapterMetadata("optimization");

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
