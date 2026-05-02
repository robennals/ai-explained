import { ChapterNav } from "@/components/layout/ChapterNav";
import { PolishingNotice } from "@/components/layout/PolishingNotice";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  WhyAttentionMattersWidget,
  ToyVocabTableWidget,
  SoftmaxExplorerWidget,
  ToyAttentionWidget,
  ToyValuesWidget,
  AttentionPlaygroundWidget,
  BertAttentionNoPositionWidget,
  LiveAttentionWidget,
  ToyAttentionValuesWidget,
  ToyValueTableWidget,
  PatternAttentionWidget,
  AttentionStepThroughWidget,
  MultiHeadWidget,
  QKVProjectionWidget,
} from "./widgets";

export const metadata = chapterMetadata("attention");

export default function Chapter07() {
  const { prev, next } = getAdjacentChapters("attention");

  return (
    <article>
      <PolishingNotice />
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WhyAttentionMattersWidget,
            ToyVocabTableWidget,
            SoftmaxExplorerWidget,
            ToyAttentionWidget,
            ToyValuesWidget,
            AttentionPlaygroundWidget,
            BertAttentionNoPositionWidget,
            LiveAttentionWidget,
            ToyAttentionValuesWidget,
            ToyValueTableWidget,
            PatternAttentionWidget,
            AttentionStepThroughWidget,
            MultiHeadWidget,
            QKVProjectionWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
