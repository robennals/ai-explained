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

const CombinedNumberLine = dynamic(
  () =>
    import("@/components/widgets/embeddings/CombinedNumberLine").then(
      (m) => m.CombinedNumberLine
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

const WordPairSpectrum = dynamic(
  () =>
    import("@/components/widgets/embeddings/WordPairSpectrum").then(
      (m) => m.WordPairSpectrum
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

const EmbeddingClassifier = dynamic(
  () =>
    import("@/components/widgets/embeddings/EmbeddingClassifier").then(
      (m) => m.EmbeddingClassifier
    ),
  { ssr: false }
);

const TokenizationPlayground = dynamic(
  () =>
    import("@/components/widgets/embeddings/TokenizationPlayground").then(
      (m) => m.TokenizationPlayground
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

export function CombinedNumberLineWidget() {
  return (
    <WidgetSlot>
      <CombinedNumberLine />
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

export function WordPairSpectrumWidget() {
  return (
    <WidgetSlot>
      <WordPairSpectrum />
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

export function EmbeddingClassifierWidget() {
  return (
    <WidgetSlot>
      <EmbeddingClassifier />
    </WidgetSlot>
  );
}

export function TokenizationPlaygroundWidget() {
  return (
    <WidgetSlot>
      <TokenizationPlayground />
    </WidgetSlot>
  );
}
