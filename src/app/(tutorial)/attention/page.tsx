import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  WhyAttentionMattersWidget,
  AnsweringQuestionsWidget,
  MatchingQuestionsWidget,
  SoftmaxExplorerWidget,
  AttentionSinkWidget,
  AttentionValuesWidget,
  AttentionHeadsWidget,
} from "./widgets";

export const metadata = chapterMetadata("attention");

export default function Chapter07() {
  const { prev, next } = getAdjacentChapters("attention");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WhyAttentionMattersWidget,
            AnsweringQuestionsWidget,
            MatchingQuestionsWidget,
            SoftmaxExplorerWidget,
            AttentionSinkWidget,
            AttentionValuesWidget,
            AttentionHeadsWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
