"use client";

import { useState, useCallback, useContext, useEffect, useMemo, useRef, type RefObject } from "react";
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
    <div className="relative mb-8">
      <ScrollOverflowCues scrollerRef={tablistRef} />
      <div
        ref={tablistRef}
        className="scrollbar-autohide flex overflow-x-auto overflow-y-clip border-b-2 border-border"
        role="tablist"
      >
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
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
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

/**
 * Fade-and-arrow cues for a horizontally scrolling row that doesn't fit, typically on a phone. A clipped item with no cue
 * doesn't read as "there's more here", so each edge that hides content gets a
 * fade plus an arrow button that scrolls that way.
 *
 */
function ScrollOverflowCues({ scrollerRef }: { scrollerRef: RefObject<HTMLElement | null> }) {
  const [hiddenLeft, setHiddenLeft] = useState(false);
  const [hiddenRight, setHiddenRight] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => {
      setHiddenLeft(scroller.scrollLeft > 1);
      setHiddenRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scrollerRef]);

  const scroll = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    scroller?.scrollBy({ left: direction * scroller.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <>
      {hiddenLeft && <Cue side="left" onClick={() => scroll(-1)} />}
      {hiddenRight && <Cue side="right" onClick={() => scroll(1)} />}
    </>
  );
}

function Cue({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <div
      className={`pointer-events-none absolute bottom-[2px] top-0 z-[1] flex w-12 items-center ${
        side === "left"
          ? "left-0 justify-start bg-gradient-to-r"
          : "right-0 justify-end bg-gradient-to-l"
      } from-[var(--color-widget-bg)] from-40% to-transparent`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={side === "left" ? "Scroll back" : "Show more"}
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--color-widget-bg)] text-muted shadow-sm"
      >
        {side === "left" ? "‹" : "›"}
      </button>
    </div>
  );
}
