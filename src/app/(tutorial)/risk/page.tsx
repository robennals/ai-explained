import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  ControlWidget,
  EstimatesWidget,
  FictionWidget,
  HuggingFaceWidget,
  ResponseWidget,
  TrajectoryWidget,
  WhyBadWidget,
} from "./widgets";

export const metadata = chapterMetadata("risk");

export default function AIRiskChapter() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="risk" />
        <Content
          components={{
            ControlWidget,
            EstimatesWidget,
            FictionWidget,
            HuggingFaceWidget,
            ResponseWidget,
            TrajectoryWidget,
            WhyBadWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="risk" />
    </article>
  );
}
