import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";

export const metadata = {
  title: "PyTorch from Scratch — Learn AI by Messing About",
  description:
    "Install PyTorch, write your first tensor operations, and train a simple neural network.",
};

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
