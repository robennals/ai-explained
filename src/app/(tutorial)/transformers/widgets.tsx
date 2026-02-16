"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const ToyTransformer = dynamic(
  () =>
    import("@/components/widgets/transformers/ToyTransformer").then(
      (m) => m.ToyTransformer
    ),
  { ssr: false }
);

const StoryTransformer = dynamic(
  () =>
    import("@/components/widgets/transformers/StoryTransformer").then(
      (m) => m.StoryTransformer
    ),
  { ssr: false }
);

const StoryGenerator = dynamic(
  () =>
    import("@/components/widgets/transformers/StoryGenerator").then(
      (m) => m.StoryGenerator
    ),
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

export function ToyTransformerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <ToyTransformer />
    </WidgetSlot>
  );
}

export function StoryTransformerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <StoryTransformer />
    </WidgetSlot>
  );
}

export function StoryGeneratorWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <StoryGenerator />
    </WidgetSlot>
  );
}
