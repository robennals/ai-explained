# AI Explained — Curriculum Outline

## Editorial Philosophy

Every chapter should have at least one "wait, what?" moment — something counterintuitive, a surprising connection to an unrelated domain, or an approach that *seems* like it should work but spectacularly doesn't. The goal is not to march through concepts linearly, but to make readers feel the *shape* of the problem space.

The target audience is smart middle schoolers. Every chapter must connect to their lived experience — their phone, their games, ChatGPT, DALL-E, YouTube recommendations. Technical concepts (activation functions, loss functions, regularization, matrix math) are covered *within* exciting narrative chapters, not as standalone topics. No chapter should feel like a textbook section they have to get through before the fun stuff.

## Widget Philosophy

Widgets are not demonstrations — they are playgrounds. The reader should be tinkering, experimenting, trying to break things. Every widget should have a "try this" prompt that leads to a surprise. Many widgets should be challenge-style. The fun is in the attempt and the discovery.

---

## Chapter 1: Everything Is Numbers

- **Prerequisites**: None
- **Status**: ✅ Implemented

**Core idea**: Text, images, and sound are all just numbers. Thinking is a function. AI models are machines with knobs. The challenge: find the right settings among billions of possibilities.

**Widgets**:
1. **TextAsNumbers** — See how text, images, and audio become arrays of numbers.
2. **FunctionMachine** — A function with sliders for parameters. Try to match a target by hand.
3. **KnobExplosion** — How the search space explodes as you add parameters. Feel the impossibility.

---

## Chapter 2: The Power of Incremental Improvement

- **Prerequisites**: Ch 1
- **Status**: ✅ Implemented

**Core idea**: Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded. You don't need to be brilliant — just relentlessly slightly better.

**Widgets**:
1. **EvolutionPlayground** — Evolve creatures toward a target. Watch random mutations + selection produce design.
2. **GradientDescentHills** — Roll a ball downhill on a loss landscape. Adjust learning rate.
3. **SmoothVsJagged** — Why smooth functions are learnable and jagged ones aren't.

---

## Chapter 3: Building a Brain

- **Prerequisites**: Ch 2
- **Status**: 🔲 Planned

**Core idea**: A single neuron is just a weighted vote. Change the weights → same neuron becomes AND, OR, NOT. But one neuron can't solve XOR (try it!). Stack neurons into layers → suddenly you can learn anything. Deeper networks need fewer neurons (exponential efficiency of depth). But without activation functions, stacking is useless — three layers collapse to one.

**Surprise**: Early layers automatically learn edges, middle layers learn shapes, deep layers learn objects. Nobody told the network to do this — hierarchy emerges from the math.

**Technical concepts woven in**: Perceptrons, activation functions (sigmoid → ReLU → Swish), universal approximation, depth vs width tradeoff.

**Widgets**:
1. **NeuronChallengePlayground** — Single neuron with draggable weights/bias. Challenge board: AND ✓, OR ✓, NOT ✓, XOR ✗. Feel the limitation.
2. **ActivationMatters** — Toggle activation functions on/off in a deep network. Off: collapses to single line. On: can learn curves and spirals. Try different activations and see dead neurons, vanishing gradients.
3. **DepthVsWidth** — Approximate a target function: 1 wide layer (500 neurons) vs 3 narrow layers (20 neurons). See depth win dramatically.
4. **WhatLayersLearn** — Train image classifier, visualize what each layer detects. Watch edges → shapes → objects emerge.

---

## Chapter 4: Learning from Mistakes

- **Prerequisites**: Ch 3
- **Status**: 🔲 Planned

**Core idea**: Training is the network watching itself fail and adjusting. The loss function defines what "wrong" means — change the loss and you change what the model learns. Gradient descent finds the direction of steepest improvement. But if you train *too* well on your examples, the model memorizes instead of learning (like memorizing answers vs understanding math).

**Surprise**: "Local minima" fear is mostly wrong — in high dimensions, what looks like a valley is usually a saddle point. Rotate the view and there's always a way down.

**Technical concepts woven in**: Loss functions (MSE, cross-entropy), gradient descent, backpropagation, learning rate, overfitting, regularization (L2, dropout), train vs test split.

