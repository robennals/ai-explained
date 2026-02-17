"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const Transform1D = dynamic(
  () =>
    import("@/components/widgets/matrices/Transform1D").then(
      (m) => m.Transform1D
    ),
  { ssr: false }
);

const Transform2D = dynamic(
  () =>
    import("@/components/widgets/matrices/Transform2D").then(
      (m) => m.Transform2D
    ),
  { ssr: false }
);

const BasisVectorView = dynamic(
  () =>
    import("@/components/widgets/matrices/BasisVectorView").then(
      (m) => m.BasisVectorView
    ),
  { ssr: false }
);

const DimensionProjection = dynamic(
  () =>
    import("@/components/widgets/matrices/DimensionProjection").then(
      (m) => m.DimensionProjection
    ),
  { ssr: false }
);

const NeuronVsMatrix = dynamic(
  () =>
    import("@/components/widgets/matrices/NeuronVsMatrix").then(
      (m) => m.NeuronVsMatrix
    ),
  { ssr: false }
);

const ActivationEffect = dynamic(
  () =>
    import("@/components/widgets/matrices/ActivationEffect").then(
      (m) => m.ActivationEffect
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

export function Transform1DWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Transform1D />
    </WidgetSlot>
  );
}

export function Transform2DWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Transform2D />
    </WidgetSlot>
  );
}

export function BasisVectorViewWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <BasisVectorView />
    </WidgetSlot>
  );
}

export function DimensionProjectionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DimensionProjection />
    </WidgetSlot>
  );
}

export function NeuronVsMatrixWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NeuronVsMatrix />
    </WidgetSlot>
  );
}

export function ActivationEffectWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ActivationEffect />
    </WidgetSlot>
  );
}
