import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  ALiBiToyTokensWidget,
  RotationPositionWidget,
  RotationToyTokensWidget,
  RoPEDistanceSensitivityWidget,
  WordOrderMattersWidget,
} from "./widgets";

export const metadata = {
  title: "Where Am I? — Learn AI Layer by Layer",
  description:
    "Attention is position-blind. Distance penalties, rotation tricks, and the elegant geometry of RoPE fix this.",
};

export default function ChapterPositions() {
  const { prev, next } = getAdjacentChapters("positions");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            WordOrderMattersWidget,
            ALiBiToyTokensWidget,
            RotationPositionWidget,
            RotationToyTokensWidget,
            RoPEDistanceSensitivityWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
