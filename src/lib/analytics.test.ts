import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendGAEvent } from "@next/third-parties/google";
import type { CaptureResult } from "posthog-js";
import { chapterFromPathname, createOnceGuard, onFirstSeen } from "./analytics";

vi.mock("@next/third-parties/google", () => ({ sendGAEvent: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn() } }));

// A fresh copy of the module per test, so events queued by one test can't
// leak into the next.
let track: typeof import("./analytics").track;
let initPostHog: typeof import("./posthog").initPostHog;
let addVercelEnv: typeof import("./posthog").addVercelEnv;
let posthog: typeof import("posthog-js").default;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  ({ track } = await import("./analytics"));
  ({ initPostHog, addVercelEnv } = await import("./posthog"));
  ({ default: posthog } = await import("posthog-js"));
});

afterEach(() => {
  vi.mocked(sendGAEvent).mockClear();
  vi.mocked(posthog.init).mockClear();
  vi.mocked(posthog.capture).mockClear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("track", () => {
  it("does nothing on the server", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    track("chapter_start", { chapter: "vectors" });
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("does nothing outside production and previews, even if GA is present", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubGlobal("window", { dataLayer: [] });
    track("chapter_start", { chapter: "vectors" });
    vi.runAllTimers();
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("sends the event once GA is loaded", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    vi.stubGlobal("window", { dataLayer: [] });
    track("quiz_answer", { chapter: "vectors", question: 2, choice: "A", correct: true });
    expect(sendGAEvent).toHaveBeenCalledWith("event", "quiz_answer", {
      chapter: "vectors",
      question: 2,
      choice: "A",
      correct: true,
    });
  });

  it("holds events sent before GA's dataLayer exists, then delivers them in order", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const fakeWindow: { dataLayer?: unknown[] } = {};
    vi.stubGlobal("window", fakeWindow);

    track("chapter_start", { chapter: "vectors" });
    track("section_reached", { chapter: "vectors", section: "intro" });
    expect(sendGAEvent).not.toHaveBeenCalled();

    fakeWindow.dataLayer = [];
    vi.advanceTimersByTime(250);
    expect(vi.mocked(sendGAEvent).mock.calls.map((c) => c[1])).toEqual([
      "chapter_start",
      "section_reached",
    ]);
  });

  it("gives up on held events if GA never loads", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const fakeWindow: { dataLayer?: unknown[] } = {};
    vi.stubGlobal("window", fakeWindow);

    track("chapter_start", { chapter: "vectors" });
    vi.advanceTimersByTime(60_000);
    fakeWindow.dataLayer = [];
    vi.advanceTimersByTime(60_000);
    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});

describe("track, with PostHog", () => {
  it("sends the same event and parameters to PostHog as to GA", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubGlobal("window", { dataLayer: [] });
    initPostHog();
    const params = { chapter: "vectors", question: 2, choice: "A", correct: true };
    track("quiz_answer", params);
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("quiz_answer", params);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "quiz_answer", params);
  });

  it("doesn't wait for GA, which loads later", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubGlobal("window", {});
    initPostHog();
    track("chapter_start", { chapter: "vectors" });
    expect(posthog.capture).toHaveBeenCalledWith("chapter_start", { chapter: "vectors" });
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("does nothing without a project key", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubGlobal("window", { dataLayer: [] });
    initPostHog();
    track("chapter_start", { chapter: "vectors" });
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("does nothing outside production and previews", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubGlobal("window", { dataLayer: [] });
    initPostHog();
    track("chapter_start", { chapter: "vectors" });
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("does nothing on the server", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initPostHog();
    track("chapter_start", { chapter: "vectors" });
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});

describe("initPostHog", () => {
  it("starts PostHog cookieless, through the site's proxy, tagging every event", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initPostHog();
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "/ingest",
        cookieless_mode: "always",
        person_profiles: "never",
        before_send: addVercelEnv,
      }),
    );
  });
});

describe("addVercelEnv", () => {
  it("adds vercel_env and changes nothing else", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    const event: CaptureResult = {
      uuid: "1",
      event: "chapter_start",
      properties: { chapter: "vectors" },
    };
    expect(addVercelEnv(event)).toEqual({
      uuid: "1",
      event: "chapter_start",
      properties: { chapter: "vectors", vercel_env: "preview" },
    });
    expect(event.properties).toEqual({ chapter: "vectors" });
  });
});

describe("createOnceGuard", () => {
  it("says yes to each key only the first time", () => {
    const once = createOnceGuard();
    expect(once("section:intro")).toBe(true);
    expect(once("section:intro")).toBe(false);
    expect(once("section:outro")).toBe(true);
  });

  it("starts fresh for each guard, so a new page visit fires again", () => {
    createOnceGuard()("complete");
    expect(createOnceGuard()("complete")).toBe(true);
  });
});

describe("onFirstSeen", () => {
  // A stand-in for the browser's IntersectionObserver that tests drive by
  // hand: `show(visible)` reports the watched element entering or leaving.
  function fakeObserver() {
    let callback: (entries: { isIntersecting: boolean }[]) => void = () => {};
    let watching = false;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof callback) {
          callback = cb;
        }
        observe() {
          watching = true;
        }
        disconnect() {
          watching = false;
        }
      },
    );
    return {
      // Tests have no DOM, and the fake never reads the element it watches.
      el: {} as Element,
      show: (visible: boolean) => {
        if (watching) callback([{ isIntersecting: visible }]);
      },
    };
  }

  it("fires once, the first time the element comes into view", () => {
    const observer = fakeObserver();
    const onSeen = vi.fn();
    onFirstSeen(observer.el, onSeen);
    observer.show(false);
    expect(onSeen).not.toHaveBeenCalled();
    observer.show(true);
    observer.show(false);
    observer.show(true);
    expect(onSeen).toHaveBeenCalledTimes(1);
  });

  it("stops watching when cleaned up", () => {
    const observer = fakeObserver();
    const onSeen = vi.fn();
    onFirstSeen(observer.el, onSeen)();
    observer.show(true);
    expect(onSeen).not.toHaveBeenCalled();
  });
});

describe("chapterFromPathname", () => {
  it("finds the chapter for a chapter page", () => {
    expect(chapterFromPathname("/vectors")).toBe("vectors");
    expect(chapterFromPathname("/vectors/")).toBe("vectors");
  });

  it("ignores pages that aren't chapters, including pages under one", () => {
    expect(chapterFromPathname("/")).toBeUndefined();
    expect(chapterFromPathname("/debugall")).toBeUndefined();
    expect(chapterFromPathname("/vectors/teach")).toBeUndefined();
    expect(chapterFromPathname(null)).toBeUndefined();
  });
});
