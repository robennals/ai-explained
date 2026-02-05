# AI Explained — Curriculum Outline

## Editorial Philosophy

Every chapter should have at least one "wait, what?" moment — something counterintuitive, a surprising connection to an unrelated domain, or an approach that *seems* like it should work but spectacularly doesn't. The goal is not to march through concepts linearly, but to make readers feel the *shape* of the problem space.

## Widget Philosophy

Widgets are not demonstrations — they are playgrounds. The reader should be tinkering, experimenting, trying to break things. Every widget should have a "try this" prompt that leads to a surprise. Many widgets should be challenge-style. The fun is in the attempt and the discovery.

---

## Chapter 1: What Is Computation?

- **Prerequisites**: None
- **Status**: ✅ Implemented

**Core idea**: Can you compute with just addition and multiplication? Discover you can't — you need gating/thresholds. Fuzzy logic (AND=min, OR=max, NOT=1-x) bridges boolean and continuous computation. NAND universality shows one brick builds everything.

**Widgets**:
1. **ArithmeticVsBooleanDemo** — Challenge: build AND using only + and ×. Fail. Add threshold → succeed.
2. **FuzzyLogicPlayground** — Continuous inputs (0.0–1.0), fuzzy AND/OR/NOT/NAND. Challenges for discovering behavior.
3. **LogicGateBuilder** — Wire NAND gates to build AND, OR, XOR. Feel complexity explosion.

---

## Chapter 2: Neurons and Perceptrons

- **Prerequisites**: Ch 1
- **Status**: 🔲 Planned

**Core idea**: A neuron is a fuzzy logic gate that learned its own truth table. Change weights → same neuron becomes AND, OR, NOT. The XOR challenge: try every weight/bias combination on a single neuron. You can't solve XOR — the decision boundary is a single line.

**Surprise**: The perceptron is the same thing as a linear classifier in statistics and a support vector with no kernel. Three fields independently discovered the same math.

**Widgets**:
1. **FuzzyToNeuron** — Morph fuzzy AND into a neuron by replacing min() with weighted sum + threshold.
2. **NeuronChallengePlayground** — Single neuron with draggable weights/bias/activation. Challenge board: AND ✓, OR ✓, NOT ✓, XOR ✗.
3. **PerceptronPlayground** — Draw 2D points, watch perceptron learn. Draw XOR-like data → fails.

---

## Chapter 3: Activation Functions

- **Prerequisites**: Ch 2
- **Status**: 🔲 Planned

**Core idea**: Stack neurons without activation functions → no better than single layer (proof: multiplying matrices gives a matrix). Sigmoid vanishing gradient. ReLU dead neurons. Swish's non-monotonic dip rescues dead neurons.

**Surprise**: Sigmoid = logistic curve in population biology = Fermi-Dirac distribution in physics.

**Widgets**:
1. **LinearStackingDemo** — Deep network with no activations collapses to single layer.
2. **ActivationFunctionExplorer** — Plot activation + derivative, stack N layers, watch gradient magnitude.
3. **DeadNeuronGraveyard** — Train ReLU network, watch neurons die. Switch to Swish, watch them resurrect.

---

## Chapter 4: Layers and Networks

- **Prerequisites**: Ch 2, 3
- **Status**: 🔲 Planned

**Core idea**: One hidden layer approximates any function (universal approximation), but needs 500 neurons. Three layers need only 20. Depth is exponentially more efficient.

**Surprise**: Early layers learn edges, then shapes, then objects — hierarchy emerges automatically.

**Widgets**:
1. **UniversalApproximationDemo** — Approximate target functions: 1 wide layer vs 3 narrow layers.
2. **ForwardPassAnimation** — Step-by-step data flow through network, try adversarial inputs.
3. **WhatLayersLearn** — Train image classifier, visualize what maximally activates each neuron.

---

## Chapter 5: Matrix Math and Linear Transformations

- **Prerequisites**: Ch 4
- **Status**: 🔲 Planned

**Core idea**: Every layer is literally a geometric transformation (rotation, scaling, shearing). Training = learning which transformation to apply. Visualize tangled data becoming linearly separable through matrix transforms.

**Surprise**: Same matrix math runs 3D graphics. GPU hardware for games turned out to be exactly what neural networks needed.

**Widgets**:
1. **MatrixTransform2D** — Drag handles to rotate/scale/shear 2D grid. Discover singular matrices, identity.
2. **MatrixTransform3D** — Three.js scene, rotate/scale/shear 3D objects. Eigenvectors as colored axes.
3. **UntanglingDemo** — Apply matrix + activation to untangle XOR/spiral data by hand.

---

## Chapter 6: Training, Gradient Descent, Backpropagation

