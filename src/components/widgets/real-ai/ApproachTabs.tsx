"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";

export interface Approach {
  id: string;
  /** Short label for the tab strip. */
  label: string;
  /** Card heading. May be longer than the tab label. */
  title: string;
  /** What problem this solves. One or two sentences. */
  problem: string;
  /** Roughly how it solves it. One or two sentences. */
  how: string;
  /** Small badge in the card's top-right, e.g. "all of them use it". */
  badge?: { text: string; tone: "accent" | "warning" };
  /** An honest caveat or exception, shown in a tinted box. */
  note?: string;
  /** Optional small diagram or demo. */
  visual?: ReactNode;
  chapter?: { label: string; href: string };
}

/**
 * The chapter's shared idiom: one tab per approach, each showing a plain card
 * that says what the thing is. Not a simulator — a browsable overview.
 */
export function ApproachTabs({
  approaches,
  footer,
}: {
  approaches: Approach[];
  footer?: ReactNode;
}) {
  const [id, setId] = useState(approaches[0].id);
  const a = approaches.find((x) => x.id === id) ?? approaches[0];

  return (
    <>
      <WidgetTabs
        tabs={approaches.map((x) => ({ id: x.id, label: x.label }))}
        activeTab={id}
        onTabChange={setId}
      />

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
          {a.badge && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                a.badge.tone === "accent"
                  ? "bg-accent/10 text-accent"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {a.badge.text}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          <span className="font-medium text-muted">The problem: </span>
          {a.problem}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          <span className="font-medium text-muted">Roughly how: </span>
          {a.how}
        </p>

        {a.visual && <div className="mt-4">{a.visual}</div>}

        {a.note && (
          <p className="mt-3 rounded-md border border-warning/40 bg-warning/5 p-2.5 text-xs leading-relaxed text-foreground/80">
            {a.note}
          </p>
        )}

        {a.chapter && (
          <p className="mt-3 text-xs">
            <Link href={a.chapter.href} className="font-medium text-accent hover:underline">
              Covered properly in {a.chapter.label} →
            </Link>
          </p>
        )}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </>
  );
}
