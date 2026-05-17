#!/usr/bin/env node
/**
 * Audit script for the auto-glossary linker. Lists every place where the
 * build-time remark plugin would wrap a glossary term, so a human (or an
 * AI agent) can scan for false positives — places where the everyday meaning
 * of a word would get an unwanted popover.
 *
 * Run after editing chapters or glossary entries:
 *   pnpm glossary:audit
 *
 * To silence a specific occurrence, wrap it in <nog>…</nog> in the chapter MDX.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRIES_DIR = join(ROOT, "src/content/glossary");
const CHAPTERS_DIR = join(ROOT, "src/app/(tutorial)");

function loadAliases() {
  const map = new Map();
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".mdx"));
  for (const f of files) {
    const raw = readFileSync(join(ENTRIES_DIR, f), "utf-8");
    const { data } = matter(raw);
    if (!data.term) continue;
    const all = [data.term, ...(Array.isArray(data.aliases) ? data.aliases : [])];
    for (const a of all) map.set(String(a).toLowerCase(), data.term);
  }
  return map;
}

function listChapters() {
  const slugs = readdirSync(CHAPTERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const out = [];
  for (const slug of slugs) {
    const file = join(CHAPTERS_DIR, slug, "content.mdx");
    try {
      out.push({ slug, file, text: readFileSync(file, "utf-8") });
    } catch {
      // No content.mdx — skip.
    }
  }
  return out;
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

function maskMdx(text) {
  let out = text;
  // Frontmatter, code fences, inline code, math, headings, <nog>, MDX tags.
  out = maskAll(out, /^---\n[\s\S]*?\n---\n/);
  out = maskAll(out, /```[\s\S]*?```/g);
  out = maskAll(out, /`[^`\n]+`/g);
  out = maskAll(out, /\$\$[\s\S]*?\$\$/g);
  out = maskAll(out, /(?<!\$)\$[^\n$]+\$(?!\$)/g);
  out = maskAll(out, /<nog(\s+[^>]*)?>[\s\S]*?<\/nog>/gi);
  // Heading lines (single line, starts with one or more #).
  out = maskAll(out, /^#{1,6}[^\n]*$/gm);
  // Strip MDX tag tokens but leave their text content.
  out = maskAll(out, /<\/?[A-Z][A-Za-z0-9]*(?:\s+[^<>]*?)?\/?>/g);
  return out;
}

function lineCol(text, offset) {
  const before = text.slice(0, offset);
  const line = before.split("\n").length;
  const col = offset - before.lastIndexOf("\n");
  return { line, col };
}

function snippet(text, offset, len) {
  const lineStart = text.lastIndexOf("\n", offset) + 1;
  const lineEnd = text.indexOf("\n", offset + len);
  const end = lineEnd === -1 ? text.length : lineEnd;
  const raw = text.slice(lineStart, end);
  const local = offset - lineStart;
  // Highlight the matched span with brackets so the user can scan output.
  return (
    raw.slice(0, local) +
    "[" +
    raw.slice(local, local + len) +
    "]" +
    raw.slice(local + len)
  ).trim();
}

function audit() {
  const aliasMap = loadAliases();
  if (aliasMap.size === 0) {
    console.log("audit: no glossary entries defined.");
    return;
  }
  const sorted = [...aliasMap.keys()].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(
    `(?<![A-Za-z0-9_])(?:${escaped.join("|")})(?![A-Za-z0-9_])`,
    "gi",
  );
  const chapters = listChapters();
  const counts = new Map(); // canonical -> count
  let total = 0;
  for (const { slug, file, text } of chapters) {
    const masked = maskMdx(text);
    let m;
    regex.lastIndex = 0;
    const hits = [];
    while ((m = regex.exec(masked)) !== null) {
      const { line, col } = lineCol(text, m.index);
      const canon = aliasMap.get(m[0].toLowerCase());
      counts.set(canon, (counts.get(canon) ?? 0) + 1);
      total++;
      hits.push({ line, col, match: m[0], canon, ctx: snippet(text, m.index, m[0].length) });
    }
    if (hits.length === 0) continue;
    console.log(`\n# ${relative(ROOT, file)} (${hits.length})`);
    for (const h of hits) {
      console.log(
        `  ${String(h.line).padStart(3)}:${String(h.col).padStart(3)}  ` +
          `${h.canon.padEnd(12)}  ${h.ctx}`,
      );
    }
  }
  console.log("\n# Summary");
  console.log(`  total auto-wraps: ${total}`);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [term, n] of rows) {
    console.log(`  ${String(n).padStart(4)}  ${term}`);
  }
  console.log(
    "\nTo silence a specific occurrence, wrap it in <nog>…</nog> in the MDX.",
  );
}

audit();
