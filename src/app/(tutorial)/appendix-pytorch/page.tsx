import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";

export const metadata = chapterMetadata("appendix-pytorch");

export default function AppendixPyTorch() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="appendix-pytorch" />
        <Content />
      </div>
      <ChapterNav slug="appendix-pytorch" />
    </article>
  );
}
