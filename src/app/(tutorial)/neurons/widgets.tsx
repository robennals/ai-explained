"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

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

function WidgetSlot({ children, tryIt, label }: { children: React.ReactNode; tryIt?: React.ReactNode; label?: string }) {
  return (
    <Suspense
      fallback={
        <div className="my-8 flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted">
          Loading widget...
        </div>
      }
    >
      <TryItProvider content={tryIt} label={label}>
        {children}
      </TryItProvider>
    </Suspense>
  );
}

export function NetworkOverviewWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NetworkOverview />
    </WidgetSlot>
  );
}

export function NeuronDiagramWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NeuronDiagram />
    </WidgetSlot>
  );
}

export function NeuronScaleComparisonWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NeuronScaleComparison />
    </WidgetSlot>
  );
}

export function NeuronPlaygroundWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NeuronPlayground />
    </WidgetSlot>
  );
}

export function NeuronGeometryWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NeuronGeometry />
    </WidgetSlot>
  );
}

export function TwoLayerPlaygroundWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <TwoLayerPlayground />
    </WidgetSlot>
  );
}

export function NetworkTrainerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NetworkTrainer />
    </WidgetSlot>
  );
}

export function SharpnessExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <SharpnessExplorer />
    </WidgetSlot>
  );
}

export function SigmoidExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <SigmoidExplorer />
    </WidgetSlot>
  );
}

export function SigmoidZoomWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <SigmoidZoom />
    </WidgetSlot>
  );
}
