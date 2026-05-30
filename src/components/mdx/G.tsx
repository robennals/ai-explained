"use client";

import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  glossaryAliasMap,
  glossaryBySlug,
} from "@/lib/glossary/index.generated";

interface GProps {
  /**
   * Glossary slug (URL-safe id) OR display term. If omitted, the child text is
   * used. Resolved to a slug via the alias map / direct slug match.
   */
  term?: string;
  children: ReactNode;
}

interface GlossaryRenderInfo {
  /** True when we're rendering inside a glossary surface (popover body or /glossary card). */
  inside: boolean;
  /** Slug of the entry being rendered, so we can suppress self-references. */
  currentSlug?: string;
}

const GlossaryRenderContext = createContext<GlossaryRenderInfo>({ inside: false });

/**
 * Signals that `<G>` is rendering inside an interactive element (e.g. a quiz
 * answer button). Both the popover trigger and the inline link are themselves
 * interactive, and nesting interactive content inside a `<button>` is invalid
 * HTML that triggers a hydration error — so here `<G>` renders as plain text.
 */
const GlossaryPlainContext = createContext(false);

export function GlossaryPlainProvider({ children }: { children: ReactNode }) {
  return (
    <GlossaryPlainContext.Provider value={true}>
      {children}
    </GlossaryPlainContext.Provider>
  );
}

/**
 * Wraps content that's being rendered as part of a glossary entry — either
 * inside a popover or on the /glossary appendix page. Causes `<G>` instances
 * inside to render as plain inline links rather than popover triggers (so we
 * don't get nested popovers), and to render as plain text when they reference
 * the entry currently being viewed.
 */
export function GlossaryRenderProvider({
  currentSlug,
  children,
}: {
  currentSlug?: string;
  children: ReactNode;
}) {
  return (
    <GlossaryRenderContext.Provider value={{ inside: true, currentSlug }}>
      {children}
    </GlossaryRenderContext.Provider>
  );
}

function extractText(children: ReactNode): string {
  let out = "";
  Children.forEach(children, (c) => {
    if (typeof c === "string" || typeof c === "number") out += String(c);
  });
  return out.trim();
}

function resolveSlug(input: string): string | null {
  const lookup = input.toLowerCase();
  if (glossaryBySlug[lookup]) return lookup;
  const viaAlias = glossaryAliasMap[lookup];
  if (viaAlias && glossaryBySlug[viaAlias]) return viaAlias;
  return null;
}

/** Pulls the entry slug out of an href like "/glossary#parameter". */
function slugFromHref(href: string | null): string | null {
  if (!href || !href.startsWith("/glossary#")) return null;
  const s = decodeURIComponent(href.slice("/glossary#".length));
  return glossaryBySlug[s] ? s : null;
}

interface NavigatorProps {
  initialSlug: string;
}

function PopoverNavigator({ initialSlug }: NavigatorProps) {
  const [history, setHistory] = useState<string[]>([initialSlug]);
  const currentSlug = history[history.length - 1];
  const previousSlug = history.length > 1 ? history[history.length - 2] : null;
  const entry = glossaryBySlug[currentSlug];
  const Body = entry.Body;
  const bodyRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever we navigate to a different entry — otherwise
  // the new entry opens scrolled to wherever the previous one was.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [currentSlug]);

  function handleBodyClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const a = target.closest("a");
    if (!a) return;
    const next = slugFromHref(a.getAttribute("href"));
    if (!next || next === currentSlug) return;
    e.preventDefault();
    setHistory((h) => [...h, next]);
  }

  function goBack() {
    setHistory((h) => h.slice(0, -1));
  }

  return (
    <div className="glossary-popover-inner">
      {previousSlug && (
        <button
          type="button"
          onClick={goBack}
          className="glossary-popover-back"
          aria-label={`Back to ${glossaryBySlug[previousSlug].term}`}
        >
          <span aria-hidden="true">←</span>
        </button>
      )}
      <div ref={bodyRef} className="glossary-popover-body prose prose-sm max-w-none">
        <div onClick={handleBodyClick}>
          <GlossaryRenderProvider currentSlug={currentSlug}>
            <Body />
          </GlossaryRenderProvider>
        </div>
        <p className="glossary-popover-outlink">
          <Link href={`/glossary#${currentSlug}`}>Open in glossary →</Link>
        </p>
      </div>
    </div>
  );
}

export function G({ term, children }: GProps) {
  const input = term ?? extractText(children);
  const slug = resolveSlug(input);
  const entry = slug ? glossaryBySlug[slug] : undefined;
  const ctx = useContext(GlossaryRenderContext);
  const plain = useContext(GlossaryPlainContext);

  // Inside an interactive element (e.g. a quiz answer button) — render plain
  // text, since neither a nested button nor a nested link is valid HTML.
  if (plain) {
    return <>{children}</>;
  }

  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<G>: no glossary entry for "${input}"`);
    }
    return <>{children}</>;
  }

  // Inside an entry's own context: don't link to ourselves.
  if (ctx.inside && entry.slug === ctx.currentSlug) {
    return <>{children}</>;
  }

  // Inside any glossary surface: render as a plain inline link. In a popover,
  // the navigator intercepts the click and cycles to the target entry; on
  // /glossary, the hash opener expands and scrolls to the target card.
  if (ctx.inside) {
    return <a href={`/glossary#${entry.slug}`}>{children}</a>;
  }

  // Chapter prose context: render as popover trigger.
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
          <PopoverNavigator initialSlug={entry.slug} />
          <Popover.Arrow className="glossary-popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
