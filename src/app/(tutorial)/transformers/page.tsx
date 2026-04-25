import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  TransformerBlockDiagramWidget,
  TransformerInActionWidget,
  VectorSubspaceFigWidget,
  TransformerOverviewWidget,
} from "./widgets";

export const metadata = {
  title: "One Architecture to Rule Them All — Learn AI Layer by Layer",
  description:
    "The transformer wires attention and neural networks together. Trained to predict the next word, it learns grammar and common sense from nothing but prediction.",
};

export default function Chapter09() {
  const { prev, next } = getAdjacentChapters("transformers");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            TransformerBlockDiagramWidget,
            TransformerInActionWidget,
            VectorSubspaceFigWidget,
            TransformerOverviewWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
