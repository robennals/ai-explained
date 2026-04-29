# Voice and style

A short style guide for prose on this site. The goal: writing that reads like one person — me — wrote it, not like an LLM did.

The blog at messyprogress.substack.com is the reference for *plain, direct, anti-LLM* sentence-level style: short sentences, concrete nouns, willingness to be opinionated, hedged where genuinely uncertain. But the blog uses heavy first-person ("I", "my"); the chapters do not. Chapters keep the plainness without the personal voice. Think: "an unusually clear textbook" rather than "a personal essay."

## The smell test

Before publishing a paragraph, ask: does this sound like ChatGPT could have written it? If the answer is "yes, easily," it probably needs work. The biggest tells are below.

## Surgical-only mode for editing existing prose

When editing existing chapter prose to remove tells, **do not** rewrite sentences for rhythm, clarity, or "improvement". The author's wording is intentional. Only touch a sentence if it contains a specific tell from the list below, and only change the tell itself, leaving the surrounding wording alone.

- ✅ Replace `—` with a period or comma. Done.
- ✅ Delete the phrase "Here's the thing:" and keep the rest of the sentence.
- ✅ Replace "remarkable" with "striking" or just delete it.
- ❌ Don't merge two sentences into one because you think it flows better.
- ❌ Don't break a long sentence into fragments because you think fragments are punchier.
- ❌ Don't replace the author's analogy with a "cleaner" one.
- ❌ Don't add new sentences to bridge old ones.
- ❌ Don't change a heading unless it contains an obvious AI tell.

If a sentence contains a tell but the rest of the sentence is fine, surgically remove the tell and keep the sentence's structure and word choice. Aggressive rewrites for "voice" make the prose less the author's voice, not more.

## Hard rules

### No "It's not X, it's Y"

The clever-contrast construction is the single strongest AI tell. Avoid it in all forms.

- ❌ "It's not magic — it's math."
- ❌ "Not by genius. Not by planning. By relentless improvement."
- ✅ "Underneath, it's all arithmetic."

### Em-dashes only when nothing else fits

LLMs reach for em-dashes constantly. Most em-dashes in current chapters can be a period, a comma, a parenthetical, or just deleted.

- ❌ "We pass a sentence — token by token — through the layers."
- ✅ "We pass a sentence through the layers, token by token."

Reasonable rule: at most one em-dash per paragraph, and only when it's genuinely useful as a sharp aside.

### No drumroll phrases

LLMs love announcing punchlines. These are all suspect:

- "Here's the thing"
- "Here's the big picture"
- "Here's a wild fact"
- "Here's the punchline"
- "That's the whole game"
- "The rest is details"
- "Let's unpack"
- "Let's dive in"
- "Let's feel this in action"

If a sentence is interesting, it doesn't need an announcement. Just say it.

### Tricolons in moderation

Three-item lists are fine. Humans use them all the time, naturally. The LLM tell is when a tricolon is the rhythmic backbone of nearly every paragraph in a chapter — drumroll-drumroll-drumroll. So:

- ✅ A natural three-item list inside a sentence ("writes programs, creates images, and holds conversations").
- ❌ Three different tricolons in three adjacent paragraphs as a structural device.
- ❌ Four-or-more-item inline lists that feel like padding ("AI can write poetry, recognize faces, generate art, and hold conversations").

Watch for over-use across a section, not for single occurrences.

### Strip AI vocabulary

Remove on sight:

- "remarkable / remarkably"
- "elegant / elegantly"
- "magical / magic" (in the figurative sense)
- "robust", "vibrant", "intricate", "tapestry", "delve"
- "beautiful thing", "the magic", "the art of"
- "in essence", "fundamentally", "ultimately"
- "showcase", "leverage" (as a verb)
- "navigate" (figuratively)
- "stands as", "serves as", "represents" (when "is" works)

### Bolding: leave the author's bolding alone

The author intentionally bolds leading sentences/clauses inside bulleted and numbered lists. This is a deliberate stylistic device, not LLM mechanical bolding. Don't strip it.

- ✅ Keep: `- **Everything inside an AI is numbers.** Words, images, sound.`
- ✅ Keep: `1. **Forward pass**: run inputs through the model to get predictions`
- ✅ Keep: `**One way to think of a neuron is as a smooth, trainable logic gate.** With the right weights...`

The LLM-mechanical bolding to watch for is bolding *every key term* across a paragraph of running prose, three or four highlights deep. That's still worth thinning. But:

- Don't reduce bolding inside bullet/numbered lists.
- Don't reduce bolding at the start of a KeyInsight or sentence-as-headline pattern.
- Don't convert the author's `**bold**` to `*italic*` to "soften" emphasis.

### "Notice that" / "Notice how" — usually delete

The patter that says "look at this thing I want you to look at" is filler.

- ❌ "Notice that the same operation produces different results."
- ✅ "The same operation produces different results."

### No "every single one" or "every last" emphasis

These intensifiers are an LLM tic.

- ❌ "And all of these — every single one — work the same way."
- ✅ "All of these work the same way."

## Voice

### Chapters: no "I", "me", or personal voice

Tutorial chapters should not be about the author. Don't open with "I find this strange" or "AI looked impossible to me five years ago." Phrase the same observation impersonally: "AI does things that would have seemed impossible for a computer to do a few years ago."

Use "we" only for collaborative actions the reader and author do together ("we'll start by looking at"). "You" is fine for addressing the reader. Don't use "we" to mean just the author.

(The blog at messyprogress is the opposite — heavy on "I" and personal experience. The chapter voice is different: pedagogical, impersonal, but still plain and direct rather than corporate.)

### Hedge with humility, not weasel words

Genuine hedging sounds like "take this with a moderate handful of salt" or "I'm fairly early in this." That's different from LLM-style hedging that sounds confident-but-noncommittal ("various factors", "in many cases", "it's important to note").

### Concrete beats abstract

Specifics are the easiest way to sound human. "A cat wearing a tiny hat on the moon" is more alive than "an unusual scene". When in doubt, pick the more specific noun.

### Short sentences are good

Many sentences in the current chapters are long because they were trying to land a clever rhythm. Short, plain, declarative sentences read more like a person talking.

## Soft preferences

Not always violations, but watch for over-use:

- "Here's where..." constructions
- "And critically:" / "And here's the thing:"
- Long opening sentences to a paragraph that just set up the real point
- The "we've come a long way" recap-list pattern at chapter ends. Keep recaps brief and skip the mechanically-bolded items.
- Sentences starting with "Let's". Cliché if used more than once or twice in a chapter.

## Quick checklist for a chapter

1. Search for `—` and justify each one.
2. Search for `It's not` / `not just` / `not only` and rewrite.
3. Search for `Here's` and `Let's`. Most should go.
4. Search for `Notice` and delete.
5. Search for `**`. Cut at least half of the bold.
6. If three or more *adjacent paragraphs* each end on a tricolon, that's the LLM rhythm — break some up. A single tricolon per paragraph is fine.
7. Read aloud. If it sounds like a TED-talk speaker building up to a reveal, it's still too LLM-y.
