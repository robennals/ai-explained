# Notebooks for Chat Models, Reasoning and Agents — plan

Status: plan, not yet implemented.
Date: 2026-08-28

Three companion notebooks, one per new chapter, following
`docs/plans/notebook-philosophy.md`: mirror the chapter section by section,
demo the real mechanisms and skip the intuition-building, one new idea per
cell, and pass `pnpm test:notebooks`.

## The shape of the problem

These chapters are different from every earlier one. Chapters 1–9 build
mechanisms from scratch in a few hundred lines, so the notebook can construct
the thing itself. Nothing here can be built from scratch: post-training,
reasoning and tool use only exist on top of a model that has already been
pre-trained. So these notebooks *drive* real models rather than build them.

That makes two questions load-bearing.

**Which models run on a free Colab T4?** A 0.5B model in fp16 is about 1GB of
weights, a 1.5B about 3GB. Both fit with room to spare. The pairs and
reasoning models named below are all ungated on Hugging Face, so no token or
licence click-through is needed.

**No API keys.** Everything below runs on a free Colab T4 with no account, no
key and no gated model. That is a deliberate constraint: a reader should be
able to open the notebook and press run. It also keeps `pnpm test:notebooks`
simple, since there is no path that silently does nothing.

## Saying how small these models are

Every notebook opens with the same framing, in its own short markdown cell,
and repeats it in one line wherever a result is visibly worse than the
chapter's hand-authored version:

> The models in this notebook are small enough to run free, in your browser,
> in a couple of minutes. They are hundreds of times smaller than the ones
> behind ChatGPT or Claude, and it shows: they make mistakes a frontier model
> would not, and they need the questions kept simple. What they do have is the
> same machinery. Everything here works the same way at a thousand times the
> size, which is the point.

Where a cell's output is worse than the chapter's, the markdown says so
plainly rather than hoping the reader does not notice. A small model failing
at something a frontier model manages is evidence about size, and the notebook
should treat it as a result rather than an embarrassment.

## `chat.ipynb`

Mirrors: What a Raw Model Does → Post-Training → Making It a Conversation →
Repeated Turns.

**1. The same prompts to a base model and a chat model.** `Qwen2.5-0.5B` and
`Qwen2.5-0.5B-Instruct`: same family, same pre-training, one has been through
post-training. Feed both the four prompts from the chapter's playground and
print the completions side by side. The chapter asserts the base model
continues the document; this is where the reader watches it happen on a real
model rather than on hand-authored text.

Risk: a 0.5B base model rambles, and the failure may be less crisp than the
chapter's hand-authored version. Mitigation: fix the seed, cap at ~80 tokens,
and if 0.5B is too incoherent, move to the 1.5B pair. **Worth a spike before
writing the notebook.**

**2. The chat template is just text.** Print
`tokenizer.apply_chat_template(messages, tokenize=False)` for the instruct
model and show the real markers. Then feed the *base* model that same
templated string and show it does not help — the markers only mean something
because post-training taught the model what to do with them. This is the
chapter's claim made falsifiable in three lines.

**3. Repeated turns.** Build a two-turn conversation, print the templated
prompt for each turn, and show the second contains the first in full. Then
`len(tokenizer(prompt).input_ids)` for turns 1, 2, 3 to show the prompt
growing. Ties directly to the chapter's widget.

**4. Judging is easier than producing.** The chapter's central asymmetry, and
the most interesting cell in the notebook. Ask a small model to factor a
number, or to answer the two-digit-multiple-of-7 puzzle, and watch it fail.
Then hand the *same* model a candidate answer and ask whether it is correct,
and watch it succeed. Score both over ~20 generated problems and print the two
accuracies. If the gap shows up, the reader has proof of the thing the whole
post-training section rests on.

Risk: at 0.5B the verification may be near chance. Falls back to the 1.5B
instruct model, and beyond that to `Qwen2.5-7B-Instruct` loaded in 4-bit with
`bitsandbytes`, about 5GB and comfortable on a T4. **Spike this before writing
prose around it.**

