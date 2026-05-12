# Glossary entry style

Principles for writing glossary entries. The audience is an 11-year-old who has *not* read the chapters or any other glossary entry.

The first batch (`function`, `model`, `parameter`) happened to all be function-shaped concepts, so several conventions below are written as "do X when the term admits it." Don't force them onto terms where they don't fit — examples for *neuron*, *vector*, *training*, *embedding*, etc. will all look different.

## 1. Voice and length

- **Be brief.** Aim for: one defining sentence, a list of examples, and at most one closing line. If you need more, you are probably explaining the chapter, not the term.
- **Write for an 11-year-old who lands on this entry cold.** Don't assume they've read related entries — each entry must stand alone.
- **The body's first sentence must match `short` verbatim, prefixed with "A [term] is …"**. The collapsed card shows `short`; when expanded, the body opens with the same sentence so nothing competes for the "title" role.

## 2. Defining the term

- **Pick the simplest accurate definition.** Resist adding technical caveats that don't universally hold in our domain. Example: don't define a function as "same input, same output, every time" — LLMs sample, so the claim isn't true for terms the reader will encounter later.
- **Use connected vocabulary across entries.** If you have a chain like *parameter* → *model* → *function*, reusing the same words across all three lets readers build a coherent mental model. Look at how related entries phrase things and stay consistent unless you have a reason not to.
- **Don't restate what the examples already show.** If the bullets make a distinction obvious, don't paraphrase it in prose.

## 3. Examples

Every entry must include a list of concrete examples. This is where most of the learning happens. The universal rules:

- **Always include examples.** No exceptions.
- **Make them concrete.** Pick specific cases, not categories. "ChatGPT" beats "a large language model."
- **Range from simple to complex when the concept admits a ladder.** When there's a natural progression from one-parameter to trillion-parameter (or one-dimension to high-dimensional, or one-step to many-step), use it — the spread is part of the lesson. Some concepts don't ladder this way; in those cases, pick examples that show *variety* instead (different shapes, different uses).
- **Make each bullet's subject the example itself, not a subordinate clause about it.** Bad: *"The `m` in `bigger(x) = x · m` — a single parameter."* Good: *"**bigger(x) = x · m** — `m` is the parameter."* Whatever is being illustrated should lead the bullet.
- **One sentence per bullet is usually enough.** If a bullet needs more, ask whether the example is doing too much work.

### When the term is function-shaped

For terms that are themselves functions or operate on functions (`function`, `model`, `parameter`, eventually `loss`, `gradient`, `neuron`, …), use math notation:

- Write each example as `name(input) = expression`. This is more rigorous than English and trains the reader on the notation used in chapter prose.
- Name the function so the output's role is obvious: prefer `lineY(x)` over `line(x)`, `chatReply(messages)` over `chat(message)`.
- Use plural inputs when the real-world case is plural (`chatReply(messages)`, not `chatReply(message)`).
- For cases where the RHS can't honestly be spelled out, write `= something complex`. Don't sketch a fake neural-net expression — it will mislead. The consistent `name(input) = …` shape conveys "this is also a function" without lying about the math.

### When the term is *not* function-shaped

The function-notation rule doesn't fit, e.g., for *vector*, *neuron*, *embedding*, *training loop*. Pick the most natural concrete form:

- A vector: a literal list like `[3, 1, 4]`, then `[red=255, green=128, blue=0]`, then a 768-dim word embedding.
- A neuron: a small picture or a tiny `output = activation(w₁·x₁ + w₂·x₂ + b)` sketch.
- A training step: a short sequence ("see input → compute output → measure error → nudge parameters").

The point of the rule is *show, don't describe*. The format is whatever makes the show land.

## 4. Notation (when math is involved)

- **Bold** the lead expression of an example (`**bigger(x) = x · m**`). Do not use code-quoting (` `` `) for the lead — the inline code box's padding misaligns bullet points.
- Single-letter variable references *inside body sentences* can use code style (`` `m` is the parameter ``) — mid-sentence, they don't disrupt bullet alignment.
- Use `·` for multiplication, not `*`.
- Subscripts (₁, ₂, …) for indexed series; superscripts (², ³) for powers. These read better than `^` or `_` syntax.

If the entry has no math, skip this section's rules entirely.

## 5. Cross-references

- Link to other glossary terms via plain Markdown anchor links: `[function](/glossary#function)`.
- **Never use `<g>` inside an entry.** The auto-wrap plugin already skips files under `src/content/glossary/`; nested popovers would be bad UX.
- Link sparingly. Link the first occurrence of a related term where reading would benefit from following the chain; subsequent mentions stay plain.

## 6. Structure template

```mdx
---
term: <canonical-lowercase>
aliases: [<plural>, <other-forms>]
short: <one-sentence summary — will match the body's opening sentence verbatim>
firstAppearance: <chapter-slug-where-introduced>
---

A **<term>** is <short verbatim>.

- <first example — simplest case, in whatever notation fits>
- <middle example — adds a wrinkle>
- <last example — most complex / most familiar to the reader>

<Optional one-line closing — e.g., naming a notation, or pointing to a tightly-related concept.>
```

## 7. What not to do

- **Don't claim universal properties that aren't.** No "deterministic," no "always returns a number," no "the same every time."
- **Don't repeat or paraphrase `short` in the body.** The opening sentence *is* the short with "A [term] is " in front.
- **Don't add separate subsections** ("How it works", "Why it matters", "History"). The chapter explains; the glossary defines.
- **Don't list synonyms loosely.** True synonyms (matched in chapter prose) belong in `aliases`. Related-but-different concepts get their own entry.
- **Don't reference unpublished chapters.** The /glossary backlinks already filter to ready chapters, but a hand-written link in the body to a 404 chapter is on you.

## 8. Workflow

- Edit the entry MDX under `src/content/glossary/`.
- If frontmatter changed (`term`, `aliases`, `short`, `firstAppearance`), run `pnpm glossary:build` to regenerate the index, and restart the dev server.
- Body edits hot-reload.
- `pnpm glossary:audit` lists every place the new aliases would auto-wrap across chapter MDX. Scan for false positives; silence specific occurrences with `<nog>…</nog>` in the chapter.
