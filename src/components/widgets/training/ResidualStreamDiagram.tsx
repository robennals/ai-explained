"use client";

// Static diagram contrasting a plain rewrite-chain (blame gets smeared) with a
// residual stream (each layer adds to a shared document, so blame is traceable).

const LAYERS = 4;

export function ResidualStreamDiagram() {
  return (
    <div className="my-8 grid gap-4 rounded-xl border border-widget-border bg-surface p-5 md:grid-cols-2">
      <Panel
        title="Plain deep network"
        subtitle="Each layer rewrites the previous one's work. A flaw is smeared across everyone — the earliest layer is hardest to blame."
        tone="bad"
      >
        <div className="flex flex-col items-center gap-1">
          {Array.from({ length: LAYERS }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Box label={`rewrite ${i + 1}`} tone="bad" />
              {i < LAYERS - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Residual stream"
        subtitle="Each layer adds its own paragraph to a shared document. A deep layer contributes directly to the output — and can be blamed and fixed directly."
        tone="good"
      >
        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-between py-1">
            <span className="text-[10px] uppercase tracking-wide text-muted">
              stream
            </span>
            <div className="my-1 w-1 flex-1 rounded-full bg-emerald-500/50" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {Array.from({ length: LAYERS }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Box label={`+ paragraph ${i + 1}`} tone="good" />
                <span className="text-emerald-500">→</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  tone: "good" | "bad";
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        className={`text-sm font-semibold ${
          tone === "good" ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {title}
      </h4>
      <p className="mb-3 mt-0.5 text-xs text-muted">{subtitle}</p>
      {children}
    </div>
  );
}

function Box({ label, tone }: { label: string; tone: "good" | "bad" }) {
  return (
    <div
      className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
        tone === "good"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300"
      }`}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return <span className="my-0.5 text-red-400">↓</span>;
}