**5. Reading the room.** Take ~10 hand-written conversation endings, half
where the user is happy ("perfect, thanks") and half where they are not ("you
didn't answer my question"), and have a small instruct model classify each.
Print the confusion matrix. This is the chapter's usage-signal tab: the point
is that the signal is cheap and mostly works, and the cell should be honest
about the cases it gets wrong.

## `reasoning.ipynb`

Mirrors: Writing To Itself First → How They Are Trained → Two Things To Keep
Straight.

**1. A real reasoning trace.** `DeepSeek-R1-Distill-Qwen-1.5B` emits
`<think>…</think>` and is ungated and small enough for a T4. Generate on one
of the chapter's questions and print the whole stream, then split on the think
tags to show what a product would hide. The chapter says the trace is ordinary
text in the same stream; here the reader sees the tokens.

**2. Thinking on and off, same model.** Prefill the assistant turn with
`<think></think>` to suppress the working, and compare accuracy with and
without over ~20 arithmetic or puzzle questions. Same weights, same prompt
format, one knob. Quantifies what the chapter asserts.

**3. Length costs.** Plot tokens generated against wall-clock time, and note
where accuracy stops improving. Supports "more thinking is not always better".

**4. What training actually does, in miniature.** Full RLVR is out of reach on
Colab, but the half that produces the signal is not:

- take a checkable problem;
- sample N attempts at temperature ~0.8;
- mark only the final answer with a Python function;
- report how often at least one attempt got there, versus how often a single
  attempt did.

That is rejection sampling, and it is the data-generation stage of the real
method. The reader sees the mechanism the chapter describes, with the real
numbers. Optionally, fine-tune a 0.5B model with LoRA on the winning traces
and show the single-attempt rate move — marked clearly as optional, since it
needs `peft` and several minutes of GPU.

**5. Unfaithful traces.** Reproduce the hinted-answer experiment: ask a
question, then ask it again with a hint pointing at the wrong answer, and
count how often the model follows the hint while writing a trace that never
mentions it. This is the chapter's caveat, and it is exactly the kind of claim
a reader should want to check.

## `agents.ipynb`

Mirrors: Tools → Skills → Memory.

**1. A harness in thirty lines.** The chapter says an agent is a model plus a
program plus a loop. The notebook writes that program: a `TOOLS` dict of
Python functions, a system prompt listing them, a generate call, a regex that
spots a tool call, and a `while` loop that runs the tool and appends the
result. Nothing else. The point is how little there is.

**2. Watch the loop run.** Print every message with who it is from, so the
notebook output looks like the chapter's transcript, dashed messages and all.
Use a real weather-ish tool (a fixed lookup table, no network) and a
calculator.

Risk: a 1.5B model is unreliable at emitting well-formed tool calls, and this
is the biggest open question in the plan. Mitigations, in order of preference:
few-shot examples in the system prompt showing the exact call format; a
forgiving parser that accepts near-miss JSON; `Qwen2.5-3B-Instruct` at about
6GB; and `Qwen2.5-7B-Instruct` in 4-bit at about 5GB, which fits a T4 and is
comfortably capable of tool calls. **Spike this first.** If none of them give
a reliable loop, the section still works with one narrow tool and a single
call rather than a multi-step loop, and the notebook says why: driving a tool
loop is one of the things small models are worst at.

**3. Skills.** Add a `load_skill` tool returning a document, offer two skills
one line each, and show the model asking for one and then following it. Reuse
the chapter's council-fault example so the notebook and chapter line up.

**4. Memory.** A dict plus `save_memory` and `search_memory`. Run one
conversation that saves a preference, throw the conversation away, start a
fresh one, and show the model finding the note. The cell that matters is the
one showing the second conversation's prompt contains nothing from the first
except the retrieved line.

**5. What breaks.** Give the model a tool that errors and show it recover, or
fail to. Honest, short, and the natural place to say that most of what makes
an agent good is the harness rather than the model.

## Constraints and open questions

**Test-suite cost.** `scripts/test-notebooks.sh` executes every notebook with
a 900s timeout. Three notebooks that each download a 1–7GB model will add
meaningful time and disk, and the reasoning notebook generates long traces
over ~20 questions, which is slow without a GPU. Options: keep every model at 0.5B in the default
path; or add a `FAST=1` environment check that shortens loops under test. The
download itself is unavoidable if the notebooks are to be honest. Worth
deciding before implementation, since it shapes how the cells are written.

**Prerequisite forward references.** These notebooks use `transformers`
pipelines, chat templates, and sampling parameters ahead of any chapter that
explains them. Each needs a one-line explanation and an entry in
`docs/plans/pytorch-prerequisites.md`.

**Spikes to run first**, in priority order, because each one could change the
plan rather than just the prose:

1. Does a tool-calling loop work with a 1.5B instruct model on a T4?
2. Is the judge-versus-produce gap visible at 0.5B, or only at 1.5B and above?
3. Does `DeepSeek-R1-Distill-Qwen-1.5B` generate a usable trace in reasonable
   time on a free T4?

**Wiring up.** Each chapter gets `<TryItInPyTorch notebook="chat">` and so on,
which builds the Colab URL from the filename. Add after the notebooks exist.
