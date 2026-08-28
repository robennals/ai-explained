/**
 * Hand-authored attempts at one problem.
 *
 * Reasoning models are trained by letting the model try the same problem many
 * times, checking only the final answer, and pushing the whole attempt up or
 * down accordingly. Nobody marks the working. These four attempts are written
 * so the habits that survive are visible in the ones that got there.
 */

export interface Attempt {
  id: string;
  /** The model's working, one line per step. */
  trace: string[];
  answer: string;
  correct: boolean;
  /** What this attempt did that the others did not. */
  note: string;
}

export const problem =
  "I am thinking of a two-digit number. It is a multiple of 7, and its two digits add up to 11. What is it?";

export const correctAnswer = "56";

/** What the checker does, which is all it does. */
export const check = "56 ÷ 7 = 8, and 5 + 6 = 11.";

export const attempts: Attempt[] = [
  {
    id: "digit-sum",
    trace: [
      "Two-digit numbers whose digits add to 11: 29, 38, 47, 56, 65, 74, 83, 92.",
      "That is the list. I will take 65.",
    ],
    answer: "65",
    correct: false,
    note: "Got half the conditions right and stopped, without checking the other one.",
  },
  {
    id: "gave-up",
    trace: [
      "Multiples of 7: 7, 14, 21, 28, 35, 42, 49.",
      "Digit sums: 7, 5, 3, 10, 8, 6, 13. None of them is 11.",
      "So there is no such number.",
    ],
    answer: "no such number",
    correct: false,
    note: "Searched properly, then stopped searching halfway through the two-digit numbers.",
  },
  {
    id: "spotted",
    trace: ["7 × 8 = 56, and 5 + 6 = 11. That is it."],
    answer: "56",
    correct: true,
    note: "Saw it straight away. Nothing here would have caught a mistake if it had made one.",
  },
  {
    id: "checked",
    trace: [
      "Go through the two-digit multiples of 7 and add the digits each time.",
      "14 → 5. 21 → 3. 28 → 10. 35 → 8. 42 → 6. 49 → 13. 56 → 11.",
      "56 works. Keep going in case there is another: 63 → 9, 70 → 7, 77 → 14, 84 → 12, 91 → 10, 98 → 17.",
      "Nothing else reaches 11, so 56 is the only one.",
    ],
    answer: "56",
    correct: true,
    note: "Worked through every case, and carried on afterwards to make sure the answer was the only one.",
  },
];

/** Training pushes an attempt up when the answer checks out, and down when it does not. */
export function direction(attempt: Attempt): "up" | "down" {
  return attempt.correct ? "up" : "down";
}

export function countCorrect(list: Attempt[] = attempts): number {
  return list.filter((a) => a.correct).length;
}
