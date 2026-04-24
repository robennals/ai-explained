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
  /** The focal token's rep at the layer immediately before the selected one. Null only at L0 / Predict. */
  previousRep: string | null;
}

export function DetailCard({
  focalToken,
  tokens,
  headDef,
  card,
  outputRep,
  layerLabel,
  previousRep,
}: DetailCardProps) {
  // L0 — no head, just show the embedding rep.
  if (!headDef) {
    return (
      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
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
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          {layerLabel} · {focalToken.token}
        </div>
        <div className="mb-3 italic text-muted">
          This head doesn&apos;t pull anything for this token. Its representation is unchanged from the previous layer.
        </div>

        {previousRep && (
          <div className="mb-3 rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
            <div className="text-xs font-medium uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Previous Representation
            </div>
            <div className="mt-1 font-medium">{previousRep}</div>
          </div>
        )}

        {outputRep && (
          <div className="rounded border-l-4 border-green-500 bg-green-50 px-3 py-2 dark:bg-green-900/20">
            <div className="text-xs font-medium uppercase tracking-wider text-green-900 dark:text-green-300">
              New Representation
            </div>
            <div className="mt-1 font-medium">{outputRep}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
        {layerLabel} · {focalToken.token}
      </div>

      {/* Previous Representation (full-width, quote-style box, amber accent).
          Read from previousRep (the focal token's actual rep at the prior layer)
          rather than card.inputRep, so the displayed text always matches the
          source of truth in the data file. */}
      <div className="mb-3 rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
        <div className="text-xs font-medium uppercase tracking-wider text-amber-900 dark:text-amber-300">
          Previous Representation
        </div>
        <div className="mt-1 font-medium">{previousRep ?? card.inputRep}</div>
      </div>

      {/* Output rep */}
      {outputRep && (
        <div className="mb-3 rounded border-l-4 border-green-500 bg-green-50 px-3 py-2 dark:bg-green-900/20">
          <div className="text-xs font-medium uppercase tracking-wider text-green-900 dark:text-green-300">
            New Representation
          </div>
          <div className="mt-1 font-medium">{outputRep}</div>
        </div>
      )}

      {/* Q (or positional looking-for + bias) */}
      {card.kind === "content" ? (
        <div className="mb-3">
          <div className="text-xs font-medium uppercase tracking-wider text-muted">
            Looking for
          </div>
          <div className="rounded bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
            {card.query}
          </div>
        </div>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              Looking for
            </div>
            <div className="rounded bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
              anything
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              Position bias
            </div>
            <div className="rounded bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
              very close
            </div>
          </div>
        </div>
      )}

      {/* Paying attention to */}
      {card.pulls.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Paying attention to
          </div>
          <table className="w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted">
                <th className="px-2 py-1 font-medium">Token</th>
                <th className="px-2 py-1 font-medium">Key</th>
                <th className="px-2 py-1 font-medium">Value</th>
                <th className="px-2 py-1 text-right font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {card.pulls.map((pull) => {
                const from = tokens[pull.fromTokenIndex];
                return (
                  <tr key={pull.fromTokenIndex} className="align-top">
                    <td className="rounded-l border-y border-l border-border bg-surface px-2 py-1 font-medium">
                      {from.token}
                    </td>
                    {card.kind === "content" ? (
                      <td className="border-y border-border bg-green-50 px-2 py-1 dark:bg-green-900/30">
                        {pull.key}
                      </td>
                    ) : (
                      <td className="border-y border-border bg-surface px-2 py-1 text-muted">
                        —
                      </td>
                    )}
                    <td className="border-y border-border bg-yellow-50 px-2 py-1 dark:bg-yellow-900/30">
                      {pull.value}
                    </td>
                    <td className="rounded-r border-y border-r border-border bg-surface px-2 py-1 text-right font-medium text-accent">
                      {Math.round(pull.weight * 100)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
