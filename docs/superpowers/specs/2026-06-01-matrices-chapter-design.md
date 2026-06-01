# Design: Restructured "Matrices" Chapter

**Date:** 2026-06-01
**Status:** Approved design — ready for implementation plan
**Chapter:** `matrices` (renamed from `matrix-math`), curriculum id 10

## Problem

The matrices chapter is an older, unpublished draft that has drifted out of sync
with the rest of the curriculum. It teaches matrices through abstract 2D geometry
(stretch/shear/rotate arrows and a cat) and never uses the animal-vector framing
that every other chapter now shares. It also misses the most important payoffs:
that a neural-network layer *and* attention are both matrix multiplication, and
that matrices' usefulness for 2D/3D rotation is why GPUs exist — and why those
same chips ended up running AI.

## Goals

1. Teach matrices on top of the curriculum's shared **animal-vector** framing
   (high-dimensional, not 2D), consistent with Vectors, Embeddings, and Attention.
2. Make the core idea unintimidating: **a matrix is just several dot products
   written out at once** — a stack of detectors. The reader already understands
   the dot product, so a matrix is something they basically already understand.
3. Show that **a neural-network layer** and **attention** are both this same
   operation.
4. A fun cold-open that makes it obvious why this matters: the GPU/games twist.
5. Explain that matrices' use for 2D/3D rotation is why GPUs were built to be fast
   at them — and it turned out they were also good for neural networks.
6. Keep a **fun** 2D/3D transform playground (restoring the dropped 3D models),
   used as an aside for the GPU story, **not** as the vehicle for teaching what a
   matrix means.
7. Focus ruthlessly on what matters for understanding how matrices are used in AI.
8. Rename the chapter from `matrix-math` to `matrices`.

## The Spine

> **A matrix is several dot products written out at once — a stack of detectors.**

A bear-detector (from the Vectors chapter) is a dot product. Want a bear-detector
*and* an eagle-detector *and* a snake-detector? Stack their weight-vectors as the
**rows** of a matrix. One matrix-multiply runs all of them in a single shot,
re-describing an animal as "0.8 bear-like, 0.1 eagle-like, 0.3 wolf-like." A matrix
isn't a scary new object; it's multiple dot products written together.

Everything else is a consequence of this one idea:
- **Enough varied detectors** → the new description loses nothing (reversible: a
  pure change of vocabulary). **Too few** → compression, detail lost — which is
  exactly what AI layers and embeddings do.
- **A neural-network layer** is a stack of detectors the network *learned for
  itself* instead of us hand-picking bear/eagle/snake — followed by an activation
  function applied to the whole output vector.
