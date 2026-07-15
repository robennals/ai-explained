"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const WhyAttentionMatters = dynamic(
  () => import("@/components/widgets/attention/WhyAttentionMatters").then((m) => m.WhyAttentionMatters),
  { ssr: false }
);

const SoftmaxExplorer = dynamic(
  () => import("@/components/widgets/attention/SoftmaxExplorer").then((m) => m.SoftmaxExplorer),
  { ssr: false }
);

const AttentionSink = dynamic(
  () => import("@/components/widgets/attention/AttentionSink").then((m) => m.AttentionSink),
  { ssr: false }
);

const AttentionValues = dynamic(
  () => import("@/components/widgets/attention/AttentionValues").then((m) => m.AttentionValues),
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

export function AnsweringQuestionsWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <WhyAttentionMatters mode="answering" />
    </WidgetSlot>
  );
}

export function MatchingQuestionsWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <WhyAttentionMatters mode="qkv" />
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

export function AttentionSinkWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <AttentionSink />
    </WidgetSlot>
  );
}

export function AttentionValuesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <AttentionValues />
    </WidgetSlot>
  );
}
