"use client";

import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { Children, useState, type MouseEvent, type ReactNode } from "react";
import {
  glossaryAliasMap,
  glossaryByTerm,
} from "@/lib/glossary/index.generated";

interface GProps {
  /** Canonical term id. If omitted, the children text is used (lowercased). */
  term?: string;
  children: ReactNode;
}

function extractText(children: ReactNode): string {
  let out = "";
  Children.forEach(children, (c) => {
    if (typeof c === "string" || typeof c === "number") out += String(c);
  });
  return out.trim();
}

/** Pulls the canonical term out of an href like "/glossary#model". */
function termFromHref(href: string | null): string | null {
  if (!href || !href.startsWith("/glossary#")) return null;
  const t = decodeURIComponent(href.slice("/glossary#".length));
  return glossaryByTerm[t] ? t : null;
}

interface NavigatorProps {
  initialTerm: string;
}

function PopoverNavigator({ initialTerm }: NavigatorProps) {
  const [history, setHistory] = useState<string[]>([initialTerm]);
  const currentTerm = history[history.length - 1];
  const previousTerm = history.length > 1 ? history[history.length - 2] : null;
  const entry = glossaryByTerm[currentTerm];
  const Body = entry.Body;

  function handleBodyClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const a = target.closest("a");
    if (!a) return;
    const next = termFromHref(a.getAttribute("href"));
    if (!next || next === currentTerm) return;
    e.preventDefault();
    setHistory((h) => [...h, next]);
  }

  function goBack() {
    setHistory((h) => h.slice(0, -1));
  }

  return (
    <div className="glossary-popover-inner">
      {previousTerm && (
        <button
          type="button"
          onClick={goBack}
          className="glossary-popover-back"
          aria-label={`Back to ${previousTerm}`}
        >
          <span aria-hidden="true">←</span>
        </button>
      )}
      <div className="glossary-popover-body prose prose-sm max-w-none">
        <div onClick={handleBodyClick}>
          <Body />
        </div>
        <p className="glossary-popover-outlink">
          <Link href={`/glossary#${currentTerm}`}>Open in glossary →</Link>
        </p>
      </div>
    </div>
  );
}

export function G({ term, children }: GProps) {
  const lookup = (term ?? extractText(children)).toLowerCase();
  const canonical = term ?? glossaryAliasMap[lookup];
  const entry = canonical ? glossaryByTerm[canonical] : undefined;

  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<G>: no glossary entry for "${lookup}"`);
    }
    return <>{children}</>;
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="glossary-term"
          aria-label={`Glossary: ${entry.term}`}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="glossary-popover"
        >
          <PopoverNavigator initialTerm={entry.term} />
          <Popover.Arrow className="glossary-popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
