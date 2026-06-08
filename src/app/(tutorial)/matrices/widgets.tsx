"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const DetectorStack = dynamic(
  () =>
    import("@/components/widgets/matrices/DetectorStack").then(
      (m) => m.DetectorStack
    ),
  { ssr: false }
);

const MatrixGrid = dynamic(
  () =>
    import("@/components/widgets/matrices/MatrixGrid").then(
      (m) => m.MatrixGrid
    ),
  { ssr: false }
);

const MatrixComposition = dynamic(
  () =>
    import("@/components/widgets/matrices/MatrixComposition").then(
      (m) => m.MatrixComposition
    ),
  { ssr: false }
);

const Transform2D3D = dynamic(
  () =>
    import("@/components/widgets/matrices/Transform2D3D").then(
      (m) => m.Transform2D3D
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

export function DetectorStackWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DetectorStack />
    </WidgetSlot>
  );
}

export function LayerDetectorWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <DetectorStack showActivation />
    </WidgetSlot>
  );
}

export function RoundTripWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <DetectorStack mode="round-trip" />
    </WidgetSlot>
  );
}

export function MatrixGridWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <MatrixGrid />
    </WidgetSlot>
  );
}

export function MatrixCompositionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <MatrixComposition />
    </WidgetSlot>
  );
}

export function AttentionMatmulWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DetectorStack mode="attention" />
    </WidgetSlot>
  );
}

export function Transform2D3DWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Transform2D3D />
    </WidgetSlot>
  );
}
