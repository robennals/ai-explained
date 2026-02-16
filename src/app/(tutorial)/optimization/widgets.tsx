"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const OptimizationGame = dynamic(
  () =>
    import("@/components/widgets/optimization/OptimizationGame").then(
      (m) => m.OptimizationGame
    ),
  { ssr: false }
);

const SmoothVsRugged = dynamic(
  () =>
    import("@/components/widgets/optimization/SmoothVsRugged").then(
      (m) => m.SmoothVsRugged
    ),
  { ssr: false }
);

const ModelComparison = dynamic(
  () =>
    import("@/components/widgets/optimization/ModelComparison").then(
      (m) => m.ModelComparison
    ),
  { ssr: false }
);

const GradientVisualization = dynamic(
  () =>
    import("@/components/widgets/optimization/GradientVisualization").then(
      (m) => m.GradientVisualization
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

export function OptimizationGameWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <OptimizationGame />
    </WidgetSlot>
  );
}

export function SmoothVsRuggedWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <SmoothVsRugged />
    </WidgetSlot>
  );
}

export function ModelComparisonWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ModelComparison />
    </WidgetSlot>
  );
}

export function GradientVisualizationWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <GradientVisualization />
    </WidgetSlot>
  );
}
