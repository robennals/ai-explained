"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import {
  buildPrefix,
  completionExamples,
  getExample,
} from "./baseVsChatExamples";

type Mode = "base" | "chat";

export function RawCompletion() {
  const [exampleId, setExampleId] = useState(completionExamples[0].id);
  const [mode, setMode] = useState<Mode>("base");
  const example = getExample(exampleId);
  const prefix = buildPrefix(example, mode);
  const completion = (mode === "base" ? example.base : example.chat).replace(
    /^\n/,
    ""
  );

  return (
    <WidgetContainer
      title="Base model vs chat model"
      description="Both models are completing a piece of text. Only the text differs."
      onReset={() => {
        setExampleId(completionExamples[0].id);
        setMode("base");
      }}
    >
      <div className="flex flex-wrap gap-2">
        {completionExamples.map((e) => (
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

      <div className="mt-4 flex gap-2">
        {(["base", "chat"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              m === mode
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-foreground/5"
            }`}
          >
            {m === "base" ? "Base model" : "Chat model"}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            Text handed to the model
          </span>
          {mode === "chat" && (
            <span className="ml-2 text-xs text-muted">
              the same words, wrapped in role markers
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {prefix}
        </div>
        <div className="border-t border-widget-border bg-accent/5 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            What the model predicts next
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-accent/5 px-4 py-3 text-base leading-relaxed text-foreground">
          {completion}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        <span className="font-semibold text-foreground">Why: </span>
        {mode === "base"
          ? example.baseNote
          : "The role markers put the model in the middle of a transcript, with the assistant's turn left open. Post-training taught it that the likely continuation there is an answer."}
      </p>
    </WidgetContainer>
  );
}