**Widgets**:
1. **LossFunctionComparison** — Drag a prediction slider, see different loss functions react. MSE is gentle, cross-entropy is harsh near wrong answers.
2. **GradientDescentVisualizer** — 2D loss contour, place ball, adjust learning rate/momentum. Too high → bouncing. Too low → glacial.
3. **OverfittingDemo** — Fit a curve to noisy data. Drag complexity slider. Watch: perfect training fit = terrible test performance. Add dropout → model gets *better* by being handicapped.
4. **SaddlePointIllusion** — A surface that looks like a trapped minimum from one angle. Rotate to reveal it's a saddle point with an escape route.

---

## Chapter 5: The Geometry of Meaning

- **Prerequisites**: Ch 4
- **Status**: 🔲 Planned

**Core idea**: How do you turn words into numbers that capture meaning? One-hot encoding is terrible (cat is equidistant from dog and democracy). Embeddings learn to place similar things close together. "king − man + woman = queen" actually works. This is how AI "understands" language — not through definitions, but through the geometry of relationships.

**Surprise**: The dimensions of an embedding space are rotatable. There's no single "correct" set of features — you can rotate the axes to reveal gender, formality, concreteness, or axes no human has names for.

**Widgets**:
1. **OneHotVsEmbedding** — Compare one-hot distances (everything equidistant) to learned embedding distances (meaningful clusters).
2. **WordEmbeddingExplorer** — ~1000 words projected to 2D. Search, zoom, discover clusters. Try analogies: king − man + woman = ?
3. **DimensionRotator** — View embeddings along different interpretable axes. Define custom axes via word pairs (e.g., man→woman, small→large).

---

## Chapter 6: Attention and Transformers

- **Prerequisites**: Ch 5
- **Status**: 🔲 Planned

**Core idea**: Before transformers, models read sentences like a telephone game — by the end, early words were forgotten. Attention lets every word look directly at every other word. But without position encoding, "dog bites man" and "man bites dog" look identical. Q/K/V decoupling lets words ask different questions than they answer.

**Surprise**: Attention is permutation invariant — word order is a bolt-on, not built-in. The model has to *learn* that order matters.

**Technical concepts woven in**: Brief RNN/vanishing gradient motivation, self-attention, Q/K/V, position encoding, multi-head attention.

**Widgets**:
1. **TelephoneGame** — Type a long sentence. Color each word by how much influence it has on the final output. Watch early words fade to nothing (RNN) vs stay vivid (Transformer).
2. **PositionEncodingDemo** — Scramble word order. Without positions: identical attention. With positions: completely different.
3. **SelfAttentionPlayground** — Live attention maps. See how "it" attends to different words depending on context. Q/K toggle: force Q=K → attention becomes symmetric (wrong!). Separate Q/K → directional (right!).

---

## Chapter 7: How LLMs Learn to Talk

- **Prerequisites**: Ch 6
- **Status**: 🔲 Planned

**Core idea**: An LLM learns about the world by playing a game: predict the next word. This seems too simple to produce intelligence, but to predict well, you need to understand grammar, facts, reasoning, humor, even emotions. Tokenization shapes what the model can see — "indescribable" → ["in", "des", "crib", "able"]. Numbers tokenize inconsistently, which is why LLMs are bad at arithmetic.

**Surprise**: The model has never been told what a verb is, what gravity does, or how to tell a joke. It figured all of this out from patterns in text.

**Technical concepts woven in**: Tokenization (BPE), next-token prediction, temperature/sampling, probability distributions over vocabulary.

**Widgets**:
1. **TokenizerPlayground** — Type anything, see tokens colored in real time. Try math ("123456" vs "one hundred"), compare languages, find weird splits.
2. **NextTokenPrediction** — Type a sentence, see probability distribution over next words. Adjust temperature: low = boring and predictable, high = creative chaos.
3. **PredictionRequiresUnderstanding** — Curated examples where predicting the next word requires world knowledge, grammar, reasoning, or social awareness.

---

## Chapter 8: Transfer Learning

- **Prerequisites**: Ch 7
- **Status**: 🔲 Planned

**Core idea**: A model trained on millions of books has learned a staggering amount about language, facts, and reasoning — even though it was "just" predicting next words. This knowledge *transfers*: show it 5 examples of a new task and it can do it. Fine-tuning adjusts this general knowledge for specific jobs with minimal data. This is why one model can write poetry, debug code, and diagnose diseases.

