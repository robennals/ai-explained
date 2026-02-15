"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LossFunctionComparison = dynamic(
  () =>
    import("@/components/widgets/training/LossFunctionComparison").then(
      (m) => m.LossFunctionComparison
    ),
  { ssr: false }
);

const GradientDescentVisualizer = dynamic(
  () =>
    import("@/components/widgets/training/GradientDescentVisualizer").then(
      (m) => m.GradientDescentVisualizer
    ),
  { ssr: false }
);

const OverfittingPlayground = dynamic(
  () =>
    import("@/components/widgets/training/OverfittingPlayground").then(
      (m) => m.OverfittingPlayground
    ),
  { ssr: false }
);

const RegularizationSlider = dynamic(
  () =>
    import("@/components/widgets/training/RegularizationSlider").then(
      (m) => m.RegularizationSlider
    ),
  { ssr: false }
);

const DropoutVisualizer = dynamic(
  () =>
    import("@/components/widgets/training/DropoutVisualizer").then(
      (m) => m.DropoutVisualizer
    ),
  { ssr: false }
);

const SaddlePointIllusion = dynamic(
  () =>
    import("@/components/widgets/training/SaddlePointIllusion").then(
      (m) => m.SaddlePointIllusion
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

export function LossFunctionComparisonWidget() {
  return (
    <WidgetSlot>
      <LossFunctionComparison />
    </WidgetSlot>
  );
}

export function GradientDescentVisualizerWidget() {
  return (
    <WidgetSlot>
      <GradientDescentVisualizer />
    </WidgetSlot>
  );
}

export function OverfittingPlaygroundWidget() {
  return (
    <WidgetSlot>
      <OverfittingPlayground />
    </WidgetSlot>
  );
}

export function RegularizationSliderWidget() {
  return (
    <WidgetSlot>
      <RegularizationSlider />
    </WidgetSlot>
  );
}

export function DropoutVisualizerWidget() {
  return (
    <WidgetSlot>
      <DropoutVisualizer />
    </WidgetSlot>
  );
}

export function SaddlePointIllusionWidget() {
  return (
    <WidgetSlot>
      <SaddlePointIllusion />
    </WidgetSlot>
  );
}
