"use client";

import { useState } from "react";
import { ToggleControl } from "@/components/widgets/shared/ToggleControl";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { buildTranscript, roleLabels, type Turn } from "./toolTranscripts";

const roleStyles: Record<Turn["role"], string> = {
  user: "border-border bg-surface",
  assistant: "border-accent/40 bg-accent/5",
  "tool-call": "border-dashed border-border bg-white",
  "tool-result": "border-dashed border-border bg-foreground/[0.03]",
};

export function ToolLoop() {
  const [broken, setBroken] = useState(false);
  const [shown, setShown] = useState(1);
  const turns = buildTranscript(broken);
  const visible = turns.slice(0, shown);
  const done = shown >= turns.length;

  const setBrokenAndRestart = (value: boolean) => {
    setBroken(value);
    setShown(1);
  };

  return (
    <WidgetContainer
      title="The tool-use loop"
      description="One transcript, growing a turn at a time. Everything in it is text."
      onReset={() => {
        setBroken(false);
        setShown(1);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setShown((s) => Math.min(s + 1, turns.length))}
          disabled={done}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-foreground/15"
        >
          {done ? "Loop finished" : "Next turn"}
        </button>
        <ToggleControl
          label="Break the weather tool"
          checked={broken}
          onChange={setBrokenAndRestart}
        />
      </div>

      <div className="mt-5 space-y-3">
        {visible.map((turn, i) => (
          <div key={i}>
            <div
              className={`rounded-lg border p-4 ${roleStyles[turn.role]}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">
                  {roleLabels[turn.role]}
                </span>
                {turn.tool && (
                  <span className="text-xs font-medium text-muted">
                    {turn.tool}
                  </span>
                )}
              </div>
              <div
                className={`mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-foreground ${
                  turn.role === "tool-call" || turn.role === "tool-result"
                    ? "font-mono text-sm"
                    : ""
                }`}
              >
                {turn.text}
              </div>
            </div>
            <p className="mt-1.5 px-1 text-sm leading-relaxed text-muted">
              {turn.note}
            </p>
          </div>
        ))}
      </div>

      {done && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The model never ran anything. It wrote a request, the harness acted,
          and the model read what came back. Then it predicted the next token,
          the same as always.
        </p>
      )}
    </WidgetContainer>
  );
}
