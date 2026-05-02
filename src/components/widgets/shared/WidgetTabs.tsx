"use client";

import { useState, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { TabVisitContext } from "./WidgetContainer";

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
  const reportTabVisit = useContext(TabVisitContext);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const isLastTab = activeIndex === tabs.length - 1;

  const goToNext = useCallback(() => {
    if (!isLastTab) {
      const nextTab = tabs[activeIndex + 1];
      onTabChange(nextTab.id);
      setVisited((prev) => {
        if (prev.has(nextTab.id)) return prev;
        const next = new Set(prev);
        next.add(nextTab.id);
        return next;
      });
    }
  }, [activeIndex, isLastTab, tabs, onTabChange]);

  const stableGoToNext = useMemo(() => (isLastTab ? null : goToNext), [isLastTab, goToNext]);

  useEffect(() => {
    reportTabVisit?.({ total: tabs.length, visited: visited.size, goToNext: stableGoToNext });
  }, [reportTabVisit, tabs.length, visited.size, stableGoToNext]);

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

  // When the active tab changes (e.g. via "Go to Next Tab"), scroll the
  // tablist horizontally so the active button is in view. We adjust
  // scrollLeft directly so this never affects page scroll.
  const tablistRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<T, HTMLButtonElement | null>());
  useEffect(() => {
    const list = tablistRef.current;
    const btn = buttonRefs.current.get(activeTab);
    if (!list || !btn) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const viewLeft = list.scrollLeft;
    const viewRight = viewLeft + list.clientWidth;
    const margin = 16;
    if (btnLeft < viewLeft + margin) {
      list.scrollTo({ left: Math.max(0, btnLeft - margin), behavior: "smooth" });
    } else if (btnRight > viewRight - margin) {
      list.scrollTo({ left: btnRight - list.clientWidth + margin, behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <div className="mb-8">
      <div ref={tablistRef} className="flex border-b-2 border-border overflow-x-auto overflow-y-clip" role="tablist">
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const isVisited = visited.has(tab.id);

          return (
            <button
              key={tab.id}
              ref={(el) => { buttonRefs.current.set(tab.id, el); }}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-colors ${
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
