# Chapter Plan: Vectors

**Position**: Between Neurons (Ch 3) and Embeddings (Ch 4) — becomes new Ch 4, bumping current chapters forward.

**Slug**: `vectors`

**Title**: Vectors

**Subtitle**: Lists of numbers that describe the world

**Prerequisites**: Ch 3 (Neurons)

**Description**: A vector is just a list of numbers — but lists of numbers can describe position, color, animals, and anything else. Learn to see neurons as vector operations and discover why activation functions make depth meaningful.

---

## Editorial Approach

The neurons chapter ends with XOR and deep networks but never explains *why* a single neuron can only draw a straight line, or what "drawing a line" even means geometrically. The embeddings chapter jumps straight into "a vector is just a list of numbers" without building intuition for what vectors are or what you can do with them.

This chapter bridges that gap. It starts with vectors as a friendly, everyday concept (position, color, animal traits), builds up geometric intuition (1D → 2D → 3D → beyond), introduces key operations (magnitude, direction, dot product), and then reveals that a neuron is secretly doing a dot product — which means its behavior has a beautiful geometric interpretation. That pays off immediately: we can *see* why XOR is impossible for one neuron and why activation functions matter.

The "wait, what?" moment: a neuron is just a dot product and a squish. Everything about how neurons work — what they can and can't compute — falls out of that one geometric fact.

---

## Section-by-Section Plan

### 1. A Vector Is Just a List of Numbers

Open by defusing the word "vector." It sounds mathematical and scary, but it's just a list of numbers. Your GPS location is a vector: (latitude, longitude). An RGB color is a vector: (red, green, blue). A point in a video game is a vector: (x, y). We use vectors all the time without calling them that.

**Widget: VectorExamplesWidget**

Toggle between everyday examples of vectors, each illustrated visually:
- **Position**: A map pin with (latitude, longitude) coordinates — drag the pin, see the numbers update
- **Color**: An RGB color swatch with (red, green, blue) sliders — mix a color, see the vector
- **Game character stats**: (health, strength, speed) — adjust stats, see how the vector describes the character
- **Screen resolution**: (width, height) in pixels

Each example shows the same idea: a list of numbers, each one measuring something different. The visual changes as you adjust the sliders, making the connection between "list of numbers" and "thing in the world" concrete.

Key point: a vector is just a list of numbers that describes something. The numbers don't mean anything on their own — what matters is what each slot represents.

### 2. Describing Things with Numbers

**Widget: AnimalPropertyExplorer**

Present a set of animals (bear, rabbit, shark, mouse, eagle, elephant, snake, cat, dog). Each animal has properties scored 0–1: big, scary, hairy, cuddly, fast, fat. Each animal's description is a vector of these scores.

The reader can:
- See all animals as a table of numbers (their vectors)
- Select two animals and see how similar/different their vectors are (highlight matching/differing properties)
- Adjust the property values and see the animal's "identity" shift

Key point: the vector captures what we *chose* to measure. Different properties → different vectors → different notion of similarity.

### 3. Vectors in Space: 1D

**Widget: Vector1DExplorer**

A number line. Place animals (or other items) by a single property (e.g., size). Each item is a point on the line. Its vector is just one number.

