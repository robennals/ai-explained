import { track } from "@/lib/analytics";
import { choiceLetter } from "./choiceLetter";

/**
 * Reports a freshly chosen quiz answer, plus `quiz_complete` if it was the
 * last unanswered question. `selectionsBefore` is the question → chosen
 * option map from before this answer.
 */
export function trackQuizAnswer({
  chapter,
  selectionsBefore,
  questionIdx,
  optionIdx,
  correctIndices,
}: {
  chapter: string;
  selectionsBefore: Record<number, number>;
  questionIdx: number;
  optionIdx: number;
  correctIndices: number[];
}) {
  track("quiz_answer", {
    chapter,
    question: questionIdx + 1,
    choice: choiceLetter(optionIdx),
    correct: optionIdx === correctIndices[questionIdx],
  });

  const selections = { ...selectionsBefore, [questionIdx]: optionIdx };
  const allAnswered = correctIndices.every((_, i) => selections[i] != null);
  if (allAnswered) {
    track("quiz_complete", {
      chapter,
      score: correctIndices.filter((c, i) => selections[i] === c).length,
      total: correctIndices.length,
    });
  }
}
