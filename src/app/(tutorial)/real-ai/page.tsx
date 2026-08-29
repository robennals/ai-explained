import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  AlignmentPlayground,
  BenchmarksPlayground,
  EfficiencyPlayground,
  ScalePlayground,
  MachinePlayground,
} from "./widgets";

export const metadata = chapterMetadata("real-ai");

export default function Chapter10() {
  const { prev, next } = getAdjacentChapters("real-ai");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="real-ai" />
        <Content
          components={{
            AlignmentPlayground,
            BenchmarksPlayground,
            EfficiencyPlayground,
            ScalePlayground,
            MachinePlayground,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
