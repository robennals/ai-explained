import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  RawCompletionWidget,
  ThinkFirstWidget,
  ToolLoopWidget,
  TrainingSignalWidget,
} from "./widgets";

export const metadata = chapterMetadata("chat");

export default function Chapter10() {
  const { prev, next } = getAdjacentChapters("chat");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="chat" />
        <Content
          components={{
            RawCompletionWidget,
            ThinkFirstWidget,
            ToolLoopWidget,
            TrainingSignalWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
