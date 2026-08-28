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

const ThinkFirst = dynamic(
  () => import("@/components/widgets/chat/ThinkFirst").then((m) => m.ThinkFirst),
  { ssr: false }
);

const MemoryLoop = dynamic(
  () =>
    import("@/components/widgets/chat/MemoryLoop").then((m) => m.MemoryLoop),
  { ssr: false }
);

const SkillLoop = dynamic(
  () => import("@/components/widgets/chat/SkillLoop").then((m) => m.SkillLoop),
  { ssr: false }
);

const ToolLoop = dynamic(
  () => import("@/components/widgets/chat/ToolLoop").then((m) => m.ToolLoop),
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

export function ThinkFirstWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ThinkFirst />
    </WidgetSlot>
  );
}

export function MemoryLoopWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <MemoryLoop />
    </WidgetSlot>
  );
}

export function SkillLoopWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <SkillLoop />
    </WidgetSlot>
  );
}

export function ToolLoopWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToolLoop />
    </WidgetSlot>
  );
}
