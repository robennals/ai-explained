import type { ComponentType } from "react";

export interface GlossaryEntryMeta {
  /** Canonical id used in <g term="..."> and as the URL anchor on /glossary. */
  term: string;
  /** Alternate spellings/plurals matched case-insensitively by the lint script. */
  aliases: string[];
  /** One-line summary shown at the top of the popover. */
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
