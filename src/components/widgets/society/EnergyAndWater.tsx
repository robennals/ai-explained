"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { BarComparison, TrendLines } from "./charts";
import { resources, type Resource } from "./resourceData";

type View = "everyday" | "world" | "overTime";

function viewLabel(resource: Resource, view: View): string {
  if (view === "everyday") return resource.everyday.title;
  if (view === "world") return resource.world.title;
  return resource.overTime.title;
}

export function EnergyAndWater() {
  const [resourceId, setResourceId] = useState<Resource["id"]>("electricity");
  const [view, setView] = useState<View>("everyday");
  const resource = resources.find((r) => r.id === resourceId) ?? resources[0];

  return (
    <WidgetContainer
      title="What AI costs to run"
      description="AI's electricity and water use, next to other things people use them for."
      onReset={() => {
        setResourceId("electricity");
        setView("everyday");
      }}
    >
      <WidgetTabs
        tabs={resources.map((r) => ({ id: r.id, label: r.label }))}
        activeTab={resource.id}
        onTabChange={setResourceId}
      />

      <div className="mb-5 inline-flex rounded-lg border border-border bg-surface p-0.5" role="group" aria-label="View">
        {(["everyday", "world", "overTime"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === v ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {viewLabel(resource, v)}
          </button>
        ))}
      </div>

      {view === "everyday" && <BarComparison key={`${resource.id}-everyday`} comparison={resource.everyday} />}
      {view === "world" && <BarComparison key={`${resource.id}-world`} comparison={resource.world} />}
      {view === "overTime" && <TrendLines chart={resource.overTime} />}
    </WidgetContainer>
  );
}
