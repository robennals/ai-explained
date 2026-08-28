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

/** A real conversation, and the signal read out of what the user said next. */
export interface UsageVisual {
  type: "usage";
  turns: { role: "user" | "assistant"; text: string }[];
  /** What the pipeline concludes from the last user turn. */
  signal: string;
  good: boolean;
}

/** A proposed solution, and the steps that verify it. */
export interface CheckVisual {
  type: "check";
  prompt: string;
  response: string;
  /** Each step of checking the proposed answer against the question. */
  steps: string[];
  verdict: string;
  passed: boolean;
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
      "The written text is the target, and training is the same next-word prediction as pre-training.",
    note: "Called supervised fine-tuning, and it is the first stage of InstructGPT. The limit is cost: a person writes every one of these, and a written answer says nothing about the responses nobody wrote.",
  },
  {
    id: "comparison",
    label: "Let a rater pick a winner",
    intro:
      "Show a person two responses to the same question and ask which is better.",
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
      "Judging a response is much easier than producing one, so a model can reliably check work it could not reliably have written. The verdict is then used exactly as a human rating would be, at a fraction of what the same work would cost from a person.",
    note: "Anthropic's Constitutional AI. It is the same model doing the judging, given a different job. A real constitution has many principles rather than one. When the rules need to change, someone edits the document.",
  },
  {
    id: "usage",
    label: "Watch what real users do",
    intro:
      "Chat products see millions of real conversations, and users say when a response missed.",
    visual: {
      type: "usage",
      turns: [
        { role: "user", text: sharedPrompt },
        {
          role: "assistant",
          text: "Percentage problems like this come up a lot. The thing to get straight is which price the percentage is being taken off.",
        },
        { role: "user", text: "you didn't answer my question" },
      ],
      signal: "The user said the question was not answered, so that response was a bad one.",
      good: false,
    },
    outcome:
      "Nobody clicked anything. The complaint is ordinary text in the conversation, and a model reading the transcript can tell what it means.",
    note: "This is the highest-volume signal there is, because most people never touch a thumbs-up button but plenty of them say when a reply missed. Consumer chat products generally do train on conversations unless you opt out; business and API tiers generally do not. The risk is that it measures whether the user was pleased rather than whether the answer was right, so leaning on it too hard teaches the model to flatter, a failure mode called sycophancy.",
  },
  {
    id: "checker",
    label: "Check the answer",
    intro:
      "For maths, code and puzzles, a proposed answer can be checked against the question it came from.",
    visual: {
      type: "check",
      prompt:
        "8,051 is the product of two prime numbers. Which two?",
      response: "83 and 97.",
      steps: [
        "Take the proposed answer: 83 and 97.",
        "Multiply them: 83 × 97 = 8,051.",
        "That is the number in the question, and neither 83 nor 97 has any divisor but itself and 1.",
      ],
      verdict: "Verified. Score 1.",
      passed: true,
    },
    outcome:
      "Finding the answer means hunting for a divisor. Checking it is one multiplication that a child could do. That gap is the whole point: a second model, or three lines of code, can grade an answer it would have struggled to produce.",
    note: "Called reinforcement learning from verifiable rewards, published in detail for DeepSeek-R1. A wrong answer fails just as fast: 89 × 91 comes to 8,099, and 91 is not prime anyway. So the score is a bare 1 or 0 with no opinion in it, and it can be produced millions of times overnight. It only works where an answer can be checked against something, which rules out most of what people ask a chat model. Where it does work, the sheer supply of it is what made reasoning models possible.",
  },
];

export function getApproach(id: string): Approach {
  return approaches.find((a) => a.id === id) ?? approaches[0];
}
