import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";

export const metadata = {
  title: "Introduction — Learn AI Layer by Layer",
  description:
    "An interactive tutorial about how modern AI actually works, with no math or computer science background assumed.",
};

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
