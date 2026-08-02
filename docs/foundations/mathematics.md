# Mathematics for AI

## Explanation

AI math is narrower than a full math degree — you need working fluency in three areas:

- **Linear algebra** — vectors, matrices, matrix multiplication, dot products, norms, and eigenvalues/eigenvectors. This is the language every model is written in: a neural network layer is a matrix multiplication plus a nonlinearity, an image is a tensor, an embedding is a vector.
- **Calculus** — derivatives, partial derivatives, and the chain rule. Training a model means computing how a small change in a parameter changes the loss — that's a derivative — and backpropagation is just the chain rule applied systematically across layers.
- **Probability** — random variables, distributions (Gaussian, Bernoulli, categorical), expectation, and Bayes' theorem. Almost every model output is really a probability distribution (a classifier's softmax output, a language model's next-token prediction), and loss functions like cross-entropy come directly from probability theory.

[Statistics](statistics.md) and [Optimization](optimization.md) build directly on this page — statistics extends probability into inference and evaluation, and optimization extends calculus into the actual training algorithms.

## Why it matters

You don't need to derive theorems from scratch, but you do need to read them. Papers describe architectures and losses using this notation, and being unable to parse `∇_θ L(θ)` (the gradient of the loss with respect to parameters) turns every paper and course into a wall of unfamiliar symbols instead of a readable idea. Conversely, once this notation is familiar, most "advanced" ML concepts turn out to be a small number of ideas (linear transformations, chain rule, probability) recombined.

## Learning resources

- [3Blue1Brown — Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra) and [Essence of Calculus](https://www.3blue1brown.com/topics/calculus) — the best visual intuition-first introduction available, free.
- [3Blue1Brown — Neural Networks](https://www.3blue1brown.com/topics/neural-networks) series, which ties linear algebra and calculus directly to backpropagation.
- [Khan Academy: Linear Algebra](https://www.khanacademy.org/math/linear-algebra), [Multivariable Calculus](https://www.khanacademy.org/math/multivariable-calculus), and [Probability](https://www.khanacademy.org/math/statistics-probability) — free, structured, with practice problems.
- *Mathematics for Machine Learning* by Deisenroth, Faisal, and Ong (free PDF available from the authors) — written specifically to bridge math and ML.
- [Immersive Linear Algebra](https://immersivemath.com/ila/index.html) — an interactive online linear algebra textbook.
- [MIT OCW — Linear Algebra (18.06)](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/) — Gilbert Strang's full course, the standard university-level treatment if you want more rigor than the visual introductions above.
- [MIT OCW — Matrix Calculus for Machine Learning and Beyond](https://ocw.mit.edu/courses/18-s096-matrix-calculus-for-machine-learning-and-beyond-january-iap-2023/) — bridges scalar calculus and the matrix/vector derivatives used throughout ML.
- [MIT — Optimization for Machine Learning](https://optml.mit.edu/teach/6881/) — a more advanced course once gradient descent (see [Optimization](optimization.md)) feels routine.
- Jason Brownlee — [Linear Algebra for Machine Learning](https://github.com/Sana-AI-ML/ML-Books-Jason-Brownlee/blob/master/01.%20Linear%20Algebra%20for%20Machine%20Learning.pdf) — a linear algebra treatment focused specifically on ML applications rather than pure theory.
- [mathematicsforai.com](https://www.mathematicsforai.com/) — a curated, one-stop starting point for the math this page covers.

## Recommended practice

- Implement matrix multiplication, dot product, and vector norms from scratch in Python (without NumPy) at least once, then compare against NumPy — this cements what the operations actually do.
- Manually compute the gradient of a simple function (e.g. a small quadratic loss) on paper, then verify it numerically in code.
- Work through Bayes' theorem on a concrete example (e.g. a medical test with a known false-positive rate) until the "prior vs. posterior" framing feels natural — you'll see this exact framing again in Bayesian models and in interpreting classifier outputs.

## Projects

- **Beginner:** Implement a small linear algebra library from scratch (vector add/subtract, dot product, matrix multiply) and unit-test it against NumPy.
- **Beginner:** Build a visualization that shows how gradient descent moves along a 2D loss surface (e.g. a bowl-shaped quadratic function) step by step.
- **Intermediate:** Derive and implement backpropagation for a two-layer neural network by hand (no autograd), then confirm your gradients match PyTorch's `autograd` — this is one of the most valuable exercises in the entire roadmap.
