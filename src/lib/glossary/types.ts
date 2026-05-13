import type { ComponentType } from "react";

export interface GlossaryEntryMeta {
  /** Display name. May contain spaces ("activation function"). */
  term: string;
  /** URL-safe kebab-case identifier — used in /glossary#<slug> and DOM ids. */
  slug: string;
  /** Alternate spellings/plurals matched case-insensitively by the auto-wrap plugin. */
  aliases: string[];
  /** One-line summary shown on the collapsed glossary card. */
  short: string;
  /** Chapter slug where this term is introduced. */
  firstAppearance: string;
  /** Optional path under /public to an illustration SVG. */
  illustration?: string;
}

export interface GlossaryEntry extends GlossaryEntryMeta {
  /** MDX-compiled body component, rendered inside the popover and on /glossary. */
  Body: ComponentType;
  /** Chapter slugs where the term is wrapped with <g>. Filled by the index build step. */
  chaptersAppearedIn: string[];
}

export interface ChapterBacklink {
  chapter: string;
  /** Anchor on the chapter page that scrolls to the first <g> occurrence. */
  anchor: string;
}
