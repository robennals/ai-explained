/**
 * Shapes for the tabbed case-study widgets used in the AI and Society and AI
 * Risk chapters: each tab is a theme, optionally holding several collapsible
 * case studies with their own sources.
 */

export interface Source {
  label: string;
  url: string;
}

export interface Stat {
  value: string;
  caption: string;
}

/** One case study, shown collapsed to its one-line teaser until opened. */
export interface Example {
  title: string;
  teaser: string;
  /** The full story, a few short paragraphs. For a risk, the harm we're worried about. */
  details: string[];
  /** For a risk: the cited evidence that makes it plausible, shown under its own label. */
  evidence?: string[];
  sources: Source[];
}

export interface Case {
  id: string;
  label: string;
  /** Short category shown above the headline, e.g. which kind of bias. */
  tag?: string;
  headline: string;
  stat?: Stat;
  body: string[];
  examples?: Example[];
  takeaway?: string;
  /** How the problem can be corrected, shown in its own box. */
  fix?: string;
  /** Sources for the tab as a whole; examples carry their own. */
  sources: Source[];
}

export interface CaseSet {
  title: string;
  description: string;
  /** Heading for each case's `fix` box; defaults to "How to correct it". */
  fixLabel?: string;
  cases: Case[];
}