Key point: with one dimension, you can only capture one thing. Big and small are separated, but scary and cuddly are mixed together. (Echoes the embeddings chapter's "Words on a Line" but focused on vector intuition rather than embedding semantics.)

### 4. Vectors in Space: 2D

**Widget: Vector2DExplorer**

A 2D plane. Place animals by two properties (e.g., size × scariness). Each item is a dot. Its vector is two numbers: (size, scariness).

The reader can:
- Switch which properties map to X and Y axes
- See how clustering changes with different axis choices
- Drag points to see coordinates update

Key point: two dimensions let you separate things that one dimension couldn't. Bear and elephant are both big, but bear is scarier. With two dimensions you can tell them apart.

### 5. Vectors in Space: 3D

**Widget: Vector3DExplorer**

A rotatable 3D scatter plot. Three properties mapped to X, Y, Z. The reader can rotate, zoom, and switch axis assignments.

Key point: three dimensions are the most we can directly visualize. But the intuition — "nearby points are similar, far-apart points are different" — extends to any number of dimensions. Our animal vectors have 6 properties, so they really live in 6D space. We can't draw 6D, but the geometric intuition from 2D and 3D still applies: distance, direction, and proximity all still work.

### 6. Direction and Magnitude

**Widget: DirectionMagnitudeExplorer**

A 2D playground showing a vector as an arrow from the origin. The reader can:
- Drag the arrow tip to set the vector freely
- Switch to constrained mode: a **direction ring** (unit circle) to set direction, and a **magnitude slider** to set length
- See the unit vector (arrow of length 1) and the full vector side by side
- Toggle between examples: velocity (direction = heading, magnitude = speed), color (direction = hue, magnitude = saturation/brightness)

Explain: any vector = unit vector × magnitude. The unit vector tells you *which way*, the magnitude tells you *how much*. This decomposition will matter a lot when we get to dot products.

### 7. The Dot Product

**Widget: DotProductExplorer**

Two vectors shown as arrows in 2D. The reader can drag either arrow. Display shows:

**View 1 — Component multiplication**: Multiply corresponding components and add. `a₁b₁ + a₂b₂`. Show the individual products and their sum.

**View 2 — Projection**: Show the projection of one vector onto the other. The dot product equals `|a| × |b| × cos(θ)` where θ is the angle between them. Visually show:
- The angle between the vectors
- The projection (shadow) of one onto the other
- How the dot product is positive when vectors point the same way, zero when perpendicular, negative when opposite

The reader can toggle between views and see that they always give the same number.

Key insight: the dot product measures *how much two vectors agree*. Vectors pointing the same direction → large positive dot product. Perpendicular → zero. Opposite → large negative. This single operation is going to appear everywhere in AI.

Side note: mention that when both vectors are unit vectors, the dot product is just cos(θ) — pure directional agreement with no magnitude involved. This is called **cosine similarity** and we'll see it again in embeddings.

### 8. A Neuron Is a Dot Product

**Widget: NeuronDotProductWidget**

Connect the dot product back to what the reader already knows. Show a neuron with its inputs and weights. Rewrite the weighted sum as a dot product:

`w₁x₁ + w₂x₂ + bias = weights · inputs + bias`

The widget shows:
- A 2D neuron (two inputs) with its weight vector and input vector as arrows
- The dot product calculation step by step
- The angle between the weight vector and input vector
- How the neuron output (after sigmoid) relates to alignment between the two vectors
- Rotate both vectors in 2D space; when they align, the neuron fires strongly; when perpendicular, the neuron output is near 0.5 (just the bias); when opposite, the neuron is near 0

Key insight: the neuron is asking "how much does this input point in the direction of my weights?" That's it. The bias shifts the threshold, and the sigmoid squashes the answer. A neuron is a direction detector.

### 9. A Neuron Draws a Line

Transition from the dot-product view to the geometric view. If the neuron fires when `weights · inputs + bias > 0`, then the set of inputs where the neuron is exactly 50/50 forms a straight line through input space — the **decision boundary**.

**Widget: DecisionBoundaryExplorerWidget** (reuse from backup content)

Show the 2D input space with the four Boolean corners (0,0), (0,1), (1,0), (1,1). The neuron's weights define a line. One side is "high" (green), the other is "low" (red).

The reader can:
- Drag the line (adjust weights/bias) to solve AND, OR, NOT
- Try XOR and discover it's impossible — the true corners are on opposite diagonals

Key insight: a single neuron can only separate inputs with a single straight line. AND and OR are linearly separable. XOR is not.

### 10. Two Lines Solve XOR

**Widget: XORBreakthroughWidget** (reuse from backup content)

Show how two hidden neurons each draw their own line. The output neuron combines them. Two lines can carve out regions that one line never could.

Show the transformation: the hidden layer *moves the points* in a new space where XOR becomes linearly separable. In the original 2D space, (0,1) and (1,0) are on opposite corners. In the hidden layer's output space, they've been moved to the same side.

Key insight: each layer transforms the data into a new representation where the next layer's job is easier. Depth doesn't just add more computation — it reshapes the problem.

### 11. Why Activation Functions Matter

**Widget: LinearCollapseDemoWidget** (reuse from backup content)

Without the activation function, a neuron is just `weights · inputs + bias` — a linear function. A linear function of a linear function is still linear. Stack 100 layers without activation functions and the whole thing collapses to a single line — no better than one neuron.

The activation function (sigmoid, ReLU, etc.) bends the space. It's the nonlinearity that makes depth meaningful.

The reader can:
- Toggle activation on/off
- Set depth (1–5 layers)
- Train on a non-linear pattern (e.g., XOR or circle)
- See that without activation, the boundary stays straight no matter how many layers
- See that with activation, the boundary curves to fit the data

Key insight: without activation functions, depth is an illusion. The activation function is the entire reason that stacking layers makes networks more powerful.

### 12. What's Next

Tie it together: a vector is a list of numbers. A neuron computes a dot product of its input vector with its weight vector, adds a bias, and applies an activation function. This gives neurons a geometric meaning — they draw decision boundaries in the space of their inputs. Stacking neurons and adding activation functions lets networks carve up that space into any shape.

In the next chapter, we'll see how this same idea powers one of AI's most important tricks: turning words into vectors where the geometry encodes meaning — **embeddings**.

---

## Widgets Summary

| Widget | New or Reused | Description |
|--------|---------------|-------------|
| VectorExamplesWidget | New | Toggle between everyday vector examples (position, color, stats) with live sliders |
| AnimalPropertyExplorer | New | Table of animals × properties, compare vectors |
| Vector1DExplorer | New | Number line with items placed by one property |
| Vector2DExplorer | New | 2D scatter plot, switchable axes |
| Vector3DExplorer | New | Rotatable 3D scatter plot |
| DirectionMagnitudeExplorer | New | Vector as direction + magnitude, unit circle |
| DotProductExplorer | New | Two draggable vectors, component and projection views |
| NeuronDotProductWidget | New | Neuron as dot product, weight/input vectors as arrows |
| DecisionBoundaryExplorerWidget | Reused from backup | Drag decision line, try AND/OR/XOR |
| XORBreakthroughWidget | Reused from backup | 2-layer XOR, space transformation view |
| LinearCollapseDemoWidget | Reused from backup | Activation on/off, see depth collapse |

---

## Relationship to Other Chapters

**Builds on Neurons (Ch 3)**: The reader already knows what a neuron does (weighted sum + activation). This chapter reveals *why* that works geometrically.

**Moves backup content to its proper home**: The decision boundary, XOR breakthrough, and linear collapse sections were cut from neurons for being too much at once. They fit naturally here after the reader has vector intuition.

**Sets up Embeddings (Ch 4→5)**: The embeddings chapter currently introduces "a vector is just a list of numbers" in passing. With this chapter in place, readers arrive at embeddings already knowing what vectors are, what dot products measure, and why proximity in vector space matters. The embeddings chapter can focus on the *semantic* magic rather than re-explaining vectors.

**Sets up Matrix Math (Ch 5→6)**: Matrix multiplication is applying many dot products at once. The dot product intuition from this chapter is direct preparation.

---

## Curriculum Changes Needed

- Insert new chapter entry in `curriculum.ts` between neurons (3) and embeddings (currently 4)
- Either renumber subsequent chapters, or use a new id (e.g., 3.5 → round to integer)
- Update neurons chapter "What's Next" to point to vectors instead of embeddings
- Update embeddings chapter intro to reference vectors chapter instead of neurons chapter
- Embeddings chapter can trim or remove "Beyond Two Dimensions" section that currently introduces vectors, since that concept will be well-established

### Embeddings Chapter Content Updates

The vectors chapter covers animals-as-vectors extensively (properties like big, scary, hairy, etc.). The embeddings chapter currently uses a similar approach (size, danger axes on scatter plots). With both chapters in place, the embeddings chapter needs to explain **why hand-picked dimensions aren't enough for words**:

- The animal property vectors work great because we're describing *one kind of thing* (animals) with a *fixed set of properties* that make sense for all of them. Every animal has a size, a scariness, a hairiness.
- But words represent *every kind of thing*. "Dog" and "democracy" and "purple" and "running" — there's no single set of labeled dimensions that makes sense for all words. "How scary is the color blue?" "How hairy is democracy?" The questions don't even make sense.
- This is the motivation for *learned* embeddings: instead of choosing dimensions by hand, let the network discover its own dimensions — unlabeled numbers where similar words end up nearby and directions encode meaningful relationships. The dimensions aren't "size" or "scary" — they're patterns the network found useful.
- This reframes the embeddings chapter's existing content (one-hot → single number → 2D → learned) as a progression from the vectors chapter's "you can describe anything as a list of numbers" to "but for language, you need the *network* to figure out which numbers to use."

Specific edits to embeddings `content.mdx`:
1. Update the Lead/intro to reference the vectors chapter ("In the last chapter, we described animals with hand-picked properties like size and scariness. That worked because animals are one kind of thing. But words represent *everything*...")
2. The "Beyond Two Dimensions" section can be shortened — the reader already knows what a vector is and has seen 1D/2D/3D. Keep the key sentence defining "vector" for reinforcement, but cut the extended explanation.
3. The "Neural Networks Meet Embeddings" section can reference dot products and decision boundaries from the vectors chapter rather than re-explaining them from scratch.

---

## Companion Notebook: `vectors.ipynb`

Sections:
1. **Creating Vectors** — `torch.tensor`, accessing elements, shapes
2. **Vector Arithmetic** — Addition, scalar multiplication, normalization
3. **Dot Products** — `torch.dot`, manual computation, comparing the two
4. **Cosine Similarity** — `F.cosine_similarity`, unit vectors
5. **A Neuron as a Dot Product** — Show `nn.Linear(2, 1)` is a dot product + bias, verify with manual computation
6. **Decision Boundaries** — Plot a single neuron's decision boundary in 2D, show AND/OR work but XOR doesn't
7. **Two Layers Solve XOR** — Train 2-layer network, plot both decision lines and the combined boundary
8. **Activation Functions Matter** — Train with and without activation, compare decision boundaries
