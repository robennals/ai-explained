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
  "A shop sells pens in packs of 4 and 7. What is the largest number of pens you cannot buy exactly?";

export const correctAnswer = "17";

export const attempts: Attempt[] = [
  {
    id: "gave-up",
    trace: [
      "Packs of 4 and 7. I need the largest number that cannot be made.",
      "4, 7, 8, 11, 12, 14, 15, 16... this could go on a while.",
      "There is probably a formula for this. I think it is 4 × 7 = 28.",
    ],
    answer: "28",
    correct: false,
    note: "Reached for a half-remembered formula rather than checking anything.",
  },
  {
    id: "slip",
    trace: [
      "Try each number and see if it can be made from 4s and 7s.",
      "17 = no. 18 = 4+7+7 yes. 19 = 4+4+4+7 yes. 20 = 4×5 yes.",
      "So 17 works, but 21 is 7×3, and I have not checked past 20.",
      "The answer is 21.",
    ],
    answer: "21",
    correct: false,
    note: "Started checking properly, then stopped before the working was finished.",
  },
  {
    id: "short",
    trace: [
      "Formula for two coprime numbers a and b: the largest unmakeable is ab − a − b.",
      "4 × 7 − 4 − 7 = 28 − 11 = 17.",
    ],
    answer: "17",
    correct: true,
    note: "Straight to a formula it knew, and the formula happened to be right.",
  },
  {
    id: "checked",
    trace: [
      "Try to build each number from 4s and 7s.",
      "17: 17−7=10, no. 17−14=3, no. 17 is not a multiple of 4. So 17 cannot be made.",
      "18 = 4+7+7. 19 = 4+4+4+7. 20 = 4×5. 21 = 7×3.",
      "That is four in a row, and every number after can be reached by adding 4 to one of those.",
      "So nothing above 17 is impossible, and 17 is.",
    ],
    answer: "17",
    correct: true,
    note: "Checked its own claim, and then explained why nothing larger could work.",
  },
];

/** Training pushes an attempt up when the answer checks out, and down when it does not. */
export function direction(attempt: Attempt): "up" | "down" {
  return attempt.correct ? "up" : "down";
}

export function countCorrect(list: Attempt[] = attempts): number {
  return list.filter((a) => a.correct).length;
}
