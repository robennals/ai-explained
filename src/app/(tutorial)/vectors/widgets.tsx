"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const VectorExamples = dynamic(
  () =>
    import("@/components/widgets/vectors/VectorExamples").then(
      (m) => m.VectorExamples
    ),
  { ssr: false }
);

const AnimalPropertyExplorer = dynamic(
  () =>
    import("@/components/widgets/vectors/AnimalPropertyExplorer").then(
      (m) => m.AnimalPropertyExplorer
    ),
  { ssr: false }
);

const Vector1DExplorer = dynamic(
  () =>
    import("@/components/widgets/vectors/Vector1DExplorer").then(
      (m) => m.Vector1DExplorer
    ),
  { ssr: false }
);

const Vector2DExplorer = dynamic(
  () =>
    import("@/components/widgets/vectors/Vector2DExplorer").then(
      (m) => m.Vector2DExplorer
    ),
  { ssr: false }
);

const Vector3DExplorer = dynamic(
  () =>
    import("@/components/widgets/vectors/Vector3DExplorer").then(
      (m) => m.Vector3DExplorer
    ),
  { ssr: false }
);

const AnimalDirectionMagnitude = dynamic(
  () =>
    import("@/components/widgets/vectors/AnimalDirectionMagnitude").then(
      (m) => m.AnimalDirectionMagnitude
    ),
  { ssr: false }
);


const DotProductTypes = dynamic(
  () =>
    import("@/components/widgets/vectors/DotProductTypes").then(
      (m) => m.DotProductTypes
    ),
  { ssr: false }
);

const DotProductAnalogies = dynamic(
  () =>
    import("@/components/widgets/vectors/DotProductAnalogies").then(
      (m) => m.DotProductAnalogies
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

export function VectorExamplesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <VectorExamples />
    </WidgetSlot>
  );
}

export function AnimalPropertyExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <AnimalPropertyExplorer />
    </WidgetSlot>
  );
}

export function Vector1DExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Vector1DExplorer />
    </WidgetSlot>
  );
}

export function Vector2DExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Vector2DExplorer />
    </WidgetSlot>
  );
}

export function Vector3DExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Vector3DExplorer />
    </WidgetSlot>
  );
}

export function AnimalDirectionMagnitudeWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <AnimalDirectionMagnitude />
    </WidgetSlot>
  );
}


export function DotProductTypesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DotProductTypes />
    </WidgetSlot>
  );
}

export function DotProductAnalogiesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <DotProductAnalogies />
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

