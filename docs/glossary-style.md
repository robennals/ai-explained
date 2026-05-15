# Glossary entry style

Principles for writing glossary entries. The audience is an 11-year-old who has *not* read the chapters or any other glossary entry.

The single highest-leverage rule: **stay grounded in the chapters**. Use the examples, framings, and vocabulary the tutorial already established. Don't invent fresh analogies; readers should feel like the glossary reinforces what the chapters teach, not a parallel version.

## 1. Voice and length

- **Be brief.** Aim for: one defining sentence, a list of examples, and one short closing line. If you need more, you are probably explaining the chapter, not the term.
- **Write for an 11-year-old who lands on this entry cold.** Don't assume they've read related entries — each entry must stand alone.
- **The body's first sentence is the card summary, and it stands alone as its own paragraph.** The collapsed `/glossary` card and the popover header are auto-derived from the body's first sentence by the build script — `short` is *not* a frontmatter field. Write the opening sentence as `A **<term>** is …` (countable), `An **<term>** is …` (vowel), or `**<Term>** is …` (uncountable mass nouns like *training*, *attention*). The script strips the article + bolded term + "is" and uses the rest. **Always put a blank line after the opening sentence** so it's structurally its own paragraph — additional context goes in a separate paragraph below.

## 2. Defining the term

- **Pick the simplest accurate definition.** Resist adding technical caveats that don't universally hold in our domain. Example: don't define a function as "same input, same output, every time" — LLMs sample, so the claim isn't true for terms the reader will encounter later.
- **Reuse the chapter's framing and vocabulary.** Skim the chapters that use the term before writing — the entry should sit comfortably alongside the chapter's wording, not invent a parallel framing. For terms that look like synonyms but actually carry a useful distinction in this tutorial's framing (e.g., *error* = per-example, *loss* = aggregate), give each its own entry and cross-reference them.
- **Use connected vocabulary across entries.** *parameter* sits inside a *model*; *model* is a *function*; *training* shrinks the *error*. Following one chain of links should feel coherent.
- **Don't restate what the examples already show.** If the bullets make a distinction obvious, don't paraphrase it in prose.

## 3. Examples

Every entry must include a list of concrete examples. This is where most of the learning happens.

### Universal rules

