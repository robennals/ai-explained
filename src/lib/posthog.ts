import posthog, { type CaptureResult, type Properties } from "posthog-js";

/**
 * PostHog, running alongside Google Analytics while we check its numbers.
 * It runs in cookieless mode: nothing is stored on the reader's device, and
 * PostHog's servers recognise a reader for one day at most (see
 * docs/analytics.md). It loads only where GA does, and only when
 * NEXT_PUBLIC_POSTHOG_KEY is set, so local dev and forks send nothing.
 */

let started = false;

/**
 * Starts PostHog. Called from src/instrumentation-client.ts, which runs before
 * React hydrates, so events from the first render's effects aren't lost.
 */
export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    // Proxied through the site's own domain (see next.config.ts), so ad
    // blockers block it less often.
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    // Includes capture_pageview: "history_change", which records a page view
    // for each move between pages with the site's own links.
    defaults: "2026-08-30",
    cookieless_mode: "always",
    // Makes identify() a no-op, so nothing can attach an id to a reader.
    person_profiles: "never",
    // A page view carries the time spent on, and scroll depth of, the page
    // before it. Page-leave events record the same for the last page of a
    // visit, which is where readers give up.
    capture_pageleave: true,
    // Otherwise only our own track() events. Everything else is off here
    // rather than left to the project settings, which could switch it on.
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    // We use no feature flags, so skip the request that fetches them.
    advanced_disable_flags: true,
    before_send: addVercelEnv,
  });
  started = true;
}

/**
 * Tags every event, including automatic page views, with the deployment it
 * came from. Previews share the production project, so reports filter on it.
 */
export function addVercelEnv(event: CaptureResult): CaptureResult {
  return {
    ...event,
    properties: {
      ...event.properties,
      vercel_env: process.env.NEXT_PUBLIC_VERCEL_ENV,
    },
  };
}

export function sendPostHogEvent(event: string, params: Properties): void {
  if (started) posthog.capture(event, params);
}
