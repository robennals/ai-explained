# Pre-Launch Review

A review of all 9 published chapters (computation through transformers) plus the
PyTorch appendix, against the criteria:

- Would this make sense to a middle schooler?
- Is every unfamiliar concept defined before use, or linked back to where it was?
- Does every complex concept have a playground?
- Does every sentence earn its space?
- Do we use the simplest language that works?
- Is everything true?
- Is everything consistent across the tutorial?

## Bugs to fix before launch

These are mechanical, factual issues. The plan is to fix them in a single pass.

### B1. Embeddings ends by promising a "matrix multiplication" chapter

`src/app/(tutorial)/embeddings/content.mdx:151` says:

> In the next chapter, we'll discover that every neural network layer is doing
> the same thing: **matrix multiplication** — a geometric transformation that
> rotates, stretches, and reshapes space.

But the next published chapter is **Next-Word Prediction**. Matrix-math is
chapter 10 in the curriculum and is not marked `ready`.

**Fix:** Rewrite the "What's Next" of the embeddings chapter to bridge into
next-word prediction.

### B2. PyTorch appendix has stale `Chapter 5` / `/matrix-math` references

- `appendix-pytorch/content.mdx:128` — `[Chapter 5](/matrix-math)`
- `appendix-pytorch/content.mdx:192` — `[Chapter 5](/matrix-math)`

Embeddings is Chapter 5; matrix-math is unpublished. Both links 404.

**Fix:** Replace with prose that refers to existing chapters (e.g. drop the
"see Chapter 5" parenthetical, or point at the relevant Chapter 3/4 content).

### B3. PyTorch appendix references ReLU as "Chapter 3"

- `appendix-pytorch/content.mdx:210` — `nn.ReLU(),  # activation function (Chapter 3)`
- `appendix-pytorch/content.mdx:217` — *"stacking linear layers would just give you another linear layer (Chapter 3 explains why)"*

The neurons chapter only covers sigmoid and never names ReLU, and never
explains why stacked linear layers collapse.

**Fix:** Either drop the cross-references, or add a brief inline explanation
in the appendix itself.

### B4. Forward-references that are never delivered

- `neurons/content.mdx:64` — *"We'll cover regularization in a later chapter"*
  — never delivered.
- `neurons/content.mdx:147` — *"We'll go into the details in a later chapter on training"*
  — never delivered (backpropagation only appears in this one paragraph).
- `vectors/content.mdx:81` — *"In a later chapter, we'll see that … information flows through a running sum called a residual stream"*
  — the term *residual stream* never appears anywhere later.

**Fix:** Drop the forward-references. They can be added back when those
chapters ship.

### B5. Vectors curriculum description doesn't match the chapter

`src/lib/curriculum.ts` says the vectors chapter will *"discover why activation
functions make depth meaningful."* The chapter doesn't make that argument; it
covers vectors → dot product → neuron-as-detector and stops. (The curriculum
description was written for a more ambitious chapter than what shipped.)

**Fix:** Trim the description to match what's in the chapter.

### B6. Typos / formatting

- `positions/content.mdx:47` — *"More fundamentially"* → fundamentally.
- `positions/content.mdx:49` — ASCII hyphens where em-dashes are used elsewhere.

### B7. Section title says "Two Neurons Solve XOR" but the network has three

`neurons/content.mdx:104` — heading: "Two Neurons Solve XOR". The body
correctly notes *"Three neurons, two layers — problem solved."*

**Fix:** Rename the section heading.

### B8. Two factually-fragile claims worth softening

- `neurons/content.mdx:19` — *"elephants and sperm whales have far more connections than humans, yet aren't smarter than us."* Synapse counts here are loose; sperm whales have fewer cortical neurons than humans.
- Multiple chapters cite **GPT-5 sizes**. GPT-5 is undisclosed; this will date quickly.

**Fix:** Hedge to "frontier models" or to a verifiable claim about elephants
specifically.

## Hardest-to-understand parts (deferred — bigger rewrites)

