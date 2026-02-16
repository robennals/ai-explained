"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const WhyAttentionMatters = dynamic(
  () =>
    import("@/components/widgets/attention/WhyAttentionMatters").then(
      (m) => m.WhyAttentionMatters
    ),
  { ssr: false }
);

const ToyVocabTable = dynamic(
  () =>
    import("@/components/widgets/attention/ToyVocabTable").then(
      (m) => m.ToyVocabTable
    ),
  { ssr: false }
);

const SoftmaxExplorer = dynamic(
  () =>
    import("@/components/widgets/attention/SoftmaxExplorer").then(
      (m) => m.SoftmaxExplorer
    ),
  { ssr: false }
);

const ToyAttention = dynamic(
  () =>
    import("@/components/widgets/attention/ToyAttention").then(
      (m) => m.ToyAttention
    ),
  { ssr: false }
);

const ToyValues = dynamic(
  () =>
    import("@/components/widgets/attention/ToyValues").then(
      (m) => m.ToyValues
    ),
  { ssr: false }
);

const AttentionPlayground = dynamic(
  () =>
    import("@/components/widgets/attention/AttentionPlayground").then(
      (m) => m.AttentionPlayground
    ),
  { ssr: false }
);

const BertAttention = dynamic(
  () =>
    import("@/components/widgets/attention/BertAttention").then(
      (m) => m.BertAttention
    ),
  { ssr: false }
);

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

const PositionApproaches = dynamic(
  () =>
    import("@/components/widgets/attention/PositionApproaches").then(
      (m) => m.PositionApproaches
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

export function WhyAttentionMattersWidget() {
  return (
    <WidgetSlot>
      <WhyAttentionMatters />
    </WidgetSlot>
  );
}

export function ToyVocabTableWidget() {
  return (
    <WidgetSlot>
      <ToyVocabTable />
    </WidgetSlot>
  );
}

export function SoftmaxExplorerWidget() {
  return (
    <WidgetSlot>
      <SoftmaxExplorer />
    </WidgetSlot>
  );
}

export function ToyAttentionWidget() {
  return (
    <WidgetSlot>
      <ToyAttention />
    </WidgetSlot>
  );
}

export function ToyValuesWidget() {
  return (
    <WidgetSlot>
      <ToyValues />
    </WidgetSlot>
  );
}

export function AttentionPlaygroundWidget() {
  return (
    <WidgetSlot>
      <AttentionPlayground />
    </WidgetSlot>
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

export function BertAttentionWidget() {
  return (
    <WidgetSlot>
      <BertAttention />
    </WidgetSlot>
  );
}

export function PositionApproachesWidget() {
  return (
    <WidgetSlot>
      <PositionApproaches />
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
