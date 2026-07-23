import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
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
  const { prev, next } = getAdjacentChapters("computation");

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
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
