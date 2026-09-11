"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const ClientServer = dynamic(
  () => import("@/components/widgets/context/ClientServerWidget").then((m) => m.ClientServer),
  { ssr: false }
);

const KVCache = dynamic(
  () => import("@/components/widgets/context/KVCacheWidget").then((m) => m.KVCache),
  { ssr: false }
);

const SubagentContext = dynamic(
  () => import("@/components/widgets/context/SubagentContext").then((m) => m.SubagentContext),
  { ssr: false }
);

const Compression = dynamic(
  () => import("@/components/widgets/context/CompressionWidget").then((m) => m.Compression),
  { ssr: false }
);

const AttentionCost = dynamic(
  () => import("@/components/widgets/context/AttentionCost").then((m) => m.AttentionCost),
  { ssr: false }
);

const SparseIndexer = dynamic(
  () => import("@/components/widgets/context/SparseIndexer").then((m) => m.SparseIndexer),
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

export function ClientServerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try this">
      <ClientServer />
    </WidgetSlot>
  );
}

export function KVCacheWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try this">
      <KVCache />
    </WidgetSlot>
  );
}

export function SubagentContextWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try this">
      <SubagentContext />
    </WidgetSlot>
  );
}

export function CompressionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try this">
      <Compression />
    </WidgetSlot>
  );
}

export function AttentionCostWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <AttentionCost />
    </WidgetSlot>
  );
}

export function SparseIndexerWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try this">
      <SparseIndexer />
    </WidgetSlot>
  );
}