**Analogy**: Pre-training is like getting a general education. Fine-tuning is like specializing in medical school. You don't start from scratch — you build on everything you already know.

**Surprise**: A model fine-tuned on just 1,000 medical Q&As outperforms a model trained from scratch on 100,000. The general knowledge does most of the heavy lifting.

**Widgets**:
1. **FewShotMagic** — Pre-trained model learns new task from 3 examples. Random model with same examples: nothing. Feel the power of prior knowledge.
2. **PretrainedVsRandom** — Side-by-side: embedding structure from pre-trained vs random model. Fine-tuning barely changes the structure — it's already organized.
3. **FineTuningPlayground** — Take a pre-trained model, fine-tune on tiny dataset for sentiment/topic/style. Watch how fast it adapts vs training from scratch.

---

## Chapter 9: Distillation — Big Teaches Small

- **Prerequisites**: Ch 8
- **Status**: 🔲 Planned

**Core idea**: A huge model knows a lot — but it's too big and slow for your phone. Solution: train a tiny model to mimic the big one's behavior. The small model learns from the big model's *soft predictions* (not just right/wrong, but the full probability distribution). A cat picture that's "90% cat, 8% tiger, 2% dog" teaches more than just "cat."

**Analogy**: Learning from a great teacher vs learning from a textbook. The teacher gives you intuition, not just answers. That intuition is "dark knowledge."

**Surprise**: A distilled model can sometimes outperform a model of the same size trained normally — because the teacher's soft labels carry more information than the raw data.

**Widgets**:
1. **HardVsSoftLabels** — Compare learning from "cat" vs learning from "90% cat, 8% tiger, 2% dog." See how soft labels reveal structure between categories.
2. **DistillationDemo** — Big teacher model classifies images. Small student tries to match. Compare student trained on hard labels vs soft labels from teacher.
3. **PhoneVsCloud** — Size/speed/accuracy tradeoff visualizer. Drag the "acceptable accuracy" bar and see how small you can go with distillation vs without.

---

## Chapter 10: Mixture of Experts

- **Prerequisites**: Ch 6
- **Status**: 🔲 Planned

**Core idea**: Your brain doesn't activate every neuron for every thought. Mixture of Experts works the same way: a router sends each input to the best-suited specialists. A model with 1 trillion parameters might only use 100 billion per question. This is how models keep getting smarter without getting proportionally slower.

**Analogy**: A hospital with specialist doctors. You don't see every doctor for every problem — a triage nurse routes you to the right expert. The hospital has vast total knowledge, but each patient only consumes a fraction.

**Surprise**: The router learns to specialize the experts *without being told what specialties to create*. Math questions automatically go to "math neurons," language questions to "language neurons."

**Widgets**:
1. **RouterVisualizer** — Type different inputs and watch which experts light up. Math activates different experts than poetry. Try to find inputs that activate the same experts.
2. **DenseVsSparse** — Compare: dense model (all parameters active) vs MoE (same total parameters, 10% active). Same quality, fraction of the compute.
3. **ExpertSpecialization** — What did each expert learn? Feed different types of inputs and see which expert "claims" each type. The specialization emerges without supervision.

---

## Chapter 11: Thinking Step by Step

- **Prerequisites**: Ch 7
- **Status**: 🔲 Planned

**Core idea**: Standard LLMs blurt out answers in one shot — one forward pass per token, with no "scratch paper." For hard problems, this fails. Chain-of-thought lets models show their work, using their own output as working memory. Thinking models (like o1 and Claude) take this further: they're trained to *reason* through problems before answering, sometimes spending minutes thinking.

**Analogy**: Answering "what's 347 × 28?" in your head instantly vs writing it out step by step. Some problems *require* intermediate steps.

**Surprise**: Simply adding "let's think step by step" to a prompt can make a model go from failing a problem to solving it — the same model, the same knowledge, just more "time to think."

**Widgets**:
1. **OneShotVsChainOfThought** — Same hard problem, same model. One-shot: wrong. With chain of thought: right. What changed? Just scratch paper.
2. **ThinkingBudget** — Adjust how many "thinking tokens" a model gets. Too few: sloppy answers. More: better answers. Too many: diminishing returns. Find the sweet spot.
3. **WhenThinkingHelps** — Collection of problems. Some benefit hugely from step-by-step reasoning (logic, math). Others don't (simple recall, pattern matching). Discover which problems need "slow thinking."

