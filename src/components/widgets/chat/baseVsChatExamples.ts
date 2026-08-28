/**
 * Hand-authored base-model / chat-model completions.
 *
 * Nothing here comes from a real model. Each base completion is written to be
 * a plausible continuation of a document that could contain the prompt, and
 * the four are chosen to fail in four different ways: wrong kind of document,
 * writing the user's turn as well as its own, not stopping, and copying
 * whoever was likely to have written the page.
 */

export interface CompletionExample {
  id: string;
  /** Short label for the picker, naming the failure rather than the prompt. */
  label: string;
  prompt: string;
  /** What a base model does: continue the document the prompt came from. */
  base: string;
  /** Why that continuation is the likely one. */
  baseNote: string;
  /** What a post-trained chat model does: answer. */
  chat: string;
}

export const completionExamples: CompletionExample[] = [
  {
    id: "more-questions",
    label: "It asks more questions",
    prompt: "How do I stop my sourdough starter from going mouldy?",
    base: `
How often should I feed my starter?
Why does my starter smell like acetone?
Can I keep a starter in the fridge?

Browse all 47 questions in our Baking forum →`,
    baseNote:
      "A question phrased like this appears far more often in a list of other questions, on a forum index or an FAQ page, than it does at the start of an answer.",
    chat: `Mould usually means something other than your starter is growing in the jar. Three things help:

1. Scrape the sides down after each feed. Dried streaks above the surface are where mould normally takes hold.
2. Feed it more often. A hungry starter goes acidic and then weak, and a weak starter loses to mould.
3. Use a clean jar every few feeds rather than topping up the same one for weeks.

If there is fuzzy growth of any colour on the surface, throw the jar out. Stirring it in does not work.`,
  },
  {
    id: "both-sides",
    label: "It writes your side too",
    prompt: "Can you recommend a book about the Apollo programme?",
    base: `
A Man on the Moon by Andrew Chaikin is the one most people start with.

Thanks. Is there anything shorter?

Carrying the Fire, by Michael Collins. About half the length, and he was there.

What about something for a ten-year-old?

Team Moon by Catherine Thimmesh is aimed at that age and is very good on the`,
    baseNote:
      "A conversation is a document with two people in it. Nothing in the text says the model should stop after one reply and wait, so it writes your next message as well, and then answers that too.",
    chat: `A Man on the Moon by Andrew Chaikin is the standard recommendation. It covers all the crewed missions, is based on interviews with almost every astronaut who flew, and reads like narrative rather than history.

If you want something shorter or more personal, Michael Collins wrote Carrying the Fire himself, and it is the best-written book by anyone who went.`,
  },
  {
    id: "no-stopping",
    label: "It doesn't stop",
    prompt: "What is the tallest mountain in the world?",
    base: `
Mount Everest, at 8,849 m, on the border between Nepal and China.

2. K2 — 8,611 m
3. Kangchenjunga — 8,586 m
4. Lhotse — 8,516 m

Share this article    ·    Print    ·    Save

Posted in Geography, Lists. Older post: The 10 deepest lakes on Earth →`,
    baseNote:
      "It gets the answer right and then keeps going, because the page it landed in was a listicle and a page always continues after the first item. Nothing in pre-training marks the end of a reply.",
    chat: `Mount Everest, at 8,849 m above sea level, on the Nepal–China border.

Worth knowing: measured from base to summit rather than from sea level, Mauna Kea in Hawaii is taller at about 10,200 m, though most of it is underwater.`,
  },
  {
    id: "any-voice",
    label: "It copies whoever wrote the page",
    prompt: "Is it safe to reheat rice?",
    base: `
Yeah, rice is fine, I reheat mine two or three times and I've never had a problem.

    Reply · 14

Same, been doing it for twenty years. The whole thing is a myth started by

    Reply · 6

Actually you do have to be careful, my cousin ended up in hospital after a`,
    baseNote:
      "Predicting the likely next words means predicting whoever was likely to have written the page. Confident and wrong is very well represented on the internet, and nothing in pre-training prefers the correct reply to the popular one.",
    chat: `Yes, but the risk is in how it is stored rather than in the reheating. Uncooked rice carries Bacillus cereus spores, which survive cooking and multiply if the rice sits at room temperature.

So: cool it quickly, refrigerate within an hour, use it within a day, and reheat it once, until it is steaming all the way through. Rice left out overnight should be thrown away, and reheating it will not make it safe.`,
  },
];

export function getExample(id: string): CompletionExample {
  return completionExamples.find((e) => e.id === id) ?? completionExamples[0];
}

/**
 * The text the model is actually completing. A base model is handed the raw
 * prompt. A chat model is handed the same words wrapped in the role markers
 * of a chat template, with the assistant marker left open at the end, which is
 * what makes "answer the question" the likely continuation.
 */
export function buildPrefix(
  example: CompletionExample,
  mode: "base" | "chat"
): string {
  if (mode === "base") return example.prompt;
  return `<|user|>${example.prompt}\n<|assistant|>`;
}
