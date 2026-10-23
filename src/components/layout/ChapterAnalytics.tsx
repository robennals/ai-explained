"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { chapterFromPathname, createOnceGuard, track } from "@/lib/analytics";

/**
 * Reports a reader's progress through a chapter page: `chapter_start` when
 * it loads, `section_reached` as each `##` heading scrolls into view, and
 * `chapter_complete` when the quiz (or, failing that, the end-of-chapter
 * navigation) does. Each fires at most once per visit to the page.
 */
export function ChapterAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const chapter = chapterFromPathname(pathname);
    if (!chapter) return;

    track("chapter_start", { chapter });

    const once = createOnceGuard();
    const headings = document.querySelectorAll<HTMLElement>("article h2[id]");
    const finish =
      document.querySelector<HTMLElement>("article #quiz") ??
      document.querySelector<HTMLElement>("[data-chapter-end]");

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        if (el === finish) {
          if (once("complete")) track("chapter_complete", { chapter });
        } else if (once(`section:${el.id}`)) {
          track("section_reached", { chapter, section: el.id });
        }
        observer.unobserve(el);
      }
    });
    headings.forEach((h) => observer.observe(h));
    if (finish) observer.observe(finish);

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
