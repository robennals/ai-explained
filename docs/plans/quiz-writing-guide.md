# Writing End-of-Chapter Quizzes

Each ready chapter ends with a multiple-choice quiz that tests whether the reader actually understood the material, not whether they can recite specific sentences. This doc captures how to write one.

## Audience & goal

- The site targets smart middle schoolers. Questions must be answerable from chapter content + basic middle-school knowledge (arithmetic, simple algebra, common-sense analogies). No outside expertise.
- The quiz isn't a vocabulary check. It probes whether the reader internalized the chapter's *ideas* — especially the counterintuitive ones the chapter is built around.

## Shape of a quiz

- **6 questions per chapter** is the default. Use more (7–8) only if the chapter genuinely covers more independent ideas worth probing. Don't pad.
- **Four-option multiple choice**, one correct answer per question.
- **Immediate feedback** after each answer — green "Correct" or amber "Not quite", followed by an explanation.
- Past questions stay reachable as collapsible rows above the current one. The reader can re-expand any prior question.

## The difficulty ladder

Each question targets a different rung. Order them this way:

1. **Recall (warm-up).** A near-direct restatement of a key fact. Almost everyone who read the chapter should get this. This is the on-ramp.
2. **Definition.** Pick the right description of a key term the chapter introduced.
3. **Comprehension.** Can you spot the right restatement / framing / analogy? Tests whether the concept landed, not just the wording.
4. **Application.** Given a new scenario not in the chapter, what does the chapter's framework predict?
5. **Misconception trap.** The question hinges on a common wrong intuition that the chapter explicitly corrects. The tempting distractor is that misconception.
6. **Deep insight ("wait, what?").** Hinges on the chapter's most counterintuitive surprise. Someone who memorized the words but didn't get the shape fails here.

## Distractor design (the most important part)

A multiple-choice question is only as hard as its wrong answers. Most of the work goes here.

**Rules:**

- **Exactly one option must be correct.** No "this is somewhat true too" distractors. Every wrong answer must be either contradicted by the chapter or factually false in a way the reader can recognize.
- **Wrong answers must be plausible misreadings, not silly.** Each distractor should be something a reader who didn't quite get the idea might genuinely pick.
- **The correct answer must never be the longest option.** This is the single biggest tell. If the right answer is more detailed or more carefully qualified than the wrong ones, the reader can spot it without thinking. Trim the correct option *or* extend the wrong ones until lengths are within ~1 word of each other.
- **Don't over-justify the correct answer in the option text.** The explanation belongs in the feedback. The option itself should be a bare claim, no more carefully worded than the wrong answers.
- **For the misconception trap (Q5)**, the most tempting wrong answer should be the misconception itself — the thing a casual reader would default to.

## Feedback

After the answer is locked in, a feedback block appears. It should:

- **Not start with "Right —" or any right/wrong marker.** The Correct / Not quite badge already shows that. The feedback is the same regardless of whether the reader got it right.
- **Explain *why* the right answer is right**, in the chapter's own framing. One short paragraph is usually enough.
- **Don't repeat the question stem.** Move into the explanation directly.
- **Don't talk about "this chapter" or "the chapter says…".** The reader has just finished the chapter; the feedback is about *AI*, not about *what a particular chapter wrote*. Make the claims directly: "Every color can be described by three numbers", not "The chapter says every color can be described by three numbers". (Question stems can reference the chapter when needed to frame the inquiry, but the feedback body shouldn't.)
- **If a wrong answer was a tempting misconception worth naming**, address it directly in a second short paragraph — no label or heading needed. Most questions don't need this; reserve it for the misconception trap and the deep insight, and only when there's something genuinely worth pointing out about the wrong answers.

## Scope rules

- Only use ideas the chapter has already introduced (or that any middle schooler would know). No forward references.
- Don't repeat insights across questions within a single chapter, or with prior chapters' quizzes. If Chapter 2 already had a question testing "the model learns without being explicitly taught", don't write the same question for Chapter 3.
- Avoid testing the chapter's exact wording. Paraphrase. The reader should be picking the *idea*, not pattern-matching a sentence.
- Don't ask "in which paragraph did the chapter say…" or anything that rewards memorizing the text rather than the concept.

## Authoring format (MDX)

Quizzes live at `src/app/(tutorial)/{chapter-slug}/quiz.mdx`. Structure:

```mdx
<Quiz slug="chapter-slug">

<Question>
Question stem text, written in regular MDX. Can use *emphasis* and **bold**.

<Choice>First wrong answer</Choice>
<Choice correct>The correct answer</Choice>
<Choice>Second wrong answer</Choice>
<Choice>Third wrong answer</Choice>

<Feedback>
Explanation of why the correct answer is correct. Can be multiple paragraphs.

*Gotcha:* Optional addendum for trap/insight questions about what made the tempting wrong answer tempting.
</Feedback>
</Question>

<!-- repeat for each question -->

</Quiz>
```

The `slug` on `<Quiz>` is the localStorage key suffix — use the chapter's URL slug.

Component identity matters: each chapter also needs a thin client wrapper so MDX-created elements resolve correctly across the RSC boundary. Copy `src/app/(tutorial)/computation/QuizContent.tsx` to your new chapter folder and update the import path. Then in `page.tsx`, import `QuizContent` and render `<QuizContent />` between `<Content />` and `<ChapterNav />`.

## Process for adding a new chapter's quiz

1. **Read the chapter carefully**, including widget descriptions and callouts. Identify the key concepts, the misconception(s) the chapter pushes against, and the "wait, what?" moment.
2. **Draft 6 questions** following the ladder. Write distractors that are plausible misreadings of the chapter, not silly options.
3. **Self-audit before submitting:**
   - Is each wrong answer definitively wrong per the chapter (not just "off-topic")?
   - Are the four options within ~1 word of each other in length?
   - Is the correct answer never the longest?
   - Does each feedback explain the *why*, not just announce the answer?
   - Does any question duplicate an insight from a previous chapter's quiz?
4. **Get human review** on the questions before wiring them into MDX.
5. **Wire it in**: create `quiz.mdx` + `QuizContent.tsx`, edit `page.tsx`, run `pnpm lint` and `pnpm build`.

## Reference implementation

Look at `src/app/(tutorial)/computation/` and `src/app/(tutorial)/optimization/` for full end-to-end examples. The Quiz component itself lives at `src/components/quiz/Quiz.tsx` — don't modify it unless you're changing quiz behavior across all chapters.
