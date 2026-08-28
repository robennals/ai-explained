/**
 * Hand-authored agent loop.
 *
 * Every turn below is text in one transcript. The model writes the user turns'
 * replies and the tool calls; the harness writes the tool results. Which of
 * those two wrote a turn is the whole point of the widget.
 */

export type TurnRole = "user" | "assistant" | "tool-call" | "tool-result";

export interface Turn {
  role: TurnRole;
  /** Tool name, for call and result turns. */
  tool?: string;
  text: string;
  /** One-line explanation of what just happened, shown under the turn. */
  note: string;
  /** True when the harness, not the model, produced this turn. */
  fromHarness?: boolean;
}

const question: Turn = {
  role: "user",
  text: "Is it going to rain in Bristol this afternoon? I'm cycling home at 6.",
  note: "Your message is appended to the transcript the model is completing.",
};

const firstCall: Turn = {
  role: "tool-call",
  tool: "get_weather",
  text: 'get_weather(location="Bristol, UK", hours=12)',
  note: "The model writes this instead of writing a reply to you. It is still just predicted text, in a format the harness knows how to read.",
};

const workingTranscript: Turn[] = [
  question,
  firstCall,
  {
    role: "tool-result",
    tool: "get_weather",
    text: "15:00 cloudy, 10% rain\n17:00 cloudy, 25% rain\n18:00 rain, 70%\n20:00 rain, 60%",
    note: "The harness stopped generation, called the weather service, and pasted the result back in as a new turn. The model finds out what happened by reading it.",
    fromHarness: true,
  },
  {
    role: "assistant",
    text: "Take a jacket. It's dry now but the forecast turns at around 6pm, with a 70% chance of rain right when you'd be setting off. Leaving 45 minutes earlier would probably keep you dry.",
    note: "No tool call this time, so the harness stops looping and shows this turn to you.",
  },
];

const brokenTranscript: Turn[] = [
  question,
  firstCall,
  {
    role: "tool-result",
    tool: "get_weather",
    text: "Error: ServiceUnavailable — the weather provider did not respond.",
    note: "The failure arrives as text too. Nothing crashes; the model simply reads an error where it expected a forecast.",
    fromHarness: true,
  },
  {
    role: "tool-call",
    tool: "web_search",
    text: 'web_search("Bristol weather forecast this evening")',
    note: "Having read the error, the model's most likely next text is a different tool call. The recovery is not special handling, it is prediction.",
  },
  {
    role: "tool-result",
    tool: "web_search",
    text: "metoffice.gov.uk — Bristol: Cloudy this afternoon, rain arriving early evening, heaviest 18:00–21:00.",
    note: "A second result, pasted in the same way.",
    fromHarness: true,
  },
  {
    role: "assistant",
    text: "The live forecast service is down, so this is from the Met Office page rather than a direct lookup: rain is expected to arrive early evening, heaviest between 6 and 9. Take a jacket.",
    note: "The model can only tell you what it read. It has no way to check whether the page was current.",
  },
];

export function buildTranscript(broken: boolean): Turn[] {
  return broken ? brokenTranscript : workingTranscript;
}

export const roleLabels: Record<TurnRole, string> = {
  user: "You",
  assistant: "Model",
  "tool-call": "Model writes a tool call",
  "tool-result": "Harness pastes the result back",
};
