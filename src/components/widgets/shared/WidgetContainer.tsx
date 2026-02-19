"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TryItValue {
  content: ReactNode;
  label: string;
}

const TryItContext = createContext<TryItValue | null>(null);

export function TryItProvider({ content, label = "Try it", children }: { content: ReactNode; label?: string; children: ReactNode }) {
  const value = content ? { content, label } : null;
  return <TryItContext.Provider value={value}>{children}</TryItContext.Provider>;
}

// Context for WidgetTabs to report visited-tab state to WidgetContainer
interface TabVisitState {
  total: number;
  visited: number;
}

type TabVisitSetter = (state: TabVisitState) => void;

const TabVisitContext = createContext<TabVisitSetter | null>(null);
export { TabVisitContext };

interface WidgetContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  onReset?: () => void;
}

export function WidgetContainer({
  title,
  description,
  children,
  onReset,
}: WidgetContainerProps) {
  const [hasError, setHasError] = useState(false);
  const [tabVisit, setTabVisit] = useState<TabVisitState | null>(null);
  const tryIt = useContext(TryItContext);

  const handleReset = useCallback(() => {
    setHasError(false);
    onReset?.();
  }, [onReset]);

  const hasUnvisitedTabs = tabVisit !== null && tabVisit.visited < tabVisit.total;

  if (hasError) {
    return (
      <div className="widget-container my-8">
        <div className="flex items-center justify-between border-b border-widget-border bg-surface px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-sm text-muted">Something went wrong with this widget.</p>
          <button
            onClick={handleReset}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Reset Widget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-container my-8">
      <div className="flex items-center justify-between border-b border-widget-border bg-surface px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          )}
        </div>
        {onReset && (
          <button
            onClick={handleReset}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Reset widget"
          >
            Reset
          </button>
        )}
      </div>
      <div className="p-5">
        <TabVisitContext.Provider value={setTabVisit}>
          {children}
        </TabVisitContext.Provider>
      </div>
      {tryIt && (
        <div className="border-t border-widget-border bg-success/5 px-5 py-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-success">
            {tryIt.label}
          </p>
          <div className="text-sm leading-relaxed text-foreground/80 [&>p]:my-1">
            {tryIt.content}
          </div>
        </div>
      )}
      {hasUnvisitedTabs && (
        <div className="border-t border-widget-border bg-accent/5 px-5 py-1.5">
          <p className="text-xs text-accent font-bold">
            👆 Don&apos;t forget to try out all the tabs!
          </p>
        </div>
      )}
    </div>
  );
}
