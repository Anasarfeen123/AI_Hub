# Transformers

## Explanation

The transformer, introduced in the 2017 paper "Attention Is All You Need," is the architecture behind essentially all modern large language models and much of modern computer vision. Its core idea is **self-attention**: instead of processing a sequence step by step (as older RNN/LSTM architectures did), a transformer lets every position in a sequence directly attend to every other position, weighing how relevant each other token is when building its representation.

Key components:

- **Self-attention** — for each token, compute a weighted combination of all other tokens, where the weights ("attention scores") are learned based on relevance.
- **Multi-head attention** — running several attention operations in parallel, each potentially learning to focus on different kinds of relationships (e.g. syntax vs. meaning).
- **Positional encoding** — since attention has no built-in notion of order, position information is added explicitly so the model knows token sequence.
- **Encoder vs. decoder** — encoders build representations of full input sequences (used in models like BERT); decoders generate output one token at a time, attending only to previous tokens (used in models like GPT); some models (like the original transformer, or T5) use both.
- **Why it parallelizes well** — unlike RNNs, which must process a sequence step by step, self-attention can compute all positions simultaneously, which is why transformers train efficiently on modern GPUs/TPUs at massive scale.

## Why it matters

Transformers replaced RNNs and LSTMs as the default sequence architecture because self-attention solves the two biggest problems those architectures had: they process sequences sequentially (slow to train, hard to parallelize) and they struggle to retain information over long distances (the "vanishing gradient" problem in long sequences). Self-attention lets a model directly connect a word to another word 500 tokens away, and does so with parallelizable computation.

This is the architecture behind BERT (in [NLP](../natural-language-processing/index.md)), GPT-style LLMs (in [Generative AI](../generative-ai/index.md)), and Vision Transformers (in [Computer Vision](../computer-vision/index.md)) — understanding attention once means you can read almost any modern architecture diagram, because most of them are transformer variants with a specific twist.

## Learning resources

- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) by Jay Alammar — the most widely recommended visual walkthrough of self-attention and the transformer architecture.
- ["Attention Is All You Need"](https://arxiv.org/abs/1706.03762) — the original paper; read it after the illustrated guide, not before.
- Andrej Karpathy — [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) — implements a GPT-style transformer from scratch in PyTorch, explaining every line.
- [CS224n: Natural Language Processing with Deep Learning (Stanford)](http://web.stanford.edu/class/cs224n/) — covers attention and transformers in depth alongside NLP applications.
- [Hugging Face — NLP Course](https://huggingface.co/learn/nlp-course) chapter on transformer architecture, for the applied/library-usage side.

## Recommended practice

- Implement scaled dot-product attention from scratch in NumPy or PyTorch (query, key, value matrices, softmax, weighted sum) on a toy sequence before using a library's built-in layer.
- Follow Karpathy's "Let's build GPT" video and reproduce a small character-level GPT model, training it on a small text corpus.
- Use Hugging Face `transformers` to load a pretrained model (e.g. BERT or GPT-2) and inspect its attention weights on a sentence to see which tokens it attends to.

## Projects

- **Beginner:** Implement single-head self-attention from scratch and visualize the attention weights on a short sentence.
- **Intermediate:** Build a small GPT-style character-level language model from scratch (following Karpathy's approach) and generate text with it.
- **Advanced:** Fine-tune a pretrained transformer (e.g. via Hugging Face) on a custom text classification or generation task, and compare against a from-scratch smaller model on the same data.
