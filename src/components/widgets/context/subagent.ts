export type Who = "user" | "model" | "skill";

export interface Msg {
  who: Who;
  text: string;
  tokens: number;
  /** A skill reused from the cache — free, because it sits at the start. */
  cached?: boolean;
  /** A cached block that had to be recomputed because it is not a prefix here. */
  reprocessed?: boolean;
  /** Throwaway drafting: the mess a task generates. */
  mess?: boolean;
}

/** The editing skill, already in the cache from an earlier use. */
export const SKILL_TOKENS = 1200;

// The ongoing conversation, shared by both tabs, ending on the request that
// needs the skill.
export const MAIN_BASE: Msg[] = [
  { who: "user", text: "Help me with my history essay.", tokens: 20 },
  { who: "model", text: "Happy to help.", tokens: 12 },
  { who: "user", text: "Now tighten the intro, using the editing skill.", tokens: 24 },
];

// Without a subagent, the rest happens in the main context.
export const WITHOUT_TAIL: Msg[] = [
  { who: "skill", text: "Essay-editing skill", tokens: SKILL_TOKENS, reprocessed: true },
  { who: "model", text: "Rewrite attempt A…", tokens: 60, mess: true },
  { who: "model", text: "Rewrite attempt B…", tokens: 60, mess: true },
  { who: "model", text: "Done — a tighter intro.", tokens: 40 },
];

// With a subagent, the main context gains only a hand-off line and the answer.
export const WITH_TAIL: Msg[] = [
  { who: "model", text: "Handing this to a subagent…", tokens: 15 },
  { who: "model", text: "Done — a tighter intro.", tokens: 40 },
];

// The subagent's own context, thrown away when it closes.
export const SUB: Msg[] = [
  { who: "skill", text: "Essay-editing skill — reused from cache", tokens: SKILL_TOKENS, cached: true },
  { who: "user", text: "Rewrite this intro, punchier.", tokens: 20 },
  { who: "model", text: "Rewrite attempt A…", tokens: 60, mess: true },
  { who: "model", text: "Rewrite attempt B…", tokens: 60, mess: true },
  { who: "model", text: "Here it is — a tighter intro.", tokens: 40 },
];

export type CacheState = "idle" | "unusable" | "reused";

export interface Frame {
  label: string;
  /** Messages of the main context revealed (MAIN_BASE + the tab's tail). */
  main: number;
  /** Messages of the subagent context revealed (With tab only). */
  sub: number;
  subOpen: boolean;
  cache: CacheState;
}

const B = MAIN_BASE.length; // 3

export const FRAMES_WITHOUT: Frame[] = [
  {
    label: "You are mid-chat. The editing skill is already in the cache from earlier.",
    main: B,
    sub: 0,
    subOpen: false,
    cache: "idle",
  },
  {
    label:
      "To use the skill now it has to go in here — but it is no longer at the start, so the cache cannot help. The model reprocesses all 1,200 tokens.",
    main: B + 1,
    sub: 0,
    subOpen: false,
    cache: "unusable",
  },
  {
    label: "The messy drafts pile up in your main context too.",
    main: B + 3,
    sub: 0,
    subOpen: false,
    cache: "unusable",
  },
  {
    label: "Answer. Your context is now big — the skill and all the drafts are stuck in it.",
    main: B + 4,
    sub: 0,
    subOpen: false,
    cache: "unusable",
  },
];

export const FRAMES_WITH: Frame[] = [
  {
    label: "Same point in the chat. The skill is in the cache.",
    main: B,
    sub: 0,
    subOpen: false,
    cache: "idle",
  },
  {
    label:
      "The agent spawns a subagent. Its context starts with the skill — a prefix match — so the cached skill is reused for free.",
    main: B + 1,
    sub: 1,
    subOpen: true,
    cache: "reused",
  },
  {
    label: "The subagent does the messy drafting in its own context.",
    main: B + 1,
    sub: 4,
    subOpen: true,
    cache: "reused",
  },
  {
    label: "It reaches the answer.",
    main: B + 1,
    sub: 5,
    subOpen: true,
    cache: "reused",
  },
  {
    label:
      "It returns just the answer and closes. The subagent's context is undone, like a chat continuation you can throw away. Your main context gained only the answer.",
    main: B + 2,
    sub: 0,
    subOpen: false,
    cache: "reused",
  },
];

/** Total tokens sitting in a context. A cached (reused) block costs nothing. */
export function contextTokens(msgs: Msg[]): number {
  return msgs.reduce((sum, m) => sum + (m.cached ? 0 : m.tokens), 0);
}
