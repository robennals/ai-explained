import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  QuadraticWallWidget,
  KVCacheWidget,
  LocalVsGlobalWidget,
  SparseIndexerWidget,
  PagedCacheWidget,
  RetrievalWidget,
} from "./widgets";

export const metadata = chapterMetadata("context");

export default function Chapter10() {
  const { prev, next } = getAdjacentChapters("context");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            QuadraticWallWidget,
            KVCacheWidget,
            LocalVsGlobalWidget,
            SparseIndexerWidget,
            PagedCacheWidget,
            RetrievalWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
