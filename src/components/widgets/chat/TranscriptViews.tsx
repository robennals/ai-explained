"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import {
  asRawText,
  isVisible,
  senderKind,
  senderLabel,
  transcript,
} from "./chatTranscript";

type View = "raw" | "bubbles";

export function TranscriptViews() {
  const [view, setView] = useState<View>("raw");

  return (
    <WidgetContainer
      title="The same conversation, twice"
      description="What the model is handed, and the shorthand the rest of this tutorial uses for it."
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
            {v === "raw" ? "One stream of tokens" : "Drawn as messages"}
          </button>
        ))}
      </div>

      {view === "raw" ? (
        <div className="mt-5 whitespace-pre-wrap rounded-lg border border-widget-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {asRawText()}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {transcript.map((turn, i) => (
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
          ? "This is what the model is completing: one document, with markers naming who is speaking. There are no turns, and no separate channel for the system prompt."
          : "Same text, drawn as messages, which is easier to follow. The dashed one is in the transcript but never shown to the human. The rest of this tutorial draws conversations this way."}
      </p>
    </WidgetContainer>
  );
}
