"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

/* ------------------------------------------------------------------ */
/*  Data: everyday "look something up" scenarios                       */
/* ------------------------------------------------------------------ */

interface Source {
  label: string;
  /** What this source advertises about itself — the key you match against. */
  keyText: string;
  /** What you get back once you pick it — the value. */
  value: string;
  /** True for the one source that actually answers the query. */
  match: boolean;
}

interface Scenario {
  id: string;
  tab: string;
  /** What you want to find out — the query. */
  query: string;
  /** Label for the row of sources. */
  sourcesLabel: string;
  sources: Source[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "book",
    tab: "A book",
    query: "How tall is Mount Everest?",
    sourcesLabel: "Books on the shelf",
    sources: [
      { label: "Mountains of the World", keyText: "peaks and mountains", value: "Everest is 8,849 m tall.", match: true },
      { label: "The Joy of Baking", keyText: "cakes and bread", value: "Knead the dough for ten minutes.", match: false },
      { label: "City Subway Maps", keyText: "transit routes", value: "Take the blue line to downtown.", match: false },
    ],
  },
  {
    id: "search",
    tab: "A web search",
    query: "best pizza near me",
    sourcesLabel: "Search results",
    sources: [
      { label: "How to make pizza dough", keyText: "a recipe page", value: "Use 00 flour and let it rest overnight.", match: false },
      { label: "Tony's Pizzeria — reviews", keyText: "a local restaurant", value: "4.6 stars, wood-fired, two blocks away.", match: true },
      { label: "Pizza (encyclopedia)", keyText: "a history article", value: "Pizza originated in Naples, Italy.", match: false },
    ],
  },
  {
    id: "friend",
    tab: "A friend",
    query: "Which trail should I hike this weekend?",
    sourcesLabel: "Friends you could ask",
    sources: [
      { label: "Sam, who loves cooking", keyText: "food and recipes", value: "I make a great mushroom risotto.", match: false },
      { label: "Dr. Lee, a doctor", keyText: "health and medicine", value: "Remember to stay hydrated.", match: false },
      { label: "Maya, an avid hiker", keyText: "trails and hiking", value: "Try Eagle Ridge — the view is unreal.", match: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AskingQuestions() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const scenario = SCENARIOS[scenarioIdx];

  const handleReset = useCallback(() => {
    setScenarioIdx(0);
    setPicked(null);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setScenarioIdx(SCENARIOS.findIndex((s) => s.id === tabId));
    setPicked(null);
  }, []);

  const tabs = SCENARIOS.map((s) => ({ id: s.id, label: s.tab }));

  const pickedSource = picked !== null ? scenario.sources[picked] : null;

  return (
    <WidgetContainer
      title="Asking a Question"
      description="You have a question. Each source advertises what it's about. Pick the one that fits and read what it says."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        <WidgetTabs tabs={tabs} activeTab={scenario.id} onTabChange={handleTabChange} />

        {/* The query */}
        <div className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Your question (the query)
          </div>
          <div className="mt-0.5 text-base font-medium text-foreground">
            {scenario.query}
          </div>
        </div>

        {/* The candidate sources */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted">{scenario.sourcesLabel}</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {scenario.sources.map((src, i) => {
              const isPicked = picked === i;
              const reveal = isPicked;
              return (
                <button
                  key={`${scenario.id}-${i}`}
                  onClick={() => setPicked(isPicked ? null : i)}
                  aria-pressed={isPicked}
                  className={`flex flex-col gap-1 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                    isPicked
                      ? src.match
                        ? "border-success bg-success/5"
                        : "border-border bg-foreground/[0.03]"
                      : "border-border bg-surface hover:border-foreground/25"
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground">{src.label}</span>
                  <span className="text-[11px] text-muted">
                    <span className="font-semibold uppercase tracking-wide">Key:</span> {src.keyText}
                  </span>
                  {reveal && (
                    <span
                      className={`mt-1 rounded px-2 py-1 text-xs ${
                        src.match
                          ? "bg-success/10 text-foreground"
                          : "bg-foreground/5 text-muted"
                      }`}
                    >
                      <span className="font-semibold uppercase tracking-wide">Value:</span> {src.value}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plain-English readout */}
        <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm">
          {pickedSource === null ? (
            <span className="text-muted">
              Click a source to ask it. You&apos;re matching your question against each source&apos;s key.
            </span>
          ) : pickedSource.match ? (
            <span className="text-foreground">
              <span className="font-semibold">{pickedSource.label}</span> advertised the right thing, so its{" "}
              <span className="font-semibold">value</span> answered your question.
            </span>
          ) : (
            <span className="text-foreground">
              <span className="font-semibold">{pickedSource.label}</span> doesn&apos;t advertise what you&apos;re
              looking for, so its value is no help. Try the source whose key matches your question.
            </span>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