---

## Chapter 12: Scaling and Emergence

- **Prerequisites**: Ch 8
- **Status**: 🔲 Planned

**Core idea**: Make a model 10× bigger and it gets smoothly better at predicting the next word. Nothing dramatic — just a straight line on a log-log plot. But zoom into specific capabilities and something weird happens: arithmetic goes from 0% to 90% accuracy at a specific size. Theory of mind appears. Translation quality jumps. Smooth trends at the macro level, sudden jumps at the micro level.

**Surprise**: Nobody programmed arithmetic into these models. They weren't trained on math drills. They were just predicting text — and at some point, arithmetic emerged as a *side effect*.

**Widgets**:
1. **ScalingLawsChart** — Interactive log-log plot of model size vs loss. Straight line. Boring? No — zoom into individual capabilities on the same axes.
2. **EmergencePlot** — Multiple capability curves vs model size. Some smooth, others show sharp "phase transitions." Find the model size where each capability appears.
3. **PredictTheJump** — Given scaling curves for several tasks, predict: at what size will the model gain a new capability? Feel how hard this is to predict.

---

## Chapter 13: Teaching AI Right from Wrong

- **Prerequisites**: Ch 7
- **Status**: 🔲 Planned

**Core idea**: A raw pre-trained model completes text but doesn't try to be helpful. RLHF transforms "text completer" into "helpful assistant" by training on human preferences. But Goodhart's Law strikes: optimize too hard on a reward signal and you get sycophantic nonsense. The model learns to tell you what you want to hear, not what's true.

**Analogy**: Like a student who learns that the teacher gives As for long essays. They start writing longer and longer essays about nothing. The metric (essay length) got optimized, but the goal (good essays) got lost.

**Surprise**: After RLHF, models get slightly worse at raw capability benchmarks — but dramatically more useful in practice. Being helpful is different from being smart.

**Widgets**:
1. **RewardModelDemo** — Rank response pairs like a real RLHF labeler. See the reward model learn your preferences — and then mis-generalize in amusing ways.
2. **RewardHackingDemo** — Crank optimization pressure. Watch: helpful → verbose → sycophantic → meaningless. Goodhart's Law in action.
3. **AlignmentTaxDemo** — Side-by-side: base model vs aligned model on capability tests vs usefulness tests. Small capability cost, huge usefulness gain.

---

## Chapter 14: Creating Images from Noise

- **Prerequisites**: Ch 4, Ch 5
- **Status**: 🔲 Planned

**Core idea**: Generating an image pixel-by-pixel fails (errors cascade). Diffusion models take a different approach: start with pure noise and gradually denoise. The model learns what "a little less noisy" looks like at every noise level. Latent space is a map of all possible images — nearby points are similar images, and you can walk between them.

**Toy models (browser via TF.js)**: Tiny VAE on MNIST (~500KB), tiny diffusion model on colored shapes (~200KB).

**Surprise**: The model never sees a clean image during training — only noisy ones. Yet it learns to create perfect images from pure static.

**Widgets**:
1. **PixelByPixelFailure** — Watch autoregressive generation go wrong. One bad pixel cascades into chaos.
2. **DiffusionPlayground** — Add/remove noise with slider. Generate from pure noise. Adjust denoising steps: too few → blobby, just right → crisp.
3. **LatentSpaceExplorer** — 2D map of latent space. Click to generate. Drag between points to interpolate (watch a 3 morph into a 7).
4. **ConditionalGeneration** — Generate [color] [shape] with label conditioning. Try contradictory instructions and see what happens.

---

## Implementation Phases

| Phase | Chapters | Key Infrastructure |
|-------|----------|--------------------|
| 1 | 1–2 | Next.js, MDX, Tailwind, widget system, layout |
| 2 | 3–4 | Neuron/network diagrams, training animations |
| 3 | 5–7 | Word embeddings data, attention visualizations, Transformers.js |
| 4 | 8–11 | Transfer learning demos, MoE routing, chain-of-thought |
| 5 | 12–14 | Scaling charts, RLHF simulation, browser ML training |
