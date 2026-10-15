import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendGAEvent } from "@next/third-parties/google";
import { chapterFromPathname, createOnceGuard } from "./analytics";

vi.mock("@next/third-parties/google", () => ({ sendGAEvent: vi.fn() }));

// A fresh copy of the module per test, so events queued by one test can't
// leak into the next.
let track: typeof import("./analytics").track;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  ({ track } = await import("./analytics"));
});

afterEach(() => {
  vi.mocked(sendGAEvent).mockClear();
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
    track("quiz_answer", { chapter: "vectors", question: 2, correct: true });
    expect(sendGAEvent).toHaveBeenCalledWith("event", "quiz_answer", {
      chapter: "vectors",
      question: 2,
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
