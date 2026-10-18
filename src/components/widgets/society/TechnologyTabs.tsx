"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { SourceLine } from "@/components/widgets/shared/SourceLine";
import { technologies, type Side } from "./technologies";

function SideCard({ kind, side }: { kind: "good" | "bad"; side: Side }) {
  const isGood = kind === "good";
  return (
    <div className={`rounded-lg border-l-4 p-4 ${isGood ? "border-success bg-success/5" : "border-error bg-error/5"}`}>
      <div className={`text-xs font-bold uppercase tracking-widest ${isGood ? "text-success" : "text-error"}`}>
        {isGood ? "The good" : "The bad"}
      </div>
      {side.stat && (
        <div className="mt-2">
          <div className="font-mono text-2xl font-bold text-foreground">{side.stat.value}</div>
          <div className="text-sm leading-snug text-muted">{side.stat.caption}</div>
        </div>
      )}
      <p className="mt-2 text-base leading-relaxed text-foreground">{side.text}</p>
    </div>
  );
}

/**
 * One tab per earlier technology: its good side and bad side next to each
 * other, then how societies adapted to it.
 */
export function TechnologyTabs() {
  const [activeId, setActiveId] = useState(technologies[0].id);
  const tech = technologies.find((t) => t.id === activeId) ?? technologies[0];

  return (
    <WidgetContainer
      title="The good and the bad"
      description="Powerful technologies, the good and harm each one brought, and how societies adapted."
      onReset={() => setActiveId(technologies[0].id)}
    >
      <WidgetTabs
        tabs={technologies.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={tech.id}
        onTabChange={setActiveId}
      />

      <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
        {tech.label}, {tech.era}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SideCard kind="good" side={tech.good} />
        <SideCard kind="bad" side={tech.bad} />
      </div>

      <div className="mt-5 text-xs font-bold uppercase tracking-widest text-muted">How societies adapted</div>
      <ul className="mt-2 space-y-2">
        {tech.adapted.map((a) => (
          <li key={a.what} className="text-base leading-relaxed text-foreground">
            <span className="font-semibold">{a.what}.</span> {a.detail}
          </li>
        ))}
      </ul>

      <p className="mt-4 border-l-4 border-accent/40 pl-3 text-base font-medium leading-relaxed text-foreground">
        {tech.verdict}
      </p>

      <SourceLine sources={tech.sources} />
    </WidgetContainer>
  );
}
