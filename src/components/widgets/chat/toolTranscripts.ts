/**
 * Hand-authored agent loops.
 *
 * Every turn below is a message in one conversation. The model writes the
 * replies and the tool calls; the tools write the results. The product shows
 * the human only the messages between them and the model, which is why an
 * agent looks like it acts when it only ever writes.
 */

export type TurnRole = "user" | "assistant" | "tool-call" | "tool-result";

export interface Turn {
  role: TurnRole;
  /** Display name of the tool, for call and result turns. */
  tool?: string;
  text: string;
}

export interface Scenario {
  id: string;
  /** Tab label. */
  label: string;
  /** One sentence on what this example shows. */
  intro: string;
  turns: Turn[];
  /** Smaller text at the bottom, carrying whatever is not obvious. */
  takeaway: string;
}

export const scenarios: Scenario[] = [
  {
    id: "search",
    label: "Looking something up",
    intro: "The model has no idea what the weather is. It has a tool that does.",
    turns: [
      {
        role: "user",
        text: "Is it going to rain in Bristol this afternoon? I'm cycling home at 6.",
      },
      {
        role: "tool-call",
        tool: "Weather service",
        text: 'get_weather(location="Bristol, UK", hours=12)',
      },
      {
        role: "tool-result",
        tool: "Weather service",
        text: "15:00 cloudy, 10% rain\n17:00 cloudy, 25% rain\n18:00 rain, 70%\n20:00 rain, 60%",
      },
      {
        role: "assistant",
        text: "Take a jacket. It's dry now, but the forecast turns at around 6pm, with a 70% chance of rain right when you'd be setting off. Leaving 45 minutes earlier would probably keep you dry.",
      },
    ],
    takeaway:
      "The forecast was never in the model's weights. It arrived as text and the model read it the same way it read your question. The model did not call anything either: it wrote a message, and the harness made the call on its behalf.",
  },
  {
    id: "code",
    label: "Running code",
    intro:
      "Arithmetic one token at a time is unreliable. Writing code and reading the output is not.",
    turns: [
      {
        role: "user",
        text: "I've got three payments of £1,249.99 and one of £874. What's the total, and what's VAT at 20% on that?",
      },
      {
        role: "tool-call",
        tool: "Python sandbox",
        text: 'run_python("total = 3 * 1249.99 + 874\nprint(total, total * 0.2)")',
      },
      {
        role: "tool-result",
        tool: "Python sandbox",
        text: "4623.97 924.794",
      },
      {
        role: "assistant",
        text: "£4,623.97 in total. VAT at 20% on that is £924.79, giving £5,548.76 including VAT.",
      },
    ],
    takeaway:
      "The model writes the program rather than the answer, then reads the numbers off the transcript. This is why models got much better at arithmetic without anyone making them better at arithmetic: the work moved to a tool that is exact.",
  },
  {
    id: "chained",
    label: "One tool, then another",
    intro:
      "Two round trips before anything appears in the chat window, and the second call could not have been written before the first result arrived.",
    turns: [
      {
        role: "user",
        text: "Did the invoice from Bramley ever get paid?",
      },
      {
        role: "tool-call",
        tool: "Email search",
        text: 'search_email(query="Bramley invoice", limit=5)',
      },
      {
        role: "tool-result",
        tool: "Email search",
        text: 'msg_4471  12 Aug  "Re: Invoice 2214" from accounts@bramley.co.uk\nmsg_4102  28 Jul  "Invoice 2214 attached" to accounts@bramley.co.uk\nmsg_3980  14 Jul  "Quote for July work" from accounts@bramley.co.uk',
      },
      {
        role: "tool-call",
        tool: "Email reader",
        text: 'read_email(id="msg_4471")',
      },
      {
        role: "tool-result",
        tool: "Email reader",
        text: '"Payment of £2,400 went out on the 12th, apologies for the delay. Should be with you Friday."',
      },
      {
        role: "assistant",
        text: "Yes. Bramley replied on 12 August to say the £2,400 payment had gone out that day, apologising for the delay and expecting it to land that Friday.",
      },
    ],
    takeaway:
      "Nothing planned that sequence. The model wrote one call, read the result, and the most likely continuation was a second call using an id that only existed once the first result came back. A loop of one-step decisions like this is most of what people mean when they call a model an agent.",
  },
  {
    id: "broken",
    label: "When a tool fails",
    intro: "A failure arrives as text too, and the model reads it like anything else.",
    turns: [
      {
        role: "user",
        text: "Is it going to rain in Bristol this afternoon? I'm cycling home at 6.",
      },
      {
        role: "tool-call",
        tool: "Weather service",
        text: 'get_weather(location="Bristol, UK", hours=12)',
      },
      {
        role: "tool-result",
        tool: "Weather service",
        text: "Error: ServiceUnavailable — the weather provider did not respond.",
      },
      {
        role: "tool-call",
        tool: "Web search",
        text: 'web_search("Bristol weather forecast this evening")',
      },
      {
        role: "tool-result",
        tool: "Web search",
        text: "metoffice.gov.uk — Bristol: cloudy this afternoon, rain arriving early evening, heaviest 18:00–21:00.",
      },
      {
        role: "assistant",
        text: "The live forecast service is down, so this is from the Met Office page rather than a direct lookup: rain is expected early evening, heaviest between 6 and 9. Take a jacket.",
      },
    ],
    takeaway:
      "Nothing crashed, and nobody wrote a rule about what to do when the weather tool fails. Having read an error, the model's most likely next text was a different tool call. The recovery is prediction.",
  },
];

export function getScenario(id: string): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0];
}

/** Who wrote a turn. */
export function senderLabel(turn: Turn): string {
  switch (turn.role) {
    case "user":
      return "Human";
    case "assistant":
    case "tool-call":
      return "Model";
    case "tool-result":
      return turn.tool ?? "Tool";
  }
}

/** Which of the three actors wrote a turn, for colouring their name. */
export function senderKind(turn: Turn): "human" | "model" | "tool" {
  if (turn.role === "user") return "human";
  if (turn.role === "tool-result") return "tool";
  return "model";
}

/**
 * Whether a turn appears in the chat window. The traffic between the model and
 * the tools is in the same transcript as everything else; the product just
 * does not show it.
 */
export function isVisibleToUser(turn: Turn): boolean {
  return turn.role === "user" || turn.role === "assistant";
}
