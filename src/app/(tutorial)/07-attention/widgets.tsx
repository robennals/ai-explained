"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const PatternAttention = dynamic(
  () =>
    import("@/components/widgets/attention/PatternAttention").then(
      (m) => m.PatternAttention
    ),
  { ssr: false }
);

const AttentionStepThrough = dynamic(
  () =>
    import("@/components/widgets/attention/AttentionStepThrough").then(
      (m) => m.AttentionStepThrough
    ),
  { ssr: false }
);

const MultiHead = dynamic(
  () =>
    import("@/components/widgets/attention/MultiHead").then(
      (m) => m.MultiHead
    ),
  { ssr: false }
);

const PositionScramble = dynamic(
  () =>
    import("@/components/widgets/attention/PositionScramble").then(
      (m) => m.PositionScramble
    ),
  { ssr: false }
);

const RotationPosition = dynamic(
  () =>
    import("@/components/widgets/attention/RotationPosition").then(
      (m) => m.RotationPosition
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

export function PatternAttentionWidget() {
  return (
    <WidgetSlot>
      <PatternAttention />
    </WidgetSlot>
  );
}

export function AttentionStepThroughWidget() {
  return (
    <WidgetSlot>
      <AttentionStepThrough />
    </WidgetSlot>
  );
}

export function MultiHeadWidget() {
  return (
    <WidgetSlot>
      <MultiHead />
    </WidgetSlot>
  );
}

export function PositionScrambleWidget() {
  return (
    <WidgetSlot>
      <PositionScramble />
    </WidgetSlot>
  );
}

export function RotationPositionWidget() {
  return (
    <WidgetSlot>
      <RotationPosition />
    </WidgetSlot>
  );
}
