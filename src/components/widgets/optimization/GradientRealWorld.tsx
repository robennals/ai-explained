"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface Example {
  id: string;
  label: string;
  errorOnly: string;
  withGradient: string;
  why: string;
}

const EXAMPLES: Example[] = [
  {
    id: "runner",
    label: "Running coach",
    errorOnly: "\"Your time was 14.2 seconds.\"",
    withGradient: "\"Your time was 14.2 seconds — try lengthening your stride.\"",
    why: "The time tells you how far off you are. The coaching tip tells you which direction to change. You don't have to guess what to try next.",
  },
  {
    id: "writer",
    label: "Story feedback",
    errorOnly: "\"I'd give it 3 out of 5 stars.\"",
    withGradient: "\"I'd give it 3 out of 5 — the middle section was confusing and I lost track of who was speaking.\"",
    why: "The rating tells you the error. The specific feedback tells you exactly what to fix. You can go straight to the problem instead of changing things at random.",
  },
  {
    id: "chef",
    label: "Restaurant review",
    errorOnly: "\"The food was okay, not great.\"",
    withGradient: "\"The food was okay — I'd like it spicier, and the sauce was too thick.\"",
    why: "\"Okay, not great\" gives you a score but no direction. \"Spicier and thinner sauce\" tells you exactly which knobs to turn and which way.",
  },
  {
    id: "teacher",
    label: "Exam results",
    errorOnly: "\"You scored 72%.\"",
    withGradient: "\"You scored 72% — you lost most of your marks on the algebra questions.\"",
    why: "The score tells you the size of the error. Knowing where you lost marks tells you where to focus your studying.",
  },
];

const ERROR_COLOR = "#ef4444";
const GRADIENT_COLOR = "#3b82f6";

export function GradientRealWorld() {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const reset = useCallback(() => {
    setSelectedIdx(0);
  }, []);

  const ex = EXAMPLES[selectedIdx];

  return (
    <WidgetContainer
      title="Gradients in Real Life"
      description="Knowing the error is good — knowing which direction to change is much better"
      onReset={reset}
    >
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {EXAMPLES.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setSelectedIdx(i)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              i === selectedIdx
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Error only */}
        <div className="rounded-lg border border-border bg-surface/50 px-4 py-3 text-sm">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: ERROR_COLOR }}>
            Error only
          </div>
          <div className="text-muted italic">{ex.errorOnly}</div>
        </div>

        {/* With gradient */}
        <div className="rounded-lg border border-border bg-surface/50 px-4 py-3 text-sm">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: GRADIENT_COLOR }}>
            Error + gradient
          </div>
          <div className="text-muted italic">{ex.withGradient}</div>
        </div>

        {/* Why it matters */}
        <div className="text-xs text-muted">
          {ex.why}
        </div>
      </div>
    </WidgetContainer>
  );
}
