"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TryItProvider } from "@/components/widgets/shared/WidgetContainer";

const LearningNeuron = dynamic(
  () =>
    import("@/components/widgets/training/LearningNeuron").then(
      (m) => m.LearningNeuron,
    ),
  { ssr: false },
);

const Twins = dynamic(
  () => import("@/components/widgets/training/Twins").then((m) => m.Twins),
  { ssr: false },
);

const VanishingChain = dynamic(
  () =>
    import("@/components/widgets/training/VanishingChain").then(
      (m) => m.VanishingChain,
    ),
  { ssr: false },
);

const ResidualStreamDiagramInner = dynamic(
  () =>
    import("@/components/widgets/training/ResidualStreamDiagram").then(
      (m) => m.ResidualStreamDiagram,
    ),
  { ssr: false },
);

const Batching = dynamic(
  () =>
    import("@/components/widgets/training/Placeholders").then((m) => m.Batching),
  { ssr: false },
);
const NormalizationPlayground = dynamic(
  () =>
    import("@/components/widgets/training/Placeholders").then(
      (m) => m.NormalizationPlayground,
    ),
  { ssr: false },
);
const OptimizerRace = dynamic(
  () =>
    import("@/components/widgets/training/Placeholders").then(
      (m) => m.OptimizerRace,
    ),
  { ssr: false },
);
const Overfitting = dynamic(
  () =>
    import("@/components/widgets/training/Placeholders").then(
      (m) => m.Overfitting,
    ),
  { ssr: false },
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

export function ActivationWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <LearningNeuron
        title="Does the neuron learn? Try each activation"
        description="Start it saturated on the sigmoid and learning stalls. Switch to ReLU and it comes back to life."
        initialWeight={5}
        initialBias={0}
        initialTarget={0.5}
        initialActivation="sigmoid"
        showActivationToggle
      />
    </WidgetSlot>
  );
}

export function BadInitWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <LearningNeuron
        title="Good start, bad start"
        description="A neuron that starts out on the flat part can barely learn. A well-scaled start learns quickly."
        initialWeight={4.5}
        initialBias={0}
        initialTarget={0.4}
        initialActivation="sigmoid"
        initPresets={{ bad: { w: 4.5, b: 0 }, good: { w: 0.4, b: 0 } }}
      />
    </WidgetSlot>
  );
}

export function TwinsWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Twins />
    </WidgetSlot>
  );
}

export function VanishingChainWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children} label="Explore it">
      <VanishingChain />
    </WidgetSlot>
  );
}

export function ResidualStreamDiagram() {
  return <ResidualStreamDiagramInner />;
}

export function BatchingWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Batching />
    </WidgetSlot>
  );
}

export function NormalizationWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children}>
      <NormalizationPlayground />
    </WidgetSlot>
  );
}

export function OptimizerRaceWidget({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <WidgetSlot tryIt={children}>
      <OptimizerRace />
    </WidgetSlot>
  );
}

export function OverfittingWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children}>
      <Overfitting />
    </WidgetSlot>
  );
}
