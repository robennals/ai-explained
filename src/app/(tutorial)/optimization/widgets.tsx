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

const ErrorMeasurement = dynamic(
  () =>
    import("@/components/widgets/optimization/ErrorMeasurement").then(
      (m) => m.ErrorMeasurement
    ),
  { ssr: false }
);

const SmoothRealWorld = dynamic(
  () =>
    import("@/components/widgets/optimization/SmoothRealWorld").then(
      (m) => m.SmoothRealWorld
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

const GradientRealWorld = dynamic(
  () =>
    import("@/components/widgets/optimization/GradientRealWorld").then(
      (m) => m.GradientRealWorld
    ),
  { ssr: false }
);

const Gradient2DCurve = dynamic(
  () =>
    import("@/components/widgets/optimization/Gradient2DCurve").then(
      (m) => m.Gradient2DCurve
    ),
  { ssr: false }
);

const Gradient3DSurface = dynamic(
  () =>
    import("@/components/widgets/optimization/Gradient3DSurface").then(
      (m) => m.Gradient3DSurface
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

export function ErrorMeasurementWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ErrorMeasurement />
    </WidgetSlot>
  );
}

export function SmoothRealWorldWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <SmoothRealWorld />
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

export function GradientRealWorldWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <GradientRealWorld />
    </WidgetSlot>
  );
}

export function Gradient2DCurveWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Gradient2DCurve />
    </WidgetSlot>
  );
}

export function Gradient3DSurfaceWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Gradient3DSurface />
    </WidgetSlot>
  );
}
