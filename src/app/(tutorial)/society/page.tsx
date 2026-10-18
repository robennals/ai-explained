import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  BiasWidget,
  EnergyAndWaterWidget,
  HistoryWidget,
  TruthWidget,
  ValueWidget,
} from "./widgets";

export const metadata = chapterMetadata("society");

export default function AISocietyChapter() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="society" />
        <Content
          components={{
            BiasWidget,
            EnergyAndWaterWidget,
            HistoryWidget,
            TruthWidget,
            ValueWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="society" />
    </article>
  );
}
