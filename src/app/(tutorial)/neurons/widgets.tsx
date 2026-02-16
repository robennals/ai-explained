"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const NetworkOverview = dynamic(
  () =>
    import("@/components/widgets/neurons/NetworkOverview").then(
      (m) => m.NetworkOverview
    ),
  { ssr: false }
);

const NeuronDiagram = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuronDiagram").then(
      (m) => m.NeuronDiagram
    ),
  { ssr: false }
);

const NeuronScaleComparison = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuronScaleComparison").then(
      (m) => m.NeuronScaleComparison
    ),
  { ssr: false }
);

const NeuronFreePlay = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuronFreePlay").then(
      (m) => m.NeuronFreePlay
    ),
  { ssr: false }
);

const NeuronPlayground = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuronPlayground").then(
      (m) => m.NeuronPlayground
    ),
  { ssr: false }
);

const NeuronGeometry = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuronGeometry").then(
      (m) => m.NeuronGeometry
    ),
  { ssr: false }
);

const TwoLayerPlayground = dynamic(
  () =>
    import("@/components/widgets/neurons/TwoLayerPlayground").then(
      (m) => m.TwoLayerPlayground
    ),
  { ssr: false }
);

const NetworkTrainer = dynamic(
  () =>
    import("@/components/widgets/neurons/NetworkTrainer").then(
      (m) => m.NetworkTrainer
    ),
  { ssr: false }
);

const SharpnessExplorer = dynamic(
  () =>
    import("@/components/widgets/neurons/SharpnessExplorer").then(
      (m) => m.SharpnessExplorer
    ),
  { ssr: false }
);

const SigmoidExplorer = dynamic(
  () =>
    import("@/components/widgets/neurons/SigmoidExplorer").then(
      (m) => m.SigmoidExplorer
    ),
  { ssr: false }
);

const SigmoidZoom = dynamic(
  () =>
    import("@/components/widgets/neurons/SigmoidZoom").then(
      (m) => m.SigmoidZoom
    ),
  { ssr: false }
);

const LogicGatePlayground = dynamic(
  () =>
    import("@/components/widgets/neurons/LogicGatePlayground").then(
      (m) => m.LogicGatePlayground
    ),
  { ssr: false }
);

const TwoNeuronXOR = dynamic(
  () =>
    import("@/components/widgets/neurons/TwoNeuronXOR").then(
      (m) => m.TwoNeuronXOR
    ),
  { ssr: false }
);

const GateCircuitDiagram = dynamic(
  () =>
    import("@/components/widgets/neurons/GateCircuitDiagram").then(
      (m) => m.GateCircuitDiagram
    ),
  { ssr: false }
);

const DeepNetworkPlayground = dynamic(
  () =>
    import("@/components/widgets/neurons/DeepNetworkPlayground").then(
      (m) => m.DeepNetworkPlayground
    ),
  { ssr: false }
);

function WidgetSlot({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="my-8 flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted">
          Loading widget...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function NetworkOverviewWidget() {
  return (
    <WidgetSlot>
      <NetworkOverview />
    </WidgetSlot>
  );
}

export function NeuronDiagramWidget() {
  return (
    <WidgetSlot>
      <NeuronDiagram />
    </WidgetSlot>
  );
}

export function NeuronScaleComparisonWidget() {
  return (
    <WidgetSlot>
      <NeuronScaleComparison />
    </WidgetSlot>
  );
}

export function NeuronFreePlayWidget() {
  return (
    <WidgetSlot>
      <NeuronFreePlay />
    </WidgetSlot>
  );
}

export function NeuronPlaygroundWidget() {
  return (
    <WidgetSlot>
      <NeuronPlayground />
    </WidgetSlot>
  );
}

export function NeuronGeometryWidget() {
  return (
    <WidgetSlot>
      <NeuronGeometry />
    </WidgetSlot>
  );
}

export function TwoLayerPlaygroundWidget() {
  return (
    <WidgetSlot>
      <TwoLayerPlayground />
    </WidgetSlot>
  );
}

export function NetworkTrainerWidget() {
  return (
    <WidgetSlot>
      <NetworkTrainer />
    </WidgetSlot>
  );
}

export function SharpnessExplorerWidget() {
  return (
    <WidgetSlot>
      <SharpnessExplorer />
    </WidgetSlot>
  );
}

export function SigmoidExplorerWidget() {
  return (
    <WidgetSlot>
      <SigmoidExplorer />
    </WidgetSlot>
  );
}

export function SigmoidZoomWidget() {
  return (
    <WidgetSlot>
      <SigmoidZoom />
    </WidgetSlot>
  );
}

export function LogicGatePlaygroundWidget() {
  return (
    <WidgetSlot>
      <LogicGatePlayground />
    </WidgetSlot>
  );
}

export function TwoNeuronXORWidget() {
  return (
    <WidgetSlot>
      <TwoNeuronXOR />
    </WidgetSlot>
  );
}

export function GateCircuitDiagramWidget() {
  return (
    <WidgetSlot>
      <GateCircuitDiagram />
    </WidgetSlot>
  );
}

export function DeepNetworkPlaygroundWidget() {
  return (
    <WidgetSlot>
      <DeepNetworkPlayground />
    </WidgetSlot>
  );
}
