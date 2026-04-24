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

const CausalMask = dynamic(
  () =>
    import("@/components/widgets/transformers/CausalMask").then(
      (m) => m.CausalMask
    ),
  { ssr: false }
);

const ResidualConnection = dynamic(
  () =>
    import("@/components/widgets/transformers/ResidualConnection").then(
      (m) => m.ResidualConnection
    ),
  { ssr: false }
);

const LayerNorm = dynamic(
  () =>
    import("@/components/widgets/transformers/LayerNorm").then(
      (m) => m.LayerNorm
    ),
  { ssr: false }
);

const MicroTransformer = dynamic(
  () =>
    import("@/components/widgets/transformers/MicroTransformer").then(
      (m) => m.MicroTransformer
    ),
  { ssr: false }
);

const DepthComparison = dynamic(
  () =>
    import("@/components/widgets/transformers/DepthComparison").then(
      (m) => m.DepthComparison
    ),
  { ssr: false }
);

const LiveTransformer = dynamic(
  () =>
    import("@/components/widgets/transformers/LiveTransformer").then(
      (m) => m.LiveTransformer
    ),
  { ssr: false }
);

const TransformerXRay = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerXRay").then(
      (m) => m.TransformerXRay
    ),
  { ssr: false }
);

const PrefixAttention = dynamic(
  () =>
    import("@/components/widgets/transformers/PrefixAttention").then(
      (m) => m.PrefixAttention
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

const VectorSubspaceFig = dynamic(
  () =>
    import("@/components/widgets/transformers/TransformerInAction").then(
      (m) => m.VectorSubspaceFig
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

export function CausalMaskWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <CausalMask />
    </WidgetSlot>
  );
}

export function ResidualConnectionWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <ResidualConnection />
    </WidgetSlot>
  );
}

export function LayerNormWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <LayerNorm />
    </WidgetSlot>
  );
}

export function MicroTransformerWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <MicroTransformer />
    </WidgetSlot>
  );
}

export function DepthComparisonWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Compare">
      <DepthComparison />
    </WidgetSlot>
  );
}

export function LiveTransformerWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <LiveTransformer />
    </WidgetSlot>
  );
}

export function TransformerXRayWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <TransformerXRay />
    </WidgetSlot>
  );
}

export function PrefixAttentionWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <PrefixAttention />
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

export function VectorSubspaceFigWidget() {
  return (
    <Suspense fallback={<div className="my-6 h-40 animate-pulse rounded bg-foreground/[0.03]" />}>
      <VectorSubspaceFig />
    </Suspense>
  );
}
