"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const RawCompletion = dynamic(
  () =>
    import("@/components/widgets/chat/RawCompletion").then(
      (m) => m.RawCompletion
    ),
  { ssr: false }
);

const TrainingSignal = dynamic(
  () =>
    import("@/components/widgets/chat/TrainingSignal").then(
      (m) => m.TrainingSignal
    ),
  { ssr: false }
);

const RepeatedTurns = dynamic(
  () =>
    import("@/components/widgets/chat/RepeatedTurns").then(
      (m) => m.RepeatedTurns
    ),
  { ssr: false }
);

const TranscriptViews = dynamic(
  () =>
    import("@/components/widgets/chat/TranscriptViews").then(
      (m) => m.TranscriptViews
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

export function RepeatedTurnsWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <RepeatedTurns />
    </WidgetSlot>
  );
}

export function TranscriptViewsWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TranscriptViews />
    </WidgetSlot>
  );
}
