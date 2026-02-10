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

const NeuronPlayground = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuronPlayground").then(
      (m) => m.NeuronPlayground
    ),
  { ssr: false }
);

const DecisionBoundaryExplorer = dynamic(
  () =>
    import("@/components/widgets/neurons/DecisionBoundaryExplorer").then(
      (m) => m.DecisionBoundaryExplorer
    ),
  { ssr: false }
);

const XORBreakthrough = dynamic(
  () =>
    import("@/components/widgets/neurons/XORBreakthrough").then(
      (m) => m.XORBreakthrough
    ),
  { ssr: false }
);

const LinearCollapseDemo = dynamic(
  () =>
    import("@/components/widgets/neurons/LinearCollapseDemo").then(
      (m) => m.LinearCollapseDemo
    ),
  { ssr: false }
);

const NeuralNetworkTrainer = dynamic(
  () =>
    import("@/components/widgets/neurons/NeuralNetworkTrainer").then(
      (m) => m.NeuralNetworkTrainer
    ),
  { ssr: false }
);

const ActivationFunctionExplorer = dynamic(
  () =>
    import("@/components/widgets/neurons/ActivationFunctionExplorer").then(
      (m) => m.ActivationFunctionExplorer
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

export function NeuronPlaygroundWidget() {
  return (
    <WidgetSlot>
      <NeuronPlayground />
    </WidgetSlot>
  );
}

export function DecisionBoundaryExplorerWidget() {
  return (
    <WidgetSlot>
      <DecisionBoundaryExplorer />
    </WidgetSlot>
  );
}

export function XORBreakthroughWidget() {
  return (
    <WidgetSlot>
      <XORBreakthrough />
    </WidgetSlot>
  );
}

export function LinearCollapseDemoWidget() {
  return (
    <WidgetSlot>
      <LinearCollapseDemo />
    </WidgetSlot>
  );
}

export function NeuralNetworkTrainerWidget() {
  return (
    <WidgetSlot>
      <NeuralNetworkTrainer />
    </WidgetSlot>
  );
}

export function ActivationFunctionExplorerWidget() {
  return (
    <WidgetSlot>
      <ActivationFunctionExplorer />
    </WidgetSlot>
  );
}
