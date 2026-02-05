import Link from "next/link";
import type { Chapter } from "@/lib/curriculum";

interface ChapterNavProps {
  prev?: Chapter;
  next?: Chapter;
}

export function ChapterNav({ prev, next }: ChapterNavProps) {
  return (
    <nav className="mt-16 flex items-stretch gap-4 border-t border-border pt-8">
      {prev ? (
        <Link
          href={`/${prev.slug}`}
          className="group flex-1 rounded-lg border border-border p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Previous
          </span>
          <p className="mt-1 font-medium text-foreground group-hover:text-accent-dark">
            {prev.title}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`/${next.slug}`}
          className="group flex-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-accent/40 hover:bg-accent/5"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Next
          </span>
          <p className="mt-1 font-medium text-foreground group-hover:text-accent-dark">
            {next.title}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
