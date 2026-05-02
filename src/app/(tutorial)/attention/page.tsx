import { ChapterNav } from "@/components/layout/ChapterNav";
import { PolishingNotice } from "@/components/layout/PolishingNotice";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  WhyAttentionMattersWidget,
  ToyAttentionScoresWidget,
  SoftmaxExplorerWidget,
  ToyAttentionSoftmaxWidget,
  ToyAttentionValuesWidget,
  ToyAttentionSinkWidget,
  QKVProjectionWidget,
  BertAttentionWidget,
  BertAttentionNoPositionWidget,
  LiveAttentionWidget,
} from "./widgets";

export const metadata = {
  title: "Paying Attention — Learn AI Layer by Layer",
  description:
    "Attention lets each word choose which other words to focus on. Built from embeddings, dot products, and neural networks.",
};

export default function Chapter07() {
  const { prev, next } = getAdjacentChapters("attention");

  return (
    <article>
      <PolishingNotice />
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WhyAttentionMattersWidget,
            ToyAttentionScoresWidget,
            SoftmaxExplorerWidget,
            ToyAttentionSoftmaxWidget,
            ToyAttentionValuesWidget,
            ToyAttentionSinkWidget,
            QKVProjectionWidget,
            BertAttentionWidget,
            BertAttentionNoPositionWidget,
            LiveAttentionWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
