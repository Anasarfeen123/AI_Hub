# Deep Learning

Deep learning is machine learning with neural networks — models built from layers of simple, differentiable operations stacked together, trained end-to-end with gradient descent. It's the engine behind modern computer vision, NLP, and generative AI.

- **[Fundamentals](fundamentals.md)** — perceptrons, activation functions, backpropagation, and training techniques.
- **[CNNs](cnn.md)** — convolutional neural networks, the architecture that unlocked modern computer vision.
- **[Transformers](transformers.md)** — the attention-based architecture behind modern NLP and LLMs.
- **[Frameworks](frameworks.md)** — PyTorch and TensorFlow, and how to choose between them.

## Where this fits

[Optimization](../foundations/optimization.md) already covered gradient descent and backpropagation in the abstract — this section is where those ideas become working models. [Machine Learning](../machine-learning/index.md)'s classical algorithms tend to win on small, tabular datasets; deep learning tends to win once data is unstructured (images, text, audio) and abundant, because neural networks can learn their own features instead of relying on hand-engineered ones.

Once you're comfortable with fundamentals and can train a basic network in a framework, [Computer Vision](../computer-vision/index.md) and [Natural Language Processing](../natural-language-processing/index.md) apply these ideas to specific data types, and [Generative AI](../generative-ai/index.md) covers what happens when you scale transformers up dramatically.
