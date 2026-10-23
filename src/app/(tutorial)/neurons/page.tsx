import { ChapterHeader } from "@/components/layout/ChapterHeader";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import Content from "./content.mdx";
import { QuizContent } from "./QuizContent";
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
  GateScaleWidget,
  TwoNeuronXORWidget,
  DeepNetworkPlaygroundWidget,
  CutoffGateWidget,
  ThresholdGateWidget,
} from "./widgets";

export const metadata = chapterMetadata("neurons");

export default function Chapter03() {
  return (
    <article>
      <div className="prose prose-lg max-w-none">
        <ChapterHeader slug="neurons" />
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
            GateScaleWidget,
            TwoNeuronXORWidget,
            DeepNetworkPlaygroundWidget,
            CutoffGateWidget,
            ThresholdGateWidget,
          }}
        />
      </div>
      <QuizContent />
      <ChapterNav slug="neurons" />
    </article>
  );
}
