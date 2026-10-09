"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Section {
  id: string;
  title: string;
}

// A heading counts as "reached" once it is this close to the top of the
// window. Slightly more than the heading's scroll margin, so the section you
// just clicked is the one that lights up.
const ACTIVE_OFFSET_PX = 100;

function findSectionHeadings(): HTMLHeadingElement[] {
  return Array.from(
    document.querySelectorAll<HTMLHeadingElement>("article h2[id]"),
  );
}

/**
 * The sections of the chapter on screen, read from the page's own headings so
 * the list can never drift from the article. `sections` is null until the page
 * has been read, which lets callers tell "not known yet" from "has none".
 */
function useChapterSections(): {
  sections: Section[] | null;
  activeId: string | null;
} {
  const pathname = usePathname();
  const [sections, setSections] = useState<Section[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = findSectionHeadings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSections(
      headings.map((h) => ({ id: h.id, title: h.textContent ?? "" })),
    );

    let ticking = false;
    const updateActive = () => {
      ticking = false;
      const reached = headings.filter(
        (h) => h.getBoundingClientRect().top <= ACTIVE_OFFSET_PX,
      );
      setActiveId(reached.at(-1)?.id ?? null);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return { sections, activeId };
}

interface ChapterSectionsProps {
  /** Called when the user clicks a section link. Used by mobile drawer to close itself. */
  onNavigate?: () => void;
  /** Shown instead when the page has no sections (e.g. the introduction). */
  fallback: React.ReactNode;
}

export function ChapterSections({ onNavigate, fallback }: ChapterSectionsProps) {
  const { sections, activeId } = useChapterSections();

  if (sections === null) return null;
  if (sections.length === 0) return fallback;

  return (
    <>
      <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        In this chapter
      </h2>
      <ul className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={onNavigate}
              aria-current={section.id === activeId ? "location" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm leading-snug transition-colors ${
                section.id === activeId
                  ? "bg-accent/10 text-accent-dark font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
