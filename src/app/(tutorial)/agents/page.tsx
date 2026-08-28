import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  MemoryLoopWidget,
  SkillLoopWidget,
  ToolLoopWidget,
} from "./widgets";

export const metadata = chapterMetadata("agents");

export default function Chapter12() {
  const { prev, next } = getAdjacentChapters("agents");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="agents" />
        <Content
          components={{
            MemoryLoopWidget,
            SkillLoopWidget,
            ToolLoopWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
