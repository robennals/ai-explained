"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const WhyAttentionMatters = dynamic(
  () => import("@/components/widgets/attention/WhyAttentionMatters").then((m) => m.WhyAttentionMatters),
  { ssr: false }
);

const ToyAttentionScores = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionScores").then((m) => m.ToyAttentionScores),
  { ssr: false }
);

const SoftmaxExplorer = dynamic(
  () => import("@/components/widgets/attention/SoftmaxExplorer").then((m) => m.SoftmaxExplorer),
  { ssr: false }
);

const ToyAttentionSoftmax = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionSoftmax").then((m) => m.ToyAttentionSoftmax),
  { ssr: false }
);

const ToyAttentionValues = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionValues").then((m) => m.ToyAttentionValues),
  { ssr: false }
);

const ToyAttentionSink = dynamic(
  () => import("@/components/widgets/attention/ToyAttentionSink").then((m) => m.ToyAttentionSink),
  { ssr: false }
);

const LiveAttention = dynamic(
  () => import("@/components/widgets/attention/LiveAttention").then((m) => m.LiveAttention),
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

export function ToyAttentionScoresWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionScores />
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

export function ToyAttentionSoftmaxWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionSoftmax />
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

export function ToyAttentionSinkWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyAttentionSink />
    </WidgetSlot>
  );
}


export function LiveAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <LiveAttention />
    </WidgetSlot>
  );
}
