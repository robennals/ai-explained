"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";
import type { CaseSet } from "@/components/widgets/shared/caseTypes";
import {
  controlCases,
  fictionCases,
  responseCases,
  whyBadCases,
} from "@/components/widgets/risk/riskCases";

const CaseTabs = dynamic(
  () => import("@/components/widgets/shared/CaseTabs").then((m) => m.CaseTabs),
  { ssr: false }
);

const HuggingFaceWalkthrough = dynamic(
  () => import("@/components/widgets/risk/HuggingFaceWalkthrough").then((m) => m.HuggingFaceWalkthrough),
  { ssr: false }
);

const Trajectory = dynamic(
  () => import("@/components/widgets/risk/Trajectory").then((m) => m.Trajectory),
  { ssr: false }
);

const WriteTheReward = dynamic(
  () => import("@/components/widgets/risk/WriteTheReward").then((m) => m.WriteTheReward),
  { ssr: false }
);

const EstimatesList = dynamic(
  () => import("@/components/widgets/risk/EstimatesList").then((m) => m.EstimatesList),
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

export const FictionWidget = caseWidget(fictionCases);
export const WhyBadWidget = caseWidget(whyBadCases);
export const ControlWidget = caseWidget(controlCases);
export const ResponseWidget = caseWidget(responseCases);

export function EstimatesWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <EstimatesList />
    </WidgetSlot>
  );
}

export function HuggingFaceWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <HuggingFaceWalkthrough />
    </WidgetSlot>
  );
}

export function TrajectoryWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Trajectory />
    </WidgetSlot>
  );
}

export function WriteTheRewardWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <WriteTheReward />
    </WidgetSlot>
  );
}
