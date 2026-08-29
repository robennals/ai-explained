# Chapters: Chat Models, Reasoning Models, Agents — design

Status: implemented. Originally one chapter; split into three on 2026-08-28.
Date: 2026-08-27, revised 2026-08-28

## What changed after the first draft

The material was written as a single chapter and then split, because seven
sections and five playgrounds is too much for one, and because the three parts
answer different questions: why a raw predictor does not act like an
assistant, how a model gets room to think, and how it acts on the world.

| Slug | Title | Sections |
|----|----|----|
| `post-training` | Post-Training | raw model, post-training |
| `conversations` | Conversations | chat template, repeated turns, system prompt |
| `reasoning` | Reasoning | thinking first, how they are trained |
| `agents` | Agents | tools, skills, memory |

Ids 10 to 13; everything after shifts by four. `reasoning` and `agents` both
take `conversations` as their prerequisite.

`chat` was split again on 2026-08-29, for the same reason as the first split:
five playgrounds and six sections is too many. The two halves also answer
different questions. Post-Training is about weights, and why a next word
predictor does not answer. Conversations is about text plumbing, and adds no
training at all. The ordering only works one way round, since Conversations
needs post-training to explain why the model answers after the assistant
marker, while Post-Training needs nothing from Conversations.

`post-training` and `conversations` are the only chapters that show raw token streams. It ends by showing
the same conversation as one stream and as speech bubbles, and the later two
chapters use the bubbles, with a dashed outline for any message the human
never sees.

Two sections were added that the original design did not have: how reasoning
models are trained (attempt a checkable problem many times, keep what reached
the answer, never mark the working), and an opening for `agents` defining an
agent as the model plus the harness plus the loop.

## Summary

A new chapter, placed immediately after **Transformers**, that explains how the
chat assistants people actually use are built on top of a next-token predictor.
It is a fast, high-level tour: post-training, reasoning, tool use, skills, and
the chat transcript. The goal is that a reader who stops here still comes away
with an accurate mental model of ChatGPT-style products, with the most common
misconceptions headed off.

Four playgrounds, one per major section. No PyTorch notebook in this pass; the
notebook is deferred until the chapter's prose and widgets have settled.

## Placement and curriculum changes

- New chapter: `id: 10`, `slug: "chat"`, title **"Chat Models"**, subtitle
  **"From predictor to assistant"**, `prerequisites: [9]`.
- Every existing chapter with `id >= 10` shifts up by one, except the two that
  are deleted. `prerequisites` arrays are numeric ids, so they must be remapped
  with the same table rather than by eye. Slugs do not change, so `<Ch slug=…>`
  cross-references in existing MDX need no edits.
- **Deleted:** `reasoning` (old id 18) and `agents` (old id 25). Their material
  is covered here at overview depth, and no deeper chapter is planned.
- **Kept as deeper dives:** `reinforcement-learning`, `self-play`, `alignment`,
  `synthetic-data`. This chapter forward-references them.

Old → new id map:

| Old | New | Slug |
|----|----|----|
| — | 10 | `chat` (new) |
| 10 | 11 | `matrix-math` |
| 11 | 12 | `training` |
| 12 | 13 | `mixture-of-experts` |
| 13 | 14 | `long-context` |
| 14 | 15 | `inference` |
| 15 | 16 | `interpretability` |
| 16 | 17 | `reinforcement-learning` |
| 17 | 18 | `self-play` |
| 18 | — | `reasoning` (deleted) |
| 19 | 19 | `alignment` |
| 20 | 20 | `synthetic-data` |
| 21 | 21 | `vision` |
| 22 | 22 | `image-generation` |
| 23 | 23 | `world-models` |
| 24 | 24 | `audio` |
| 25 | — | `agents` (deleted) |
| 26 | 25 | `hallucination` |
| 27 | 26 | `context` |
| 28 | 27 | `appendix-pytorch` |
| 29 | 28 | `glossary` |

Prerequisite fixes that follow from the table: `alignment` was `[9, 16]` and
becomes `[10, 17]` (it now builds on this chapter plus RL); `self-play` was
`[16]` and becomes `[17]`; `context` was `[5, 9]` and is unchanged in slugs but
its ids stay `[5, 9]`. Any prerequisite pointing at a deleted chapter is
repointed at `chat` (id 10).

## Section arc

### 1. A predictor is not an assistant

Opens on the gap Chapter 9 leaves. A trained transformer completes documents.
That is not the thing you talk to.

**Widget 1 — Raw Completion.** Pick a prompt, toggle **base model / chat
model**, see two hand-authored completions side by side. Examples chosen so the
base model's behaviour is obviously *correct given its training* and obviously
useless:

- A question → three more questions (the model landed in an FAQ list).
- "Write a poem about the sea" → "…and 9 other creative writing prompts for
  your class."
- A maths question → a worksheet with the answers omitted.
- A request for help → a support-page boilerplate and an ad.

The knob is the toggle. The surprise is that the base model is not broken. It
is doing its job well.

Misconception headed off: base models are not "dumber" versions of chat models.
They contain nearly all the knowledge; what they lack is the habit of answering.

### 2. Post-training

Pre-training builds a model of the world. Post-training aims it. Each approach
gets roughly one paragraph plus one named published example. The widget carries
the comparison, so the prose must not turn into a list of five equal blobs.

- **Supervised fine-tuning on demonstrations.** A curated set of ideal
  prompt/response pairs, trained on the same next-token objective. InstructGPT's
  first stage; FLAN for instruction-following generally.
- **RLHF from pairwise human comparison.** Paid raters see two responses and
  say which is better. Those comparisons train a reward model, which scores new
  responses, and the language model is nudged toward high-scoring ones.
  InstructGPT, Llama 2.
