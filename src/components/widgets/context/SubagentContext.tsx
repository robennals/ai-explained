"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import {
  MAIN_BASE,
  WITHOUT_TAIL,
  WITH_TAIL,
  SUB,
  FRAMES_WITHOUT,
  FRAMES_WITH,
  SKILL_TOKENS,
  contextTokens,
  type Msg,
  type CacheState,
} from "./subagent";

type Tab = "without" | "with";
const TABS: Tab[] = ["without", "with"];

function whoLabel(m: Msg): string {
  if (m.who === "user") return "You: ";
  if (m.who === "skill") return "";
  return "Model: ";
}

function Row({ m }: { m: Msg }) {
  const style = m.cached
    ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100"
    : m.reprocessed
    ? "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100"
    : m.mess
    ? "border-dashed border-border bg-surface/50 text-muted italic"
    : "border-border bg-surface text-foreground";
  const tag = m.cached
    ? "reused · free"
    : m.reprocessed
    ? `reprocessed · ${m.tokens} tok`
    : m.mess
    ? "scratch"
    : "";
  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-sm ${style}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span>
          <span className="font-semibold">{whoLabel(m)}</span>
          {m.text}
        </span>
        {tag && (
          <span className="shrink-0 font-mono text-[10px] uppercase opacity-70">{tag}</span>
        )}
      </div>
    </div>
  );
}

function CacheColumn({ state }: { state: CacheState }) {
  const style =
    state === "unusable"
      ? "border-amber-400 bg-amber-50 text-amber-900 opacity-70 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100"
      : "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100";
  const tag = state === "reused" ? "reused ✓" : state === "unusable" ? "unused" : "cached";
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">KV cache</div>
      <div className={`rounded-md border px-2.5 py-1.5 text-sm ${style}`}>
        <div className="flex items-baseline justify-between gap-2">
          <span>Essay-editing skill</span>
          <span className="shrink-0 font-mono text-[10px] uppercase opacity-70">{tag}</span>
        </div>
        <div className="mt-0.5 font-mono text-[10px] opacity-70">{SKILL_TOKENS} tokens</div>
      </div>
      {state === "unusable" && (
        <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          In the cache, but not at the start of this context — so it cannot be reused here.
        </div>
      )}
      {state === "reused" && (
        <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
          The subagent starts with it, so it is a prefix again — reused for free.
        </div>
      )}
    </div>
  );
}

export function SubagentContext() {
  const [tab, setTab] = useState<Tab>("without");
  const [i, setI] = useState(0);

  const handleReset = useCallback(() => {
    setTab("without");
    setI(0);
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setI(0);
  };

  const frames = tab === "with" ? FRAMES_WITH : FRAMES_WITHOUT;
  const frame = frames[i];
  const tail = tab === "with" ? WITH_TAIL : WITHOUT_TAIL;
  const main = [...MAIN_BASE, ...tail].slice(0, frame.main);
  const sub = SUB.slice(0, frame.sub);
  const subClosed = tab === "with" && !frame.subOpen && i > 0;

  return (
    <WidgetContainer
      title="Reusing a cached skill"
      description="Step through the same task each way. The right column shows the cache."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              aria-pressed={tab === t}
              className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {t === "without" ? "Without a subagent" : "With a subagent"}
            </button>
          ))}
        </div>

        {/* Step label */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-medium text-foreground">
          {frame.label}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_minmax(140px,0.5fr)]">
          {/* Context column */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              Main context
            </div>
            <div className="flex flex-col gap-1.5">
              {main.map((m, idx) => (
                <Row key={idx} m={m} />
              ))}
            </div>
            <div
              className={`mt-2 text-xs font-medium ${
                contextTokens(main) > 500 ? "text-red-600 dark:text-red-400" : "text-muted"
              }`}
            >
              Main context: {contextTokens(main)} tokens
            </div>

            {/* Subagent, shown below the main agent */}
            {frame.subOpen && (
              <div className="mt-3 rounded-md border border-dashed border-accent/50 bg-accent/5 p-2">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  ↳ Subagent · its own context
                </div>
                <div className="flex flex-col gap-1.5">
                  {sub.map((m, idx) => (
                    <Row key={idx} m={m} />
                  ))}
                </div>
              </div>
            )}
            {subClosed && (
              <div className="mt-3 rounded-md border border-dashed border-border bg-surface/40 px-2 py-2 text-xs italic text-muted">
                ↳ Subagent closed — its context is undone.
              </div>
            )}
          </div>

          {/* Cache column */}
          <CacheColumn state={frame.cache} />
        </div>

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
            Step {i + 1} of {frames.length}
          </span>
          <button
            onClick={() => setI((n) => Math.min(frames.length - 1, n + 1))}
            disabled={i === frames.length - 1}
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </WidgetContainer>
  );
}
