# Generative AI

## Explanation

Generative AI covers models that produce new content — text, images, code, audio — rather than only classifying or predicting a label. The current wave is dominated by scaled-up transformers:

- **Large Language Models (LLMs)** — transformer decoders (see [Transformers](../deep-learning/transformers.md)) trained on huge text corpora to predict the next token, which turns out to be enough to produce coherent generation, question-answering, and reasoning-like behavior at sufficient scale.
- **Prompt Engineering** — the practice of structuring inputs to an LLM (instructions, examples, formatting) to reliably get the output behavior you want, without changing the model's weights.
- **RAG (Retrieval-Augmented Generation)** — combining an LLM with a retrieval step over an external knowledge source, so the model can answer using up-to-date or private information it wasn't trained on, and cite where an answer came from.
- **Vector Databases** — specialized databases (e.g. FAISS, Pinecone, Chroma, Weaviate) that store embeddings and support fast similarity search, the retrieval backbone of most RAG systems.
- **Fine-tuning** — further training a pretrained model on a smaller, task-specific dataset to specialize its behavior.
- **LoRA (Low-Rank Adaptation)** — a parameter-efficient fine-tuning technique that trains small, low-rank update matrices instead of the full model, making fine-tuning large models feasible on modest hardware.
- **AI Agents** — systems where an LLM plans and takes actions (calling tools, running code, browsing) in a loop, rather than producing a single response.
- **Multimodal AI** — models that handle more than one modality at once (text + images, text + audio), such as vision-language models.
- **Local LLMs** — running open-weight models (e.g. via `llama.cpp`, Ollama, or similar) on your own hardware rather than through an API, useful for privacy, cost, and learning how inference actually works.

## Why it matters

Generative AI is the fastest-moving part of this hub's content and the area most students will end up working with directly, whether building products or research. Understanding the mechanics here — why RAG exists (LLMs don't know your private data or anything after their training cutoff), why LoRA exists (fine-tuning a 7B+ parameter model outright needs far more memory than most people have), and what agents actually are (an LLM in a loop with tools, not magic) — is what separates being able to use these systems from being able to reason about their limits, costs, and failure modes.

## Learning resources

- [Hugging Face — NLP Course](https://huggingface.co/learn/nlp-course) and [Hugging Face — LLM Course](https://huggingface.co/learn/llm-course) for the applied, library-first path.
- Andrej Karpathy — [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) and his ["Intro to Large Language Models"](https://www.youtube.com/watch?v=zjkBMFhNj_g) talk for how LLMs actually work under the hood.
- [Prompt Engineering Guide](https://www.promptingguide.ai/) — a well-maintained, vendor-neutral reference for prompting techniques.
- [LangChain documentation](https://python.langchain.com/) and [LlamaIndex documentation](https://docs.llamaindex.ai/) for building RAG pipelines and agents in practice.
- [The Annotated LoRA paper / original LoRA paper](https://arxiv.org/abs/2106.09685) for the technique behind efficient fine-tuning.
- [Ollama](https://ollama.com/) documentation for running open-weight LLMs locally.

## Recommended practice

- Build a minimal RAG pipeline yourself: chunk a document, embed the chunks, store them in a vector database, and retrieve relevant chunks to answer a question — before reaching for a framework, so you understand what the framework is doing for you.
- Fine-tune a small open-weight model with LoRA on a narrow task (e.g. a specific writing style or domain Q&A) and compare its output against the base model.
- Run an open-weight LLM locally (via Ollama or similar) and compare its behavior, speed, and limitations against an API-based model.

## Projects

- **Beginner:** Build a prompt-engineering playground notebook that tests how different prompt structures affect an LLM's output on the same task (e.g. summarization or classification).
- **Intermediate:** Build a RAG-based Q&A system over a specific document set (e.g. your department's course materials) with a vector database and an LLM.
- **Advanced:** Fine-tune an open-weight LLM with LoRA on a custom dataset, and build a simple tool-using agent (e.g. one that can search, calculate, or query a database) on top of it.
