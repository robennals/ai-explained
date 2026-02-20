"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const VectorPropertyExplorer = dynamic(
  () =>
    import("@/components/widgets/vectors/VectorPropertyExplorer").then(
      (m) => m.VectorPropertyExplorer
    ),
  { ssr: false }
);


const DotProduct2D = dynamic(
  () =>
    import("@/components/widgets/vectors/DotProduct2D").then(
      (m) => m.DotProduct2D
    ),
  { ssr: false }
);

const DotProductComparison = dynamic(
  () =>
    import("@/components/widgets/vectors/DotProductComparison").then(
      (m) => m.DotProductComparison
    ),
  { ssr: false }
);

const NeuronDotProduct = dynamic(
  () =>
    import("@/components/widgets/vectors/NeuronDotProduct").then(
      (m) => m.NeuronDotProduct
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

export function VectorPropertyExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <VectorPropertyExplorer />
    </WidgetSlot>
  );
}


export function DotProduct2DWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DotProduct2D />
    </WidgetSlot>
  );
}

export function DotProductComparisonWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DotProductComparison />
    </WidgetSlot>
  );
}

export function NeuronDotProductWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NeuronDotProduct />
    </WidgetSlot>
  );
}

