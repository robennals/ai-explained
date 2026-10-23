/**
 * Hand-authored base-model / chat-model completions.
 *
 * Nothing here comes from a real model. Each base completion is written to be
 * a plausible continuation of a document that could contain the prompt.
 *
 * Each prompt has two: one you would want and one you would not. That pairing
 * is the point. It is not that some questions get answered and others do not.
 * For almost any prompt both continuations are plausible, and which one you
 * get is not something the base model has any opinion about. Post-training is
 * what puts a thumb on the scale.
 */

export interface CompletionExample {
  id: string;
  /** Short label for the picker, naming the way this one can go wrong. */
  label: string;
  prompt: string;
  /** A continuation you would not want, and why it is plausible anyway. */
  sideways: string;
  /** A continuation you would want. Just as plausible, from the same model. */
  helpful: string;
  /** Why both of them are things this model might write. */
  note: string;
}

export const completionExamples: CompletionExample[] = [
  {
    id: "more-questions",
    label: "It asks more questions",
    prompt: "How do I stop my sourdough starter from going mouldy?",
    sideways: `
How often should I feed my starter?
Why does my starter smell like acetone?
Can I keep a starter in the fridge?

Browse all 47 questions in our Baking forum →`,
    note:
      "Both of these are things this model might write. A question phrased like this appears on pages that answer it, and on forum indexes and FAQ lists full of other questions. Nothing in the model prefers one kind of page to the other.",
    helpful: `Keep the jar clean and scrape the sides down after every feed. Dried streaks above the surface are where mould usually takes hold. Feed it more often if it smells sharp, and use a fresh jar every week or so. If anything fuzzy appears, throw the whole lot out rather than stirring it in.`,
  },
  {
    id: "both-sides",
    label: "It writes your side too",
    prompt: "Can you recommend a book about the Apollo programme?",
    sideways: `
A Man on the Moon by Andrew Chaikin is the one most people start with.

Thanks. Is there anything shorter?

Carrying the Fire, by Michael Collins. About half the length, and he was there.

What about something for a ten-year-old?

Team Moon by Catherine Thimmesh is aimed at that age and is very good on the`,
    note:
      "Both are plausible. Plenty of pages answer this question; plenty of others are whole conversations, and a conversation carries on past the first reply. Nothing has told the model that its turn ends.",
    helpful: `A Man on the Moon by Andrew Chaikin is the usual recommendation. It covers all the crewed missions and draws on interviews with nearly every astronaut who flew. Carrying the Fire, by Michael Collins, is shorter and better written, though it only covers his own flights.`,
  },
  {
    id: "no-stopping",
    label: "It doesn't stop",
    prompt: "What is the tallest mountain in the world?",
    sideways: `
Mount Everest, at 8,849 m, on the border between Nepal and China.

2. K2 — 8,611 m
3. Kangchenjunga — 8,586 m
4. Lhotse — 8,516 m

Share this article    ·    Print    ·    Save

Posted in Geography, Lists. Older post: The 10 deepest lakes on Earth →`,
    note:
      "Both are plausible. The answer is the same in each, and the difference is what comes after it. A web page usually has more page after the answer, and the model has no reason to treat the answer as the end.",
    helpful: `Mount Everest, at 8,849 m above sea level, on the border between Nepal and China. Measured from base to summit rather than from sea level, Mauna Kea is taller, but most of it is underwater.`,
  },
  {
    id: "any-voice",
    label: "It copies whoever wrote the page",
    prompt: "Is it safe to reheat rice?",
    sideways: `
Yeah, rice is fine, I reheat mine two or three times and I've never had a problem.

    Reply · 14

Same, been doing it for twenty years. The whole thing is a myth started by

    Reply · 6

Actually you do have to be careful, my cousin ended up in hospital after a`,
    note:
      "Both are plausible. This question is answered carefully on health pages and confidently, sometimes wrongly, in forum threads. Predicting the likely next words means predicting whoever was likely to have written the page, and nothing prefers the accurate one.",
    helpful: `Reheating rice is safe as long as it was cooled quickly and kept in the fridge. The risk comes from rice left standing at room temperature, where Bacillus cereus spores multiply. Cool it within an hour, keep it no more than a day, and reheat it once until it is steaming throughout.`,
  },
];

export function getExample(id: string): CompletionExample {
  return completionExamples.find((e) => e.id === id) ?? completionExamples[0];
}

/**
 * The text the model is actually completing. A base model is handed the raw
 * prompt. A chat model is handed the same words wrapped in the role markers
 * of a chat template, with the assistant marker left open at the end, which is
 * the arrangement post-training taught it to answer in.
 */
export function buildPrefix(
  example: CompletionExample,
  mode: "base" | "chat"
): string {
  if (mode === "base") return example.prompt;
  return `<|user|>${example.prompt}\n<|assistant|>`;
}
