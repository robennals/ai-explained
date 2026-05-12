# Glossary entry style

Principles for writing glossary entries — distilled from review of the first batch (`function`, `model`, `parameter`). Apply these consistently. The audience is an 11-year-old who has *not* read the chapters or any other glossary entry.

## 1. Voice and length

- **Be brief.** Aim for: one defining sentence, a bulleted list of examples, and at most one closing line. If you need more, you are probably explaining the chapter, not the term.
- **Write for an 11-year-old who lands on this entry cold.** Don't assume they've read related entries — each entry must stand alone.
- **Don't repeat the `short` in the body in different words.** The body's first sentence must match `short` verbatim, prefixed with "A [term] is …". The collapsed card shows `short`; when expanded, the body opens with the same sentence so nothing competes for the "title" role.

## 2. Defining the term

- **Pick the simplest accurate definition.** Resist adding technical caveats that don't universally hold in our domain. Example: don't define a function as "same input, same output, every time" — LLMs sample, so the claim isn't true for an entry the reader will encounter later.
- **Use connected vocabulary.** Definitions should chain: *parameter* is inside a *model*, a *model* is a *function*. Reusing the same words across entries lets readers build a coherent mental model without re-reading the chapters.
- **Don't explain what the notation already shows.** If the example bullets make a distinction obvious (input vs. parameter, simple vs. complex), don't restate it in prose. Trust the reader.

## 3. Examples (the most important part)

Every entry must include a bulleted example list. This is where most of the learning happens.

- **Range from crazy-simple to impressively-complex.** The first bullet should be trivial; the last should be ChatGPT-scale. The spread is the lesson — same idea works at every size.
- **Write each example as a function in math notation: `name(input) = expression`.** This is more rigorous than English prose and trains the reader on the notation used elsewhere in the glossary and chapters.
- **Name the function so the output's role is obvious.** Prefer `lineY(x)` over `line(x)` (the y-coordinate), `chatReply(messages)` over `chat(message)` (the reply). The function name should answer "what does this return?"
- **Use plural inputs when relevant.** `chatReply(messages)` not `chatReply(message)` — chat models read a conversation, not a single line.
- **For abstract cases, write `= something complex` on the right-hand side.** Keeps every bullet in the `name(input) = expression` shape so the reader sees that even ChatGPT is "just a function." Don't try to sketch a real neural-net expression — it will mislead.
- **Make the function definition the subject of each bullet, not a subordinate clause.** Bad: *"The `m` in `bigger(x) = x · m` — a single parameter."* Good: *"**bigger(x) = x · m** — `m` is the parameter."* The function comes first because it's what the reader needs to see.

### Worked progression

```
- bigger(x) = x · m                          # 1 parameter
- lineY(x) = m · x + c                       # 2 parameters
- curveY(x) = a + b · x + c · x² + d · x³    # 4 parameters
- isSpam(email) = something complex          # thousands
- isCat(photo) = something complex           # millions
- chatReply(messages) = something complex    # ~trillion
```

This progression should feel like a deliberate climb. If the term you're defining doesn't admit a progression like this, ask whether examples like these would still illustrate the term — usually they will, by being instances of the thing you're defining.

## 4. Notation and formatting

- **Bold** the function definition (`**bigger(x) = x · m**`). Do *not* use code-quoting (` `` `) for the lead — the inline code box's padding misaligns bullet points.
- Single-letter variable references *inside body sentences* can use code style (`` `m` is the parameter ``) — mid-sentence, they don't disrupt bullet alignment.
- Use `·` for multiplication, not `*`.
- Use subscripts (₁, ₂, …) for indexed series and superscripts (², ³) for powers — they read better than `^` or `_` syntax in glossary bodies.

## 5. Cross-references

- Link to other glossary terms via plain Markdown anchor links: `[function](/glossary#function)`.
- **Never use `<g>` inside an entry.** The auto-wrap plugin already skips files under `src/content/glossary/`, and nested popovers would be bad UX. Cross-links resolve in-popover via the navigator (back-button enabled).
- Link sparingly. Link the first occurrence of a related term where reading would benefit from following the chain; subsequent mentions in the same entry stay plain.

## 6. Structure template

```mdx
---
term: <canonical-lowercase>
aliases: [<plural>, <other-forms>]
short: <one-sentence summary — will match the body's opening sentence verbatim>
firstAppearance: <chapter-slug-where-introduced>
---

A **<term>** is <short verbatim>.

- **trivial-example(x) = …** — what this case shows.
- **medium-example(x) = …** — what this case shows.
- **complex-example(input) = something complex** — what this case shows.

<Optional one-line closing — e.g., naming the notation, or pointing to a tightly-related concept.>
```

## 7. What *not* to do

- **Don't claim universal properties that aren't.** No "same input, same output, every time"; no "deterministic"; no "always returns a number."
- **Don't repeat or paraphrase the `short` in the body.** The opening sentence is *literally* the short with "A [term] is " in front.
- **Don't add a separate "How it works" or "Why it matters" subsection.** The chapter explains; the glossary defines.
- **Don't list synonyms that aren't aliases for matching.** If a word is a *true* synonym used in chapter prose, put it in `aliases`. If it's a related-but-different concept, give it its own entry.
- **Don't reference unpublished chapters in the body.** The render layer filters backlinks to ready chapters, but body cross-links go directly to URLs that may 404.

## 8. Workflow

- Edit the entry MDX file under `src/content/glossary/`.
- If you changed frontmatter (`term`, `aliases`, `short`, `firstAppearance`), run `pnpm glossary:build` to regenerate the index.
- Body edits hot-reload; frontmatter edits need the rebuild and a dev restart.
- Run `pnpm glossary:audit` to see every place the new aliases would auto-wrap across chapter MDX — scan for false positives, silence with `<nog>…</nog>` if needed.
