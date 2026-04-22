"use client";

import type { HeadCard, HeadDef, TokenState } from "./types";

interface DetailCardProps {
  focalToken: TokenState;
  tokens: TokenState[];
  headDef: HeadDef | null;
  /** null → no card to show at this layer (L0) or head is L0/Predict. */
  card: HeadCard | null;
  /** Output rep shown at the bottom (same for all heads of a layer — post-FFN). */
  outputRep: string | null;
  /** Layer label for section headers. */
  layerLabel: string;
}

export function DetailCard({
  focalToken,
  tokens,
  headDef,
  card,
  outputRep,
  layerLabel,
}: DetailCardProps) {
  // L0 — no head, just show the embedding rep.
  if (!headDef) {
    return (
      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          {layerLabel} · {focalToken.token}
        </div>
        <div className="text-foreground/80">
          <span className="text-muted">Embedding:</span> <em>{focalToken.reps.L0}</em>
        </div>
      </div>
    );
  }

  // Head exists but did nothing for this token → pass-through.
  if (!card) {
    return (
      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          {layerLabel} · {headDef.label} · {focalToken.token}
        </div>
        <div className="italic text-muted">
          This head&apos;s Q does not match any K strongly for this token — its rep passes through unchanged.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        {layerLabel} · {headDef.label} · {focalToken.token}
      </div>
      <div className="mb-2 text-xs text-muted">{headDef.description}</div>

      {/* Input rep */}
      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
            Input rep
          </div>
          <div className="rounded bg-surface px-2 py-1 italic">{card.inputRep}</div>
        </div>

        {/* Q (or positional rule) */}
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {card.kind === "positional" ? "Rule" : "Q — seeking"}
          </div>
          <div className="rounded bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
            {card.kind === "positional" ? card.positionalRule : card.query}
          </div>
        </div>
      </div>

      {/* Pulled-from list */}
      {card.pulls.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
            Pulled from
          </div>
          <div className="grid gap-1">
            {card.pulls.map((pull) => {
              const from = tokens[pull.fromTokenIndex];
              return (
                <div
                  key={pull.fromTokenIndex}
                  className="grid grid-cols-[90px_1fr_1fr_50px] items-center gap-2 rounded border border-border bg-surface px-2 py-1 text-xs"
                >
                  <span className="font-medium">{from.token}</span>
                  {card.kind === "content" ? (
                    <span className="rounded bg-green-50 px-1.5 py-0.5 dark:bg-green-900/30">
                      <span className="text-[10px] text-muted">K</span> {pull.key}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                  <span className="rounded bg-yellow-50 px-1.5 py-0.5 dark:bg-yellow-900/30">
                    <span className="text-[10px] text-muted">V</span> {pull.value}
                  </span>
                  <span className="text-right font-medium text-accent">
                    {Math.round(pull.weight * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contribution */}
      <div className="mb-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
          This head&apos;s contribution
        </div>
        <div className="rounded bg-surface px-2 py-1 italic">{card.contribution}</div>
      </div>

      {/* Output rep */}
      {outputRep && (
        <div className="rounded border-l-4 border-green-500 bg-green-50 px-3 py-2 dark:bg-green-900/20">
          <div className="text-[10px] font-medium uppercase tracking-wider text-green-900 dark:text-green-300">
            Output rep after {layerLabel} (shared across all heads of this layer, post-FFN)
          </div>
          <div className="mt-1 font-medium">{outputRep}</div>
        </div>
      )}
    </div>
  );
}
