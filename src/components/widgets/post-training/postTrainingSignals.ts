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
  /** Whose response this is, since two separate models are involved. */
  responseLabel: string;
  /** Who is judging, and what they were asked. */
  verdictLabel: string;
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
      "The model is trained to make responses like the chosen one more likely, and responses like the rejected one less likely. Ratings from people are slow and expensive though, and steering a model takes a great many of them. So the picks are used once, to train a second model that predicts which response a person would have preferred, and that model then scores millions of responses no human ever saw. The whole approach is called RLHF, reinforcement learning from human feedback.",
    note: "Used for InstructGPT and Llama 2. Raters work fast and do not always check the arithmetic, so a confident, friendly wrong answer wins more of these comparisons than it should, and everything trained on those ratings inherits the mistake.",
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
      responseLabel: "Model A's response to the question",
      verdictLabel: "Model B, asked whether Model A's answer followed the constitution",
      response:
        "Percentage discounts trip people up all the time! The trick is to remember that the sale price is a fraction of the original price.",
      verdict: "No. Nothing here gives a price, so it didn't answer the question.",
      passed: false,
    },
    outcome:
      "Judging a response is much easier than producing one, so a model can reliably check work it could not reliably have written. The verdict is then used exactly as a human rating would be, at a fraction of what the same work would cost from a person.",
    note: "Anthropic's Constitutional AI. Model A and Model B are usually two separate runs of the same model, given different jobs. Model A never sees the constitution: it is being trained to follow those rules by default, not told about them at the time. A real constitution has many principles rather than one, and when they change, someone edits the document.",
  },
  {
    id: "usage",
    label: "Watch what real users do",
    intro:
      "Chat products see billions of real conversations, and you can often tell how happy the user is with the model by how they reply to it.",
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
      "This is the highest-volume signal there is. The weakness is that it measures whether the user was pleased rather than whether the answer was right, so leaning on it too hard teaches the model to flatter the user, a failure mode called sycophancy. ",
    note: "Consumer chat products generally do train on conversations unless you opt out; business and API tiers generally do not.",
  },
  {
    id: "checker",
    label: "Check the answer",
    intro:
      "For maths, code and puzzles, a proposed answer can be checked against the question it came from.",
    visual: {
      type: "check",
      prompt:
        "What two whole numbers, other than 1, multiply together to give 8,051?",
      response: "83 and 97.",
      steps: [
        "Take the proposed answer: 83 and 97.",
        "Multiply them: 83 × 97 = 8,051.",
        "That is the number in the question, so the answer is right.",
      ],
      verdict: "Verified. Score 1.",
      passed: true,
    },
    outcome:
      "Finding the answer means hunting for a divisor. Checking it is one multiplication. It is often much easier for a model to check whether an answer is good than to produce a good answer itself.",
    note: "Called reinforcement learning from verifiable rewards, published in detail for DeepSeek-R1. A wrong answer fails just as fast: 89 × 91 comes to 8,099, not 8,051. So the score is a bare 1 or 0 with no opinion in it, and it can be produced millions of times overnight. It only works where an answer can be checked against something, which rules out most of what people ask a chat model. Where it does work, the sheer supply of it is what made reasoning models possible.",
  },
];

export function getApproach(id: string): Approach {
  return approaches.find((a) => a.id === id) ?? approaches[0];
}
