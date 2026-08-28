"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import {
  approaches,
  getApproach,
  type Panel,
  type PanelKind,
} from "./postTrainingSignals";

const panelStyles: Record<PanelKind, string> = {
  prompt: "border-border bg-surface",
  response: "border-widget-border bg-white",
  target: "border-accent/40 bg-accent/5",
  human: "border-dashed border-border bg-foreground/[0.03]",
  judge: "border-dashed border-border bg-foreground/[0.03]",
  checker: "border-dashed border-border bg-foreground/[0.03]",
};

function PanelCard({ panel }: { panel: Panel }) {
  return (
    <div className={`rounded-lg border p-4 ${panelStyles[panel.kind]}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          {panel.label}
        </span>
        {panel.score !== undefined && (
          <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
            Score {panel.score.toFixed(2)}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-base leading-relaxed text-foreground">
        {panel.text}
      </p>
    </div>
  );
}

function ShiftBars({
  shift,
}: {
  shift: { label: string; before: number; after: number }[];
}) {
  return (
    <div className="mt-4 rounded-lg border border-widget-border bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-muted">
        What the training step does
      </div>
      <div className="mt-3 space-y-3">
        {shift.map((row) => (
          <div key={row.label}>
            <div className="text-sm font-medium text-foreground">
              {row.label}
            </div>
            <div className="mt-1 grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-xs text-muted">
              <span>Before</span>
              <div className="h-2.5 rounded-full bg-foreground/10">
                <div
                  className="h-2.5 rounded-full bg-foreground/30"
                  style={{ width: `${row.before * 100}%` }}
                />
              </div>
              <span className="text-right tabular-nums">
                {Math.round(row.before * 100)}%
              </span>
              <span className="font-semibold text-foreground">After</span>
              <div className="h-2.5 rounded-full bg-foreground/10">
                <div
                  className={`h-2.5 rounded-full ${
                    row.after > row.before ? "bg-accent" : "bg-foreground/25"
                  }`}
                  style={{ width: `${row.after * 100}%` }}
                />
              </div>
              <span className="text-right font-semibold tabular-nums text-foreground">
                {Math.round(row.after * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrainingSignal() {
  const [approachId, setApproachId] = useState(approaches[0].id);
  const approach = getApproach(approachId);

  return (
    <WidgetContainer
      title="Five ways to score an answer"
      description="The same question, and five ways of telling the model which response you wanted."
      onReset={() => setApproachId(approaches[0].id)}
    >
      <WidgetTabs
        tabs={approaches.map((a) => ({ id: a.id, label: a.label }))}
        activeTab={approachId}
        onTabChange={setApproachId}
      />

      <p className="text-base leading-relaxed text-foreground">{approach.how}</p>

      <div className="mt-4 space-y-3">
        {approach.panels.map((panel, i) => (
          <PanelCard key={i} panel={panel} />
        ))}
      </div>

      {approach.shift && <ShiftBars shift={approach.shift} />}

      <div className="mt-4 rounded-lg border border-widget-border bg-white p-4 text-sm leading-relaxed">
        <p className="text-foreground">{approach.outcome}</p>
        <p className="mt-2 text-muted">
          <span className="font-semibold text-foreground">Blind spot: </span>
          {approach.blindSpot}
        </p>
        <p className="mt-2 text-xs text-muted">{approach.usedBy}</p>
      </div>
    </WidgetContainer>
  );
}
