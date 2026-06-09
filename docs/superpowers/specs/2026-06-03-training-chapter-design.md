# Chapter 11 — "Why Training Almost Doesn't Work" (Design Spec)

**Date:** 2026-06-03
**Slug:** `training`
**Chapter id:** 11
**Prerequisites:** [9] transformers (transitively covers neurons + optimization)
**Companion notebook:** `notebooks/training.ipynb`
**Quiz:** yes

## One-line idea

The neurons chapter promised that training a billion-weight network is "no harder in
principle" than training a tiny one. That is true in principle and false in practice. Plain
gradient descent on a deep network stalls, diverges, or memorizes. This chapter is a guided
tour of the hard-won tricks that make modern training actually work, grouped by the problem
each one solves.

## Editorial principles for this chapter

- **Analogy-first.** Every concept gets a concrete, carefully-developed real-life analogy, and
  the load-bearing analogies drive interactive playgrounds — the way the optimization and
  computation chapters paired a real-world widget with the technical one. The analogies are the
  backbone, not decoration. A soccer motif runs through clusters 1 and 2 (tracing *why your team
  won* for credit assignment, and *reviewing after each game* for batching).
- **Rough sense for most, playgrounds for the important stuff.** Cover every listed topic well
  enough to give intuition. Build playgrounds for the five load-bearing ideas. Smaller items
  (gradient clipping, early stopping, RMSNorm) are short "be aware of" passes.
- **Honest about uncertainty.** Where a trick was found empirically and isn't fully understood
  (why Adam beats SGD, why batch norm helps), say so plainly rather than inventing a tidy reason.
- **Voice.** Follow `docs/style/voice.md`: impersonal-but-plain textbook, no personal "I", no
  em-dash overuse, no drumroll phrases, no "it's not X it's Y", no AI-vocabulary. Reuse the
  established notation conventions from earlier chapters.

## Structure: five clusters + an opener and close

### Opening — "the promise was a lie"

Callback to the neurons chapter's claim that a deep net is "no harder to train in principle"
than a small one. In practice, naive backprop on a deep network barely works: the signal dies,
the steps are mis-sized, or the model memorizes. The chapter is a tour of the fixes, organized
by the problem each solves.

### Cluster 1 — Keeping the gradient alive

**Problem.** Training is credit assignment: every weight gets a signal saying "nudge this much
to reduce the error." In a deep network that signal travels back through many layers, multiplied
by another factor at each step. Over many layers it compounds — shrinking toward nothing
(vanishing) or blowing up (exploding). When it vanishes, the early layers get almost no signal
and barely learn.

