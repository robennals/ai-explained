"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface Example {
  id: string;
  label: string;
  smooth: boolean;
  tweak: string;
  result: string;
  why: string;
}

const SMOOTH_EXAMPLES: Example[] = [
  {
    id: "runner",
    label: "Runner",
    smooth: true,
    tweak: "A runner tries a slightly longer stride",
    result: "Their time changes by a fraction of a second",
    why: "A small change to technique gives a small change in performance — so the runner knows whether the tweak helped.",
  },
  {
    id: "writer",
    label: "Writer",
    smooth: true,
    tweak: "A writer adds a bit more detail to a scene",
    result: "Readers rate the story a little higher or a little lower",
    why: "A small change to the writing gives a small change in how much people enjoy it — so the writer can tell what's working.",
  },
  {
    id: "evolution",
    label: "Evolution",
    smooth: true,
    tweak: "A mutation makes an animal's legs slightly longer",
    result: "It runs a little faster or a little slower",
    why: "Small genetic changes produce small changes in survival ability — so natural selection gets useful feedback.",
  },
  {
    id: "chef",
    label: "Chef",
    smooth: true,
    tweak: "A chef adds a pinch more salt to a recipe",
    result: "Diners find the dish a little tastier or a little too salty",
    why: "A tiny change to the recipe gives a tiny change in the taste — so the chef can gradually dial in the perfect amount.",
  },
];

const NON_SMOOTH_EXAMPLES: Example[] = [
  {
    id: "lock",
    label: "Combination lock",
    smooth: false,
    tweak: "You try a code that's one digit off from the right answer",
    result: "The lock stays locked — exactly as stuck as a code that's completely wrong",
    why: "Being close gives you zero feedback. The only way to find the code is to try every combination or get lucky.",
  },
  {
    id: "game",
    label: "Buying a game",
    smooth: false,
    tweak: "You're interested in a video game but not sure you'll like it",
    result: "You can't half-buy it and gradually find out — you either spend the money or you don't",
    why: "There's no way to make a small change and get a small amount of feedback. It's all or nothing.",
  },
  {
    id: "nofeedback",
    label: "Game with no feedback",
    smooth: false,
    tweak: "You change your strategy slightly in a game that only tells you \"you won\" or \"you lost\"",
    result: "You get the same win or loss — no idea if your new strategy was almost right or completely wrong",
    why: "Without knowing how close you were, you can't tell which changes helped. You're stuck guessing blindly instead of improving step by step.",
  },
];

const GOOD_COLOR = "#22c55e";
const ERROR_COLOR = "#ef4444";

export function SmoothRealWorld() {
  const [selected, setSelected] = useState<Example>(SMOOTH_EXAMPLES[0]);

  const reset = useCallback(() => {
    setSelected(SMOOTH_EXAMPLES[0]);
  }, []);

  const color = selected.smooth ? GOOD_COLOR : ERROR_COLOR;

  return (
    <WidgetContainer
      title="Smooth vs. Non-Smooth in Real Life"
      description="Optimization only works when small changes give useful feedback"
      onReset={reset}
    >
      {/* Two rows of buttons */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: GOOD_COLOR }}>Smooth</span>
          {SMOOTH_EXAMPLES.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selected.id === e.id
                  ? "text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
              style={selected.id === e.id ? { backgroundColor: GOOD_COLOR } : undefined}
            >
              {e.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: ERROR_COLOR }}>Non-smooth</span>
          {NON_SMOOTH_EXAMPLES.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selected.id === e.id
                  ? "text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
              style={selected.id === e.id ? { backgroundColor: ERROR_COLOR } : undefined}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected example */}
      <div className="space-y-2 rounded-lg border border-border bg-surface/50 px-4 py-3 text-sm">
        <div className="flex gap-2">
          <span className="mt-0.5 shrink-0 font-bold" style={{ color }}>→</span>
          <div>
            <span className="font-semibold text-foreground">Small tweak: </span>
            <span className="text-muted">{selected.tweak}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="mt-0.5 shrink-0 font-bold" style={{ color }}>→</span>
          <div>
            <span className="font-semibold text-foreground">Result: </span>
            <span className="text-muted">{selected.result}</span>
          </div>
        </div>
        <div className="text-xs text-muted italic">
          {selected.why}
        </div>
      </div>
    </WidgetContainer>
  );
}
