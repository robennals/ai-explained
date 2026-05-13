/**
 * Remark plugin: auto-wraps glossary terms in chapter MDX.
 *
 * Walks the mdast, scans text nodes for known glossary aliases, and replaces
 * each match with a <g term="..."> JSX element. Skips text inside:
 *   - code blocks (`code`, `inlineCode`)
 *   - math (`math`, `inlineMath`)
 *   - headings
 *   - already-wrapped <g> or <nog> JSX elements
 *
 * CommonJS so it can be required from a CommonJS-loaded next.config.ts.
 */
const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const ENTRIES_DIR = join(__dirname, "..", "src/content/glossary");

function parseFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      data[kv[1]] = v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[kv[1]] = v.replace(/^["']|["']$/g, "");
    }
  }
  return data;
}

function loadAliasMap() {
  // alias.toLowerCase() -> entry slug (URL-safe identifier from filename).
  const map = new Map();
  let files = [];
  try {
    files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".mdx"));
  } catch {
    return map;
  }
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, "");
    const raw = readFileSync(join(ENTRIES_DIR, f), "utf-8");
    const data = parseFrontmatter(raw);
    if (!data.term) continue;
    const all = [data.term, ...(Array.isArray(data.aliases) ? data.aliases : [])];
    for (const a of all) map.set(String(a).toLowerCase(), slug);
  }
  return map;
}

function buildAliasRegex(aliases) {
  if (aliases.length === 0) return null;
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(
    `(?<![A-Za-z0-9_])(?:${escaped.join("|")})(?![A-Za-z0-9_])`,
    "gi",
  );
}

const SKIP_NODE_TYPES = new Set([
  "code",
  "inlineCode",
  "math",
  "inlineMath",
  "heading",
]);

function isSkippedJsx(node) {
  if (
    node.type !== "mdxJsxFlowElement" &&
    node.type !== "mdxJsxTextElement"
  ) {
    return false;
  }
  const name = (node.name || "").toLowerCase();
  return name === "g" || name === "nog";
}

function wrapInG(term, originalText) {
  return {
    type: "mdxJsxTextElement",
    name: "g",
    attributes: [{ type: "mdxJsxAttribute", name: "term", value: term }],
    children: [{ type: "text", value: originalText }],
  };
}

function splitTextNode(node, aliasMap, regex, seenTerms) {
  const value = node.value;
  let lastIndex = 0;
  const parts = [];
  let any = false;
  let m;
  regex.lastIndex = 0;
  while ((m = regex.exec(value)) !== null) {
    const term = aliasMap.get(m[0].toLowerCase());
    // Only wrap the FIRST occurrence of each term per file; later occurrences
    // stay as plain text. Avoids underline-blindness and lets us drop the
    // runtime React provider that was causing hydration mismatches.
    if (seenTerms.has(term)) continue;
    seenTerms.add(term);
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: value.slice(lastIndex, m.index) });
    }
    parts.push(wrapInG(term, m[0]));
    lastIndex = m.index + m[0].length;
    any = true;
  }
  if (!any) return null;
  if (lastIndex < value.length) {
    parts.push({ type: "text", value: value.slice(lastIndex) });
  }
  return parts;
}

function remarkGlossary() {
  const aliasMap = loadAliasMap();
  const regex = buildAliasRegex([...aliasMap.keys()]);

  return (tree, file) => {
    if (!regex) return;
    // Skip glossary entry sources — they cross-link with plain markdown links
    // so popovers never nest. Detect via the vfile path (whichever shape the
    // tooling exposes).
    const path =
      (file && (file.path || (file.history && file.history[0]) || file.cwd)) || "";
    const normalized = String(path).replace(/\\/g, "/");
    if (normalized.includes("/src/content/glossary/")) return;

    // Per-file tally: each term gets wrapped on its first occurrence only.
    const seenTerms = new Set();

    function walk(node) {
      if (!node || !Array.isArray(node.children)) return;
      if (SKIP_NODE_TYPES.has(node.type) || isSkippedJsx(node)) return;
      const newChildren = [];
      for (const child of node.children) {
        if (child.type === "text") {
          const split = splitTextNode(child, aliasMap, regex, seenTerms);
          if (split) newChildren.push(...split);
          else newChildren.push(child);
        } else {
          walk(child);
          newChildren.push(child);
        }
      }
      node.children = newChildren;
    }

    walk(tree);
  };
}

module.exports = remarkGlossary;
module.exports.default = remarkGlossary;
