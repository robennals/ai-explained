import Link from "next/link";
import type { Chapter } from "@/lib/curriculum";
import { ChapterArt } from "./art/ChapterArt";

export function ChapterCard({
  chapter,
  accent,
  ink,
  widgetCount,
}: {
  chapter: Chapter;
  accent: string;
  ink: string;
  widgetCount: number;
}) {
  return (
    <Link
      href={`/${chapter.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="aspect-[16/9] border-b border-border/60"
        style={{ backgroundColor: `${accent}0d` }}
      >
        <ChapterArt slug={chapter.slug} number={chapter.id} accent={accent} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span
          className="font-mono text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: ink }}
        >
          Chapter {chapter.id}
        </span>
        <h3 className="mt-0.5 font-semibold text-foreground group-hover:text-accent-dark">
          {chapter.title}
        </h3>
        <p className="mt-0.5 text-sm text-muted">{chapter.subtitle}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {widgetCount > 0 && <WidgetBadge count={widgetCount} />}
          {chapter.polishing && (
            <span
              title="I'm still polishing this chapter — it's good enough to read, but isn't yet at the point where my 11-year-old fully understands it."
              className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200"
            >
              Polishing
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function WidgetBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-border">
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
        <path d="M2 4h12M2 12h12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={10} cy={4} r={2} fill="white" stroke="currentColor" strokeWidth={1.5} />
        <circle cx={5} cy={12} r={2} fill="white" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      {count} interactive {count === 1 ? "widget" : "widgets"}
    </span>
  );
}
