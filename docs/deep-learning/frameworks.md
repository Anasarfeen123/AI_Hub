# Deep Learning Frameworks

## Explanation

Frameworks provide automatic differentiation (autograd), GPU acceleration, and prebuilt layers so you don't reimplement backpropagation for every project. The two dominant frameworks:

- **PyTorch** — the default in research and increasingly in industry, known for its "eager execution" style (code runs as you write it, like normal Python), which makes debugging and experimentation straightforward. Backed by Meta, and the base for the Hugging Face ecosystem.
- **TensorFlow** (with its high-level Keras API) — historically stronger in production/deployment tooling (TensorFlow Serving, TensorFlow Lite for mobile, TensorFlow.js for browsers) and still widely used in industry, especially for deployed systems.

Both provide the same core pieces: tensors (GPU-capable arrays), autograd, neural network layer libraries, optimizers, and data-loading utilities. The concepts you learned in [Fundamentals](fundamentals.md) — forward pass, loss, backward pass, optimizer step — map directly onto both frameworks' APIs; the syntax differs, the ideas don't.

## Why it matters

You will use one of these frameworks for essentially every deep learning project going forward, so fluency matters more than which one you pick first. Most current research code, tutorials, and the Hugging Face ecosystem (used throughout [Generative AI](../generative-ai/index.md)) are PyTorch-first, which is why this hub generally shows PyTorch examples — but the underlying concepts transfer directly if your course or job uses TensorFlow/Keras instead.

## Learning resources

- [PyTorch — Learn the Basics](https://pytorch.org/tutorials/beginner/basics/intro.html) — the official, well-structured tutorial series covering tensors, autograd, `nn.Module`, training loops, and saving/loading models.
- [TensorFlow — Keras Quickstart](https://www.tensorflow.org/tutorials/quickstart/beginner) and the [Keras documentation](https://keras.io/) if your course uses TensorFlow.
- [fast.ai — Practical Deep Learning for Coders](https://course.fast.ai/) — built on PyTorch, code-first, and a good way to become productive quickly.
- [Hugging Face — Transformers Quicktour](https://huggingface.co/docs/transformers/quicktour) once you're ready to use pretrained models rather than training from scratch.

## Recommended practice

- Rebuild the same small model (e.g. an MNIST classifier) in both PyTorch and Keras — the exercise makes clear which parts are "deep learning concepts" and which are framework-specific syntax.
- Get comfortable with a GPU training loop: moving tensors/models to a GPU device, and understanding why this speeds up training.
- Learn to save and load a trained model's weights (checkpointing) — you'll need this constantly for any project longer than a single script.

## Projects

- **Beginner:** Implement the same image classifier in both PyTorch and TensorFlow/Keras, and write a short comparison of the developer experience.
- **Intermediate:** Build a reusable training script (data loading, training loop, checkpointing, logging) in PyTorch that you can adapt across multiple future projects in this hub.
- **Intermediate:** Set up experiment tracking (e.g. TensorBoard or Weights & Biases) for a training run, and use it to compare a few hyperparameter configurations.