**Analogy — tracing why your team won.** Why did your soccer team win? Partly because of the
third goal. Which happened partly because the striker was in the right spot. Partly because he
ran fast. Partly because he had energy. Partly because he ate a good breakfast. Partly because
his mum bought his favorite cereal. Partly because she remembered to... Each "partly because"
link makes the connection to the root cause fainter and harder to pin down. Backprop is exactly
this chain of "partly because," and after enough links the signal reaching the earliest cause is
too weak to act on. (This is the chain rule; we needn't name it.)

**Playground — ChainSensitivity (centerpiece, reused three ways).** A chain of simple neurons
wired in a line: each is a single input, a weight, a bias, and a sigmoid, feeding the next. Drag
the input at one end and watch whether the output at the other end moves at all.
- *Vanishing:* with a long chain and saturated / badly-scaled weights, wiggling the input does
  nothing to the output — the connection is dead.
- *Initialization:* hit "good init" and the weights are set to a scale that keeps each neuron in
  its responsive range, so the input's influence survives down the chain. Bad init pushes
  neurons into the flat tails of the sigmoid where they stop responding.
- *Residuals:* toggle a skip connection (each neuron adds its input back to its output) and the
  input's influence always reaches the end, no matter how deep.

**Initialization — two jobs.**
1. *Right scale.* Pick the weight scale so the signal neither shrinks nor grows on average as it
   crosses each layer (He / Xavier, named lightly).
2. *Randomness, to break symmetry.* If every neuron in a layer started with identical weights,
   they would receive identical gradients and update identically — staying twins forever, so the
   layer would act like a single neuron. Random initialization breaks the tie. Fully solved by
   initializing randomly; it's why we never start all weights equal (or all zero). Short aside.

**Residual connections — why they don't make the model shallow.** A residual block computes
output = input + f(input). The "+ input" is a direct path the signal and its credit-assignment
can always travel, so depth stops killing the gradient. But f(input) still adds new computation
on top, so all the expressive power of a deep network remains. The picture is a *shared running
report*: instead of each layer rewriting the previous summary from scratch (and burying what came
before), each layer *adds* its findings to the report and passes it on. Nothing is overwritten,
so information accumulates (still deep and complex) and any single contribution can be traced
straight back (gradient flows). This shared report is the transformer **residual stream** from
chapter 9 — every attention and MLP block reads it and adds back to it.

**Key insight.** Most of deep learning's architecture tricks exist to keep one number — the
strength of the credit signal — from fading to nothing or blowing up as it travels back through
depth.

### Cluster 2 — Batching

**Problem.** To take one honest gradient step you'd average over the whole dataset — millions of
examples — every step. Far too slow. The opposite, one example per step, gives a jumpy,
unreliable estimate.

**Analogy — the soccer season.** Don't wait until the end of the season to work out how to play
better; review after each game. But a single game is a noisy signal — bad weather, a lucky
bounce, one weird opponent — so reviewing your last handful of games gives a steadier read on
what to fix. (Same soccer world as cluster 1.)

**Batch size and learning rate are linked.** Why not use a batch of 1 with a tiny learning rate
and get the same accuracy as using the whole dataset at once? You almost can. Averaging the
gradient over N examples and taking one step is, locally, about the same as taking N tiny steps
over those examples one at a time — so the *direction* you move is similar either way. That's the
batch-size / learning-rate link: bigger batches let you take proportionally bigger steps (linear
scaling rule, named lightly).

**So why batch at all? Parallelism and step count.** A GPU computes the gradient for hundreds of
examples at once in roughly the time it takes for one. A batch of 256 gets a far better gradient
estimate for almost the same wall-clock cost as a single example — and reaches the same place in
256× fewer steps. Doing 256 examples one at a time would be just as accurate but hundreds of
times slower. Batch size is mostly a hardware-efficiency knob: big enough to fill the parallel
hardware and keep the step count down, not so big it wastes compute for no extra accuracy.

**Playground — Batching (no loss-surface contour).** Avoid the 2D loss-landscape style. Candidate
design: a fixed dataset processed at different batch sizes, showing three meters — gradient
estimate quality, number of steps to finish a pass, and parallel wall-clock — so dragging batch
size makes the trade-off visible (more parallel work per step, fewer steps, similar final
accuracy). Exact visualization is a build-time choice; the goal is to land "batching is about
doing lots in parallel while keeping the number of steps down," not "noise on a contour map."

**Noise — deferred.** Small-batch noise also acts a little like regularization, but explaining
why noise helps is confusing here. Defer it: one sentence pointing forward to cluster 5, or skip.

**Key insight.** Batching isn't about a more correct gradient than single examples in principle —
it's about using parallel hardware to get a good-enough gradient in as few steps as possible.

### Cluster 3 — Normalization

**Problem — why the numbers drift.** If a sigmoid keeps outputs between 0 and 1, why would
anything blow up? Two reasons. First, even with a sigmoid the *pre-activation* sum (weights times
inputs, before the squashing) can grow large as weights change during training, pushing neurons
into the flat saturated tails — the same death from cluster 1. Second, modern networks mostly
don't use sigmoid; they use unbounded activations like ReLU (covered next chapter — a quick peek:
ReLU passes positive numbers straight through, so values can grow without limit as they stack
across layers). Either way, as training proceeds the scale of each layer's inputs wanders, every
layer keeps re-adapting to its inputs' moving range, and that slows training and forces a tiny
learning rate.

**Analogy — grading on a curve.** A raw score of 70 means nothing until it's standardized;
different teachers grade on wildly different scales. Normalization re-grades each layer's outputs
to a standard scale (mean 0, variance 1) on every pass, then lets the network re-stretch them
with two learned knobs — so the next layer always knows what range to expect.

**Batch norm vs layer norm — and why each suits its domain.**
- **Batch norm** standardizes each feature *across the batch* of examples — like grading each
  student against everyone else who sat the exam in the same room. It needs a big, stable batch
  for reliable per-feature statistics. Image models (CNNs) train on large batches with steady
  per-channel statistics, so batch norm works well there.
- **Layer norm** standardizes across the *features of a single example* — like grading each
  student against their own other answers, ignoring the room. Because it doesn't depend on the
  batch, it behaves identically with any batch size, with variable-length sequences, and when a
  transformer generates one token at a time at inference. Transformers have exactly those
  conditions, so batch statistics would be unreliable or unavailable, and layer norm sidesteps
  the problem. (The reader's hunch — one-token-at-a-time — is part of it; the deeper reason is
  layer norm needs no batch at all.) Brief mention of RMSNorm as the modern simplification.

