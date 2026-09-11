"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { CONVO, FRAMES, type Msg, type Dir } from "./clientserver";

function MsgRow({ m, muted }: { m: Msg; muted?: boolean }) {
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 text-sm ${
        muted
          ? "border-dashed border-border bg-surface/50 text-muted"
          : "border-border bg-surface text-foreground"
      }`}
    >
      <span className="font-semibold">{m.who === "user" ? "You: " : "Model: "}</span>
      {m.text}
    </div>
  );
}

function Channel({ dir, payload }: { dir: Dir; payload: string }) {
  if (dir === "none") {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-border bg-surface/40 px-3 py-2 text-xs italic text-muted">
        no traffic
      </div>
    );
  }
  const toServer = dir === "toServer";
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm font-medium text-foreground">
      <span>📱</span>
      <span className="font-mono text-accent">{toServer ? "———▶" : "◀———"}</span>
      <span>☁️</span>
      <span className="ml-1 text-xs">
        {toServer ? `sends ${payload} (the whole conversation)` : payload}
      </span>
    </div>
  );
}

export function ClientServer() {
  const [i, setI] = useState(0);
  const handleReset = useCallback(() => setI(0), []);

  const frame = FRAMES[i];
  const device = CONVO.slice(0, frame.device);

  return (
    <WidgetContainer
      title="Your device and the server"
      description="Step through two rounds. Watch the whole conversation get sent every time."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-medium text-foreground">
          {frame.label}
        </div>

        {/* The wire between device and server */}
        <Channel dir={frame.dir} payload={frame.payload} />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Device */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              📱 Your device
            </div>
            <div className="flex flex-col gap-1.5">
              {device.map((m, idx) => (
                <MsgRow key={idx} m={m} />
              ))}
            </div>
          </div>

          {/* Server */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              ☁️ AI data center
            </div>
            {frame.serverHolds.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-surface/40 px-2 py-3 text-xs italic text-muted">
                empty — remembers nothing
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {frame.serverHolds.map((idx) => (
                  <MsgRow key={idx} m={CONVO[idx]} muted />
                ))}
                <div className="mt-0.5 text-[11px] text-muted">
                  {frame.dir === "toDevice" ? "…working out the reply" : "…just received this"}
                </div>
              </div>
            )}
          </div>
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
