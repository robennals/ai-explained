import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  ActivationWidget,
  BadInitWidget,
  TwinsWidget,
  VanishingChainWidget,
  ResidualStreamDiagram,
  BatchingWidget,
  NormalizationWidget,
  OptimizerRaceWidget,
  OverfittingWidget,
} from "./widgets";

export const metadata = chapterMetadata("training");

export default function ChapterTraining() {
  const { prev, next } = getAdjacentChapters("training");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            ActivationWidget,
            BadInitWidget,
            TwinsWidget,
            VanishingChainWidget,
            ResidualStreamDiagram,
            BatchingWidget,
            NormalizationWidget,
            OptimizerRaceWidget,
            OverfittingWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
