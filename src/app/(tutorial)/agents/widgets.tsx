"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const ToolLoop = dynamic(
  () => import("@/components/widgets/agents/ToolLoop").then((m) => m.ToolLoop),
  { ssr: false }
);

const SkillLoop = dynamic(
  () =>
    import("@/components/widgets/agents/SkillLoop").then((m) => m.SkillLoop),
  { ssr: false }
);

const MemoryLoop = dynamic(
  () =>
    import("@/components/widgets/agents/MemoryLoop").then((m) => m.MemoryLoop),
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

export function ToolLoopWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToolLoop />
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

export function MemoryLoopWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <MemoryLoop />
    </WidgetSlot>
  );
}