- **Prerequisites**: Ch 3, 4, 5
- **Status**: 🔲 Planned

**Core idea**: Gradient descent = rolling downhill. High dimensions have saddle points, not local minima. Learning rate too high → bouncing, too low → glacial. Flat minima generalize better than sharp ones.

**Surprise**: "Local minima" fear is mostly wrong — saddle points are everywhere in high dimensions.

**Widgets**:
1. **GradientDescentVisualizer** — 2D loss contour, place ball, adjust learning rate/momentum/Adam.
2. **SaddlePointIllusion** — Surface that looks like local minimum from one angle, rotate to reveal saddle point.
3. **SpikyVsSmoothMinima** — Two minima, same loss. Add noise → sharp one explodes, flat one survives.

---

## Chapter 7: Loss Functions

- **Prerequisites**: Ch 6
- **Status**: 🔲 Planned

**Core idea**: Loss function is the most important design choice. MSE on classification → mushy boundaries. Cross-entropy → sharp boundaries. The loss tells the model what "wrong" means.

**Surprise**: Cross-entropy = KL divergence = maximizing likelihood = minimizing surprise. Lower loss = fewer bits to encode data.

**Widgets**:
1. **LossFunctionComparison** — Drag prediction slider, see MSE/cross-entropy/Huber values AND gradients.
2. **LossShapesModel** — Train identical networks with MSE vs cross-entropy, visualize decision boundaries.
3. **CompressionConnection** — Model's cross-entropy loss = compression ratio.

---

## Chapter 8: Regularization and Generalization

- **Prerequisites**: Ch 6, 7
- **Status**: 🔲 Planned

**Core idea**: Perfect training fit is terrible for generalization. Deliberately handicapping the model (L2, dropout) makes it better. This is Occam's Razor, mathematically.

**Widgets**:
1. **OverfittingDemo** — Fit polynomial to noisy data, drag complexity slider. Watch the U-turn in test loss.
2. **RegularizationVisualizer** — Toggle L1/L2/dropout, see weights shrink, fit smooth out.
3. **DropoutAnimation** — Watch neurons randomly vanish during training. Knowledge distributes.

---

## Chapter 9: Embeddings and Vector Spaces

- **Prerequisites**: Ch 5, 6
- **Status**: 🔲 Planned

**Core idea**: Embedding = 20 Questions with continuous answers. Network learns its own questions. "king - man + woman = queen" is real. One-hot encoding is terrible (cat equidistant from dog and democracy).

**Surprise**: Embedding dimensions are rotatable axes of meaning. No single "right" set of features.

**Widgets**:
1. **TwentyQuestionsAnalogy** — Play literal 20 Questions → make answers continuous → network learns its own questions.
2. **WordEmbeddingExplorer** — ~1000 words projected to 2D. Search, zoom, try analogies.
3. **DimensionRotator** — View embeddings along different interpretable axes. Define custom axes via word pairs.

---

## Chapter 10: Recurrent Architectures (Historical)

- **Prerequisites**: Ch 4, 9
- **Status**: 🔲 Planned

**Core idea**: RNNs have beautiful idea (persistent memory) but fatal flaw: can't remember beyond ~20 steps. Early words' influence fades to literally zero. This is the telephone game problem.

**Widgets**:
1. **RNNMemoryDecay** — Type sentence, color words by influence on final hidden state. Watch early words fade.
2. **VanishingGradientRNN** — Gradient magnitude flowing backward through 50 time steps. Hits zero after ~15.
3. **WhyNotJustLookBack** — Show RNN bottleneck vs attention idea (direct connections to any previous token).

---

## Chapter 11: Attention and Transformers

- **Prerequisites**: Ch 5, 9, 10
- **Status**: 🔲 Planned

**Core idea**: Without position encoding, model sees no difference between "dog bites man" and "man bites dog." Q/K/V decoupling enables asymmetric relationships. Attention is a soft database lookup.

**Surprise**: Attention is permutation invariant — positions are bolt-on, not built-in.

**Widgets**:
1. **PositionEncodingDemo** — Scramble word order. Without positions: identical attention. With positions: different.
2. **SelfAttentionPlayground** — Live attention maps from real BERT model (Transformers.js, ~30MB).
3. **QKVDecoupling** — Toggle Q=K → attention becomes symmetric. With separate Q/K → directional.

---

## Chapter 12: Tokenization

- **Prerequisites**: Ch 9
- **Status**: 🔲 Planned

**Core idea**: Tokenization shapes what the model can see. "indescribable" → ["in", "des", "crib", "able"]. Numbers tokenize inconsistently → explains why LLMs can't do arithmetic. BPE is a compression algorithm.

