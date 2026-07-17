"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

/* ------------------------------------------------------------------ */
/*  Multi-headed attention: one sentence, several heads. Each head is a */
/*  separate round of attention that learns one kind of link. Flip      */
/*  between heads to see the different patterns a model might learn.     */
/* ------------------------------------------------------------------ */

const HUE = 240;
const ARC_H = 66;

interface Head {
  id: string;
  label: string;
  blurb: string;
  /** [from, to] token-index pairs this head connects. */
  links: [number, number][];
}

const WORDS = ["The", "tired", "dog", "chased", "the", "cat", "that", "stole", "its", "food", "."];

const HEADS: Head[] = [
  {
    id: "pronoun",
    label: "Pronouns",
    blurb: "Links a pronoun to the thing it stands for.",
    links: [[8, 2]],
  },
  {
    id: "subject",
    label: "Who did it",
    blurb: "Links an action to whoever did it.",
    links: [
      [3, 2],
      [7, 5],
    ],
  },
  {
    id: "object",
    label: "What it happened to",
    blurb: "Links an action to what it happened to.",
    links: [
      [3, 5],
      [7, 9],
    ],
  },
  {
    id: "describe",
    label: "Describing words",
    blurb: "Links a describing word to what it describes.",
    links: [[1, 2]],
  },
  {
    id: "prev",
    label: "The token before",
    blurb: "Just looks at the token right before, which helps with spelling and grammar.",
    links: [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
      [5, 4],
      [6, 5],
      [7, 6],
      [8, 7],
      [9, 8],
      [10, 9],
    ],
  },
];

export function AttentionHeads() {
  const [headIdx, setHeadIdx] = useState(0);
  const head = HEADS[headIdx];

  const handleReset = useCallback(() => setHeadIdx(0), []);
  const handleTab = useCallback((id: string) => {
    setHeadIdx(HEADS.findIndex((h) => h.id === id));
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [arcs, setArcs] = useState<{ fromX: number; toX: number }[]>([]);

  useEffect(() => {
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const content = contentRef.current;
        if (!content) {
          setArcs([]);
          return;
        }
        const c = content.getBoundingClientRect();
        const next: { fromX: number; toX: number }[] = [];
        for (const [from, to] of head.links) {
          const f = colRefs.current.get(from);
          const t = colRefs.current.get(to);
          if (!f || !t) continue;
          const fr = f.getBoundingClientRect();
          const tr = t.getBoundingClientRect();
          next.push({ fromX: fr.left + fr.width / 2 - c.left, toX: tr.left + tr.width / 2 - c.left });
        }
        setArcs(next);
      });
    };
    run();
    const scroller = scrollRef.current;
    scroller?.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
    return () => {
      cancelAnimationFrame(raf);
      scroller?.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
    };
    // Recompute when the head changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headIdx]);

  const involved = new Set<number>();
  head.links.forEach(([a, b]) => {
    involved.add(a);
    involved.add(b);
  });

  const tabs = HEADS.map((h) => ({ id: h.id, label: h.label }));

  return (
    <WidgetContainer
      title="A Head for Each Job"
      description="One head is one round of attention that learns a single kind of link. A model runs many at once. Flip through some heads a model might learn."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        <WidgetTabs tabs={tabs} activeTab={head.id} onTabChange={handleTab} />

        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-foreground">
          {head.blurb}
        </div>

        <div ref={scrollRef} className="overflow-x-auto rounded-md border border-border">
          <div ref={contentRef} className="relative w-max">
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width="100%"
              height={ARC_H}
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker id="head-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${HUE}, 75%, 55%, 0.85)`} />
                </marker>
              </defs>
              {arcs.map((a, k) => {
                const dx = Math.abs(a.toX - a.fromX);
                const lift = Math.min(ARC_H - 8, 14 + dx * 0.18);
                const midX = (a.fromX + a.toX) / 2;
                return (
                  <path
                    key={k}
                    d={`M ${a.fromX} ${ARC_H - 6} Q ${midX} ${ARC_H - 6 - lift} ${a.toX} ${ARC_H - 8}`}
                    fill="none"
                    stroke={`hsla(${HUE}, 75%, 55%, 0.8)`}
                    strokeWidth={2}
                    markerEnd="url(#head-arrowhead)"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
            <div style={{ height: ARC_H }} aria-hidden />
            <div className="flex w-max items-stretch">
              {WORDS.map((word, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    if (el) colRefs.current.set(i, el);
                    else colRefs.current.delete(i);
                  }}
                  className={`flex h-11 items-center justify-center whitespace-nowrap border-l border-border px-3 text-lg first:border-l-0 ${
                    involved.has(i) ? "font-semibold text-accent" : "text-foreground"
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
