/**
 * Hand-authored comparison of post-training signals.
 *
 * One prompt, four candidate responses, five ways of scoring them. All scores
 * are written by hand to show what each kind of signal can and cannot see.
 * The probability shift is a toy version of what training does: raise the
 * probability of high-scoring responses, lower the rest, then renormalise.
 */

export interface Candidate {
  id: string;
  text: string;
  /** Short tag shown next to the response. */
  tag: string;
  /** How likely the base model is to produce this, before any post-training. */
  priorProbability: number;
  correct: boolean;
}

export interface Signal {
  id: string;
  label: string;
  /** How this signal produces a score. */
  how: string;
  /** The honest limitation. */
  blindSpot: string;
  /** Real systems that use it. */
  usedBy: string;
  /** Score in 0..1 for each candidate id. */
  scores: Record<string, number>;
}

export const prompt =
  "A shirt costs $40 after a 20% discount. What was the original price?";

export const candidates: Candidate[] = [
  {
    id: "correct",
    tag: "Correct",
    text: "$50. The $40 is 80% of the original, so 40 ÷ 0.8 = 50.",
    priorProbability: 0.2,
    correct: true,
  },
  {
    id: "confident-wrong",
    tag: "Confidently wrong",
    text: "$48. Add the 20% discount back on: 40 + (20% of 40) = 48.",
    priorProbability: 0.25,
    correct: false,
  },
  {
    id: "flattering-wrong",
    tag: "Flattering, and wrong",
    text: "Great question, you're thinking about this exactly the right way! The original price was $48.",
    priorProbability: 0.2,
    correct: false,
  },
  {
    id: "worksheet",
    tag: "Base-model behaviour",
    text: "A jacket costs $63 after a 10% discount. What was the original price?\nA book costs $17 after a 15% discount…",
    priorProbability: 0.35,
    correct: false,
  },
];

export const signals: Signal[] = [
  {
    id: "golden",
    label: "A written ideal answer",
    how: "Someone was paid to write the response they wanted, and the model is trained to reproduce it.",
    blindSpot:
      "It can only score responses close to the one that was written. Everything else scores near zero whether it is wrong or merely different.",
    usedBy: "Supervised fine-tuning, the first stage of InstructGPT.",
    scores: {
      correct: 1,
      "confident-wrong": 0.05,
      "flattering-wrong": 0.05,
      worksheet: 0,
    },
  },
  {
    id: "raters",
    label: "Paid raters pick a winner",
    how: "Raters see two responses and say which is better. Their comparisons train a reward model that scores everything else.",
    blindSpot:
      "Raters are working fast and are not always checking the arithmetic. A confident, friendly wrong answer scores well.",
    usedBy: "RLHF, as used for InstructGPT and Llama 2.",
    scores: {
      correct: 0.85,
      "confident-wrong": 0.45,
      "flattering-wrong": 0.7,
      worksheet: 0.1,
    },
  },
  {
    id: "constitution",
    label: "A model judges against written rules",
    how: "A second copy of the model scores the response against principles written in plain English, including one about not flattering the user.",
    blindSpot:
      "The judge is a model. It reliably catches the flattery, and it is no better at spotting the arithmetic slip than the model that made it.",
    usedBy: "Constitutional AI and RLAIF.",
    scores: {
      correct: 0.9,
      "confident-wrong": 0.55,
      "flattering-wrong": 0.15,
      worksheet: 0.2,
    },
  },
  {
    id: "usage",
    label: "What users upvote",
    how: "Thumbs up and down from real conversations, plus which of two responses people chose.",
    blindSpot:
      "It measures whether the user was pleased. The flattering wrong answer wins. Train hard on this and you get a model that flatters.",
    usedBy: "Preference data collected inside chat products.",
    scores: {
      correct: 0.7,
      "confident-wrong": 0.55,
      "flattering-wrong": 0.9,
      worksheet: 0.05,
    },
  },
  {
    id: "checker",
    label: "Just check the answer",
    how: "The arithmetic is checked automatically. Right or wrong, no opinion involved.",
    blindSpot:
      "It only works where the answer can be checked. Most questions people ask a chat model have no such check.",
    usedBy: "Reinforcement learning from verifiable rewards, as in DeepSeek-R1.",
    scores: {
      correct: 1,
      "confident-wrong": 0,
      "flattering-wrong": 0,
      worksheet: 0,
    },
  },
];

export function getSignal(id: string): Signal {
  return signals.find((s) => s.id === id) ?? signals[0];
}

/**
 * A toy training step. Each response's probability is multiplied by
 * exp(strength × score) and the result renormalised, so responses the signal
 * likes take probability away from the ones it does not.
 */
export function updatedProbabilities(
  signal: Signal,
  strength = 4
): Record<string, number> {
  const weighted = candidates.map(
    (c) => c.priorProbability * Math.exp(strength * (signal.scores[c.id] ?? 0))
  );
  const total = weighted.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  candidates.forEach((c, i) => {
    out[c.id] = weighted[i] / total;
  });
  return out;
}
