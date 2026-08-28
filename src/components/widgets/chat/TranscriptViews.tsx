"use client";

import { useState } from "react";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import {
  completionFor,
  exchanges,
  isVisible,
  promptParts,
  senderKind,
  senderLabel,
  transcript,
} from "./chatTranscript";

type View = "raw" | "bubbles";

const firstReply = exchanges[0];

export function TranscriptViews() {
  const [view, setView] = useState<View>("raw");

  return (
    <WidgetContainer
      title="A chat is a prompt and a completion"
      description="The same exchange as raw text, and as the messages this tutorial draws from here on."
      onReset={() => setView("raw")}
    >
      <div className="flex gap-2">
        {(["raw", "bubbles"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              v === view
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-foreground/5"
            }`}
          >
            {v === "raw" ? "As text" : "As messages"}
          </button>
        ))}
      </div>

      {view === "raw" ? (
        <>
          <div className="mt-5 overflow-hidden rounded-lg border border-widget-border">
            <div className="border-b border-widget-border bg-surface px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                Prompt the model is given
              </span>
            </div>
            <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
              {promptParts(firstReply)
                .map((p) => p.text)
                .join("")}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-accent/40">
            <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                The model&rsquo;s completion
              </span>
            </div>
            <div className="whitespace-pre-wrap bg-accent/5 px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
              {completionFor(firstReply)}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-3">
          {transcript.slice(0, firstReply + 1).map((turn, i) => (
            <ChatMessage
              key={i}
              sender={senderLabel(turn)}
              kind={senderKind(turn)}
              hidden={!isVisible(turn)}
              text={turn.text}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-base leading-relaxed text-foreground">
        <span className="font-semibold">Why: </span>
        {view === "raw"
          ? "Exactly the arrangement from the first playground in this chapter: a prefix, and the text that most likely follows it. The prompt ends with the marker that opens the model's turn, which is what makes an answer the likely continuation."
          : "Same text, drawn as messages, which is easier to follow. The dashed one is in the prompt but never shown to the human. The rest of this tutorial draws conversations this way."}
      </p>
    </WidgetContainer>
  );
}
