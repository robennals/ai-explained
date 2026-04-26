"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const TransformerBlockDiagram = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerBlockDiagram").then(
      (m) => m.TransformerBlockDiagram
    ),
  { ssr: false }
);

const TransformerInAction = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerInAction").then(
      (m) => m.TransformerInAction
    ),
  { ssr: false }
);

const TransformerOverview = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerOverview").then(
      (m) => m.TransformerOverview
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

export function TransformerBlockDiagramWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TransformerBlockDiagram />
    </WidgetSlot>
  );
}

export function TransformerInActionWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TransformerInAction />
    </WidgetSlot>
  );
}

export function TransformerOverviewWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TransformerOverview />
    </WidgetSlot>
  );
}

