import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  NextWordGameWidget,
  BigramExplorerWidget,
  NgramExplosionWidget,
  SimpleNNPredictorWidget,
} from "./widgets";

export const metadata = chapterMetadata("next-word-prediction");

export default function Chapter06() {
  const { prev, next } = getAdjacentChapters("next-word-prediction");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            NextWordGameWidget,
            BigramExplorerWidget,
            NgramExplosionWidget,
            SimpleNNPredictorWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
