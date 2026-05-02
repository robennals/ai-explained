import { ChapterNav } from "@/components/layout/ChapterNav";
import { PolishingNotice } from "@/components/layout/PolishingNotice";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  TransformerBlockDiagramWidget,
  TransformerInActionWidget,
  TransformerOverviewWidget,
} from "./widgets";

export const metadata = chapterMetadata("transformers");

export default function Chapter09() {
  const { prev, next } = getAdjacentChapters("transformers");

  return (
    <article>
      <PolishingNotice />
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            TransformerBlockDiagramWidget,
            TransformerInActionWidget,
            TransformerOverviewWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
