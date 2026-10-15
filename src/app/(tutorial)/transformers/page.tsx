import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  TransformerBlockDiagramWidget,
  TransformerInActionWidget,
  TransformerOverviewWidget,
} from "./widgets";

export const metadata = chapterMetadata("transformers");

export default function Chapter09() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="transformers" />
        <Content
          components={{
            TransformerBlockDiagramWidget,
            TransformerInActionWidget,
            TransformerOverviewWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="transformers" />
    </article>
  );
}
