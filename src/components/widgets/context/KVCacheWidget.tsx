"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { buildSteps, type Message, type SegState } from "./kvcache";

const CONVO: Message[] = [
  { role: "user", text: "What's the tallest mountain?" },
  { role: "assistant", text: "Mount Everest." },
  { role: "user", text: "How tall is it?" },
  { role: "assistant", text: "About 8,849 meters." },
  { role: "user", text: "Has anyone climbed it?" },
  { role: "assistant", text: "Yes, many people have." },
];

const STEPS = buildSteps(CONVO);

const STATE_STYLE: Record<SegState, string> = {
  pending: "border-dashed border-border bg-surface/40 text-muted opacity-50",
  text: "border-border bg-surface text-foreground",
  computing:
    "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300 animate-pulse dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100",
  cached:
    "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100",
};

const STATE_TAG: Record<SegState, string> = {
  pending: "",
  text: "text",
  computing: "computing KV…",
  cached: "KV cached",
};

export function KVCache() {
  const [i, setI] = useState(0);
  const handleReset = useCallback(() => setI(0), []);

  const step = STEPS[i];
  const atStart = i === 0;
  const atEnd = i === STEPS.length - 1;

  return (
    <WidgetContainer
      title="What the cache saves"
      description="Step through the conversation. Green is already computed and reused; amber is fresh work."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Step label */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-medium text-foreground">
          {step.label}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_minmax(120px,0.5fr)]">
          {/* Context column */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              Context sent in
            </div>
            <div className="flex flex-col gap-1.5">
              {CONVO.map((m, idx) => {
                const s = step.states[idx];
                return (
                  <div
                    key={idx}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${STATE_STYLE[s]}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span>
                        <span className="font-semibold">
                          {m.role === "user" ? "You: " : "Model: "}
                        </span>
                        {m.text}
                      </span>
                      {STATE_TAG[s] && (
                        <span className="shrink-0 font-mono text-[10px] uppercase opacity-80">
                          {STATE_TAG[s]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cache column */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              KV cache
            </div>
            <div className="flex min-h-[3rem] flex-col gap-1.5 rounded-lg border border-border bg-surface/50 p-2">
              {step.cached.length === 0 ? (
                <span className="px-1 py-2 text-xs italic text-muted">empty</span>
              ) : (
                step.cached.map((idx) => (
                  <div
                    key={idx}
                    className="truncate rounded border border-emerald-400 bg-emerald-100 px-2 py-1 text-xs text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    {CONVO[idx].role === "user" ? "You: " : "Model: "}
                    {CONVO[idx].text}
                  </div>
                ))
              )}
            </div>
            {step.reused > 0 && (
              <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                Reused {step.reused} message{step.reused > 1 ? "s" : ""} — no
                rework.
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={atStart}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
          >
            ← Back
          </button>
          <span className="font-mono text-xs text-muted">
            Step {i + 1} of {STEPS.length}
          </span>
          <button
            onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}
            disabled={atEnd}
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </WidgetContainer>
  );
}
