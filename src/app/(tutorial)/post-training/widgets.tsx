"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const RawCompletion = dynamic(
  () =>
    import("@/components/widgets/post-training/RawCompletion").then(
      (m) => m.RawCompletion
    ),
  { ssr: false }
);

const PromptsAndCompletions = dynamic(
  () =>
    import("@/components/widgets/post-training/PromptsAndCompletions").then(
      (m) => m.PromptsAndCompletions
    ),
  { ssr: false }
);

const TrainingSignal = dynamic(
  () =>
    import("@/components/widgets/post-training/TrainingSignal").then(
      (m) => m.TrainingSignal
    ),
  { ssr: false }
);

function WidgetSlot({
  children,
  tryIt,
  label,
}: {
  children: React.ReactNode;
  tryIt?: React.ReactNode;
  label?: string;
}) {
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

export function RawCompletionWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <RawCompletion />
    </WidgetSlot>
  );
}

export function PromptsAndCompletionsWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <PromptsAndCompletions />
    </WidgetSlot>
  );
}

export function TrainingSignalWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TrainingSignal />
    </WidgetSlot>
  );
}
