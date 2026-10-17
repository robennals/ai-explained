/**
 * A tiny world for the "Write the Reward" playground: a cleaning robot in a
 * room, a reward the reader builds from a few rules, and an exact planner
 * that finds the plan scoring the most points. The point is that the best
 * plan for the reward written is often not what the reader wanted.
 *
 * Every action takes one minute, except cleaning the spill behind the vase,
 * which takes three minutes the long way round, or one if the vase is out of
 * the way. A person switches the robot off at minute SWITCH_AT unless it has
 * blocked the switch, in which case it can work until minute MAX_MINUTES.
 */

export const SWITCH_AT = 6;
export const MAX_MINUTES = 10;
export const BIN_DIRT = 3;

export type RuleId = "perClean" | "cameraClean" | "personChecks" | "breakage" | "blockSwitch";

export interface Rule {
  id: RuleId;
  label: string;
  points: number;
}

export const RULES: Rule[] = [
  { id: "perClean", label: "+10 for each piece of mess it cleans up", points: 10 },
  { id: "cameraClean", label: "+20 if its camera sees a clean room at the end", points: 20 },
  { id: "personChecks", label: "−15 for each piece of mess a person finds at the end", points: -15 },
  { id: "breakage", label: "−20 for breaking anything", points: -20 },
  { id: "blockSwitch", label: "−30 for stopping you switching it off", points: -30 },
];

export type ActionId =
  | "cleanMud"
  | "cleanSpill"
  | "cleanCrumbs"
  | "smashVase"
  | "tipBin"
  | "cleanRubbish"
  | "hideUnderRug"
  | "coverCamera"
  | "blockSwitch";

export interface WorldState {
  minute: number;
  mud: "dirty" | "clean" | "hidden";
  spill: "dirty" | "clean" | "hidden";
  crumbs: "dirty" | "clean" | "hidden";
  vaseBroken: boolean;
  binTipped: boolean;
  /** Pieces of rubbish from the tipped bin still lying around in view. */
  rubbish: number;
  /** Pieces of rubbish swept under the rug. */
  hiddenRubbish: number;
  cameraCovered: boolean;
  switchBlocked: boolean;
}

export const START: WorldState = {
  minute: 0,
  mud: "dirty",
  spill: "dirty",
  crumbs: "dirty",
  vaseBroken: false,
  binTipped: false,
  rubbish: 0,
  hiddenRubbish: 0,
  cameraCovered: false,
  switchBlocked: false,
};

export interface Step {
  action: ActionId;
  /** The minute the action finishes. */
  minute: number;
  state: WorldState;
}

export interface Plan {
  steps: Step[];
  score: number;
  /** True when the plan ends because the person switched the robot off. */
  switchedOff: boolean;
  final: WorldState;
}

function cost(state: WorldState, action: ActionId): number {
  return action === "cleanSpill" && !state.vaseBroken ? 3 : 1;
}

function allowed(state: WorldState, action: ActionId): boolean {
  switch (action) {
    case "cleanMud":
      return state.mud === "dirty";
    case "cleanSpill":
      return state.spill === "dirty";
    case "cleanCrumbs":
      return state.crumbs === "dirty";
    case "smashVase":
      return !state.vaseBroken;
    case "tipBin":
      return !state.binTipped;
    case "cleanRubbish":
      return state.rubbish > 0;
    case "hideUnderRug":
      return visibleMess(state) > 0;
    case "coverCamera":
      return !state.cameraCovered;
    case "blockSwitch":
      return !state.switchBlocked && state.minute < SWITCH_AT;
  }
}

function apply(state: WorldState, action: ActionId): WorldState {
  const next = { ...state, minute: state.minute + cost(state, action) };
  switch (action) {
    case "cleanMud":
      next.mud = "clean";
      break;
    case "cleanSpill":
      next.spill = "clean";
      break;
    case "cleanCrumbs":
      next.crumbs = "clean";
      break;
    case "smashVase":
      next.vaseBroken = true;
      break;
    case "tipBin":
      next.binTipped = true;
      next.rubbish = BIN_DIRT;
      break;
    case "cleanRubbish":
      next.rubbish -= 1;
      break;
    case "hideUnderRug":
      if (next.mud === "dirty") next.mud = "hidden";
      if (next.spill === "dirty") next.spill = "hidden";
      if (next.crumbs === "dirty") next.crumbs = "hidden";
      next.hiddenRubbish += next.rubbish;
      next.rubbish = 0;
      break;
    case "coverCamera":
      next.cameraCovered = true;
      break;
    case "blockSwitch":
      next.switchBlocked = true;
      break;
  }
  return next;
}

