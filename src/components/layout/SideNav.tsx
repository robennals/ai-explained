"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chapters } from "@/lib/curriculum";

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 border-r border-border overflow-y-auto py-6 pr-4 hidden lg:block">
      <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Chapters
      </h2>
      <ul className="space-y-0.5">
        {chapters.map((ch) => {
          const href = `/${ch.slug}`;
          const isActive = pathname === href;
          return (
            <li key={ch.id}>
              <Link
                href={href}
                className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent-dark font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <span className="mt-0.5 shrink-0 w-5 text-right font-mono text-xs text-muted">
                  {ch.id}
                </span>
                <span className="leading-snug">{ch.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
