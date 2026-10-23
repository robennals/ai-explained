import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";

export const metadata = chapterMetadata("introduction");

export default function Introduction() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="introduction" />
        <Content />
      </div>
      <ChapterNav slug="introduction" />
    </article>
  );
}
