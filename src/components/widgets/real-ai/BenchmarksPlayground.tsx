"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { BENCHMARKS, LEADERBOARD } from "./data";

const ORD = ["", "first", "second", "third", "fourth", "fifth"];

// Data is all module-constant, so derive these once rather than per render.
const AVAILABLE = BENCHMARKS.filter((b) => LEADERBOARD.some((e) => e.scores[b.id] != null));

export function BenchmarksPlayground() {
  const [benchId, setBenchId] = useState(AVAILABLE[0].id);
  const bench = AVAILABLE.find((b) => b.id === benchId) ?? AVAILABLE[0];

  const ranked = LEADERBOARD.filter((e) => e.scores[bench.id] != null).sort(
    (a, b) => (b.scores[bench.id] as number) - (a.scores[bench.id] as number)
  );

  const max = ranked.length ? (ranked[0].scores[bench.id] as number) : 100;
  // Elo scores sit in a high, narrow band (≈1440–1510), so scale bars from a
  // floor rather than zero — otherwise every bar looks nearly full.
  const floor = bench.floor ?? 0;
  const barPct = (v: number) => Math.max(4, ((v - floor) / (max - floor)) * 100);
  const fmt = (v: number) => (bench.elo ? String(Math.round(v)) : v.toFixed(1));
  const bestOpen = ranked.find((e) => e.open);
  const bestOpenScore = bestOpen ? (bestOpen.scores[bench.id] as number) : 0;
  const rank = bestOpen ? ranked.indexOf(bestOpen) + 1 : 0;
  const ordinal = ORD[rank] ?? `${rank}th`;
  const justAbove = bestOpen
    ? ranked.filter((e) => !e.open && (e.scores[bench.id] as number) > bestOpenScore)
    : [];
  const nearOpen = bestOpen
    ? ranked.filter(
        (e) => !e.open && e !== bestOpen && Math.abs((e.scores[bench.id] as number) - bestOpenScore) <= 2
      )
    : [];
  // "Leads" when the best open model is at or near the top; otherwise it trails.
  const openLeads = rank > 0 && rank <= 2;

  return (
    <WidgetContainer
      title="Open models against secret ones"
      description="The open models are the ones whose design we can read. Here's how they actually score."
    >
      <WidgetTabs
        tabs={AVAILABLE.map((b) => ({ id: b.id, label: b.name }))}
        activeTab={benchId}
        onTabChange={setBenchId}
      />

      <div className="mb-4 mt-4 rounded-lg border border-border bg-surface p-3">
        <p className="text-sm leading-relaxed text-foreground/80">{bench.blurb}</p>
        <p className="mt-1.5 text-xs text-muted">
          {bench.selfReported ? (
            <>
              Scores as each lab reported them (
              <a href={bench.href} className="underline decoration-dotted hover:text-foreground" target="_blank" rel="noreferrer">{bench.evaluator}</a>
              , {bench.date}). These are the widely-cited numbers, but each lab runs the test its own way, so
              treat small gaps loosely.
            </>
          ) : (
            <>
              Measured by{" "}
              <a href={bench.href} className="underline decoration-dotted hover:text-foreground" target="_blank" rel="noreferrer"><strong className="font-semibold text-foreground/70">{bench.evaluator}</strong></a>
              , {bench.date} — one outside group ran every model itself, the same way. A lab testing its own
              model tends to report a higher number than an outsider gets.
            </>
          )}
        </p>
      </div>

      <div className="space-y-2.5">
        {ranked.map((e) => {
          const v = e.scores[bench.id] as number;
          return (
            <div key={e.name} className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold ${e.open ? "text-accent" : "text-foreground"}`}
                  >
                    {e.name}
                  </span>
                  {e.pending && (
                    <span className="rounded bg-accent/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-accent">
                      opens soon
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted">
                  {e.maker} · {e.released}
                </div>
              </div>
              <div className="h-4 flex-1 rounded-full bg-foreground/5">
                <div
                  className={`h-4 rounded-full ${e.open ? "bg-accent" : "bg-warning"}`}
                  style={{ width: `${barPct(v)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                {fmt(v)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" /> open weights, design published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-warning" /> closed, nothing published
        </span>
      </div>

      {bestOpen && openLeads && (
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-sm leading-relaxed text-foreground/85">
            The best open model here, <strong>{bestOpen.name}</strong>, comes {ordinal} out of everything on
            the board
            {justAbove.length > 0 && <>, behind only {justAbove.map((e) => e.name).join(" and ")}</>}
            {nearOpen.length > 0 && <>, and level with closed models like {nearOpen[0].name}</>}. An open
            model, whose blueprint you can download, sitting right at the top with the secret ones.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            The other open models trail by a rung, but they are plainly in the same game, and they are the
            only ones whose insides you can actually inspect.
          </p>
        </div>
      )}

      {bestOpen && !openLeads && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3">
          <p className="text-sm leading-relaxed text-foreground/85">
            Here the open models don&apos;t lead. The best of them, <strong>{bestOpen.name}</strong>, comes{" "}
            {ordinal}, behind {justAbove.map((e) => e.name).join(", ")}. Close, but on this test the closed
            models stay ahead.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            That&apos;s the point of having more than one tab. Flip between them and the pattern is mixed:
            the open models can match or beat the closed ones on some tasks and fall a little behind on
            others. &ldquo;In the same ballpark&rdquo; means close, not ahead on everything.
          </p>
        </div>
      )}

      <p className="mt-3 rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground/80">
        <strong className="font-semibold">Read these loosely.</strong> The same model can score several
        points higher or lower depending on exactly how it&apos;s tested, so trust the rough ordering, not the
        decimals — which is why it&apos;s worth flipping between the tabs rather than trusting any one. On
        the human-preference tab in particular, the top few are so close they&apos;re really a tie.
      </p>
    </WidgetContainer>
  );
}
