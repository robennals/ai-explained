import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  WhyAttentionMattersWidget,
  PatternAttentionWidget,
  AttentionStepThroughWidget,
  MultiHeadWidget,
  PositionScrambleWidget,
  RotationPositionWidget,
} from "./widgets";

export const metadata = {
  title: "Attention — Learn AI by Messing About",
  description:
    "Attention lets each word choose which other words to focus on. Built from embeddings, dot products, and neural networks.",
};

export default function Chapter07() {
  const { prev, next } = getAdjacentChapters("07-attention");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WhyAttentionMattersWidget,
            PatternAttentionWidget,
            AttentionStepThroughWidget,
            MultiHeadWidget,
            PositionScrambleWidget,
            RotationPositionWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
