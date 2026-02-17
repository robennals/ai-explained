import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  NumbersEverywhereWidget,
  FunctionMachineWidget,
  ParameterPlaygroundWidget,
  LookupTableExplosionWidget,
} from "./widgets";

export const metadata = {
  title: "Everything Is Numbers — Learn AI by Messing About",
  description:
    "Text, images, and sound are all numbers. Thinking is a function. The challenge: find the right one.",
};

export default function Chapter01() {
  const { prev, next } = getAdjacentChapters("computation");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            NumbersEverywhereWidget,
            FunctionMachineWidget,
            ParameterPlaygroundWidget,
            LookupTableExplosionWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
