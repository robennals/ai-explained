import { ChapterNav } from "@/components/layout/ChapterNav";
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

export const metadata = {
  title: "Neural Networks — Learn AI Layer by Layer",
  description:
    "A neuron is a smooth logic gate. Stack them in layers and they can compute anything — and backpropagation lets you train all the weights at once.",
};

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
