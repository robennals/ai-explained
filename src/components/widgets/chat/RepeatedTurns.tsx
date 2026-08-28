"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { completionFor, exchanges, promptParts } from "./chatTranscript";

const secondReply = exchanges[1];

export function RepeatedTurns() {
  const parts = promptParts(secondReply);

  return (
    <WidgetContainer
      title="The second reply in the same conversation"
      description="Shaded text was already sent last time. It is all sent again."
    >
      <div className="overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            Prompt the model is given
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed">
          {parts.map((part, i) => (
            <span
              key={i}
              className={
                part.carriedOver
                  ? "rounded bg-foreground/8 text-muted"
                  : "font-semibold text-foreground"
              }
            >
              {part.text}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-accent/40">
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            The model&rsquo;s completion
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-accent/5 px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {completionFor(secondReply)}
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        <span className="font-semibold">Why: </span>
        The model kept nothing from last time. Its own earlier reply is in the
        prompt because the program running it put it there, alongside
        everything else that has been said.
      </p>
    </WidgetContainer>
  );
}
