"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const ArithmeticVsBooleanDemo = dynamic(
  () =>
    import("@/components/widgets/computation/ArithmeticVsBooleanDemo").then(
      (m) => m.ArithmeticVsBooleanDemo
    ),
  { ssr: false }
);

const FuzzyLogicPlayground = dynamic(
  () =>
    import("@/components/widgets/computation/FuzzyLogicPlayground").then(
      (m) => m.FuzzyLogicPlayground
    ),
  { ssr: false }
);

const LogicGateBuilder = dynamic(
  () =>
    import("@/components/widgets/computation/LogicGateBuilder").then(
      (m) => m.LogicGateBuilder
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

export function ArithmeticWidget() {
  return (
    <WidgetSlot>
      <ArithmeticVsBooleanDemo />
    </WidgetSlot>
  );
}

export function FuzzyWidget() {
  return (
    <WidgetSlot>
      <FuzzyLogicPlayground />
    </WidgetSlot>
  );
}

export function GatesWidget() {
  return (
    <WidgetSlot>
      <LogicGateBuilder />
    </WidgetSlot>
  );
}
