import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "@/lib/analytics";
import { trackQuizAnswer } from "./quizAnalytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

// Three questions whose correct answers are options 0, 2 and 1.
const correctIndices = [0, 2, 1];

beforeEach(() => vi.mocked(track).mockClear());
afterEach(() => vi.mocked(track).mockClear());

describe("trackQuizAnswer", () => {
  it("reports the answer with a 1-based question number", () => {
    trackQuizAnswer({
      chapter: "vectors",
      selectionsBefore: {},
      questionIdx: 1,
      optionIdx: 2,
      correctIndices,
    });
    expect(vi.mocked(track).mock.calls).toEqual([
      ["quiz_answer", { chapter: "vectors", question: 2, correct: true }],
    ]);
  });

  it("reports the score once the last unanswered question is answered", () => {
    trackQuizAnswer({
      chapter: "vectors",
      // Restored from an earlier visit: one right, one wrong.
      selectionsBefore: { 0: 0, 1: 0 },
      questionIdx: 2,
      optionIdx: 1,
      correctIndices,
    });
    expect(vi.mocked(track).mock.calls).toEqual([
      ["quiz_answer", { chapter: "vectors", question: 3, correct: true }],
      ["quiz_complete", { chapter: "vectors", score: 2, total: 3 }],
    ]);
  });

  it("ignores stale answers to questions the quiz no longer has", () => {
    trackQuizAnswer({
      chapter: "vectors",
      selectionsBefore: { 0: 0, 5: 1, 6: 1 },
      questionIdx: 1,
      optionIdx: 0,
      correctIndices,
    });
    expect(vi.mocked(track).mock.calls.map((c) => c[0])).toEqual([
      "quiz_answer",
    ]);
  });
});
