# Foundations

Every AI course, paper, and library assumes you already know this material. Skipping it doesn't save time — it just moves the confusion to later, where it's more expensive to fix (debugging a training loop is much harder if you don't know what a gradient is).

This section covers the minimum you need before machine learning starts making sense:

- **[Python for AI](python.md)** — NumPy, Pandas, Matplotlib, and the habits that make code debuggable.
- **[Mathematics](mathematics.md)** — linear algebra, calculus, and probability, taught the way ML actually uses them.
- **[Statistics](statistics.md)** — distributions, inference, and the bias/variance framing that underlies model evaluation.
- **[Optimization](optimization.md)** — gradient descent and why "training" is a search problem.

## How much do you need?

Enough to read the first few chapters of a machine learning textbook without stopping every paragraph to look something up. You do **not** need a full university-level math degree before starting ML — you need working fluency, and the rest fills in as you encounter it in context.

A reasonable test: if you can explain what `y = Wx + b` means, why we take the derivative of a loss function, and what a mean and standard deviation tell you about a dataset, you're ready to move into [Machine Learning](../machine-learning/index.md).

## Suggested order

1. Python basics → NumPy → Pandas (you'll use these in literally everything else)
2. Linear algebra (vectors, matrices, dot products)
3. Calculus (derivatives, partial derivatives, the chain rule)
4. Probability and statistics
5. Optimization (gradient descent) — this is the page that ties math and code together

Each topic page below follows the same format: an explanation, why it matters, curated learning resources, recommended practice, and a couple of starter projects.
