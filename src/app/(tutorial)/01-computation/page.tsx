import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import { ArithmeticWidget, FuzzyWidget, GatesWidget } from "./widgets";

export const metadata = {
  title: "What Is Computation? — AI Explained",
  description:
    "Boolean logic, gates, and fuzzy logic as a bridge to neural networks.",
};

export default function Chapter01() {
  const { prev, next } = getAdjacentChapters("01-computation");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            ArithmeticWidget,
            FuzzyWidget,
            GatesWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
