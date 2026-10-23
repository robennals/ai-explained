"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { completionExamples, getExample } from "./baseVsChatExamples";

function Completion({
  label,
  text,
  wanted,
}: {
  label: string;
  text: string;
  wanted: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        wanted ? "border-success/50" : "border-error/40"
      }`}
    >
      <div
        className={`border-b px-4 py-2 ${
          wanted
            ? "border-success/30 bg-success/10"
            : "border-error/25 bg-error/10"
        }`}
      >
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            wanted ? "text-success" : "text-error"
          }`}
        >
          {label}
        </span>
      </div>
      <div
        className={`whitespace-pre-wrap px-4 py-3 text-base leading-relaxed text-foreground ${
          wanted ? "bg-success/5" : "bg-error/5"
        }`}
      >
        {text.replace(/^\n/, "")}
      </div>
    </div>
  );
}

export function RawCompletion() {
  const [exampleId, setExampleId] = useState(completionExamples[0].id);
  const example = getExample(exampleId);

  return (
    <WidgetContainer
      title="What a base model writes"
      description="Two things the same model might write next. Both are plausible."
      onReset={() => setExampleId(completionExamples[0].id)}
    >
      <WidgetTabs
        tabs={completionExamples.map((e) => ({ id: e.id, label: e.label }))}
        activeTab={exampleId}
        onTabChange={setExampleId}
      />

      <div className="overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            The prompt
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {example.prompt}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Completion
          label="A completion you would want"
          text={example.helpful}
          wanted
        />
        <Completion
          label="A completion you would not want"
          text={example.sideways}
          wanted={false}
        />
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        {example.note}
      </p>
    </WidgetContainer>
  );
}
