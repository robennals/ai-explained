#!/usr/bin/env node
/**
 * Reads src/content/glossary/*.mdx, parses frontmatter, scans chapter MDX
 * for occurrences of each term/alias (the same auto-detection logic the
 * remark-glossary build-time plugin uses), and emits
 * src/lib/glossary/index.generated.ts.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRIES_DIR = join(ROOT, "src/content/glossary");
const CHAPTERS_DIR = join(ROOT, "src/app/(tutorial)");
const OUTPUT = join(ROOT, "src/lib/glossary/index.generated.ts");

function listChapterMdxFiles() {
  const slugs = readdirSync(CHAPTERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const out = [];
  for (const slug of slugs) {
    const file = join(CHAPTERS_DIR, slug, "content.mdx");
    try {
      out.push({ slug, text: readFileSync(file, "utf-8") });
    } catch {
      // no content.mdx — skip
    }
  }
  return out;
}

/**
 * Derive the card-summary `short` from the body's first paragraph by
 * stripping the leading "A **term** is " (or "An …", or just "**Term** is")
 * and resolving Markdown links and inline emphasis. Lets each entry be a
 * single source of truth — author writes the opening sentence, the card
 * summary follows automatically.
 */
function deriveShort(content) {
  const para = content.split(/\n\s*\n/)[0]?.trim() ?? "";
  if (!para) return "";
  // Take only the first sentence (up to a sentence-ending punctuation
  // followed by whitespace+capital, or end of paragraph).
  const sentMatch = /^.*?[.!?](?=\s+[A-Z]|\s*$)/.exec(para);
  let s = sentMatch ? sentMatch[0] : para;
  // Drop leading article + bolded term + " is ".
  s = s.replace(/^(?:An?\s+)?\*\*[^*]+\*\*\s+is\s+/i, "");
  // [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // **bold** -> bold, *italic* -> italic
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : "";
}

function parseEntries() {
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".mdx"));
  return files
    .map((f) => {
      const raw = readFileSync(join(ENTRIES_DIR, f), "utf-8");
      const { data, content } = matter(raw);
      if (!data.term) throw new Error(`${f}: missing 'term' in frontmatter`);
      if (!data.firstAppearance) {
        throw new Error(`${f}: missing 'firstAppearance' in frontmatter`);
      }
      const short = data.short || deriveShort(content);
      if (!short) {
        throw new Error(
          `${f}: could not derive 'short' from body. Ensure the body opens with ` +
            `"A **${data.term}** is …" (or "An …" / just "**${data.term}** is …").`,
        );
      }
      return {
        term: data.term,
        aliases: Array.isArray(data.aliases) ? data.aliases : [],
        short,
        firstAppearance: data.firstAppearance,
        illustration: data.illustration,
        importName: data.term.replace(/[^a-zA-Z0-9]/g, "_") + "Body",
        slug: f.replace(/\.mdx$/, ""),
      };
    })
    .sort((a, b) => a.term.localeCompare(b.term));
}

function maskRange(text, start, end) {
  const slice = text.slice(start, end);
  return text.slice(0, start) + slice.replace(/[^\n]/g, " ") + text.slice(end);
}

function maskAll(text, re) {
  let out = text;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(out)) !== null) {
    out = maskRange(out, m.index, m.index + m[0].length);
    re.lastIndex = m.index + m[0].length;
  }
  return out;
}

/**
 * Apply the same masks as the remark plugin: skip code, math, headings,
 * <nog>…</nog>, and the literal text of MDX tag tokens.
 */
function maskMdx(text) {
  let out = text;
  out = maskAll(out, /^---\n[\s\S]*?\n---\n/);
  out = maskAll(out, /```[\s\S]*?```/g);
  out = maskAll(out, /`[^`\n]+`/g);
  out = maskAll(out, /\$\$[\s\S]*?\$\$/g);
  out = maskAll(out, /(?<!\$)\$[^\n$]+\$(?!\$)/g);
  out = maskAll(out, /<nog(\s+[^>]*)?>[\s\S]*?<\/nog>/gi);
  out = maskAll(out, /^#{1,6}[^\n]*$/gm);
  out = maskAll(out, /<\/?[A-Z][A-Za-z0-9]*(?:\s+[^<>]*?)?\/?>/g);
  return out;
}

function buildBacklinks(entries, chapterFiles) {
  if (entries.length === 0) return new Map();
  const aliasMap = new Map(); // alias.toLowerCase() -> canonical term
  for (const e of entries) {
    aliasMap.set(e.term.toLowerCase(), e.term);
    for (const a of e.aliases) aliasMap.set(String(a).toLowerCase(), e.term);
  }
  const sorted = [...aliasMap.keys()].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(
    `(?<![A-Za-z0-9_])(?:${escaped.join("|")})(?![A-Za-z0-9_])`,
    "gi",
  );

  const map = new Map(); // canonical -> Set<chapterSlug>
  for (const e of entries) map.set(e.term, new Set());
  for (const { slug, text } of chapterFiles) {
    const masked = maskMdx(text);
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(masked)) !== null) {
      const canon = aliasMap.get(m[0].toLowerCase());
      map.get(canon).add(slug);
    }
  }
  return map;
}

function emit(entries, backlinks) {
  const lines = [];
  lines.push("// AUTO-GENERATED by scripts/build-glossary-index.mjs — do not edit.");
  lines.push("// Run `pnpm glossary:build` to regenerate.");
  lines.push("");
  lines.push('import type { GlossaryEntry } from "./types";');
  for (const e of entries) {
    lines.push(`import ${e.importName} from "@/content/glossary/${e.slug}.mdx";`);
  }
  lines.push("");
  lines.push("export const glossaryEntries: GlossaryEntry[] = [");
  for (const e of entries) {
    const appeared = JSON.stringify([...(backlinks.get(e.term) ?? new Set())].sort());
    lines.push("  {");
    lines.push(`    term: ${JSON.stringify(e.term)},`);
    lines.push(`    aliases: ${JSON.stringify(e.aliases)},`);
    lines.push(`    short: ${JSON.stringify(e.short)},`);
    lines.push(`    firstAppearance: ${JSON.stringify(e.firstAppearance)},`);
    if (e.illustration) {
      lines.push(`    illustration: ${JSON.stringify(e.illustration)},`);
    }
    lines.push(`    Body: ${e.importName},`);
    lines.push(`    chaptersAppearedIn: ${appeared},`);
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");
  lines.push("export const glossaryByTerm: Record<string, GlossaryEntry> =");
  lines.push("  Object.fromEntries(glossaryEntries.map((e) => [e.term, e]));");
  lines.push("");
  lines.push("export const glossaryAliasMap: Record<string, string> = {");
  for (const e of entries) {
    for (const a of [e.term, ...e.aliases]) {
      lines.push(`  ${JSON.stringify(a.toLowerCase())}: ${JSON.stringify(e.term)},`);
    }
  }
  lines.push("};");
  lines.push("");
  writeFileSync(OUTPUT, lines.join("\n"), "utf-8");
}

const entries = parseEntries();
const chapters = listChapterMdxFiles();
const backlinks = buildBacklinks(entries, chapters);
emit(entries, backlinks);
console.log(
  `Wrote ${entries.length} glossary entries (with backlinks scanned from ${chapters.length} chapters).`,
);
