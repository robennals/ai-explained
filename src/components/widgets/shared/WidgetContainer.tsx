"use client";

import { useState, useCallback, type ReactNode } from "react";

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

  const handleReset = useCallback(() => {
    setHasError(false);
    onReset?.();
  }, [onReset]);

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
      <div className="p-5">{children}</div>
    </div>
  );
}
