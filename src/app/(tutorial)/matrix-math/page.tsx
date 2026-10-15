import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import {
  Transform1DWidget,
  Transform2DWidget,
  BasisVectorViewWidget,
  DimensionProjectionWidget,
  NeuronVsMatrixWidget,
  ActivationEffectWidget,
} from "./widgets";

export const metadata = chapterMetadata("matrix-math");

export default function Chapter05() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="matrix-math" />
        <Content
          components={{
            Transform1DWidget,
            Transform2DWidget,
            BasisVectorViewWidget,
            DimensionProjectionWidget,
            NeuronVsMatrixWidget,
            ActivationEffectWidget,
          }}
        />
      </div>
      <ChapterNav slug="matrix-math" />
    </article>
  );
}
