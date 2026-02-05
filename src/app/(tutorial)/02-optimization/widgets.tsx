"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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

export function OptimizationGameWidget() {
  return (
    <WidgetSlot>
      <OptimizationGame />
    </WidgetSlot>
  );
}

export function SmoothVsRuggedWidget() {
  return (
    <WidgetSlot>
      <SmoothVsRugged />
    </WidgetSlot>
  );
}

export function ModelComparisonWidget() {
  return (
    <WidgetSlot>
      <ModelComparison />
    </WidgetSlot>
  );
}

export function GradientVisualizationWidget() {
  return (
    <WidgetSlot>
      <GradientVisualization />
    </WidgetSlot>
  );
}
