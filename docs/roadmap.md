# AI Learning Roadmap

There is no single "right" order to learn AI, but there is a bad one: jumping straight into transformers before you can explain what a gradient is. This roadmap gives you a sequence that keeps every topic buildable on what came before it.

Treat each stage as a checkpoint, not a wall — most students study foundations and machine learning in parallel once they're past the first few weeks of programming and math.

!!! tip "Prefer a visual view?"
    This same roadmap is embedded as an interactive diagram on the [homepage](index.md#interactive-roadmap).

## Stage 1 — Beginner: Foundations

Goal: be comfortable writing code and reading the mathematical notation used in every ML paper and course.

| Topic | What "done" looks like |
|---|---|
| [Python for AI](foundations/python.md) | Comfortable with NumPy arrays, Pandas DataFrames, and writing small scripts without hand-holding |
| [Mathematics](foundations/mathematics.md) | Can read vector/matrix notation, understand derivatives and the chain rule, and reason about probability distributions |
| [Statistics](foundations/statistics.md) | Understand distributions, hypothesis testing, bias/variance, and correlation vs. causation |
| [Optimization](foundations/optimization.md) | Understand gradient descent and why training a model is a search problem |

Expect this stage to take **6–10 weeks** if you're starting from a general programming background, longer if you're also learning to program for the first time.

## Stage 2 — Intermediate: Machine Learning & Deep Learning

Goal: understand the full ML lifecycle — problem framing, data, model, evaluation, iteration — and be able to train, debug, and evaluate models yourself.

| Topic | What "done" looks like |
|---|---|
| [Machine Learning](machine-learning/index.md) | Can pick an appropriate algorithm for a tabular problem and correctly evaluate it |
| [Deep Learning](deep-learning/index.md) | Understand backpropagation, can build and train a neural network in PyTorch or TensorFlow from scratch |
| [Computer Vision](computer-vision/index.md) | Can train and fine-tune an image classifier or detector |
| [Natural Language Processing](natural-language-processing/index.md) | Understand tokenization, embeddings, and how attention works |
| [Projects](machine-learning/projects.md) | Have shipped at least 2–3 small end-to-end projects, not just followed tutorials |

Expect **3–6 months**, with most of the time going into projects rather than passive learning.

## Stage 3 — Advanced: Specialization & Research

Goal: go from using models to understanding — and eventually contributing to — the frontier.

| Topic | What "done" looks like |
|---|---|
| [Generative AI](generative-ai/index.md) | Understand LLM architecture, can build a RAG pipeline, and can fine-tune a model with LoRA |
| [Reinforcement Learning](reinforcement-learning/index.md) | Understand MDPs and can implement Q-learning or a policy gradient method from scratch |
| [Research](research/index.md) | Can read a paper critically, reproduce a result, and follow venues like NeurIPS, ICML, ICLR, CVPR, and ACL |
| Publications | Contribute to open-source ML projects, write up findings, and — if it fits your goals — submit to a workshop or conference |

This stage is open-ended by design. Pick a specialization based on what you find interesting, not what's trending.

## How to use this roadmap

- Don't wait to "finish" foundations before touching machine learning — start ML once you can read code and basic math notation, and fill gaps as you hit them.
- Every topic page in this hub follows the same structure: **explanation → why it matters → learning resources → recommended practice → projects**. Use the projects section on each page as your checkpoint before moving on.
- The [Resource Library](resources/index.md) has the full list of courses, books, and tools referenced across every stage.
- If you get stuck on where something belongs, or think a stage is missing something important, open a pull request — see [Contributing](contribution.md).
