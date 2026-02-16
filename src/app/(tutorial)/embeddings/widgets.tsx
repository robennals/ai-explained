"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

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

export function WordNumberLineWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <WordNumberLine />
    </WidgetSlot>
  );
}

export function CombinedNumberLineWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <CombinedNumberLine />
    </WidgetSlot>
  );
}

export function Simple2DScatterWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <Simple2DScatter />
    </WidgetSlot>
  );
}

export function EmbeddingPlaygroundWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <EmbeddingPlayground />
    </WidgetSlot>
  );
}

export function WordPairSpectrumWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <WordPairSpectrum />
    </WidgetSlot>
  );
}

export function EmbeddingLayerDiagramWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <EmbeddingLayerDiagram />
    </WidgetSlot>
  );
}

export function EmbeddingClassifierWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <EmbeddingClassifier />
    </WidgetSlot>
  );
}

export function TokenizationPlaygroundWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TokenizationPlayground />
    </WidgetSlot>
  );
}
