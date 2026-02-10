import { ChapterNav } from "@/components/layout/ChapterNav";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  NetworkOverviewWidget,
  NeuronDiagramWidget,
  NeuronScaleComparisonWidget,
  NeuronPlaygroundWidget,
  CoordinateDescentTrapWidget,
  NetworkTrainerWidget,
} from "./widgets";

export const metadata = {
  title: "Neural Networks — AI Explained",
  description:
    "Neural networks are remarkably simple: just neurons stacked in layers. The hard part isn't the architecture — it's finding the right weights.",
};

export default function Chapter03() {
  const { prev, next } = getAdjacentChapters("03-neurons");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            NetworkOverviewWidget,
            NeuronDiagramWidget,
            NeuronScaleComparisonWidget,
            NeuronPlaygroundWidget,
            CoordinateDescentTrapWidget,
            NetworkTrainerWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
