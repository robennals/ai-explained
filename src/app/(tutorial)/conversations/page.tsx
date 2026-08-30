import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  RepeatedTurnsWidget,
  SystemPromptViewWidget,
  TranscriptViewsWidget,
} from "./widgets";

export const metadata = chapterMetadata("conversations");

export default function Chapter11() {
  const { prev, next } = getAdjacentChapters("conversations");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="conversations" />
        <Content
          components={{
            RepeatedTurnsWidget,
            SystemPromptViewWidget,
            TranscriptViewsWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
