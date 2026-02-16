"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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

export function NumbersEverywhereWidget() {
  return (
    <WidgetSlot>
      <NumbersEverywhere />
    </WidgetSlot>
  );
}

export function FunctionMachineWidget() {
  return (
    <WidgetSlot>
      <FunctionMachine />
    </WidgetSlot>
  );
}

export function ParameterPlaygroundWidget() {
  return (
    <WidgetSlot>
      <ParameterPlayground />
    </WidgetSlot>
  );
}

export function LookupTableExplosionWidget() {
  return (
    <WidgetSlot>
      <LookupTableExplosion />
    </WidgetSlot>
  );
}
