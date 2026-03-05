"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const RotationPosition = dynamic(
  () =>
    import("@/components/widgets/attention/RotationPosition").then(
      (m) => m.RotationPosition
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

const BertAttention = dynamic(
  () =>
    import("@/components/widgets/attention/BertAttention").then(
      (m) => m.BertAttention
    ),
  { ssr: false }
);

const ALiBiToyTokens = dynamic(
  () =>
    import("@/components/widgets/positions/ALiBiToyTokens").then(
      (m) => m.ALiBiToyTokens
    ),
  { ssr: false }
);

const RotationToyTokens = dynamic(
  () =>
    import("@/components/widgets/positions/RotationToyTokens").then(
      (m) => m.RotationToyTokens
    ),
  { ssr: false }
);

const RoPEDistanceSensitivity = dynamic(
  () =>
    import("@/components/widgets/positions/RoPEDistanceSensitivity").then(
      (m) => m.RoPEDistanceSensitivity
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

export function RotationPositionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <RotationPosition />
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

export function ALiBiToyTokensWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ALiBiToyTokens />
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

export function RotationToyTokensWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <RotationToyTokens />
    </WidgetSlot>
  );
}

export function RoPEDistanceSensitivityWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <RoPEDistanceSensitivity />
    </WidgetSlot>
  );
}
