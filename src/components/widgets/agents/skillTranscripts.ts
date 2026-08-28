/**
 * Hand-authored skill loading.
 *
 * A skill is a tool whose result is a page of instructions, so these are
 * ordinary transcripts: the available skills arrive as one line each in the
 * system prompt, and the model asks for the full document only when one looks
 * relevant. Each scenario is written so the reply can be checked against the
 * instructions that came back. Nothing here comes from a real model.
 */

export type SkillTurnRole =
  | "system"
  | "user"
  | "assistant"
  | "skill-request"
  | "skill-document"
  | "tool-call"
  | "tool-result";

export interface SkillTurn {
  role: SkillTurnRole;
  /** Display name of the tool, for call and result turns. */
  tool?: string;
  text: string;
}

export interface SkillScenario {
  id: string;
  /** Tab label. */
  label: string;
  turns: SkillTurn[];
  /** Smaller text at the bottom. */
  takeaway: string;
}

function offered(text: string): SkillTurn {
  return {
    role: "system",
    text: `You have these skills available. Load one with load_skill(name).\n\n${text}`,
  };
}

export const skillScenarios: SkillScenario[] = [
  {
    id: "tool-use",
    label: "Using a tool properly",
    turns: [
      offered(
        `  report-fault  reporting something broken to the council
  bin-day       what goes in which bin, and when they are collected
  bus-times     checking when the next one is`
      ),
      {
        role: "user",
        text: "Can you report the streetlight outside the chemist on Fore Street? It's been out for a week.",
      },
      { role: "skill-request", text: 'load_skill("report-fault")' },
      {
        role: "skill-document",
        text: `Reporting a fault to the council

If something is broken, report it using the "report_fault" tool, defined as follows:

report_fault(
  service: "lighting", "roads", "waste" or "parks"
  street:  the street name on its own, with no number
  detail:  whereabouts on that street, in a few words
  urgent:  true only if somebody could be hurt before it is fixed
)

One dark streetlight is not urgent. A whole dark street is.`,
      },
      {
        role: "tool-call",
        tool: "Council website",
        text: 'report_fault(service="lighting", street="Fore Street",\n             detail="outside the chemist", urgent=false)',
      },
      {
        role: "tool-result",
        tool: "Council website",
        text: "Logged as FS-40118. Lighting faults are fixed within five working days.",
      },
      {
        role: "assistant",
        text: "Reported it. Reference FS-40118, and they fix lighting within five working days. I didn't mark it urgent, since it's one light rather than the whole street being dark.",
      },
    ],
    takeaway:
      "The whole skill is how to use one tool: what the four arguments are called, what they will accept, and one rule about when something counts as urgent. The model had never seen this council's website before.",
  },
  {
    id: "rules",
    label: "Following someone's rules",
    turns: [
      offered(
        `  family-food  what this family eats
  weekly-shop  where we buy what, and roughly what it costs
  birthdays    who gets a card, and when`
      ),
      {
        role: "user",
        text: "What should I cook on Saturday? There'll be eight of us and I'd rather do one thing in the oven.",
      },
      { role: "skill-request", text: 'load_skill("family-food")' },
      {
        role: "skill-document",
        text: `What this family eats

Read this before planning a meal or booking anywhere to eat.

Nobody puts nuts on the table, ever. The allergy is severe.
Two of us are vegetarian, though both of them eat fish.
Nobody likes coriander, so leave it out rather than serving it alongside.
Sunday is the roast, so Saturday should be something else.`,
      },
      {
        role: "assistant",
        text: "How about fish pie? One dish in the oven, feeds eight, and it suits everyone: no nuts, no coriander, and the two who don't eat meat do eat fish. It also leaves the roast for Sunday.",
      },
    ],
    takeaway:
      "No tool involved. The skill is one household's rules, written down once, and every constraint in it shows up in the answer. None of it could have been in the model's weights, because it is true only of this family.",
  },
  {
    id: "chained",
    label: "One skill leading to another",
    turns: [
      offered(
        `  restaurant-search  finding somewhere to eat
  book-a-table       booking a table once you have picked one
  weekly-shop        where we buy what`
      ),
      {
        role: "user",
        text: "Book an Italian place near the office for lunch tomorrow. Four of us.",
      },
      { role: "skill-request", text: 'load_skill("restaurant-search")' },
      {
        role: "skill-document",
        text: `Finding somewhere to eat

Call the "find_restaurants" tool, defined as follows:

find_restaurants(
  area:    where to look
  cuisine: the kind of food
  people:  how many are coming
)

Ignore anything rated below 4.0. Once you have picked one, book it with load_skill("book-a-table").`,
      },
      {
        role: "tool-call",
        tool: "Restaurant finder",
        text: 'find_restaurants(area="near the office", cuisine="Italian", people=4)',
      },
      {
        role: "tool-result",
        tool: "Restaurant finder",
        text: `Trattoria Vera   4.5   10 minute walk, takes bookings
Pizza Nova       3.7   5 minute walk`,
      },
      { role: "skill-request", text: 'load_skill("book-a-table")' },
      {
        role: "skill-document",
        text: `Booking a table

Call the "book_table" tool, defined as follows:

book_table(
  place:  the name of the restaurant
  date:   when, in whatever form they said it
  people: how many are coming
)

Confirm back with the name and the time.`,
      },
      {
        role: "tool-call",
        tool: "Booking site",
        text: 'book_table(place="Trattoria Vera", date="tomorrow 12:30", people=4)',
      },
      {
        role: "tool-result",
        tool: "Booking site",
        text: "Booked. Trattoria Vera, 12:30 tomorrow, table for 4.",
      },
      {
        role: "assistant",
        text: "Booked: Trattoria Vera, 12.30 tomorrow, table for four. Ten minutes from the office. Pizza Nova is closer but only rated 3.7, so I left it.",
      },
    ],
    takeaway:
      "Two small skills, and the model only knew about the second because the first one named it. Neither says much: one gives the search tool and a rule about ratings, the other gives the booking tool and asks it to confirm back.",
  },
];

export function getSkillScenario(id: string): SkillScenario {
  return skillScenarios.find((s) => s.id === id) ?? skillScenarios[0];
}

export function skillSenderLabel(turn: SkillTurn): string {
  switch (turn.role) {
    case "system":
      return "System prompt";
    case "user":
      return "Human";
    case "assistant":
    case "skill-request":
    case "tool-call":
      return "Model";
    case "skill-document":
      return "Skill library";
    case "tool-result":
      return turn.tool ?? "Tool";
  }
}

export function skillSenderKind(
  turn: SkillTurn
): "human" | "model" | "tool" | "system" {
  switch (turn.role) {
    case "system":
      return "system";
    case "user":
      return "human";
    case "skill-document":
    case "tool-result":
      return "tool";
    default:
      return "model";
  }
}

/** Whether a turn is rendered as code rather than prose. */
export function isMonospace(turn: SkillTurn): boolean {
  return turn.role !== "user" && turn.role !== "assistant";
}

/** Only the human's own messages and the model's replies reach the chat window. */
export function isSkillTurnVisible(turn: SkillTurn): boolean {
  return turn.role === "user" || turn.role === "assistant";
}
