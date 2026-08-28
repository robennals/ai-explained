"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import {
  buildPrompt,
  buildStream,
  getReasoningExample,
  reasoningExamples,
  type SegmentKind,
} from "./reasoningExamples";

const segmentStyles: Record<SegmentKind, string> = {
  marker: "font-mono text-sm text-accent",
  think: "text-muted",
  answer: "font-semibold text-foreground",
};

export function ThinkFirst() {
  const [exampleId, setExampleId] = useState(reasoningExamples[0].id);
  const example = getReasoningExample(exampleId);
  const prompt = buildPrompt(example);
  const stream = buildStream(example);

  return (
    <WidgetContainer
      title="Thinking before answering"
      description="One stream of tokens. The app hides the part between the think tags."
      onReset={() => setExampleId(reasoningExamples[0].id)}
    >
      <div className="flex flex-wrap gap-2">
        {reasoningExamples.map((e) => (
          <button
            key={e.id}
            onClick={() => setExampleId(e.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              e.id === exampleId
                ? "bg-accent text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            Text handed to the model
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {prompt}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            Every token the model emits
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-widget-bg px-4 py-3 text-base leading-relaxed">
          {stream.map((segment, i) => (
            <span key={i} className={segmentStyles[segment.kind]}>
              {segment.text}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-accent/40">
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            What you see in the app
          </span>
        </div>
        <div className="bg-accent/5 px-4 py-3 text-base leading-relaxed text-foreground">
          {example.answer}
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        <span className="font-semibold">Why: </span>
        The grey text is the model talking to itself. It is predicted one token
        at a time, exactly like the answer, and the model reads it back as
        context before writing that answer. The app strips everything between
        the think tags.
      </p>
    </WidgetContainer>
  );
}
