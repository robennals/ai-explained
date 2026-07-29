"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { ApproachTabs, type Approach } from "./ApproachTabs";
import { DIAL_SPREAD, MACHINE_TECHNIQUES } from "./data";
import { KVCacheVisual, MoEVisual, SparseAttentionVisual } from "./visuals";

const SHORT: Record<string, string> = {
  moe: "Experts",
  kv: "Attention memory",
  rope: "Positions",
  plumbing: "Plumbing",
  thinking: "Thinking",
  tools: "Tool use",
  sparse: "Sparse attention",
  mtp: "Multi-token",
};

const VISUALS: Record<string, React.ReactNode> = {
  moe: <MoEVisual />,
  kv: <KVCacheVisual />,
  sparse: <SparseAttentionVisual />,
};

const approaches: Approach[] = MACHINE_TECHNIQUES.map((t) => ({
  id: t.id,
  label: SHORT[t.id] ?? t.name,
  title: t.name,
  problem: t.problem,
  how: t.how,
  badge: t.universal
    ? { text: "all of them use it", tone: "accent" as const }
    : { text: "they disagree", tone: "warning" as const },
  note: t.variation,
  visual: VISUALS[t.id],
  chapter: t.chapter,
}));

export function MachinePlayground() {
  const universal = MACHINE_TECHNIQUES.filter((t) => t.universal).length;

  return (
    <WidgetContainer
      title="What's actually inside the machine"
      description="Eight changes to how a model runs. One tab each."
    >
      <ApproachTabs
        approaches={approaches}
        footer={
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <p className="text-sm font-semibold text-foreground">
              So they&apos;re all basically the same machine
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              {universal} of these {MACHINE_TECHNIQUES.length} are used by every frontier model we can look
              inside. That isn&apos;t a guess: their weights and configuration files are published, so you
              can check it yourself.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              What actually differs is the settings. Same design, different dials:
            </p>
            <ul className="mt-2 space-y-1">
              {DIAL_SPREAD.map((d) => (
                <li key={d.label} className="text-xs text-foreground/75">
                  <span className="font-semibold text-foreground">
                    {d.label}: {d.range}.
                  </span>{" "}
                  {d.note}
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </WidgetContainer>
  );
}
