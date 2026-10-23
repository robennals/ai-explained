"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Section {
  id: string;
  title: string;
}

// A section counts as "reached" once it is this close to the top of the
// window. Slightly more than a section's scroll margin, so the section you
// just clicked is the one that lights up.
const ACTIVE_OFFSET_PX = 100;

/**
 * The elements the sidebar links to, in page order: the article's section
 * headings, plus blocks that have no heading of their own (the quiz, the
 * PyTorch notebook box) and so name themselves with `data-nav-title`.
 */
function findSectionElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      "article :is(h2[id], [id][data-nav-title])",
    ),
  );
}

/**
 * The sections of the chapter on screen, read from the page itself so the
 * list can never drift from the article. `sections` is null until the page
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
    const elements = findSectionElements();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSections(
      elements.map((el) => ({
        id: el.id,
        title: el.dataset.navTitle ?? el.textContent ?? "",
      })),
    );

    let ticking = false;
    const updateActive = () => {
      ticking = false;
      const reachedCount = elements.filter(
        (el) => el.getBoundingClientRect().top <= ACTIVE_OFFSET_PX,
      ).length;
      const atPageBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1;
      if (!atPageBottom) {
        setActiveId(elements[reachedCount - 1]?.id ?? null);
        return;
      }
      // The page has run out of scroll, so the sections still below the
      // reach line can never get to it. Light up the one the reader jumped
      // to, or failing that the last one.
      const jumpedTo = elements
        .slice(reachedCount)
        .find((el) => el.id === window.location.hash.slice(1));
      setActiveId((jumpedTo ?? elements.at(-1))?.id ?? null);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Jumping between two sections that are both on screen at the bottom of
    // the page changes the hash without scrolling.
    window.addEventListener("hashchange", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
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
