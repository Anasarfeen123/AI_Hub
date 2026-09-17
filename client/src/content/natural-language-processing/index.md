# Natural Language Processing

## Explanation

NLP is the field of getting machines to work with human language — text and speech. The modern NLP pipeline builds directly on [Transformers](../deep-learning/transformers.md):

- **Text processing** — cleaning and normalizing raw text (lowercasing, removing noise, handling punctuation) before it reaches a model.
- **Tokenization** — splitting text into units a model can consume: words, subwords (e.g. Byte-Pair Encoding, WordPiece), or characters. Subword tokenization is the modern default because it handles rare/unseen words gracefully.
- **Embeddings** — representing tokens as dense numeric vectors that capture semantic meaning, so that words used in similar contexts end up with similar vectors.
- **Word2Vec** — an earlier, foundational technique for learning word embeddings from co-occurrence patterns in text; largely superseded by contextual embeddings but still important for understanding *why* embeddings work.
- **Transformers** — the architecture (see the dedicated [Transformers](../deep-learning/transformers.md) page) that replaced RNNs/LSTMs as the NLP default.
- **BERT** — a transformer *encoder* pretrained to understand text bidirectionally (looking at context from both directions), then fine-tuned for specific tasks (classification, question answering, named entity recognition). The model that made "pretrain then fine-tune" the standard NLP workflow.

## Why it matters

Before embeddings, NLP represented words as arbitrary, unrelated symbols (one-hot vectors) that carried no notion of meaning or similarity — "cat" and "kitten" were as unrelated to the model as "cat" and "spreadsheet." Embeddings fixed this by placing semantically similar words near each other in vector space, learned automatically from how words are used. BERT's pretrain-then-fine-tune paradigm then made it practical to reach strong performance on a new NLP task with a relatively small labeled dataset, because most of the "understanding language" work was already done during pretraining on massive unlabeled text corpora — a pattern that generative AI's LLMs (see [Generative AI](../generative-ai/index.md)) scaled up dramatically further.

## Learning resources

- [CS224n: Natural Language Processing with Deep Learning (Stanford)](http://web.stanford.edu/class/cs224n/) — the standard, thorough course covering embeddings, RNNs, attention, and transformers.
- [Hugging Face — NLP Course](https://huggingface.co/learn/nlp-course) — practical, code-first, covers tokenization, transformers, and fine-tuning with the `transformers` library.
- [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/) and [The Illustrated BERT](https://jalammar.github.io/illustrated-bert/) by Jay Alammar — the clearest visual explanations of these two foundational ideas.
- ["BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"](https://arxiv.org/abs/1810.04805) — the original paper, worth reading after the illustrated guide.
- [Stanford CS224n lecture recordings](https://www.youtube.com/playlist?list=PLoROMvodv4rPt5D0zs3YhbWSZA8Q_DyiJ) — the video companion to the course above.

## Recommended practice

- Train a small Word2Vec model on a text corpus and inspect nearest-neighbor words in embedding space (e.g. does "king" - "man" + "woman" land near "queen"?) to build intuition for what embeddings capture.
- Tokenize the same sentence with a word-level tokenizer and a subword tokenizer (e.g. BERT's WordPiece via Hugging Face), and compare how each handles rare or made-up words.
- Fine-tune a pretrained BERT model (via Hugging Face `transformers`) on a text classification task and compare against a simpler baseline (e.g. logistic regression on TF-IDF features).

## Projects

- **Beginner:** Build a sentiment classifier using TF-IDF + logistic regression, then repeat with a fine-tuned BERT model, and compare accuracy and effort required.
- **Intermediate:** Build a named entity recognition (NER) system by fine-tuning a pretrained transformer on a labeled dataset.
- **Advanced:** Build a question-answering system (extractive QA) by fine-tuning a transformer on a dataset like SQuAD, and evaluate with exact-match and F1 metrics.