**Widgets**:
1. **TokenizerPlayground** — Type anything, see tokens colored in real time. Compare languages.
2. **BPEStepThrough** — Start from characters, step through merge algorithm. Watch tokens emerge.
3. **TokenizationArtifacts** — Curated weird tokenization behaviors explaining real LLM quirks.

---

## Chapter 13: Pre-training and Fine-tuning

- **Prerequisites**: Ch 6, 11, 12
- **Status**: 🔲 Planned

**Core idea**: Model learns about the world by predicting the next word. Seems too simple → but requires understanding syntax, semantics, world knowledge. Pre-training = education, fine-tuning = specialization.

**Widgets**:
1. **NextTokenPrediction** — Type sentence, see probability distribution over next words.
2. **PretrainedVsRandom** — Side-by-side embedding visualizations. Fine-tuning only slightly adjusts structure.
3. **FewShotMagic** — Pre-trained model learns from few examples. Random model with same examples learns nothing.

---

## Chapter 14: Scaling Laws

- **Prerequisites**: Ch 13
- **Status**: 🔲 Planned

**Core idea**: Performance scales as power law with compute — smooth, predictable. But individual capabilities suddenly appear at certain scales (emergence). Smooth macro trend, discontinuous micro behavior.

**Surprise**: Power laws appear everywhere in nature. Neural network scaling may relate to fractal structure of natural data.

**Widgets**:
1. **ScalingLawsChart** — Interactive log-log plot. Drag compute/data/parameter axes. Chinchilla-optimal frontier.
2. **EmergencePlot** — Multiple task accuracy curves vs model size. Some smooth, others show sharp jumps.

---

## Chapter 15: RLHF and Alignment

- **Prerequisites**: Ch 6, 13
- **Status**: 🔲 Planned

**Core idea**: Base model knows everything but does nothing useful. RLHF transforms "completes text" → "answers questions helpfully." Over-optimize reward model → sycophantic nonsense (Goodhart's Law).

**Widgets**:
1. **RewardModelDemo** — Rank response pairs like a real RLHF labeler. See reward model learn + mis-generalize.
2. **RewardHackingDemo** — Crank optimization pressure. Watch helpful → verbose → sycophantic → meaningless.
3. **AlignmentTaxDemo** — Alignment slightly reduces capability but massively increases usefulness.

---

## Chapter 16: Modern Architectures (Text)

- **Prerequisites**: Ch 11, 13, 14
- **Status**: 🔲 Planned

**Core idea**: Differences between GPT/BERT/T5 are tiny — mainly which tokens can see which others. One attention mask change → entirely different model. Mixture of experts: 1T parameters, only 100B active per thought.

**Widgets**:
1. **AttentionMaskComparison** — Side-by-side GPT/BERT/T5 attention masks. Same input, different information flow.
2. **MixtureOfExpertsVisualizer** — Router sends tokens to different experts. Each token activates ~10% of parameters.
3. **DecoderSamplingPlayground** — Adjust temperature, top-k, top-p. Low temp: boring. High temp: chaotic.

---

## Chapter 17: Image Generation

- **Prerequisites**: Ch 6, 9, 16
- **Status**: 🔲 Planned

**Core idea**: Autoregressive pixel-by-pixel generation fails (cascading errors). Diffusion models learn to undo randomness. Latent space is a map of all possible images. All demos run real toy models in browser via TF.js.

**Toy models (browser via TF.js)**:
- Tiny VAE on MNIST (~500KB)
- Tiny diffusion model on colored shapes (~200KB)
- Tiny autoregressive pixel model for 8×8 art

**Widgets**:
1. **PixelByPixelFailure** — Watch autoregressive model generate image pixel-by-pixel. See cascading errors.
2. **DiffusionPlayground** — Add/remove noise with slider. Generate from pure noise. Adjust denoising steps.
3. **LatentSpaceExplorer** — 2D map of VAE's latent space. Click to generate. Drag to interpolate (3→7).
4. **TrainYourOwnVAE** — Train tiny VAE on colored shapes in browser. Watch noise → blobs → shapes.
5. **ConditionalGeneration** — Generate [color] [shape] with label conditioning. Try contradictory instructions.

---

## Implementation Phases

| Phase | Chapters | Key Infrastructure |
|-------|----------|--------------------|
| 1 | 1–2 | Next.js, MDX, Tailwind, widget system, layout |
| 2 | 3–8 | TF.js lazy loading, Web Workers, NetworkDiagram |
| 3 | 9–12 | Word embeddings data, Transformers.js integration |
| 4 | 13–16 | Advanced visualizations |
| 5 | 17 | Pre-trained toy models, browser ML training |
