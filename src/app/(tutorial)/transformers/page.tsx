import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  ToyTransformerWidget,
  StoryTransformerWidget,
  StoryGeneratorWidget,
} from "./widgets";

export const metadata = {
  title: "One Architecture to Rule Them All — Learn AI Layer by Layer",
  description:
    "The transformer wires attention and neural networks together. Trained to predict the next word, it learns grammar and common sense from nothing but prediction.",
};

export default function Chapter08() {
  const { prev, next } = getAdjacentChapters("transformers");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            ToyTransformerWidget,
            StoryTransformerWidget,
            StoryGeneratorWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
