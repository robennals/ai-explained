import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
import {
  NumbersEverywhereWidget,
  FunctionMachineWidget,
  ParameterPlaygroundWidget,
  LookupTableExplosionWidget,
} from "./widgets";

export const metadata = chapterMetadata("computation");

export default function Chapter01() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="computation" />
        <Content
          components={{
            NumbersEverywhereWidget,
            FunctionMachineWidget,
            ParameterPlaygroundWidget,
            LookupTableExplosionWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="computation" />
    </article>
  );
}
