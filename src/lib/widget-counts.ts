import fs from "node:fs";
import path from "node:path";

/**
 * Counts the distinct interactive widgets a chapter's content.mdx renders,
 * by looking for `<SomethingWidget` tags. Runs at build time on the server.
 */
export function getWidgetCount(slug: string): number {
  const file = path.join(process.cwd(), "src/app/(tutorial)", slug, "content.mdx");
  if (!fs.existsSync(file)) return 0;
  const tags = fs.readFileSync(file, "utf8").match(/<[A-Z][A-Za-z0-9]*Widget\b/g);
  return new Set(tags).size;
}
