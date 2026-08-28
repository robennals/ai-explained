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

const familyFood = `What this family eats

Read this before planning a meal or booking anywhere to eat.

Nobody puts nuts on the table, ever. The allergy is severe.
Two of us are vegetarian, though both of them eat fish.
Nobody likes coriander, so leave it out rather than serving it alongside.
Sunday is the roast, so Saturday should be something else.`;

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
        text: familyFood,
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
    id: "checklist",
    label: "Working through a checklist",
    turns: [
      offered(
        `  closing-up  what to do at the end of the day
  opening-up  what to do first thing
  cash-up     counting the till and getting it to the bank`
      ),
      {
        role: "user",
        text: "It's my first time locking up on my own tonight. What do I need to do?",
      },
      { role: "skill-request", text: 'load_skill("closing-up")' },
      {
        role: "skill-document",
        text: `Closing up

Use this when someone is shutting the café for the night. Do these in order, because two of them only work that way round.

  1. Chairs up, then mop from the back of the room forwards
  2. Backflush the coffee machine and leave it switched on overnight
  3. Fridges shut, and push the freezer door to check it has caught
  4. Cash out of the till into the safe, and leave the till drawer open
  5. Bins out, but only on a Tuesday or a Thursday
  6. Set the alarm at the panel by the back door, then leave through that door within 30 seconds

Never lock the back door before setting the alarm. You will only have to unlock it again, and the alarm will go off while you do.`,
      },
      {
        role: "assistant",
        text: "In order, because a couple of these only work one way round.\n\n1. Chairs up, then mop from the back of the room forwards, so you're not walking back over it.\n2. Backflush the coffee machine and leave it switched on.\n3. Fridges shut, and give the freezer door a push to check it has caught.\n4. Cash out of the till into the safe. Leave the drawer open.\n5. Bins out only if it's Tuesday or Thursday. Any other night, leave them.\n6. Last thing: set the alarm at the panel by the back door, then out through that door within 30 seconds.\n\nDon't lock the back door before you set the alarm, or you'll have to unlock it again with the alarm going off.",
      },
    ],
    takeaway:
      "Every step here is particular to one café, and two of them are ordering rules: mop back to front, and set the alarm before you lock up. Without the document the model would write a confident, generic closing-up list and get both of them wrong.",
  },
  {
    id: "chained",
    label: "One skill leading to another",
    turns: [
      offered(
        `  book-a-table       booking somewhere to eat
  restaurant-search  finding somewhere that suits
  family-food        what this family eats`
      ),
      {
        role: "user",
        text: "Book somewhere for Mum and Dad's anniversary on the 14th. Eight of us.",
      },
      { role: "skill-request", text: 'load_skill("book-a-table")' },
      {
        role: "skill-document",
        text: `Booking a table

Use this when someone wants a table booked. Check what the family eats first, with load_skill("family-food"), then find somewhere with load_skill("restaurant-search").

Book it using the "book_table" tool, defined as follows:

book_table(
  place:  the name of the restaurant
  date:   when, in whatever form they said it
  people: how many are coming
  notes:  anything the kitchen needs to know
)

Put every dietary requirement in the notes. Do not assume the restaurant will ask.`,
      },
      { role: "skill-request", text: 'load_skill("family-food")' },
      { role: "skill-document", text: familyFood },
      { role: "skill-request", text: 'load_skill("restaurant-search")' },
      {
        role: "skill-document",
        text: `Finding somewhere that suits

Use this to find a restaurant. Call the "find_restaurants" tool, defined as follows:

find_restaurants(
  area:   where to look, as a place name
  people: how many are coming
  needs:  dietary requirements, in plain words
)

Results come back in rating order. Do not suggest anywhere below 4.0, or anywhere that says no large groups. For more than six, prefer somewhere with a set menu.`,
      },
      {
        role: "tool-call",
        tool: "Restaurant finder",
        text: 'find_restaurants(area="town centre", people=8,\n                 needs="severe nut allergy, two vegetarians who eat fish")',
      },
      {
        role: "tool-result",
        tool: "Restaurant finder",
        text: `The Old Mill     4.6  set menu, groups up to 20, nut-free kitchen
Saffron House    4.4  no large groups
The Anchor       3.8  set menu, groups welcome`,
      },
      {
        role: "tool-call",
        tool: "Booking site",
        text: 'book_table(place="The Old Mill", date="14th", people=8,\n           notes="Severe nut allergy, please keep nuts off the table.\n                  Two vegetarians who do eat fish. No coriander.")',
      },
      {
        role: "tool-result",
        tool: "Booking site",
        text: "Booked. The Old Mill, 19:30 on the 14th, table for 8. Notes sent to the kitchen.",
      },
      {
        role: "assistant",
        text: "Booked: The Old Mill at 7.30 on the 14th, table for eight. It was the only one of the three that takes a group that size and has a nut-free kitchen, and it does a set menu. I've told them about the allergy, the two who eat fish but not meat, and the coriander.",
      },
    ],
    takeaway:
      "Three skills and two tools, and the model only knew to load two of those skills because the first one told it to. The allergy travelled from a household document, through a restaurant search, into the note the kitchen will read.",
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
