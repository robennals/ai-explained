import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";

export const metadata = chapterMetadata("introduction");

export default function Introduction() {
  const { prev, next } = getAdjacentChapters("introduction");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
