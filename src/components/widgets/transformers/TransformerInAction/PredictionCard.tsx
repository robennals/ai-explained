"use client";

import type { PredictionRow } from "./types";

interface PredictionCardProps {
  predictions: PredictionRow[];
  predictionSlotToken: string;
  finalRep: string;
}

export function PredictionCard({ predictions, predictionSlotToken, finalRep }: PredictionCardProps) {
  const max = Math.max(...predictions.map((p) => p.probability));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted">
          Final representation feeding the prediction
        </div>
        <div className="mb-2 text-xs text-muted">
          The model reads this representation of the final word{" "}
          <span className="font-mono text-foreground">&ldquo;{predictionSlotToken}&rdquo;</span>:
        </div>
        <div className="border-l-4 border-green-500 bg-green-50 px-3 py-2 text-sm text-foreground">
          {finalRep}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-foreground/[0.03] p-4 text-sm">
        <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted">
          Prediction · top candidates for the next token
        </div>
        <div className="grid gap-1.5">
          {predictions.map((pred) => (
            <div key={pred.token} className="grid grid-cols-[100px_1fr_50px] items-center gap-2">
              <span className="font-mono text-xs">{pred.token}</span>
              <div className="h-2 rounded bg-surface">
                <div
                  className="h-2 rounded bg-accent"
                  style={{ width: `${(pred.probability / max) * 100}%` }}
                />
              </div>
              <span className="text-right text-xs text-muted">
                {Math.round(pred.probability * 100)}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] italic text-muted">
          Illustrative probabilities — this is a hand-constructed pedagogical example, not a real model run.
        </div>
      </div>
    </div>
  );
}
