"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { ApproachTabs, type Approach } from "./ApproachTabs";
import { CATEGORY_LABELS, SAVINGS } from "./data";

const SHORT: Record<string, string> = {
  quant4: "Quantization",
  "moe-ds": "Experts",
  mla: "Smaller memory",
  spec: "Guess ahead",
  flash: "FlashAttention",
  sparse: "Sparse attention",
  pruning: "Pruning",
  paged: "Serving",
  gpu: "Hardware",
};

/** One tab per idea. Near-duplicates (two MoE rows, two quantization rows) are folded together. */
const PICK = ["quant4", "moe-ds", "mla", "spec", "flash", "sparse", "pruning", "paged", "gpu"];

const EXTRA: Record<string, string> = {
  quant4:
    "Going to 8 bits instead of 4 halves the size with essentially no measurable loss at all. Long, multi-step answers degrade more than short factual ones.",
  "moe-ds":
    "gpt-oss goes further still: 117 billion parameters stored, 5.1 billion used, which is 23 times less work per word.",
};

function SavingBar({ factor, measures }: { factor: number; measures: string }) {
  const pct = Math.min((Math.log(factor) / Math.log(40)) * 100, 100);
  return (
    <div className="rounded-md border border-border bg-widget-bg p-3">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-medium text-muted">{measures}</span>
        <span className="text-lg font-bold tabular-nums text-accent">{factor}×</span>
      </div>
      <span className="mt-1 block h-2.5 w-full rounded-full bg-foreground/5">
        <span className="block h-2.5 rounded-full bg-accent" style={{ width: `${Math.max(pct, 4)}%` }} />
      </span>
    </div>
  );
}

const approaches: Approach[] = PICK.map((id) => {
  const s = SAVINGS.find((x) => x.id === id)!;
  const isModel = s.category === "model";
  return {
    id: s.id,
    label: SHORT[s.id] ?? s.name,
    title: s.name,
    problem: `Running a model costs money and time, measured here in ${s.measures}.`,
    how: s.detail,
    badge: {
      text: CATEGORY_LABELS[s.category],
      tone: isModel ? ("accent" as const) : ("warning" as const),
    },
    note: EXTRA[s.id] ?? (isModel ? undefined : "This one isn't a change to the model at all. Worth keeping separate when you ask what made AI cheaper."),
    visual: <SavingBar factor={s.factor} measures={s.measures} />,
  };
});

export function EfficiencyPlayground() {
  return (
    <WidgetContainer
      title="Getting the same answer for less"
      description="Nine ways to make a model cheaper rather than smarter. One tab each."
    >
      <ApproachTabs
        approaches={approaches}
        footer={
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-3">
            <p className="text-sm font-semibold text-foreground">These savings do not multiply</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              They measure different things. Experts save computation but not memory. Quantization saves
              memory but doesn&apos;t cut the number of calculations in proportion. Guessing ahead actually
              does <em>extra</em> work to save time. A model using all of them does not end up 40 × 23 × 4
              times better at anything.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              The last two tabs aren&apos;t changes to the model at all. Only about a third of the falling
              price of AI comes from cleverer algorithms; the rest is hardware getting cheaper and companies
              competing on price.
            </p>
          </div>
        }
      />
    </WidgetContainer>
  );
}
