import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  RawCompletionWidget,
  TrainingSignalWidget,
} from "./widgets";

export const metadata = chapterMetadata("post-training");

export default function Chapter10() {
  const { prev, next } = getAdjacentChapters("post-training");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="post-training" />
        <Content
          components={{
            RawCompletionWidget,
            TrainingSignalWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
