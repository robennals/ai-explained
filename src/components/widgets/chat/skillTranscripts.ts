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
        `  tenancy-check  what to look at in a rental agreement
  moving-in      the list of things to do before you get the keys
  letter-writing  how to write to a letting agent`
      ),
      {
        role: "user",
        text: "The agent sent this over: “Either party may end the tenancy on two months' written notice. Rent is payable monthly in advance. The tenant is responsible for all repairs and maintenance.” Should I sign it?",
      },
      { role: "skill-request", text: 'load_skill("tenancy-check")' },
      {
        role: "skill-document",
        text: `Checking a tenancy agreement

Use this when someone is about to sign a rental agreement and wants to know whether it is reasonable.

Work through four things, in this order. How much notice each side has to give. Whether the deposit is protected, and how it comes back. Who pays for repairs. Whether the rent can go up part-way through.

Say what is missing as well as what is there. The clause that is absent is often the bigger problem.`,
      },
      {
        role: "assistant",
        text: "Taking them in order.\n\nNotice: two months either way, which is normal.\n\nDeposit: not mentioned at all. Ask where it will be held and how you get it back.\n\nRepairs: this is the one to push on. As written, you pay for everything, including the boiler and the roof. That is not usual, and much of it is not enforceable anyway.\n\nRent rises: also not mentioned, so ask for a clause saying the rent is fixed for the term.",
      },
    ],
    takeaway:
      "The answer is the checklist, in the checklist's order, including the instruction to say what is absent. Two of the four points are things the agreement never mentions, which the model would have had no reason to raise on its own.",
  },
  {
    id: "chained",
    label: "One skill leading to another",
    turns: [
      offered(
        `  book-a-table  booking somewhere to eat, and how we pick
  family-food   what this family eats
  birthdays     who gets a card, and when`
      ),
      {
        role: "user",
        text: "Book somewhere for Mum and Dad's anniversary on the 14th. Eight of us.",
      },
      { role: "skill-request", text: 'load_skill("book-a-table")' },
      {
        role: "skill-document",
        text: `Booking a table

Use this when someone wants a restaurant booked. Check what the family eats first, with load_skill("family-food").

Then book it using the "book_table" tool, defined as follows:

book_table(
  place:  the name of the restaurant
  date:   when, in whatever form they said it
  people: how many are coming
  notes:  anything the kitchen needs to know
)

For a party of more than six, pick somewhere with a set menu. Put every dietary requirement in the notes. Do not assume the restaurant will ask.`,
      },
      { role: "skill-request", text: 'load_skill("family-food")' },
      {
        role: "skill-document",
        text: familyFood,
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
        text: "Booked: The Old Mill at 7.30 on the 14th, table for eight. They do a set menu, which is easier with that many. I've told the kitchen about the nut allergy, the two who eat fish but not meat, and the coriander.",
      },
    ],
    takeaway:
      "Two skills and a tool. The model only knew to look at what the family eats because the first document told it to, and the allergy reached the restaurant because a second document said never to assume anyone will ask.",
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
