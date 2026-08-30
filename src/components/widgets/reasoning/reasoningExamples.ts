/**
 * Hand-authored reasoning traces.
 *
 * The traces are written to look like what reasoning models actually produce:
 * plain first-person working, false starts included, not a tidy proof. They
 * are illustrations, not transcripts from a real model.
 */

export interface ReasoningExample {
  id: string;
  label: string;
  question: string;
  /** The hidden working, one line per step. */
  trace: string[];
  answer: string;
}

export const reasoningExamples: ReasoningExample[] = [
  {
    id: "bat",
    label: "Bat and ball",
    question:
      "A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much does the ball cost?",
    trace: [
      "Ball = x, bat = x + 1.00.",
      "So x + (x + 1.00) = 1.10, which gives 2x = 0.10, so x = 0.05.",
      "The obvious answer is 10 cents, but check it: if the ball is 0.10 the bat is 1.10 and the total is 1.20. Too much.",
      "Check 0.05: bat is 1.05, total is 1.10, and the difference is exactly 1.00. That works.",
    ],
    answer: "5 cents. The bat is then $1.05, which is $1.00 more, and the two add to $1.10.",
  },
  {
    id: "letters",
    label: "Counting letters",
    question: "How many times does the letter r appear in the word strawberry?",
    trace: [
      "I can't see the letters directly. The word arrives as one or two tokens, so I have to write it out a letter at a time and number them as I go.",
      "1: s\n2: t\n3: r\n4: a\n5: w\n6: b\n7: e\n8: r\n9: r\n10: y",
      "Now pick out the r's: 3, 8 and 9.",
      "That is three of them.",
    ],
    answer: "Three. s-t-r-a-w-b-e-r-r-y has an r in the middle and two together near the end.",
  },
  {
    id: "recipe",
    label: "Scaling a recipe",
    question:
      "A rice dish for 4 people needs 300g of rice and takes 25 minutes. What do I need for 6 people?",
    trace: [
      "6 people is 1.5 times 4, so the rice is 300 × 1.5 = 450g.",
      "Do the same to the time? 25 × 1.5 = 37.5 minutes.",
      "That is wrong. Rice cooks by absorbing water, and the cooking time depends on the depth in the pan, not the total quantity.",
      "So the time stays roughly the same. Maybe a few minutes longer if the pan is now crowded.",
    ],
    answer:
      "450g of rice, and about the same 25 minutes. Cooking time does not scale with quantity here, though you may need a wider pan.",
  },
];

export function getReasoningExample(id: string): ReasoningExample {
  return (
    reasoningExamples.find((e) => e.id === id) ?? reasoningExamples[0]
  );
}
