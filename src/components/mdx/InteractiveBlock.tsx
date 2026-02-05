"use client";

import { Suspense, type ReactNode } from "react";

interface InteractiveBlockProps {
  children: ReactNode;
}

function LoadingFallback() {
  return (
    <div className="widget-container my-8">
      <div className="flex items-center justify-center p-16">
        <div className="flex items-center gap-3 text-sm text-muted">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading interactive widget...
        </div>
      </div>
    </div>
  );
}

export function InteractiveBlock({ children }: InteractiveBlockProps) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
