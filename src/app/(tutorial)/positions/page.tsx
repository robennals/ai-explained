import { ChapterNav } from "@/components/layout/ChapterNav";
import { PolishingNotice } from "@/components/layout/PolishingNotice";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  ALiBiToyTokensWidget,
  RotationDotProductWidget,
  RotationPositionWidget,
  RotationToyTokensWidget,
  RoPEDistanceSensitivityWidget,
  RoPEMultiSpeedWidget,
  CausalMaskingWidget,
  WordOrderMattersWidget,
} from "./widgets";

export const metadata = chapterMetadata("positions");

export default function ChapterPositions() {
  const { prev, next } = getAdjacentChapters("positions");

  return (
    <article>
      <PolishingNotice />
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WordOrderMattersWidget,
            ALiBiToyTokensWidget,
            RotationDotProductWidget,
            RotationPositionWidget,
            RotationToyTokensWidget,
            RoPEDistanceSensitivityWidget,
            RoPEMultiSpeedWidget,
            CausalMaskingWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
