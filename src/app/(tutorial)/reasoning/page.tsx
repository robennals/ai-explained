import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  ThinkFirstWidget,
  TraceSamplingWidget,
} from "./widgets";

export const metadata = chapterMetadata("reasoning");

export default function Chapter11() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="reasoning" />
        <Content
          components={{
            ThinkFirstWidget,
            TraceSamplingWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="reasoning" />
    </article>
  );
}
