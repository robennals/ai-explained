"use client";

import type { TokenState } from "./types";

interface PassageProps {
  tokens: TokenState[];
  focusedTokenIndex: number | null;
  /** Indices of source tokens the focused token pulled from — rendered with an accent border. */
  pulledFromIndices: number[];
  /** Indices of tokens that have something interesting to inspect at the current layer/head. */
  tokensWithContent: number[];
  onClickToken: (index: number) => void;
}

export function Passage({
  tokens,
  focusedTokenIndex,
  pulledFromIndices,
  tokensWithContent,
  onClickToken,
}: PassageProps) {
  const pulledSet = new Set(pulledFromIndices);
  const contentSet = new Set(tokensWithContent);
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-5 text-base leading-loose">
      {tokens.map((token, i) => {
        const isFocused = focusedTokenIndex === i;
        const isPulledFrom = pulledSet.has(i);
        const hasContent = contentSet.has(i);

        if (!token.clickable) {
          return (
            <span key={i} className="text-foreground/70">
              {/* tokens that attach to their predecessor visually keep spacing clean */}
              {token.token === "," || token.token === "." ? token.token : ` ${token.token} `}
            </span>
          );
        }

        const base = "relative mx-0.5 rounded px-1.5 py-0.5 transition-colors cursor-pointer";
        const stateClasses = isFocused
          ? "bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-500 font-semibold"
          : isPulledFrom
          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-400"
          : "border border-transparent hover:bg-foreground/10";

        return (
          <button
            key={i}
            type="button"
            onClick={() => onClickToken(i)}
            className={`${base} ${stateClasses}`}
          >
            {hasContent && !isFocused && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent"
              />
            )}
            {token.token}
          </button>
        );
      })}
      <span className="text-foreground/70">{" ___"}</span>
    </div>
  );
}
