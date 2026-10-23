"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const TranscriptViews = dynamic(
  () =>
    import("@/components/widgets/conversations/TranscriptViews").then(
      (m) => m.TranscriptViews
    ),
  { ssr: false }
);

const RepeatedTurns = dynamic(
  () =>
    import("@/components/widgets/conversations/RepeatedTurns").then(
      (m) => m.RepeatedTurns
    ),
  { ssr: false }
);

const SystemPromptView = dynamic(
  () =>
    import("@/components/widgets/conversations/SystemPromptView").then(
      (m) => m.SystemPromptView
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

export function SystemPromptViewWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <SystemPromptView />
    </WidgetSlot>
  );
}
