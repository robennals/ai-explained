"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

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

const ToyAttentionValues = dynamic(
  () =>
    import("@/components/widgets/attention/ToyAttentionValues").then(
      (m) => m.ToyAttentionValues
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

const ToyValueTable = dynamic(
  () =>
    import("@/components/widgets/attention/ToyValueTable").then(
      (m) => m.ToyValueTable
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

const RoPEToyTokens = dynamic(
  () =>
    import("@/components/widgets/attention/RoPEToyTokens").then(
      (m) => m.RoPEToyTokens
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

export function WhyAttentionMattersWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <WhyAttentionMatters />
    </WidgetSlot>
  );
}

export function ToyVocabTableWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ToyVocabTable />
    </WidgetSlot>
  );
}

export function SoftmaxExplorerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <SoftmaxExplorer />
    </WidgetSlot>
  );
}

export function ToyAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttention />
    </WidgetSlot>
  );
}

export function ToyAttentionValuesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionValues />
    </WidgetSlot>
  );
}

export function ToyValuesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ToyValues />
    </WidgetSlot>
  );
}

export function ToyValueTableWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ToyValueTable />
    </WidgetSlot>
  );
}

export function AttentionPlaygroundWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <AttentionPlayground />
    </WidgetSlot>
  );
}

export function PatternAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <PatternAttention />
    </WidgetSlot>
  );
}

export function AttentionStepThroughWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <AttentionStepThrough />
    </WidgetSlot>
  );
}

export function MultiHeadWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <MultiHead />
    </WidgetSlot>
  );
}

export function BertAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <BertAttention />
    </WidgetSlot>
  );
}

export function BertAttentionNoPositionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <BertAttention excludeHeads={["Next word", "Previous word", "Broad context"]} onlySentencesWithWord="it" />
    </WidgetSlot>
  );
}

export function RoPEToyTokensWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <RoPEToyTokens />
    </WidgetSlot>
  );
}

export function RotationPositionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <RotationPosition />
    </WidgetSlot>
  );
}
