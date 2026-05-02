"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getIntroChapter,
  getMainChapters,
  getAppendixChapters,
  getAppendixLabel,
  type Chapter,
} from "@/lib/curriculum";

interface ChapterItemProps {
  ch: Chapter;
  isActive: boolean;
  label: string;
  onNavigate?: () => void;
}

function ChapterItem({ ch, isActive, label, onNavigate }: ChapterItemProps) {
  const href = `/${ch.slug}`;

  if (!ch.ready) {
    return (
      <li>
        <div className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm text-muted/50 cursor-default">
          <span className="mt-0.5 shrink-0 w-5 text-right font-mono text-xs">
            {label}
          </span>
          <div className="leading-snug">
            <span>{ch.title}</span>
            <span className="block text-[10px] uppercase tracking-wide mt-0.5">
              Coming soon
            </span>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-accent/10 text-accent-dark font-medium"
            : "text-muted hover:text-foreground hover:bg-surface"
        }`}
      >
        <span className="mt-0.5 shrink-0 w-5 text-right font-mono text-xs text-muted">
          {label}
        </span>
        <span className="leading-snug">
          {ch.title}
          {ch.polishing && (
            <span
              title="I'm still polishing this chapter — it's good enough to read, but isn't yet at the point where my 11-year-old fully understands it."
              className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200 align-middle"
            >
              Polishing
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

interface ChapterListProps {
  /** Called when the user clicks a chapter link. Used by mobile drawer to close itself. */
  onNavigate?: () => void;
}

export function ChapterList({ onNavigate }: ChapterListProps) {
  const pathname = usePathname();
  const introChapter = getIntroChapter();
  const mainChapters = getMainChapters();
  const appendixChapters = getAppendixChapters();

  return (
    <>
      <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Chapters
      </h2>
      <ul className="space-y-0.5">
        {introChapter && (
          <ChapterItem
            key={introChapter.id}
            ch={introChapter}
            isActive={pathname === `/${introChapter.slug}`}
            label=""
            onNavigate={onNavigate}
          />
        )}
        {mainChapters.map((ch) => (
          <ChapterItem
            key={ch.id}
            ch={ch}
            isActive={pathname === `/${ch.slug}`}
            label={String(ch.id)}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      {appendixChapters.length > 0 && (
        <>
          <div className="my-4 mx-3 border-t border-border" />
          <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Appendixes
          </h2>
          <ul className="space-y-0.5">
            {appendixChapters.map((ch) => (
              <ChapterItem
                key={ch.id}
                ch={ch}
                isActive={pathname === `/${ch.slug}`}
                label={getAppendixLabel(ch)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
