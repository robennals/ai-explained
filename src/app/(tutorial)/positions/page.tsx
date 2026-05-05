import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  ALiBiToyTokensWidget,
  DistancePenaltyShapesWidget,
  RotationDotProductWidget,
  RotationPositionWidget,
  RotationToyTokensWidget,
  RoPEDistanceSensitivityWidget,
  RoPEMultiSpeedWidget,
  WordOrderMattersWidget,
} from "./widgets";

export const metadata = chapterMetadata("positions");

export default function ChapterPositions() {
  const { prev, next } = getAdjacentChapters("positions");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WordOrderMattersWidget,
            ALiBiToyTokensWidget,
            DistancePenaltyShapesWidget,
            RotationDotProductWidget,
            RotationPositionWidget,
            RotationToyTokensWidget,
            RoPEDistanceSensitivityWidget,
            RoPEMultiSpeedWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
