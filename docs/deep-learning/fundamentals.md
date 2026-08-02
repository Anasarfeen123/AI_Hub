# Deep Learning Fundamentals

## Explanation

Core building blocks of every neural network:

- **Perceptron** — the simplest unit: a weighted sum of inputs plus a bias, passed through an activation function. Stack many of these in layers and you get a neural network.
- **Activation functions** — nonlinear functions (ReLU, sigmoid, tanh, softmax) applied after each layer's linear step. Without nonlinearity, stacking layers would collapse into a single linear function no matter how many layers you add — activations are what let networks learn complex, non-linear patterns.
- **Forward pass** — computing predictions by pushing input through the network layer by layer.
- **Loss function** — measuring how wrong the predictions are (see [Optimization](../foundations/optimization.md)).
- **Backpropagation** — computing the gradient of the loss with respect to every parameter in the network, layer by layer, using the chain rule.
- **Training techniques** — batching (mini-batch gradient descent), regularization (dropout, weight decay) to prevent overfitting, normalization (batch norm, layer norm) to stabilize training, and learning rate scheduling.

## Why it matters

Every architecture you'll encounter later — CNNs, transformers, diffusion models — is a specific arrangement of these same building blocks. If you understand how a basic feedforward network trains, you already understand 80% of how any neural network trains; what changes between architectures is mostly *which* operations the layers perform (convolutions, attention, etc.), not the underlying training loop.

This is also where a lot of practical debugging skill comes from: a loss that becomes `NaN`, a model that won't learn, or one that overfits instantly, are usually explained by something in this list — a bad learning rate, missing normalization, an unstable activation function, or no regularization.

## Learning resources

- Andrej Karpathy — [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) — builds a neural network and its training loop entirely from scratch, including backpropagation, in Python.
- [3Blue1Brown — Neural Networks series](https://www.3blue1brown.com/topics/neural-networks) — the clearest visual intuition for how a network computes and learns.
- [Deep Learning](https://www.deeplearningbook.org/) by Goodfellow, Bengio, and Courville — the standard, free-online textbook reference.
- [PyTorch — Learn the Basics tutorial series](https://pytorch.org/tutorials/beginner/basics/intro.html) — hands-on, framework-specific introduction to training a network.
- [fast.ai — Practical Deep Learning for Coders](https://course.fast.ai/) — a top-down, code-first course that gets you training real models quickly, then circles back to theory.

## Recommended practice

- Build a basic feedforward network from scratch (using only NumPy, no autograd) to classify a simple dataset, implementing forward pass, loss, and backpropagation by hand.
- Rebuild the same network in PyTorch or TensorFlow and confirm you get comparable results — this is the bridge from "understanding the math" to "using the tools."
- Deliberately break training (remove normalization, set a huge learning rate, remove activation functions) and observe the failure modes so you recognize them later.

## Projects

- **Beginner:** Train a feedforward neural network to classify MNIST handwritten digits, first in NumPy from scratch, then in PyTorch.
- **Intermediate:** Build a small experiment comparing training with and without dropout/batch norm on the same architecture, and report the effect on overfitting.
- **Intermediate:** Implement a learning rate scheduler from scratch (e.g. step decay or cosine annealing) and show its effect on convergence versus a fixed learning rate.
