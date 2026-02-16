"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const NumbersEverywhere = dynamic(
  () =>
    import("@/components/widgets/computation/NumbersEverywhere").then(
      (m) => m.NumbersEverywhere
    ),
  { ssr: false }
);

const FunctionMachine = dynamic(
  () =>
    import("@/components/widgets/computation/FunctionMachine").then(
      (m) => m.FunctionMachine
    ),
  { ssr: false }
);

const ParameterPlayground = dynamic(
  () =>
    import("@/components/widgets/computation/ParameterPlayground").then(
      (m) => m.ParameterPlayground
    ),
  { ssr: false }
);

const LookupTableExplosion = dynamic(
  () =>
    import("@/components/widgets/computation/LookupTableExplosion").then(
      (m) => m.LookupTableExplosion
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

export function NumbersEverywhereWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <NumbersEverywhere />
    </WidgetSlot>
  );
}

export function FunctionMachineWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <FunctionMachine />
    </WidgetSlot>
  );
}

export function ParameterPlaygroundWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <ParameterPlayground />
    </WidgetSlot>
  );
}

export function LookupTableExplosionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <LookupTableExplosion />
    </WidgetSlot>
  );
}
