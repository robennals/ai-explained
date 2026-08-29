"use client";

import { useMemo, useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { MODELS, STAT_EXPLANATIONS, STATS } from "./data";

const SPEC_STATS = STATS.filter((s) => s.group === "spec");
const TABS = SPEC_STATS.map((s) => ({ id: s.id, label: s.label }));
const ordered = [...MODELS].sort((a, b) => a.year - b.year);

export function ScalePlayground() {
  const [statId, setStatId] = useState(SPEC_STATS[0].id);
  const stat = SPEC_STATS.find((s) => s.id === statId) ?? SPEC_STATS[0];

  // Only models that actually published this number get a row.
  const rows = useMemo(
    () => ordered.filter((m) => m.stats[stat.id]?.value != null),
    [stat.id]
  );
  const missing = useMemo(
    () => ordered.filter((m) => m.stats[stat.id]?.value == null),
    [stat.id]
  );

  const max = Math.max(...rows.map((m) => m.stats[stat.id].value as number), 1);
  const min = Math.min(...rows.map((m) => m.stats[stat.id].value as number), max);
  // Log-scaled bars, otherwise the largest value flattens everything else.
  const barWidth = (v: number) => {
    if (!stat.log) return (v / max) * 100;
    const lo = Math.log10(Math.max(min, 1)) - 0.4;
    return ((Math.log10(v) - lo) / (Math.log10(max) - lo)) * 100;
  };

  const anyLeaked = rows.some(
    (m) => (m.stats[stat.id].confidence ?? m.confidence) === "leaked"
  );

  return (
    <WidgetContainer
      title="What has scaled up, and by how much"
      description="Pick something that grew. Each tab explains what it is, then shows how it changed."
      onReset={() => setStatId(SPEC_STATS[0].id)}
    >
      <WidgetTabs tabs={TABS} activeTab={statId} onTabChange={setStatId} />

      <div className="mb-3 mt-4 rounded-lg border border-border bg-surface p-3">
        <p className="text-sm font-semibold text-foreground">{stat.label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/80">
          {STAT_EXPLANATIONS[stat.id]}
        </p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="text-muted">
            <th className="pb-2 text-left font-semibold">Model</th>
            <th className="pb-2 pl-3 text-right font-semibold">Year</th>
            <th className="pb-2 pl-3 text-right font-semibold">{stat.label}</th>
            <th className="w-[38%] pb-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const v = m.stats[stat.id].value as number;
            const leaked = (m.stats[stat.id].confidence ?? m.confidence) === "leaked";
            return (
              <tr key={m.id} className="border-t border-border">
                <td className="py-1.5">
                  <span className="block whitespace-nowrap font-medium text-foreground">
                    {m.name}
                  </span>
                  <span className="block whitespace-nowrap text-[10px] text-muted">
                    {m.maker} · {m.openness === "open" ? "open" : "closed"}
                  </span>
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums text-muted">
                  {Math.floor(m.year)}
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums font-medium text-foreground">
                  {stat.format(v)}
                  {leaked && <span className="align-super text-[9px] text-muted">*</span>}
                </td>
                <td className="py-1.5 pl-3">
                  <span className="block h-2 w-full rounded-full bg-foreground/5">
                    <span
                      className="block h-2 rounded-full bg-accent"
                      style={{ width: `${Math.max(barWidth(v), 2)}%`, opacity: leaked ? 0.45 : 1 }}
                    />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {stat.log && <>Bars are on a logarithmic scale, or the biggest would flatten all the others. </>}
        {anyLeaked && <>* based on a leak that was never confirmed. </>}
        {missing.length > 0 && (
          <>
            Not published for {missing.map((m) => m.name).join(", ")}.
          </>
        )}
      </p>
    </WidgetContainer>
  );
}
