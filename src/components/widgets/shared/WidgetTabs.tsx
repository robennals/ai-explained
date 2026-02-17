"use client";

import { useState, useCallback } from "react";

interface Tab<T extends string> {
  id: T;
  label: string;
}

interface WidgetTabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function WidgetTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: WidgetTabsProps<T>) {
  const [visited, setVisited] = useState<Set<T>>(() => new Set([activeTab]));

  const handleTabClick = useCallback(
    (tabId: T) => {
      onTabChange(tabId);
      setVisited((prev) => {
        if (prev.has(tabId)) return prev;
        const next = new Set(prev);
        next.add(tabId);
        return next;
      });
    },
    [onTabChange]
  );

  return (
    <div className="mb-8">
      <div className="flex border-b-2 border-border" role="tablist">
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const isVisited = visited.has(tab.id);

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-0 -bottom-[2px] h-[3px] rounded-full bg-accent" />
              )}
              <span
                className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : isVisited
                      ? "bg-accent/10 text-accent"
                      : "bg-foreground/8 text-foreground/40"
                }`}
              >
                {isVisited && !isActive ? "\u2713" : i + 1}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
