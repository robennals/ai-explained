"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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

export function NextWordGameWidget() {
  return (
    <WidgetSlot>
      <NextWordGame />
    </WidgetSlot>
  );
}

export function BigramExplorerWidget() {
  return (
    <WidgetSlot>
      <BigramExplorer />
    </WidgetSlot>
  );
}

export function NgramExplosionWidget() {
  return (
    <WidgetSlot>
      <NgramExplosion />
    </WidgetSlot>
  );
}

export function SimpleNNPredictorWidget() {
  return (
    <WidgetSlot>
      <SimpleNNPredictor />
    </WidgetSlot>
  );
}
