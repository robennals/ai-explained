"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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

function WidgetSlot({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="my-8 flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted">
          Loading widget...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function ToyTransformerWidget() {
  return (
    <WidgetSlot>
      <ToyTransformer />
    </WidgetSlot>
  );
}

export function StoryTransformerWidget() {
  return (
    <WidgetSlot>
      <StoryTransformer />
    </WidgetSlot>
  );
}

export function StoryGeneratorWidget() {
  return (
    <WidgetSlot>
      <StoryGenerator />
    </WidgetSlot>
  );
}
