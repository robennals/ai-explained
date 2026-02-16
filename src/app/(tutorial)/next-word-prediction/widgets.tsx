"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const NextWordGame = dynamic(
  () =>
    import("@/components/widgets/next-word-prediction/NextWordGame").then(
      (m) => m.NextWordGame
    ),
  { ssr: false }
);

const BigramExplorer = dynamic(
  () =>
    import("@/components/widgets/next-word-prediction/BigramExplorer").then(
      (m) => m.BigramExplorer
    ),
  { ssr: false }
);

const NgramExplosion = dynamic(
  () =>
    import("@/components/widgets/next-word-prediction/NgramExplosion").then(
      (m) => m.NgramExplosion
    ),
  { ssr: false }
);

const SimpleNNPredictor = dynamic(
  () =>
    import("@/components/widgets/next-word-prediction/SimpleNNPredictor").then(
      (m) => m.SimpleNNPredictor
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

export function NextWordGameWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NextWordGame />
    </WidgetSlot>
  );
}

export function BigramExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <BigramExplorer />
    </WidgetSlot>
  );
}

export function NgramExplosionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <NgramExplosion />
    </WidgetSlot>
  );
}

export function SimpleNNPredictorWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <SimpleNNPredictor />
    </WidgetSlot>
  );
}
