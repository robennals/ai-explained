"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const ScalePlaygroundImpl = dynamic(
  () => import("@/components/widgets/real-ai/ScalePlayground").then((m) => m.ScalePlayground),
  { ssr: false }
);

const MachinePlaygroundImpl = dynamic(
  () => import("@/components/widgets/real-ai/MachinePlayground").then((m) => m.MachinePlayground),
  { ssr: false }
);

const BenchmarksPlaygroundImpl = dynamic(
  () => import("@/components/widgets/real-ai/BenchmarksPlayground").then((m) => m.BenchmarksPlayground),
  { ssr: false }
);

const EfficiencyPlaygroundImpl = dynamic(
  () => import("@/components/widgets/real-ai/EfficiencyPlayground").then((m) => m.EfficiencyPlayground),
  { ssr: false }
);

const AlignmentPlaygroundImpl = dynamic(
  () => import("@/components/widgets/real-ai/AlignmentPlayground").then((m) => m.AlignmentPlayground),
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

export function ScalePlayground({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ScalePlaygroundImpl />
    </WidgetSlot>
  );
}

export function MachinePlayground({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <MachinePlaygroundImpl />
    </WidgetSlot>
  );
}

export function BenchmarksPlayground({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <BenchmarksPlaygroundImpl />
    </WidgetSlot>
  );
}

export function EfficiencyPlayground({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <EfficiencyPlaygroundImpl />
    </WidgetSlot>
  );
}

export function AlignmentPlayground({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <AlignmentPlaygroundImpl />
    </WidgetSlot>
  );
}