**Playground — NormalizationPlayground.** Three example vectors shown as bar charts, each with a
few features.
- *Layer norm mode:* normalize each vector on its own (across its own features) — each becomes
  mean 0 / variance 1 within itself; the three are handled independently.
- *Batch norm mode:* normalize each feature across the three vectors (down the columns) — each
  feature position becomes mean 0 / variance 1 across examples; the vectors are coupled.
- Drag the raw values; watch the normalized output; toggle layer vs batch to *see* which
  direction the standardizing runs.

**Key insight.** Normalization keeps every layer's inputs in a predictable range so the whole
stack trains at one sane learning rate. Batch norm standardizes down the batch; layer norm
standardizes across one example's features, which is why transformers use it.

### Cluster 4 — How big a step

**Problem.** One global learning rate is wrong for everyone. Some directions of the loss are
steep, others shallow; a single step size either bounces across the steep ones or crawls along
the shallow ones.

**Analogy — San Francisco to your friend's living room in Paris.** You don't travel at one speed.
Ease cautiously out of the driveway while you get your bearings (warmup), cruise at full speed
across the country and ocean, then take tiny careful steps down the hallway to the right door
(decay). And you match speed to terrain — sprint the open highway, tiptoe the crowded hall — a
different speed for each leg.

**Why start slow (warmup)?** Shouldn't you start fast, with far to go and very wrong random
weights? No: at the very start the weights are random, so gradient *directions* are large and
erratic and the model doesn't know the terrain yet. A big confident step in a direction that
turns out wrong can knock the model into a bad region it never recovers from — and adaptive
optimizers like Adam are especially unreliable in the first few steps, having barely had time to
gauge how big each parameter's gradients usually are. Distance to cover doesn't help if the first
lunge is off a cliff. Start slow until the direction settles, then go fast in the middle.

**Momentum.** Keep a running average of recent gradients, so you build speed in a consistent
direction and don't get knocked off course by every bump. (The rolling ball from the optimization
chapter.)

