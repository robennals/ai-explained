"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { OLD, SUMMARY, BUDGET, FRAMES, totalTokens, type Msg } from "./compression";

function Row({ m, deleted }: { m: Msg; deleted?: boolean }) {
  const base = m.summary
    ? "border-accent bg-accent/10 text-foreground"
    : "border-border bg-surface text-foreground";
  const dead = deleted ? "opacity-40 line-through" : "";
  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-sm ${base} ${dead}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span>
          <span className="font-semibold">{m.who === "user" ? "You: " : "Model: "}</span>
          {m.summary ? "📝 " : ""}
          {m.text}
        </span>
        {deleted && (
          <span className="shrink-0 font-mono text-[10px] uppercase opacity-70">deleted</span>
        )}
      </div>
    </div>
  );
}

export function Compression() {
  const [i, setI] = useState(0);
  const handleReset = useCallback(() => setI(0), []);

  const frame = FRAMES[i];
  const old = OLD.slice(0, frame.old);
  const liveTokens = frame.oldDeleted ? SUMMARY.tokens : totalTokens(old);
  const over = liveTokens > BUDGET;
  const pct = Math.min(100, (liveTokens / BUDGET) * 100);

  return (
    <WidgetContainer
      title="Compressing a full conversation"
      description="Step through it. The window fills, the agent summarises, and a fresh agent carries on."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Step label */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-medium text-foreground">
          {frame.label}
        </div>

        {/* Budget bar */}
        <div>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-foreground">Window</span>
            <span className={`font-mono ${over ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
              {liveTokens} / {BUDGET} tokens{over ? " — full" : ""}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border border-border bg-surface">
            <div
              style={{ width: `${pct}%` }}
              className={`h-full transition-all ${over ? "bg-red-400/80 dark:bg-red-500/70" : "bg-blue-400/70 dark:bg-blue-500/60"}`}
            />
          </div>
        </div>

        {/* Old context */}
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            {frame.oldDeleted ? "Old context (deleted)" : "Context"}
          </div>
          <div className="flex flex-col gap-1.5">
            {old.map((m, idx) => (
              <Row key={idx} m={m} deleted={frame.oldDeleted} />
            ))}
          </div>
        </div>

        {/* Summary written, on its own */}
        {frame.summaryOut && !frame.newOpen && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">
              Summary written
            </div>
            <Row m={SUMMARY} />
          </div>
        )}

        {/* Fresh agent, started from the summary */}
        {frame.newOpen && (
          <div className="rounded-md border border-dashed border-accent/50 bg-accent/5 p-2">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                ↳ Fresh agent · starts from the summary
              </span>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                {SUMMARY.tokens} / {BUDGET} — room to spare
              </span>
            </div>
            <Row m={SUMMARY} />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
          >
            ← Back
          </button>
          <span className="font-mono text-xs text-muted">
            Step {i + 1} of {FRAMES.length}
          </span>
          <button
            onClick={() => setI((n) => Math.min(FRAMES.length - 1, n + 1))}
            disabled={i === FRAMES.length - 1}
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </WidgetContainer>
  );
}
