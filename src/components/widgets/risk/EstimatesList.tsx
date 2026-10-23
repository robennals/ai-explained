"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { SourceLine } from "@/components/widgets/shared/SourceLine";
import { estimates } from "./estimates";

/** The scale every estimate is drawn on, in percent. */
const SCALE_MAX = 50;
const GRIDLINES = [0, 10, 20, 30, 40, 50];

const pct = (value: number) => `${(Math.min(value, SCALE_MAX) / SCALE_MAX) * 100}%`;

/**
 * A scrollable list of published estimates of AI catastrophe, each drawn on
 * the same 0–50% scale so the spread of opinion is visible at a glance.
 */
export function EstimatesList() {
  return (
    <WidgetContainer
      title="What respected people estimate"
      description="Each person's own estimate of the chance of AI catastrophe, in their own terms."
    >
      <div className="not-prose mb-2 grid grid-cols-[1fr_minmax(8rem,14rem)] gap-4 px-4 text-xs text-muted">
        <span />
        <span className="relative h-4">
          {GRIDLINES.map((g) => (
            <span key={g} className="absolute -translate-x-1/2" style={{ left: pct(g) }}>
              {g}%
            </span>
          ))}
        </span>
      </div>
      <div className="not-prose max-h-[32rem] divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {estimates.map((e) => (
          <div key={e.who} className="grid grid-cols-[1fr_minmax(8rem,14rem)] items-start gap-4 px-4 py-3">
            <div>
              <div className="font-semibold text-foreground">
                {e.who} <span className="font-normal text-muted">({e.year})</span>
              </div>
              <div className="text-sm leading-snug text-muted">{e.role}</div>
              <p className="mt-1 text-base leading-relaxed text-foreground">
                <span className="font-semibold">{e.label}.</span> {e.statement}
              </p>
              <SourceLine sources={e.sources} compact />
            </div>
            <div className="relative mt-2 h-4">
              {GRIDLINES.map((g) => (
                <span
                  key={g}
                  aria-hidden
                  className="absolute inset-y-0 border-l border-dashed border-foreground/15"
                  style={{ left: pct(g) }}
                />
              ))}
              {e.range ? (
                <span
                  className="absolute top-1/2 h-3 min-w-3 -translate-y-1/2 rounded-full bg-[#2a78d6]"
                  style={{ left: pct(e.range[0]), width: `calc(${pct(e.range[1] - e.range[0])} + 0.75rem)`, marginLeft: "-0.375rem" }}
                  title={e.label}
                />
              ) : (
                <span className="absolute inset-y-0 left-0 text-xs italic text-muted">no number given</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}
