import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { getAdjacentChapters } from "@/lib/curriculum";
import Content from "./content.mdx";
import {
  NetworkOverviewWidget,
  NeuronDiagramWidget,
  NeuronScaleComparisonWidget,
  NeuronFreePlayWidget,
  NeuronPlaygroundWidget,
  SharpnessExplorerWidget,
  SigmoidExplorerWidget,
  SigmoidZoomWidget,
  LogicGatePlaygroundWidget,
  GateCircuitDiagramWidget,
  TwoNeuronXORWidget,
  DeepNetworkPlaygroundWidget,
} from "./widgets";

export const metadata = chapterMetadata("neurons");

export default function Chapter03() {
  const { prev, next } = getAdjacentChapters("neurons");

  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <Content
          components={{
            NetworkOverviewWidget,
            NeuronDiagramWidget,
            NeuronScaleComparisonWidget,
            NeuronFreePlayWidget,
            NeuronPlaygroundWidget,
            SharpnessExplorerWidget,
            SigmoidExplorerWidget,
            SigmoidZoomWidget,
            LogicGatePlaygroundWidget,
            GateCircuitDiagramWidget,
            TwoNeuronXORWidget,
            DeepNetworkPlaygroundWidget,
          }}
        />
      </div>
      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
