import { sendGAEvent } from "@next/third-parties/google";
import { getChapter } from "@/lib/curriculum";
import { sendPostHogEvent } from "@/lib/posthog";

/**
 * Typed analytics events, sent to Google Analytics and PostHog. Children use this site, so parameters are
 * limited to chapter slugs, widget names, question numbers, booleans and
 * scores — never names, emails, free text or user ids.
 *
 * docs/analytics.md lists when each event fires and how to read them.
 */

export const GA_ID = "G-4BJPJ1RZR6";

export interface AnalyticsEvents {
  chapter_start: { chapter: string };
  section_reached: { chapter: string; section: string };
  chapter_complete: { chapter: string };
  widget_interact: { chapter: string; widget: string };
  quiz_answer: { chapter: string; question: number; correct: boolean };
  quiz_complete: { chapter: string; score: number; total: number };
  colab_open: { chapter: string };
  educator_page_view: { page: string };
  educator_signup: Record<string, never>;
}

export type AnalyticsEvent = keyof AnalyticsEvents;

/**
 * Whether Google Analytics is loaded on this deployment: production, plus
 * Vercel previews (in debug mode) so new events can be checked in DebugView
 * before they ship. Local dev and tests send nothing.
 */
export function isAnalyticsEnabled(): boolean {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;
  return env === "production" || env === "preview";
}

// GA's init script is injected after hydration, so events fired by the first
// render's effects (chapter_start, mostly) can arrive before `dataLayer`
// exists. They wait here until it does.
const pending: [AnalyticsEvent, object][] = [];
const RETRY_MS = 250;
const MAX_RETRIES = 40;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retries = 0;

function flush() {
  retryTimer = null;
  if (!window.dataLayer) {
    if (retries++ < MAX_RETRIES) retryTimer = setTimeout(flush, RETRY_MS);
    else pending.length = 0;
    return;
  }
  for (const [event, params] of pending.splice(0)) {
    sendGAEvent("event", event, params);
  }
}

export function track<E extends AnalyticsEvent>(
  event: E,
  params: AnalyticsEvents[E],
): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled()) return;
  // PostHog starts before hydration, so unlike GA it needs no queue.
  sendPostHogEvent(event, params);
  pending.push([event, params]);
  if (!retryTimer) flush();
}

/**
 * A guard that answers true the first time it sees each key and false after,
 * for events that fire "once per page load".
 */
export function createOnceGuard(): (key: string) => boolean {
  const seen = new Set<string>();
  return (key) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}

/**
 * The chapter slug for a chapter page's path (`/vectors` → `vectors`), or
 * undefined for anything else — including pages nested under a chapter.
 */
export function chapterFromPathname(pathname: string | null): string | undefined {
  const slug = pathname?.match(/^\/([^/]+)\/?$/)?.[1];
  return slug && getChapter(slug) ? slug : undefined;
}
