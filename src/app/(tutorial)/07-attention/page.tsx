import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  WhyAttentionMattersWidget,
  ToyVocabTableWidget,
  SoftmaxExplorerWidget,
  ToyAttentionWidget,
  ToyValuesWidget,
  AttentionPlaygroundWidget,
  BertAttentionWidget,
  PatternAttentionWidget,
  AttentionStepThroughWidget,
  MultiHeadWidget,
  RoPEToyTokensWidget,
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
            ToyVocabTableWidget,
            SoftmaxExplorerWidget,
            ToyAttentionWidget,
            ToyValuesWidget,
            AttentionPlaygroundWidget,
            BertAttentionWidget,
            PatternAttentionWidget,
            AttentionStepThroughWidget,
            MultiHeadWidget,
            RoPEToyTokensWidget,
            RotationPositionWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
