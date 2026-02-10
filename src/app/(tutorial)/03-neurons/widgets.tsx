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

const CoordinateDescentTrap = dynamic(
  () =>
    import("@/components/widgets/neurons/CoordinateDescentTrap").then(
      (m) => m.CoordinateDescentTrap
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

export function CoordinateDescentTrapWidget() {
  return (
    <WidgetSlot>
      <CoordinateDescentTrap />
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
