"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import {
  candidates,
  getSignal,
  prompt,
  signals,
  updatedProbabilities,
} from "./postTrainingSignals";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function TrainingSignal() {
  const [signalId, setSignalId] = useState(signals[0].id);
  const signal = getSignal(signalId);
  const after = updatedProbabilities(signal);

  return (
    <WidgetContainer
      title="Where the training signal comes from"
      description="Four candidate answers, five ways of deciding which one to make more likely."
      onReset={() => setSignalId(signals[0].id)}
    >
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          Prompt
        </div>
        <p className="mt-1 text-base text-foreground">{prompt}</p>
      </div>

      <div className="mt-5">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          Signal
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {signals.map((s) => (
            <button
              key={s.id}
              onClick={() => setSignalId(s.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                s.id === signalId
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-widget-border bg-white p-4 text-sm leading-relaxed">
        <p className="text-foreground">{signal.how}</p>
        <p className="mt-2 text-muted">
          <span className="font-semibold text-foreground">Blind spot: </span>
          {signal.blindSpot}
        </p>
        <p className="mt-2 text-xs text-muted">{signal.usedBy}</p>
      </div>

      <div className="mt-5 space-y-3">
        {candidates.map((candidate) => {
          const score = signal.scores[candidate.id] ?? 0;
          const before = candidate.priorProbability;
          const now = after[candidate.id];
          const rose = now > before + 0.005;
          const fell = now < before - 0.005;
          return (
            <div
              key={candidate.id}
              className="rounded-lg border border-widget-border bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${
                    candidate.correct ? "text-success" : "text-muted"
                  }`}
                >
                  {candidate.tag}
                </span>
                <span className="text-xs font-medium text-muted">
                  Score from this signal: {percent(score)}
                </span>
              </div>
              <pre className="mt-1.5 whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">
                {candidate.text}
              </pre>

              <div className="mt-3 grid grid-cols-[7rem_1fr_3rem] items-center gap-2 text-xs text-muted">
                <span>Before training</span>
                <div className="h-2.5 rounded-full bg-foreground/10">
                  <div
                    className="h-2.5 rounded-full bg-foreground/30"
                    style={{ width: `${before * 100}%` }}
                  />
                </div>
                <span className="text-right tabular-nums">
                  {percent(before)}
                </span>

                <span className="font-semibold text-foreground">
                  After training
                </span>
                <div className="h-2.5 rounded-full bg-foreground/10">
                  <div
                    className={`h-2.5 rounded-full ${
                      rose ? "bg-accent" : fell ? "bg-foreground/25" : "bg-foreground/30"
                    }`}
                    style={{ width: `${now * 100}%` }}
                  />
                </div>
                <span className="text-right font-semibold tabular-nums text-foreground">
                  {percent(now)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        The model emits a probability for every possible response, so a training
        step can raise one and lower another at the same time. Whether that
        makes the model better depends entirely on which column of scores you
        used.
      </p>
    </WidgetContainer>
  );
}
