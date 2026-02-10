"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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

export function Transform1DWidget() {
  return (
    <WidgetSlot>
      <Transform1D />
    </WidgetSlot>
  );
}

export function Transform2DWidget() {
  return (
    <WidgetSlot>
      <Transform2D />
    </WidgetSlot>
  );
}

export function BasisVectorViewWidget() {
  return (
    <WidgetSlot>
      <BasisVectorView />
    </WidgetSlot>
  );
}

export function DimensionProjectionWidget() {
  return (
    <WidgetSlot>
      <DimensionProjection />
    </WidgetSlot>
  );
}

export function NeuronVsMatrixWidget() {
  return (
    <WidgetSlot>
      <NeuronVsMatrix />
    </WidgetSlot>
  );
}
