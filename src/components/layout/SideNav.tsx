"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMainChapters, getAppendixChapters, getAppendixLabel, type Chapter } from "@/lib/curriculum";

function ChapterItem({ ch, isActive, label }: { ch: Chapter; isActive: boolean; label: string }) {
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
            <span className="block text-[10px] uppercase tracking-wide mt-0.5">Coming soon</span>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-accent/10 text-accent-dark font-medium"
            : "text-muted hover:text-foreground hover:bg-surface"
        }`}
      >
        <span className="mt-0.5 shrink-0 w-5 text-right font-mono text-xs text-muted">
          {label}
        </span>
        <span className="leading-snug">{ch.title}</span>
      </Link>
    </li>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const mainChapters = getMainChapters();
  const appendixChapters = getAppendixChapters();

  return (
    <nav className="w-64 shrink-0 border-r border-border overflow-y-auto py-6 pr-4 hidden lg:block">
      <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Chapters
      </h2>
      <ul className="space-y-0.5">
        {mainChapters.map((ch) => (
          <ChapterItem
            key={ch.id}
            ch={ch}
            isActive={pathname === `/${ch.slug}`}
            label={String(ch.id)}
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
              />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}