- **Constitutional AI / RLAIF.** A model judges another model's response
  against a written set of rules. Exploits that judging is easier than
  generating, and it scales past what humans can label. Anthropic's
  Constitutional AI.
- **Signals from real usage.** Thumbs up/down, which of two shown responses a
  user preferred, whether the user rephrased in frustration or said thanks.
  Cheap and plentiful, but noisy and biased toward what pleases the user, which
  is a direct route to sycophancy. Flag honestly; forward-reference
  `alignment`.
- **Verifiable rewards (RLVR).** For maths and code the answer can be checked
  automatically, so no human or judge model is needed. DeepSeek-R1, the
  OpenAI o-series. This is the bridge to Section 3.

RL intuition is inline and minimal: produce several candidate answers, score
them somehow, nudge the weights so higher-scoring answers become more likely.
No policy gradients, no value functions. Forward-reference
`reinforcement-learning` for readers who want the machinery.

**Widget 2 — Training Signal.** One prompt, a handful of hand-authored
candidate responses. The reader picks a signal source (golden example / human
pair preference / constitution judge / usage signal / auto-checker) and sees:

1. each candidate receiving a score from that source, and
2. the next-token probability distribution shifting — the good answer's
   probability rising, the bad one's falling.

This is where the chapter makes the point that a model emits a distribution,
not a single response, so training can push probability toward one answer and
away from another at the same time.

Misconceptions headed off: post-training mostly does not add knowledge, it
selects behaviour; it is a small fraction of total training compute; the reward
model is itself a model and can be wrong, which is where sycophancy and reward
hacking come from.

### 3. Reasoning

State plainly that the architecture does not change. The model emits thinking
tokens that the product hides, then emits its answer. What changed was
training: verifiable rewards made it possible to reward a scratchpad that leads
to a correct final answer, so models learned to use one.

**Widget 3 — Think First.** Pick a query, toggle thinking on or off, see the
hidden trace and the two resulting answers. Queries chosen so the no-thinking
answer is confidently wrong in a way the reader can check.

Misconceptions headed off: the trace is more generated text, produced the same
way as any other text, not a log of the model's internal computation, and it
can be unfaithful to what actually drove the answer. Longer traces are not
automatically better.

### 4. Tools and search

The model emits a tool call instead of prose. The program around the model runs
the tool and pastes the result back into the transcript as another turn. The
loop repeats until the model answers in prose. The model never runs anything
itself; it writes text and reads text.

**Widget 4 — The Loop.** A transcript that grows turn by turn: assistant →
tool call → tool result → assistant. The reader can break a tool (make it error
or return stale data) and watch the loop adapt.

Misconception headed off: search grounding reduces hallucination but does not
eliminate it, because the model still writes the summary. Forward-reference
`hallucination`.

### 5. Skills

Short, no widget. A model learns nothing between conversations, so a "skill" is
a document of instructions that gets pulled into the context when it is
relevant, often by a tool call. That is why an agent can gain a capability
without anyone retraining it.

### 6. Making it a conversation

Chat template and system prompt. The whole conversation is one token stream
with role markers, the system prompt is text at the top, and the model is
completing the assistant's turn. Explains why the model can be told who to be,
and why everything it "knows" about the conversation is text in front of it.

### 7. The big picture

Brief recap in the style of the Transformers chapter close, without the
mechanically-bolded item list. Points forward to `alignment`,
`reinforcement-learning`, `hallucination`, and `context`.

## Build shape

Files, following the `transformers` chapter as template:

```
src/app/(tutorial)/chat/
  page.tsx        — ChapterHeader + Content + QuizContent + ChapterNav
  content.mdx     — no `#` heading; opens on the first paragraph
  widgets.tsx     — dynamic imports, ssr:false, TryItProvider slots
  quiz.mdx        — <Quiz slug="chat"> with questions per section
  QuizContent.tsx — client wrapper

src/components/widgets/chat/
  RawCompletion.tsx        + rawCompletion.ts        (+ .test.ts)
  TrainingSignal.tsx       + trainingSignal.ts       (+ .test.ts)
  ThinkFirst.tsx           + thinkFirst.ts           (+ .test.ts)
  ToolLoop.tsx             + toolLoop.ts             (+ .test.ts)
```

Widget conventions this chapter follows:

- All data is hand-authored, not generated by a real model. The chapter says so
  where it matters, as the Transformers chapter does.
- Logic lives in a plain `.ts` module with unit tests; the `.tsx` is
  presentation over `WidgetContainer` and the shared controls.
- Readable text sizes; one clear knob per widget; each has a "try this" that
  produces a surprise.

Also required: glossary entries for the new terms (post-training, supervised
fine-tuning, RLHF, reward model, Constitutional AI, RLVR, reasoning tokens,
tool call, agent loop, skill, chat template, system prompt) in `src/lib/glossary`.

## Deferred

- **PyTorch notebook (`notebooks/chat.ipynb`).** Deferred by decision until the
  chapter is settled. The intended shape, when it happens: compare a small base
  model against its instruct sibling on the same prompts, apply the chat
  template explicitly so the reader sees the role markers, show log-probs
  shifting for a good versus bad continuation, and hand-roll a tool loop around
  a local model. This is the part most likely to be cut or slimmed, because it
  needs real model downloads.

## Prose constraints

`docs/style/voice.md` applies. Section 2 is the section at risk of becoming a
list of five equal blobs; hold it to one paragraph and one named example per
approach, and let the widget carry the comparison. No "I"/"me". Em-dashes at
most one per paragraph.
