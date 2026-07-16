"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

// First-pass placeholders for the cluster 2–5 playgrounds. These render a clear
// "planned" panel so the chapter reads end to end while the interactive versions
// are built out. Replace each with its real widget.

function Placeholder({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note: string;
}) {
  return (
    <WidgetContainer title={title} description={description}>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-widget-border bg-surface p-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
          Playground planned
        </span>
        <p className="max-w-md text-sm text-muted">{note}</p>
      </div>
    </WidgetContainer>
  );
}

export function Batching() {
  return (
    <Placeholder
      title="Batch size vs. speed"
      description="Soccer season: learn after each game, but a handful of games gives a steadier signal."
      note="Drag the batch size and watch three meters — gradient quality, number of steps to finish a pass, and parallel wall-clock — to see that batching is about doing lots in parallel while keeping the step count down."
    />
  );
}

export function NormalizationPlayground() {
  return (
    <Placeholder
      title="Layer norm vs. batch norm"
      description="Grading on a curve: re-scale the numbers so the next layer always knows what to expect."
      note="Drag three feature vectors. Layer norm standardizes each vector across its own features; batch norm standardizes each feature down the batch. Toggle between them to see which direction the standardizing runs."
    />
  );
}

export function OptimizerRace() {
  return (
    <Placeholder
      title="SGD vs. momentum vs. Adam"
      description="San Francisco to a living room in Paris: ease out slow, cruise fast, tiptoe at the end."
      note="Race three optimizers down the same loss surface. A learning-rate slider shows too-small (never arrives), just-right, and too-big (diverges); toggle between a rotatable 3D surface and a 2D heat-map view."
    />
  );
}

export function Overfitting() {
  return (
    <Placeholder
      title="Memorizing vs. learning"
      description="Cramming last year's answer key: perfect on the practice test, lost on the real one."
      note="Fit a curve to noisy points. A complexity slider goes from underfit to a wiggly curve through every point; dropout and weight-decay sliders rescue the test curve, shown against the training curve."
    />
  );
}
