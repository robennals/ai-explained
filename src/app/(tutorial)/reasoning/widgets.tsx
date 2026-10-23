"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const ThinkFirst = dynamic(
  () =>
    import("@/components/widgets/reasoning/ThinkFirst").then(
      (m) => m.ThinkFirst
    ),
  { ssr: false }
);

const TraceSampling = dynamic(
  () =>
    import("@/components/widgets/reasoning/TraceSampling").then(
      (m) => m.TraceSampling
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

export function ThinkFirstWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ThinkFirst />
    </WidgetSlot>
  );
}

export function TraceSamplingWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TraceSampling />
    </WidgetSlot>
  );
}
