"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { attempts, correctAnswer, direction, problem } from "./trainingAttempts";

export function TraceSampling() {
  return (
    <WidgetContainer
      title="How the working gets trained"
      description="One problem, four attempts. Only the final answer is checked."
    >
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          The problem
        </div>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {problem}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {attempts.map((attempt) => {
          const up = direction(attempt) === "up";
          return (
            <div
              key={attempt.id}
              className={`rounded-lg border p-4 ${
                up
                  ? "border-success/40 bg-success/5"
                  : "border-widget-border bg-surface"
              }`}
            >
              <ol className="space-y-1">
                {attempt.trace.map((line, i) => (
                  <li
                    key={i}
                    className="text-base leading-relaxed text-muted"
                  >
                    {line}
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-widget-border pt-3">
                <span className="text-base font-semibold text-foreground">
                  Answer: {attempt.answer}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    up
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error"
                  }`}
                >
                  <span aria-hidden>{up ? "✓" : "✕"}</span>
                  {up ? "Correct, made more likely" : "Wrong, made less likely"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {attempt.note}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        The checker only knows whether the answer was {correctAnswer}. Nobody
        marked the working. The habits in the surviving attempts are there
        because attempts containing them reach the right answer more often.
      </p>
    </WidgetContainer>
  );
}