- **Always include examples.** No exceptions.
- **Introduce the list with one short sentence saying what it is.** "Some examples:" / "Things you can describe with a vector:" / "There are several ways to think about a neuron:" / "Some common activation functions:". A bare bullet list dropped in after a paragraph leaves the reader guessing whether it's a definition, a categorisation, or examples.
- **Use the chapters' own examples first.** If the chapter's introduction of "error" uses a test score, race time, and restaurant rating, your glossary entry should reuse those. Don't reach for spam filters or other off-tutorial standbys.
- **Make them concrete.** Pick specific cases, not categories. "ChatGPT" beats "a large language model."
- **Build up by complexity of explanation, not just by scale.** "Complexity" here means how far the example is from something the reader already understands. The first bullet must be super-approachable; later bullets can introduce more abstraction or more dimensions or more math.
- **The ladder should track the reader's progress through the tutorial, not just abstract complexity.** Bullet 1 should make sense to someone who hasn't started the tutorial. Later bullets can use ideas from progressively later chapters: pre-tutorial intuition → early-chapter examples (chapter 1 polynomials, optimisation analogies) → mid-tutorial examples (neurons, vectors, embeddings) → late-tutorial / frontier-model scale (transformers, GPT-3 dimensions, ChatGPT). A reader can stop at the bullet where the concepts outrun their progress and return as they cover more chapters. The spread itself is part of the lesson: *"this same idea applies all the way up."*
- **The bold lead should be the thing the bullet is illustrating, not the data structure.** For *vector*, bold "A point in 2D space", not "[3, 1]"; for *function*, bold the function definition (because *that's* the thing being illustrated).
- **Make the example the bullet's subject, not a subordinate clause.** Bad: *"The `m` in `bigger(x) = x · m` — a single parameter."* Good: *"**bigger(x) = x · m** — `m` is the parameter."*
- **One sentence per bullet is usually enough.**

### When the term is function-shaped

For terms that are themselves functions or operate on functions (*function*, *model*, *parameter*, *loss/error* as a function, …), math notation works well:

- Write each example as `name(input) = expression`. Trains the reader on the notation used in chapter prose.
- Name the function so the output's role is obvious: prefer `lineY(x)` over `line(x)`, `chatReply(messages)` over `chat(message)`.
- Use plural inputs when the real-world case is plural (`chatReply(messages)`, not `chatReply(message)`).
- For cases where the RHS can't honestly be spelled out, write `= something complex`. Don't sketch a fake neural-net expression — it will mislead.

### When the term has multiple useful framings

For terms the chapter explains from several angles (a *neuron* is "a building block in a network", "a smooth logic gate", "a pattern detector", "a weighted sum + activation"), the example list can be those framings rather than scaled-up versions:

- Lead with the most everyday framing ("In words — the neuron looks at its inputs and decides how strongly to fire").
- Move through the chapter's analogies ("As a smooth logic gate", "As a pattern detector").
- End with the precise form ("As math: `output = activation(w · x + b)`").

The math is the *last* framing, never the first.

### When the term is a data structure

For *vector*, *embedding*, and similar list-shaped concepts, the chapter introduces them as ways of describing things. Mirror that: the bold lead is the *thing being described*; the rest of the bullet explains how the data structure captures it.

### When the term is a process

For *training*, *optimization*, *inference*, *backpropagation*, the chapter usually has a recipe ("measure error → take a small step → repeat"). The example bullets walk a reader through that recipe applied to concrete cases of increasing complexity, ending at the AI use.

### Redirect entries (for true synonyms)

When two terms genuinely mean the same thing (e.g., *AGI* ≡ *artificial general intelligence*, *MLP* ≡ *feed-forward layer*), give the canonical one a full entry and the synonym a tiny **redirect entry** — the index-style "*see also*" pattern. The redirect entry is exempt from the examples rule. Its whole job is:

1. State that it's another name for the canonical term, with a link.
2. Optionally, one short line on why both words exist (e.g., one is the acronym, one is the full name).

That's it. Readers get a clear "you clicked X, X = Y" signal without the popover misleadingly displaying Y's full content as if X were Y. They can click through to the canonical entry; the popover navigator cycles there with a back button.

Use redirect entries *only* for true synonyms. Plurals, inflections, and casual variants (`function`/`functions`, `train`/`trains`/`trained`) belong in `aliases` on the owning entry. Terms that look synonymous but actually carry a useful distinction (e.g., *error* per-example vs. *loss* aggregate) deserve full entries that reference each other — not a redirect.

## 4. Notation (when math is involved)

- **Bold** the lead expression of an example (`**bigger(x) = x · m**`). Do not use code-quoting (` `` `) for the lead — the inline code box's padding misaligns bullet points.
- Single-letter variable references *inside body sentences* can use code style (`` `m` is the parameter ``) — mid-sentence, they don't disrupt bullet alignment.
- Use `·` for multiplication, not `*`.
- Subscripts (₁, ₂, …) for indexed series; superscripts (², ³) for powers.

If the entry has no math, skip this section entirely.

## 5. Cross-references

- **You don't write cross-links by hand.** The auto-wrap plugin runs on entry bodies the same way it runs on chapter prose. Just write the term naturally; it becomes a cross-link automatically on its first occurrence in the file. Inside a popover, clicking cycles the navigator to the target entry; on `/glossary`, clicking expands the target card.
- **Self-references stay plain.** The word "function" inside the function entry's body doesn't link back to itself.
- **Manual `[term](/glossary#slug)` links still work** as overrides if you need fine control — to link a specific later occurrence rather than the first, or to point to a planned-but-unwritten entry. A manual link "claims" the first occurrence so the auto-wrap won't double-link.
- **Never use `<g>` inside an entry.** That's only for chapter prose; in entries the auto-wrap handles it, and `<g>` would render as a nested popover.

## 6. Structure templates

### Full entry

```mdx
---
term: <display name — may contain spaces, e.g. "activation function">
aliases: [<plural>, <other-forms-the-chapter-uses>]
firstAppearance: <chapter-slug-where-introduced>
---

<A | An | (nothing)> **<term>** is <one-sentence definition — this is the card summary>.

<Optional second paragraph of context.>

- <first example — most approachable, in whatever form fits>
- <middle example — adds a wrinkle or moves a step toward AI>
- <last example — most AI-scale or most formal>

<Optional one-line closing — naming a notation, linking to a tightly-related concept, etc.>
```

The **filename** is the entry's URL slug (kebab-case): `activation-function.mdx` → `/glossary#activation-function`. For single-word terms, filename and `term` match; for multi-word terms, the filename is the slug form and `term` keeps the natural spacing.

### Redirect entry

```mdx
---
term: <synonym>
aliases: [<word-variants-of-the-synonym>]
firstAppearance: <chapter-slug>
---

**<Synonym>** is another name for [<canonical>](/glossary#<canonical>).

<Optional one-line: why both words exist.>
```

## 7. What not to do

- **Don't claim universal properties that aren't.** No "deterministic," no "always returns a number," no "the same every time."
- **Don't invent examples the chapters don't use.** Spam filters are a textbook standby and aren't part of this tutorial; don't reach for them. Use the chapter's examples (race times, restaurant ratings, animal-property vectors, next-word prediction) and extend them naturally if you need more.
- **Don't add a `short:` frontmatter field.** The build script derives it from the body's first sentence; declaring it manually is the kind of duplicate-source-of-truth that drifts.
- **Don't add separate subsections** ("How it works", "Why it matters", "History"). The chapter explains; the glossary defines.
- **Don't bury synonyms as aliases.** Word-variants (plurals, inflections, casual forms) belong in `aliases`. *True synonyms* (different word, same concept) get their own redirect entry (§3) so the popover doesn't show one term's content under another term's label. Before assuming two words are synonyms, check whether they actually carry a distinction worth teaching — *error* and *loss* read as synonyms in casual ML usage but are split here into per-example vs. aggregate.
- **Don't reference unpublished chapters in body links.** Glossary backlinks already filter to ready chapters; a hand-written link to a 404 chapter is on you.

## 8. Workflow

- Read the relevant chapter(s) before writing — the chapter is the source of truth for examples and framing.
- Edit the entry MDX under `src/content/glossary/`. Filename matches the canonical term.
- If frontmatter changed (`term`, `aliases`, `firstAppearance`) or the body's first sentence changed, run `pnpm glossary:build` to regenerate the index, and restart the dev server.
- Body edits hot-reload.
- `pnpm glossary:audit` lists every place the new aliases would auto-wrap across chapter MDX. Scan for false positives; silence specific occurrences with `<nog>…</nog>` in the chapter.
