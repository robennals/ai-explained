/**
 * Hand-authored walkthroughs of the main post-training approaches.
 *
 * Each approach follows the same shape: a one-line summary of the idea, a
 * minimal illustration of it, and a smaller note underneath for the
 * subtleties. The illustration differs per approach because the approaches
 * genuinely differ. Writing an ideal answer produces no score at all; a rater
 * produces a comparison, not a number; a checker produces a bare pass or fail.
 * Nothing here comes from a real model or a real rater.
 */

export const sharedPrompt =
  "A shirt costs $40 after a 20% discount. What was the original price?";

const correctAnswer =
  "$50. The $40 is 80% of the original price, so 40 ÷ 0.8 = 50.";

const confidentlyWrong =
  "$48. Add the 20% discount back on: 40 + (20% of 40) = 48.";

/** A written response used as the training target. No score involved. */
export interface TargetVisual {
  type: "target";
  prompt: string;
  response: string;
}

/** Two responses, one of which a person chose. */
export interface PairVisual {
  type: "pair";
  prompt: string;
  options: { id: "A" | "B"; response: string }[];
  chosen: "A" | "B";
}

/** A rule, a response, and a model's verdict on whether the rule was met. */
export interface JudgeVisual {
  type: "judge";
  rule: string;
  prompt: string;
  response: string;
  verdict: string;
  passed: boolean;
}

/** Real conversations with the reaction the user gave. */
export interface UsageVisual {
  type: "usage";
  rows: { response: string; reaction: string; up: boolean }[];
}

/** Responses put through an automatic check. */
export interface CheckVisual {
  type: "check";
  prompt: string;
  rows: { response: string; check: string; passed: boolean }[];
}

export type Visual =
  | TargetVisual
  | PairVisual
  | JudgeVisual
  | UsageVisual
  | CheckVisual;

export interface Approach {
  id: string;
  /** Tab label. */
  label: string;
  /** One or two sentences. This is all the prominent text an approach gets. */
  intro: string;
  visual: Visual;
  /** What training does with what the illustration produced. One line. */
  outcome: string;
  /** Smaller text at the bottom: the subtleties and who does this. */
  note: string;
}

export const approaches: Approach[] = [
  {
    id: "ideal",
    label: "Write the ideal answer",
    intro:
      "Pay people to write the response you wanted, and train the model to produce it.",
    visual: {
      type: "target",
      prompt: sharedPrompt,
      response: correctAnswer,
    },
    outcome:
      "No score is involved. The written text is the target, and training is the same next-word prediction as pre-training.",
    note: "Called supervised fine-tuning, and it is the first stage of InstructGPT. The limit is cost: a person writes every one of these, and a written answer says nothing about the responses nobody wrote.",
  },
  {
    id: "comparison",
    label: "Let a rater pick a winner",
    intro:
      "Show a person two responses to the same question and ask which is better. That is their whole task.",
    visual: {
      type: "pair",
      prompt: sharedPrompt,
      options: [
        { id: "A", response: confidentlyWrong },
        { id: "B", response: correctAnswer },
      ],
      chosen: "B",
    },
    outcome:
      "The model is trained to make responses like the chosen one more likely, and responses like the rejected one less likely.",
    note: "This is RLHF, used for InstructGPT and Llama 2. In practice the picks train a separate reward model, which then scores responses no person ever saw. Raters work fast and do not always check the arithmetic, so a confident, friendly wrong answer wins more of these than it should.",
  },
  {
    id: "constitution",
    label: "Let the model judge",
    intro:
      "Write the rules down, then have a second copy of the same model check responses against them.",
    visual: {
      type: "judge",
      rule: "The response must actually answer the question it was asked.",
      prompt: sharedPrompt,
      response:
        "Percentage discounts trip people up all the time! The trick is to remember that the sale price is a fraction of the original price.",
      verdict: "No. Nothing here gives a price.",
      passed: false,
    },
    outcome:
      "The verdict is used exactly as a human rating would be, and it costs almost nothing to produce.",
    note: "Anthropic's Constitutional AI. It is the same model doing the judging, given a different job, which works because judging a response is easier than producing one. A real constitution has many principles rather than one. When the rules need to change, someone edits the document.",
  },
  {
    id: "usage",
    label: "Watch what real users do",
    intro:
      "Chat products produce feedback for free: thumbs up and down, which response people picked, what they said next.",
    visual: {
      type: "usage",
      rows: [
        {
          response:
            "Great question, you're thinking about this exactly the right way! The original price was $48.",
          reaction: "Thanks, that's what I got too!",
          up: true,
        },
        {
          response: correctAnswer,
          reaction: "that's not the answer in the back of the book",
          up: false,
        },
      ],
    },
    outcome:
      "Both signals point the same way, and it is the wrong way. The flattering wrong answer gets more likely and the correct one gets less likely.",
    note: "This measures whether the user was pleased, not whether the answer was right. Optimise hard on it and the model learns to flatter, a failure mode called sycophancy.",
  },
  {
    id: "checker",
    label: "Just check the answer",
    intro:
      "For maths, code and puzzles, run the check. Nobody has to judge anything.",
    visual: {
      type: "check",
      prompt: sharedPrompt,
      rows: [
        {
          response: confidentlyWrong,
          check: "Answer given: 48. Expected: 50.",
          passed: false,
        },
        {
          response: correctAnswer,
          check: "Answer given: 50. Expected: 50.",
          passed: true,
        },
      ],
    },
    outcome:
      "A score that costs nothing, cannot be charmed, and can be produced millions of times overnight.",
    note: "Called reinforcement learning from verifiable rewards, published in detail for DeepSeek-R1. It only works where an answer can be checked, which rules out most of what people ask a chat model. Where it does work, the sheer supply of it is what made reasoning models possible.",
  },
];

export function getApproach(id: string): Approach {
  return approaches.find((a) => a.id === id) ?? approaches[0];
}
