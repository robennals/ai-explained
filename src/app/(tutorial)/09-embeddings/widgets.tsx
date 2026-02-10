"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const WordNumberLine = dynamic(
  () =>
    import("@/components/widgets/embeddings/WordNumberLine").then(
      (m) => m.WordNumberLine
    ),
  { ssr: false }
);

const Simple2DScatter = dynamic(
  () =>
    import("@/components/widgets/embeddings/Simple2DScatter").then(
      (m) => m.Simple2DScatter
    ),
  { ssr: false }
);

const EmbeddingPlayground = dynamic(
  () =>
    import("@/components/widgets/embeddings/EmbeddingPlayground").then(
      (m) => m.EmbeddingPlayground
    ),
  { ssr: false }
);

const CustomAxisScatter = dynamic(
  () =>
    import("@/components/widgets/embeddings/CustomAxisScatter").then(
      (m) => m.CustomAxisScatter
    ),
  { ssr: false }
);

const EmbeddingLayerDiagram = dynamic(
  () =>
    import("@/components/widgets/embeddings/EmbeddingLayerDiagram").then(
      (m) => m.EmbeddingLayerDiagram
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

export function WordNumberLineWidget() {
  return (
    <WidgetSlot>
      <WordNumberLine />
    </WidgetSlot>
  );
}

export function Simple2DScatterWidget() {
  return (
    <WidgetSlot>
      <Simple2DScatter />
    </WidgetSlot>
  );
}

export function EmbeddingPlaygroundWidget() {
  return (
    <WidgetSlot>
      <EmbeddingPlayground />
    </WidgetSlot>
  );
}

export function CustomAxisScatterWidget() {
  return (
    <WidgetSlot>
      <CustomAxisScatter />
    </WidgetSlot>
  );
}

export function EmbeddingLayerDiagramWidget() {
  return (
    <WidgetSlot>
      <EmbeddingLayerDiagram />
    </WidgetSlot>
  );
}
