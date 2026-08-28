"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import {
  approaches,
  getApproach,
  type CheckVisual,
  type JudgeVisual,
  type PairVisual,
  type TargetVisual,
  type UsageVisual,
  type Visual,
} from "./postTrainingSignals";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest text-muted">
      {children}
    </div>
  );
}

function Prompt({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <Label>The question</Label>
      <p className="mt-1 text-base leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

function Verdict({ passed, children }: { passed: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
        passed ? "bg-success/10 text-success" : "bg-error/10 text-error"
      }`}
    >
      <span aria-hidden>{passed ? "✓" : "✕"}</span>
      {children}
    </span>
  );
}

function TargetPanel({ visual }: { visual: TargetVisual }) {
  return (
    <div className="space-y-3">
      <Prompt text={visual.prompt} />
      <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
        <Label>Response, written by a person</Label>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {visual.response}
        </p>
      </div>
    </div>
  );
}

function PairPanel({ visual }: { visual: PairVisual }) {
  return (
    <div className="space-y-3">
      <Prompt text={visual.prompt} />
      <div className="grid gap-3 sm:grid-cols-2">
        {visual.options.map((option) => {
          const chosen = option.id === visual.chosen;
          return (
            <div
              key={option.id}
              className={`flex flex-col rounded-lg border p-4 ${
                chosen
                  ? "border-accent bg-accent/5"
                  : "border-widget-border bg-surface"
              }`}
            >
              <Label>Response {option.id}</Label>
              <p className="mt-1 flex-1 text-base leading-relaxed text-foreground">
                {option.response}
              </p>
              <div
                className={`mt-3 rounded-md border px-3 py-1.5 text-center text-sm font-semibold ${
                  chosen
                    ? "border-accent bg-accent text-white"
                    : "border-border text-muted"
                }`}
              >
                {chosen ? "✓ I prefer this response" : "I prefer this response"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JudgePanel({ visual }: { visual: JudgeVisual }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-warning/50 bg-warning/8 p-4">
        <Label>The constitution, in full</Label>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {visual.rule}
        </p>
      </div>
      <Prompt text={visual.prompt} />
      <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
        <Label>Response</Label>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {visual.response}
        </p>
      </div>
      <div
        className={`rounded-lg border p-4 ${
          visual.passed
            ? "border-success/40 bg-success/5"
            : "border-error/40 bg-error/5"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>The model, asked whether the rule was met</Label>
          <Verdict passed={visual.passed}>
            {visual.passed ? "Rule met" : "Rule not met"}
          </Verdict>
        </div>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {visual.verdict}
        </p>
      </div>
    </div>
  );
}

function UsagePanel({ visual }: { visual: UsageVisual }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-widget-border bg-surface p-4">
        <Label>A real conversation</Label>
        <div className="mt-2 space-y-2">
          {visual.turns.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-base leading-relaxed ${
                  turn.role === "user"
                    ? "bg-accent/10 text-foreground"
                    : "bg-widget-bg text-foreground ring-1 ring-widget-border"
                }`}
              >
                {turn.text}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-widget-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>What the training pipeline reads from that</Label>
          <Verdict passed={visual.good}>
            {visual.good ? "Good response" : "Bad response"}
          </Verdict>
        </div>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {visual.signal}
        </p>
      </div>
    </div>
  );
}

function CheckPanel({ visual }: { visual: CheckVisual }) {
  return (
    <div className="space-y-3">
      <Prompt text={visual.prompt} />
      <div className="rounded-lg border border-widget-border bg-surface p-4">
        <Label>The model&rsquo;s solution</Label>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {visual.response}
        </p>
      </div>
      <div className="rounded-lg border border-widget-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Checking it against the question</Label>
          <Verdict passed={visual.passed}>{visual.verdict}</Verdict>
        </div>
        <ol className="mt-2 space-y-1.5">
          {visual.steps.map((step, i) => (
            <li key={i} className="text-base leading-relaxed text-foreground">
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Illustration({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case "target":
      return <TargetPanel visual={visual} />;
    case "pair":
      return <PairPanel visual={visual} />;
    case "judge":
      return <JudgePanel visual={visual} />;
    case "usage":
      return <UsagePanel visual={visual} />;
    case "check":
      return <CheckPanel visual={visual} />;
  }
}

export function TrainingSignal() {
  const [approachId, setApproachId] = useState(approaches[0].id);
  const approach = getApproach(approachId);

  return (
    <WidgetContainer
      title="Five ways to tell a model what you wanted"
      description="The same question every time. Only the source of the signal changes."
      onReset={() => setApproachId(approaches[0].id)}
    >
      <WidgetTabs
        tabs={approaches.map((a) => ({ id: a.id, label: a.label }))}
        activeTab={approachId}
        onTabChange={setApproachId}
      />

      <p className="text-base leading-relaxed text-foreground">
        {approach.intro}
      </p>

      <div className="mt-4">
        <Illustration visual={approach.visual} />
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        {approach.outcome}
      </p>

      <p className="mt-3 border-t border-widget-border pt-3 text-sm leading-relaxed text-muted">
        {approach.note}
      </p>
    </WidgetContainer>
  );
}