**Adam — how you get a per-parameter learning rate.** For each parameter, keep a running estimate
of the typical *size* of its recent gradients, and divide that parameter's step by it. A
parameter whose gradient is consistently large gets a smaller step (stops overshooting); one
whose gradient is consistently tiny gets a relatively larger step (isn't stuck). Combined with
momentum (a running average of direction), that's essentially Adam — a custom, self-tuning step
size for every weight, which is why enormous models train without anyone hand-setting thousands
of learning rates.

**Schedules + the rest.** Learning-rate schedule = the start-slow, go-fast, slow-at-the-end plan.
Gradient clipping = a seatbelt that caps the occasional huge step; one-paragraph "be aware of."

**Playground — OptimizerRace.** SGD vs momentum vs Adam racing down the same loss surface, framed
as the journey. Learning-rate slider: too small (never arrives), right, too big (overshoots and
diverges); optional warmup toggle. Include a toggle between a rotatable 3D surface and a 2D
colorized (heat-map) top-down view. This is the one place a loss-surface visualization is wanted.

**Key insight.** Adam = momentum plus a per-parameter step size that adapts to each weight's own
gradient history. Adapting the step to the terrain, direction by direction, is what lets huge
models train at all.

### Cluster 5 — Generalization (does it actually learn?)

**Problem.** A big network can drive *training* loss to zero by memorizing the data, including its
noise. On new data it then fails. The thing we care about is test performance, not training loss.

**Analogies.**
- **Overfitting** = cramming for an exam by memorizing last year's answer key. Perfect on the
  practice test, lost on the real one. Understanding generalizes; memorizing the key does not.
- **Dropout** = don't learn to recognize a cat only by its fur or only by its ears — it might be a
  hairless cat, or one wearing a hat. Randomly hiding some cues during training forces the network
  to rely on many independent ones, so it stays robust when a few are missing.
- **Weight decay (L2)** = Occam's razor / travel light. Penalize large weights so the model
  prefers the simplest explanation that fits, which generalizes better.

**Content.** Train/test split and the overfitting curve (training loss keeps dropping while test
loss turns back up). Weight decay, dropout. Brief: early stopping, "more data is the best
regularizer."

**Playground — Overfitting.** Fit a curve to noisy points. Complexity slider: underfit →
just-right → overfit (a wiggly curve through every noisy point). Dropout and weight-decay sliders
rescue the test curve. Train vs test error shown side by side.

**Key insight.** The goal was never low training error — it's generalization. Several tricks
deliberately make training *harder* in order to get there.

### Close — what's next

Recap: training almost doesn't work because deep nets fight back — signals vanish, gradients
explode, steps are mis-sized, models memorize. Each cluster is a fix; stacked, they are why we can
train trillion-parameter models at all. Honest note that several of these were found empirically
and aren't fully understood. Pointer onward to the next chapter.

## Widgets to build

| Widget | Cluster | Type | Status |
| --- | --- | --- | --- |
| ChainSensitivity | 1 | playground — vanishing + init + residuals (centerpiece) | new |
| Batching | 2 | playground — batch size vs steps vs wall-clock (no loss surface) | new |
| NormalizationPlayground | 3 | playground — layer vs batch norm on vectors | new |
| OptimizerRace | 4 | playground — SGD/momentum/Adam on a loss surface (2D heat-map / 3D toggle) | new |
| Overfitting | 5 | playground — fit noisy data, dropout + weight-decay sliders | new |
| Residual-stream diagram | 1 | static — layers adding into a shared stream | new |

Widgets live in `src/components/widgets/training/`. Follow the existing pattern: `"use client"`,
wrapped in `<WidgetContainer>`, dynamically imported with `{ ssr: false }` and `<Suspense>` via
the `widgets.tsx` slot pattern (see `matrix-math/widgets.tsx`). Use D3 for chart / surface
widgets, Framer Motion for animation, Radix-based shared controls (`SliderControl`,
`ToggleControl`, `SelectControl`).

## Files to create

- `src/app/(tutorial)/training/page.tsx` — chapter wrapper (see `matrix-math/page.tsx`)
- `src/app/(tutorial)/training/content.mdx` — article
- `src/app/(tutorial)/training/widgets.tsx` — dynamic widget slots
- `src/app/(tutorial)/training/quiz.mdx` + `QuizContent.tsx` — quiz (see optimization chapter)
- `src/components/widgets/training/*` — the five interactive widgets (+ optional static diagram)
- `notebooks/training.ipynb` — companion notebook

## Files to update

- `src/lib/curriculum.ts` — set chapter 11 `prerequisites: [9]`, mark `ready`/`polishing` per
  workflow, confirm title/subtitle/description.
- Verify `src/lib/chapter-metadata.ts` covers the `training` slug (mirror matrix-math).

## Companion notebook (mirrors the chapter section by section)

1. Build a deep chain/MLP; print per-layer activation and gradient norms → watch them vanish.
   Fix with He init, then add residual blocks; re-print and watch the signal survive. (Mirrors
   ChainSensitivity.)
2. Train the same net at batch size 1 vs a large batch; show similar final accuracy but the
   wall-clock / step-count difference. (Mirrors Batching.)
3. Add LayerNorm; show training tolerates a higher learning rate and converges faster; show a
   single vector normalized across features vs a feature normalized across the batch. (Mirrors
   NormalizationPlayground.)
4. Compare SGD vs SGD+momentum vs Adam on the same net; sweep the learning rate; show warmup.
   (Mirrors OptimizerRace.)
5. Overfit a small net on noisy data; add weight decay and dropout; plot train vs test curves.
   (Mirrors Overfitting.)

Every term must be defined before use, or pointed at the chapter that covers it (see
`docs/plans/pytorch-prerequisites.md`).

## Quiz

~6–8 questions spread across the five clusters, following `docs/plans/quiz-writing-guide.md` and
the balanced correct-answer-position convention. Exclude quiz question stems from glossary
tooltips (per recent repo change).

## Out of scope / explicitly brief

- Activation functions: short peeks only (sigmoid saturation in cluster 1, ReLU's unboundedness
  in cluster 3) + pointer to their own forthcoming chapter.
- Gradient clipping, early stopping, RMSNorm, data augmentation: short "be aware of" mentions.
- Small-batch noise as regularization: deferred / skipped (confusing here).
- Mixed precision, distributed training, optimizer bias-correction math: not covered.

## Resolved decisions

- **Activation-function ordering:** training stays ch 11. Activation functions get only short
  peeks here (sigmoid saturation in cluster 1, ReLU's unboundedness in cluster 3); the full
  treatment is the following chapter.
- **Plan scope:** one implementation plan covers the whole chapter end to end — content.mdx (all
  five clusters), all five playgrounds, the residual-stream diagram, the quiz, and the notebook.
- **Residual-stream diagram:** build it as a static diagram alongside the cluster 1 prose.
- **Slug / title:** `training` / "Why Training Almost Doesn't Work" (unchanged).
