"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";
import {
  biasCases,
  truthCases,
  valueCases,
} from "@/components/widgets/society/societyCases";
import type { CaseSet } from "@/components/widgets/shared/caseTypes";

const CaseTabs = dynamic(
  () => import("@/components/widgets/shared/CaseTabs").then((m) => m.CaseTabs),
  { ssr: false }
);

const TechnologyTabs = dynamic(
  () => import("@/components/widgets/society/TechnologyTabs").then((m) => m.TechnologyTabs),
  { ssr: false }
);

const EnergyAndWater = dynamic(
  () => import("@/components/widgets/society/EnergyAndWater").then((m) => m.EnergyAndWater),
  { ssr: false }
);

function WidgetSlot({ children, tryIt }: { children: React.ReactNode; tryIt?: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="my-8 flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted">
          Loading widget...
        </div>
      }
    >
      <TryItProvider content={tryIt} label="Explore it">
        {children}
      </TryItProvider>
    </Suspense>
  );
}

function caseWidget(set: CaseSet) {
  return function CaseWidget({ children }: { children?: React.ReactNode }) {
    return (
      <WidgetSlot tryIt={children}>
        <CaseTabs set={set} />
      </WidgetSlot>
    );
  };
}

export const BiasWidget = caseWidget(biasCases);
export const TruthWidget = caseWidget(truthCases);
export const ValueWidget = caseWidget(valueCases);

export function HistoryWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <TechnologyTabs />
    </WidgetSlot>
  );
}

export function EnergyAndWaterWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <EnergyAndWater />
    </WidgetSlot>
  );
}

