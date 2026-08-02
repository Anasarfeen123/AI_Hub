# Optimization

## Explanation

Optimization is the math that answers: "given a model with parameters and a loss function that measures how wrong it is, how do we find parameters that make the loss small?" Core ideas:

- **Loss functions** — a single number summarizing how wrong a model's predictions are (e.g. mean squared error, cross-entropy).
- **Gradient descent** — repeatedly nudging parameters in the direction that decreases the loss fastest, using the gradient (the multivariable derivative) of the loss with respect to the parameters.
- **Learning rate** — how big each nudge is, and why too large diverges while too small trains forever.
- **Variants** — stochastic gradient descent (SGD), momentum, Adam, and why almost all modern training uses some adaptive variant of plain gradient descent.
- **Backpropagation** — the specific, efficient algorithm for computing gradients through a multi-layer neural network, which is just the chain rule from calculus applied systematically layer by layer.

## Why it matters

"Training a model" is not a metaphor — it is, literally, running an optimization algorithm. Every deep learning framework (PyTorch, TensorFlow) is, at its core, a system for computing gradients automatically (autograd) and applying an optimizer (SGD, Adam, etc.) to update parameters. If you understand gradient descent and backpropagation, you understand what `loss.backward()` and `optimizer.step()` are actually doing — instead of treating them as incantations, you can reason about why training diverges, plateaus, or overfits, and what hyperparameter to change in response.

## Learning resources

- [3Blue1Brown — Gradient descent, how neural networks learn](https://www.3blue1brown.com/lessons/gradient-descent) and [What is backpropagation really doing?](https://www.3blue1brown.com/lessons/backpropagation) — the clearest visual explanation available.
- Andrej Karpathy's [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) — builds backpropagation and a neural network from scratch in Python, live, starting from first principles (the `micrograd` project).
- [Sebastian Ruder — An overview of gradient descent optimization algorithms](https://www.ruder.io/optimizing-gradient-descent/) — the standard reference comparing SGD, momentum, RMSProp, Adam, and more.
- [PyTorch — Autograd tutorial](https://pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html) for seeing these ideas expressed in the framework you'll actually use.

## Recommended practice

- Implement gradient descent from scratch in plain Python/NumPy to fit a line to noisy data (linear regression), then verify it matches the closed-form solution.
- Implement backpropagation from scratch for a small (2–3 layer) neural network — no autograd — and confirm your computed gradients match PyTorch's `autograd` on the same inputs.
- Deliberately set a learning rate far too high and far too low on the same problem, and observe divergence vs. slow convergence — this builds real intuition, not just textbook knowledge.

## Projects

- **Beginner:** Build a from-scratch linear regression trainer using gradient descent, and plot the loss curve over training iterations.
- **Intermediate:** Build `micrograd`-style: a tiny autograd engine that supports scalar addition, multiplication, and a few nonlinearities, backed by automatic backpropagation — then use it to train a tiny neural network.
- **Intermediate:** Compare SGD, momentum, and Adam on the same model and dataset, and produce a report/plot showing how convergence speed and stability differ.
