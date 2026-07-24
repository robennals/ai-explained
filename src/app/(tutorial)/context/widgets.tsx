"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const QuadraticWall = dynamic(
  () => import("@/components/widgets/context/QuadraticWall").then((m) => m.QuadraticWall),
  { ssr: false }
);

const KVCache = dynamic(
  () => import("@/components/widgets/context/KVCacheWidget").then((m) => m.KVCache),
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

export function QuadraticWallWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <QuadraticWall />
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
