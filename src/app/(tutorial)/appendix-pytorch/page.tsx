import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";

export const metadata = chapterMetadata("appendix-pytorch");

export default function AppendixPyTorch() {
  const { prev, next } = getAdjacentChapters("appendix-pytorch");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
