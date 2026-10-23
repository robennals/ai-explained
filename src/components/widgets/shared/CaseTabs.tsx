"use client";

import { useState } from "react";
import { WidgetContainer } from "./WidgetContainer";
import { WidgetTabs } from "./WidgetTabs";
import { SourceLine } from "./SourceLine";
import type { CaseSet } from "./caseTypes";

/**
 * A set of real-world examples, one per tab. Each tab leads with a one-line
 * headline and an optional key number, so a reader skimming the tabs gets the
 * point of each example before reading its detail.
 */
export function CaseTabs({ set }: { set: CaseSet }) {
  const [activeId, setActiveId] = useState(set.cases[0].id);
  const active = set.cases.find((c) => c.id === activeId) ?? set.cases[0];

  return (
    <WidgetContainer
      title={set.title}
      description={set.description}
      onReset={() => setActiveId(set.cases[0].id)}
    >
      <WidgetTabs
        tabs={set.cases.map((c) => ({ id: c.id, label: c.label }))}
        activeTab={active.id}
        onTabChange={setActiveId}
      />

      {active.tag && (
        <span className="mb-2 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
          {active.tag}
        </span>
      )}
      <p className="text-lg font-semibold leading-snug text-foreground">
        {active.headline}
      </p>

      {active.stat && (
        <div className="mt-4 flex items-baseline gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          <span className="shrink-0 font-mono text-2xl font-bold text-foreground">
            {active.stat.value}
          </span>
          <span className="text-sm leading-snug text-muted">{active.stat.caption}</span>
        </div>
      )}

      {active.body.length > 0 && (
        <div className="mt-4 space-y-3">
          {active.body.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {active.examples && (
        <div className="not-prose mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {active.examples.map((example) => (
            <details key={example.title} className="group open:bg-surface/60">
              <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 transition-colors group-open:pb-0.5 hover:bg-surface [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden
                  className="mt-1 text-xs text-muted transition-transform group-open:rotate-90"
                >
                  ▶
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{example.title}</span>
                  <span className="block text-sm leading-snug text-muted group-open:hidden">{example.teaser}</span>
                </span>
              </summary>
              <div className="space-y-2 px-4 pt-0 pb-3 pl-10">
                {[example.teaser, ...example.details].map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-foreground">
                    {paragraph}
                  </p>
                ))}
                {example.evidence && (
                  <>
                    <div className="pt-1 text-xs font-bold uppercase tracking-widest text-muted">Why it&apos;s plausible</div>
                    {example.evidence.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-relaxed text-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </>
                )}
                <SourceLine sources={example.sources} compact />
              </div>
            </details>
          ))}
        </div>
      )}

      {active.takeaway && (
        <p className="mt-4 border-l-4 border-accent/40 pl-3 text-base font-medium leading-relaxed text-foreground">
          {active.takeaway}
        </p>
      )}

      {active.fix && (
        <div className="mt-4 rounded-lg border-l-4 border-success bg-success/5 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-success">{set.fixLabel ?? "How to correct it"}</div>
          <p className="mt-1 text-base leading-relaxed text-foreground">{active.fix}</p>
        </div>
      )}

      {active.sources.length > 0 && <SourceLine sources={active.sources} />}
    </WidgetContainer>
  );
}
