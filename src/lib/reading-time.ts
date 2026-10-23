import fs from "node:fs";
import path from "node:path";
import { getWidgetCount } from "./widget-counts";

const WORDS_PER_MINUTE = 200;
/** Time a student typically spends trying out one interactive widget. */
const MINUTES_PER_WIDGET = 2;

/** Counts the words a reader sees in MDX source, ignoring tags and imports. */
export function countProseWords(mdx: string): number {
  const prose = mdx
    .replace(/^(import|export) .*$/gm, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>|$\\[\]()]/g, " ");
  return prose.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

/**
 * Estimated minutes for a student to work through a chapter: its prose at
 * reading speed plus a fixed allowance per widget, rounded up to 5 minutes.
 * Runs at build time on the server.
 */
export function getReadingMinutes(slug: string): number {
  const file = path.join(process.cwd(), "src/app/(tutorial)", slug, "content.mdx");
  if (!fs.existsSync(file)) return 0;
  const words = countProseWords(fs.readFileSync(file, "utf8"));
  const minutes = words / WORDS_PER_MINUTE + getWidgetCount(slug) * MINUTES_PER_WIDGET;
  return Math.ceil(minutes / 5) * 5;
}
