"use client";

import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { getChapter, getChapterRefLabel } from "@/lib/curriculum";
import { ChapterList } from "./ChapterList";

interface ChapterMenuProps {
  /** Called when the user clicks a chapter link. Used by mobile drawer to close itself. */
  onNavigate?: () => void;
}

/**
 * A button naming the current chapter that opens the full chapter list, so
 * the sidebar itself can be given over to the current chapter's sections.
 */
export function ChapterMenu({ onNavigate }: ChapterMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const chapter = getChapter(pathname.slice(1));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label="Switch chapter"
        className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-surface"
      >
        <span className="min-w-0 flex-1 leading-snug">
          {chapter && chapter.section !== "intro" && (
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
              {getChapterRefLabel(chapter)}
            </span>
          )}
          <span className="block text-sm font-medium text-foreground">
            {chapter?.title ?? "Chapters"}
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="scrollbar-autohide z-[70] max-h-[var(--radix-popover-content-available-height)] w-72 max-w-[85vw] overflow-y-auto rounded-lg border border-border bg-background py-4 pr-3 pl-1 shadow-lg"
        >
          <ChapterList
            onNavigate={() => {
              setOpen(false);
              onNavigate?.();
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
