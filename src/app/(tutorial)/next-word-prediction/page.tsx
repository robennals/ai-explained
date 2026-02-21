import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  NextWordGameWidget,
  BigramExplorerWidget,
  NgramExplosionWidget,
  SimpleNNPredictorWidget,
} from "./widgets";

export const metadata = {
  title: "Prediction Requires Understanding — Learn AI Layer by Layer",
  description:
    "If you can predict the next word accurately, you must understand grammar, facts, and common sense. Prediction IS understanding.",
};

export default function Chapter06() {
  const { prev, next } = getAdjacentChapters("next-word-prediction");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            NextWordGameWidget,
            BigramExplorerWidget,
            NgramExplosionWidget,
            SimpleNNPredictorWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
