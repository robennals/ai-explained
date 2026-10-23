import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  PromptsAndCompletionsWidget,
  RawCompletionWidget,
  TrainingSignalWidget,
} from "./widgets";

export const metadata = chapterMetadata("post-training");

export default function Chapter10() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="post-training" />
        <Content
          components={{
            PromptsAndCompletionsWidget,
            RawCompletionWidget,
            TrainingSignalWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="post-training" />
    </article>
  );
}