- **Attention's match-score step** is exactly a detector stack: a matrix of every
  context token's *key* times the current token's *query* vector → a vector of match
  scores (one matrix × vector per query token, per head). (The Q/K/V vectors are
  themselves produced by matrix multiplies, and blending the values is one too — but
  the score step is the one that reuses this chapter's spine directly.)
- The same multiply-and-add machine **rotates 2D and 3D worlds** — which is why
  GPUs were built for it (games), and why those chips now run AI.

## Pedagogical Decisions (resolved during brainstorming)

- **Cold open:** the GPU/games twist — the chips running ChatGPT were built to make
  videogames look good. Mystery posed up front, **resolved in the final aside (§6)**
  once the reader understands matrices well enough not to be confused by seeing them
  in 2D/3D.
- **Animal framing:** named anchors first (bear/eagle/snake/wolf as reference
  animals = the matrix's rows = detectors), then the reversibility payoff
  (lossless when the reference set is good enough; lossy when too few).
- **Geometry is a brief fun aside, not a backbone.** Cut the 2D/3D teaching of
  basis vectors and projection — we teach "what a matrix means" with animals
  instead. The 2D/3D widgets exist because they're fun and because they explain the
  GPU history.
- **Activation functions: trimmed.** No standalone 2D activation widget. The "why
  you need a bend" point gets a brief section backed by a **matrix-composition
  widget** (two matrix multiplies collapse into one, shown by displaying the product
  matrix). The visual "what a nonlinearity does to a shape" lives as an optional
  **toggle inside the 2D/3D playground**. ReLU/sigmoid details stay in the Training
  chapter.
- **Title:** "A Thousand Questions at Once" (subtitle: "Matrices").
- **Prerequisites:** bump from `[4]` (vectors) to `[7]` (attention) — the chapter
  now relies on neurons, embeddings, and attention.

## Chapter Structure

### Cold open (`<Lead>`)
The graphics card running ChatGPT was invented to make videogames look good. The
same operation that spins a 3D dragon in a game is the operation a neural network
uses to think: matrix multiplication. By the end, you'll see why the same chips do
both. (Mystery posed; resolved in §6.)

### §1 — You already know this (a matrix is many dot products at once)
Recall from Vectors: a bear-detector is a dot product of an animal's vector with a
"bear" weight-vector. Want several detectors at once — bear, eagle, snake, wolf?
Stack their weight-vectors as the rows of a grid. Multiplying the animal-vector by
that grid runs every detector in one shot and produces a new vector: "how bear-like,
how eagle-like, how snake-like, how wolf-like." That grid is a **matrix**. Matrix
multiplication is just multiple dot products written out together. Nothing new.

**Widget — NEW `DetectorStack`:** feed a high-dimensional animal vector in; show each
row computing its dot product and lighting up; out comes a vector of similarity
scores. Reader can swap the input animal and the reference animals.

### §2 — Can you get the original back? (reversible vs. lossy)
If you pick as many varied reference animals as there are dimensions, the new
"how-X-like" description contains all the original information. To *prove* it, build
the matrix that **undoes** the re-description — its **inverse** — and apply it: you
get the original animal back exactly. It was a pure change of vocabulary (a lossless
re-description, the same thing a 3D rotation does). Use **fewer** reference animals
than dimensions and there's no way back — detail is lost, some animals become
confusable. That lossy compression is exactly what an AI layer that shrinks dimensions
does, and the seed of embeddings. Keep the word "inverse" light — show the round-trip,
don't lecture on how inverses are computed.

**Widget:** extend `DetectorStack` into a **round-trip** view — animal → matrix →
re-described vector → inverse matrix → recovered animal. Control the number of
reference animals: enough good ones → exact recovery (lossless); too few → can't
recover (lossy). [Plan to decide: one combined widget vs. a second view.]

### §3 — A layer of a neural network is a matrix (plus a bend)
A neural-network layer takes an input vector and produces an output vector by running
a stack of weighted sums — i.e., a stack of dot products — i.e., a matrix multiply.
The only difference from §1 is that the network **learns its own detectors** (its own
useful "reference concepts") during training, instead of us hand-picking
bear/eagle/snake. **But a layer is not *just* a matrix:** after the matrix produces its
output vector, the layer applies an **activation function to that whole vector** (one
simple nonlinear step per output number). So a layer = matrix multiply, then a bend.
Why the bend is there is the next section.

**Widget:** show the layer in detector terms — the §1 `DetectorStack` matrix followed
by an activation step applied to the whole output vector. (Plan to decide whether to
extend `DetectorStack` or adapt/reframe `NeuronVsMatrix` away from its 2D geometry; the
neuron ↔ matrix duality is worth keeping if it can be shown in detector terms.)

### §4 — Why the bend can't be dropped (matrix × matrix = one matrix)
If you stack two matrix multiplies with nothing between them, the result is just...
*one* matrix multiply — you can compute the single combined matrix that does both at
once. So stacking pure matrix layers computes nothing a single matrix couldn't, and
depth would be pointless. That's why the activation function from §3 matters: a
nonlinear bend between layers makes stacked layers able to do things no single matrix
can. How the bend works (ReLU, sigmoid) is the Training chapter's job.

**Widget — NEW `MatrixComposition`:** show two detector-matrices multiplied together,
**and display the resulting product matrix**, so the reader sees two layers collapse
into one. (The visual of *what a nonlinearity does to a shape* is deferred to the §6
2D/3D playground's activation toggle.)

### §5 — Attention is a matrix multiply too
The match-score step of attention is exactly the §1 detector stack. Stack every
context token's **key** as a row of a matrix, multiply by the current token's **query**
vector, and out comes a vector of match scores — one score per token. The keys are the
detectors; the query is the input. It's a single matrix × vector per query token, per
head. (Briefly: the query/key/value vectors are themselves produced by matrix
multiplies — the "one-layer network without an activation function" the Attention
chapter mentioned — and blending the values by the attention weights is another matrix
multiply. Attention is matrix multiplication through and through.) Callback-heavy;
reuses the reader's attention knowledge.

**Widget:** prose + a light attention-flavored reuse of the detector-stack visual
(keys as rows, query as input). Plan to decide whether a dedicated widget is worth it.

### §6 — Aside: the same math spins 2D and 3D worlds — and that's why GPUs run AI
Resolve the cold open. The exact same multiply-and-add re-describes a 2D or 3D point's
position — i.e., **rotates** it. Every frame of a 3D game multiplies every vertex by
matrices. GPUs were built to do millions of these multiply-adds in parallel for games.
Then it turned out neural networks are *also* mostly matrix multiplication — so the
hardware built for games became the hardware for AI. This section is deliberately
light: it's fun, and it closes the loop. It does **not** lecture about basis vectors or
projection (the reader already understands what a matrix means, from the animals).

**Widget — NEW `Transform2D3D`:** a single playground with **2D / 3D tabs**. 2D tab
spins/shears a cat (from existing `Transform2D`); 3D tab spins a chicken/shiba (from
existing `Transform3D`, restoring the dropped 3D models). Presets are about *fun*
(rotate, spin, tumble), not about teaching coordinate systems. Includes an optional
**"apply activation" toggle** so the reader can *see* a nonlinearity warp the shape
(this absorbs the old standalone `ActivationEffect` widget).

### §7 — Training / What's next
Training searches for the right detectors at every layer — the right matrices. Next:
how gradient descent finds them. Link to the PyTorch notebook.

## Widget Plan

**New:**
- `DetectorStack` (§1) — the core widget: a matrix as a stack of dot-product rows over
  a high-dimensional animal vector. Extended in §2 into a **round-trip** view (matrix →
  inverse matrix → recovered original) with a reference-count control for lossless vs.
  lossy. Extended in §3 with an activation step on the output vector.
- `MatrixComposition` (§4) — two detector-matrices multiplied, **displaying the product
  matrix**, so two layers visibly collapse into one.
- `Transform2D3D` (§6) — one tabbed playground assembled from the existing `Transform2D`
  and `Transform3D` internals; fun presets only, plus an optional "apply activation"
  toggle (absorbs the old `ActivationEffect`).

**Reuse, reframed (plan to confirm):**
- `NeuronVsMatrix` — candidate to adapt for §3's neuron ↔ matrix duality **only if** it
  can be reframed in detector terms rather than 2D geometry; otherwise cut.

**Cut (unwired, files stay on disk):**
- `Transform1D` (1D warmup), `BasisVectorView` (basis-via-2D),
  `DimensionProjection` (folded into §2 reversibility), `HigherDimensions`,
  `ActivationEffect` (folded into the §6 playground toggle).

## Rename Mechanics (full surface area)

- `src/lib/curriculum.ts` — slug `matrix-math` → `matrices`; subtitle → "Matrices";
  title → "A Thousand Questions at Once"; prerequisites `[4]` → `[7]`.
- Rename folder `src/app/(tutorial)/matrix-math/` → `matrices/`.
- `matrices/page.tsx` — `chapterMetadata("matrices")`, `getAdjacentChapters("matrices")`,
  and the widget import list (drop cut widgets, add new ones).
- `matrices/content.mdx` — `<TryItInPyTorch notebook="matrices">`.
- Notebook `notebooks/matrix-math.ipynb` → `notebooks/matrices.ipynb`; fix internal
  `/matrix-math` links and stale "Chapter 5 / Matrix Math" labels; **mirror the chapter
  section-by-section** per the notebook convention (build a matrix as stacked dot
  products; show `nn.Linear` is a matrix multiply; show attention's Q/K/V projections
  are matrix multiplies; demonstrate `matrix × matrix = matrix` and why a nonlinearity
  is needed).
- Glossary `firstAppearance: matrix-math` → `matrices` in
  `src/content/glossary/matrix.mdx`, `matrix-multiplication.mdx`, `relu.mdx`.
- `src/app/(tutorial)/appendix-pytorch/content.mdx` — two `[Chapter 5](/matrix-math)`
  links → `/matrices` (these currently 404; noted in `docs/plans/pre-launch-review.md`).
- Planning docs that mention `matrix-math` (`docs/plans/notebook-sync-*.md`,
  `pytorch-prerequisites.md`, `pre-launch-polish.md`) are historical references —
  update only where it prevents confusion; not load-bearing.

**Safety:** the chapter is not marked `ready`, so it is excluded from the live nav and
has no published URL. The rename needs no redirects.

## Consistency & Voice

- Match the curriculum's animal-vector framing and established notation: reuse the
  Vectors chapter's variable names, use `×` (not `·`), avoid invented subscripts like
  x₁/x₂.
- Follow `docs/style/voice.md`: no drumroll phrases, em-dash discipline, avoid the
  AI-vocabulary blocklist; no first-person singular in chapter prose; three-item lists
  are fine.
- Never use raw `<p>` tags in MDX (use `<Lead>` or `<div>`); `pnpm lint` enforces this.

## Out of Scope

- ReLU/sigmoid mechanics and training tricks (Training chapter).
- Deep basis-vector / change-of-coordinates theory (taught implicitly via animals; not
  belabored).
- Marking the chapter `ready` / publishing — a separate editorial decision.

## Verification

- `pnpm lint` (includes the no-raw-`<p>` MDX check) passes.
- `pnpm build` succeeds with the renamed route.
- The chapter renders, all wired widgets load, the 2D/3D playground shows both tabs
  with the restored 3D models.
- `pnpm test:notebooks` passes for the renamed `matrices.ipynb`.
- No remaining broken `/matrix-math` references in shipped content (app + notebooks +
  glossary + appendix).