These are not "bugs" but areas where a middle schooler will struggle most. They
are recorded here for follow-up, not fixed in the launch pass.

### H1. Positions chapter — the leap into RoPE

The single hardest stretch in the tutorial. Sections "Applying Rotation to a
Dimension" through "You Don't Need to Double the Dimensions" ask the reader to
absorb rotation invariance, splitting one feature into 2D coords, position
× speed, multi-speed pairs, and pair-collision avoidance — all in two pages.

The sentence *"each token can specify an arbitrary distance penalty curve by
choosing how much weight to put in dimension pairs that rotate at different
speeds"* is the climax, but who/what is "choosing" is never grounded. Suggest:
add a bridge framing the choice as something the *training process* induces
via the Q/K projection weights, and break the rotation derivation into smaller
steps with a worked example before the multi-speed widget.

### H2. Transformers chapter is the lightest treatment of the most important architecture

Only 76 lines for the capstone, vs 145–161 for earlier chapters. The
TransformerInActionWidget is admitted to be hand-coded ("written by hand
rather than being generated by a real transformer"). Feedforward layers,
LayerNorm, and residual connections are bundled into a click-through diagram
without prose. The "logits → next token" step that closes the prediction loop
is missing entirely.

This chapter deserves to be the longest, not the shortest.

### H3. Embeddings — "Adding Meaning" + the embedding-layer reveal

The footnote *"subtraction is just a detective's trick — we extract
transformations this way so we can see them, but real neural networks learn
transformation vectors directly as weights during training"* is the most
confusing sentence in the chapter. It deserves a paragraph, not a parenthetical.

Also "Where Do Embeddings Come From?" lands *after* arithmetic and tokenization,
even though it's the mechanical foundation. Re-order so one-hot → embedding
layer comes earlier.

### H4. Attention — "Where the Vectors Come From" is too compressed

The Q/K/V projection paragraph (`attention/content.mdx:104-114`) is the moment
the abstraction becomes mechanical, but it's two short paragraphs. The line
*"the only difference is there's no activation function"* is dropped without
justification, after three chapters of telling readers activation functions
are essential. Add a sentence on why linear projections preserve geometry and
nonlinearity comes later in the FFN.

### H5. Neurons — sigmoid → sharpness → trainability chain

The "There's a catch" paragraph (`neurons/content.mdx:64`) tries to explain
three things at once. Either give it its own section with an illustration, or
drop the regularization tease (this overlaps with B4).

### H6. Vectors — "What and How Much" decomposition

The unit-vector × magnitude split is reused as the central framing for "neuron
is a pattern detector," but it's introduced abstractly. A 2D arrow showing
"same direction, different lengths = same detector, more sensitive" *before*
the abstract framing would land it.

### H7. Next-Word Prediction — closing philosophical detour

The Karl Friston "free energy principle" name-drop at the end of the chapter
doesn't earn its space for a middle-school reader and interrupts the bridge to
attention. Move to a `<Callout>` or cut.

## Cross-cutting style observations (deferred)

**Sentences that don't earn their space:**
- `computation/content.mdx:9` — "AI can write essays, debug code, …" laundry list.
- `optimization/content.mdx:19-25` — three examples for one point; cut to two.
- `transformers/content.mdx:39-43` — "Interpretability" section is academic without payoff.

**Complex language where simple would do:**
- "Causal masking" leans on "enforces a causal relationship" before simplifying
  to "you can only see what you've already written."
- "Magnitude" introduced via Pythagoras before "length of the arrow."

**Interactivity gaps:**
- Backpropagation is named but has no widget.
- The full transformer prediction loop (logits → softmax-over-vocab → sampled token)
  has no widget; transformers shows representations but never closes the loop.

**Consistency:**
- Embeddings says *"the embedding layer has no bias and no activation function"*
  but the reader was never told biases are optional. Lands as a contradiction.
- "Sharpness" of the sigmoid is described as scaling weights, but the
  playgrounds let weights and biases scale independently.

## Order of operations

1. Fix B1–B8 in this PR.
2. Open follow-ups for H1–H7 and the style observations.