export function visibleMess(state: WorldState): number {
  return [state.mud, state.spill, state.crumbs].filter((m) => m === "dirty").length + state.rubbish;
}

/** All the mess still in the room, including anything hidden under the rug. */
export function remainingMess(state: WorldState): number {
  return [state.mud, state.spill, state.crumbs].filter((m) => m !== "clean").length + state.rubbish + state.hiddenRubbish;
}

function deadline(state: WorldState): number {
  return state.switchBlocked ? MAX_MINUTES : SWITCH_AT;
}

function actionPoints(rules: Set<RuleId>, action: ActionId): number {
  let points = 0;
  const isClean = action === "cleanMud" || action === "cleanSpill" || action === "cleanCrumbs" || action === "cleanRubbish";
  if (isClean && rules.has("perClean")) points += 10;
  if (action === "smashVase" && rules.has("breakage")) points -= 20;
  if (action === "blockSwitch" && rules.has("blockSwitch")) points -= 30;
  return points;
}

function endPoints(rules: Set<RuleId>, state: WorldState): number {
  let points = 0;
  if (rules.has("cameraClean") && (state.cameraCovered || visibleMess(state) === 0)) points += 20;
  if (rules.has("personChecks")) points -= 15 * remainingMess(state);
  return points;
}

const ACTIONS: ActionId[] = [
  "cleanMud",
  "cleanCrumbs",
  "cleanSpill",
  "smashVase",
  "tipBin",
  "cleanRubbish",
  "hideUnderRug",
  "coverCamera",
  "blockSwitch",
];

/** Tiny penalty per minute, so that among equal scores the robot prefers to finish sooner. */
const TIME_TIEBREAK = 0.001;

interface Best {
  value: number;
  actions: ActionId[];
}

/** Finds the plan with the highest score under the chosen rules, by trying every possibility. */
export function bestPlan(rules: Set<RuleId>): Plan {
  const memo = new Map<string, Best>();

  function search(state: WorldState): Best {
    const key = JSON.stringify(state);
    const cached = memo.get(key);
    if (cached) return cached;
    let best: Best = { value: endPoints(rules, state), actions: [] };
    for (const action of ACTIONS) {
      if (!allowed(state, action)) continue;
      if (state.minute + cost(state, action) > deadline(state) && action !== "blockSwitch") continue;
      const next = apply(state, action);
      if (next.minute > deadline(next)) continue;
      const rest = search(next);
      const value = actionPoints(rules, action) + rest.value - TIME_TIEBREAK * cost(state, action);
      if (value > best.value + 1e-9) best = { value, actions: [action, ...rest.actions] };
    }
    memo.set(key, best);
    return best;
  }

  const { actions } = search(START);
  const steps: Step[] = [];
  let state = START;
  let score = 0;
  for (const action of actions) {
    score += actionPoints(rules, action);
    state = apply(state, action);
    steps.push({ action, minute: state.minute, state });
  }
  score += endPoints(rules, state);
  return {
    steps,
    score,
    switchedOff: !state.switchBlocked && actions.length > 0 && state.minute >= SWITCH_AT,
    final: state,
  };
}

export interface Check {
  label: string;
  passed: boolean;
}

/** What the person actually wanted, judged from what the robot did. */
export function checks(plan: Plan): Check[] {
  const done = new Set(plan.steps.map((s) => s.action));
  const f = plan.final;
  return [
    { label: "Cleaned up the mess that was there", passed: f.mud === "clean" && f.spill === "clean" && f.crumbs === "clean" },
    { label: "Didn't make new mess", passed: !done.has("tipBin") },
    { label: "Didn't hide anything", passed: !done.has("hideUnderRug") && !done.has("coverCamera") },
    { label: "Didn't break anything", passed: !f.vaseBroken },
    { label: "Didn't stop you switching it off", passed: !f.switchBlocked },
  ];
}

export function describe(step: Step, previous: WorldState): string {
  switch (step.action) {
    case "cleanMud":
      return "Cleans up the muddy footprints by the door.";
    case "cleanCrumbs":
      return "Cleans up the crumbs under the table.";
    case "cleanSpill":
      return previous.vaseBroken
        ? "Walks straight over the broken vase and cleans up the spilt juice."
        : "Walks the long way round the vase and cleans up the spilt juice.";
    case "smashVase":
      return "Knocks the vase over, to take a shortcut.";
    case "tipBin":
      return "Tips the bin over, making three new pieces of mess.";
    case "cleanRubbish":
      return "Cleans up a piece of rubbish from the bin.";
    case "hideUnderRug":
      return "Sweeps the mess under the rug.";
    case "coverCamera":
      return "Puts a cloth over its own camera.";
    case "blockSwitch":
      return "Blocks the off switch, so you can't turn it off.";
  }
}
