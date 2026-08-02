# Speech & Audio AI

## Explanation

Speech and audio AI covers models that work with sound as input or output: converting speech to text, text to speech, classifying sounds, and understanding audio more generally. Core ideas:

- **Audio representation** — raw audio is a very high-frequency waveform; models typically work on transformed representations instead, most commonly the **spectrogram** (a time-frequency view of the signal) or **mel-spectrogram** (frequency scaled to match human hearing).
- **Automatic Speech Recognition (ASR)** — converting spoken audio into text, the task behind voice assistants and transcription tools.
- **Text-to-Speech (TTS)** — the reverse: generating natural-sounding speech audio from text.
- **Audio classification** — labeling a clip (speaker identification, sound event detection, music genre classification).
- **Architectures** — modern speech models largely reuse ideas from [Deep Learning](../deep-learning/index.md): CNNs over spectrograms, and increasingly [Transformers](../deep-learning/transformers.md) treating audio as a sequence of tokens, similar to text.

## Why it matters

Audio is a different modality from the images and text covered elsewhere in this hub, but the same underlying tools apply once the signal is converted into a suitable representation — this is a good place to see how transferable the core deep learning toolbox really is. It's also an increasingly practical area: voice interfaces, transcription, accessibility tools, and multimodal AI (see [Generative AI](../generative-ai/index.md)) all depend on solid speech/audio models, and the tooling has become accessible enough that a student project can realistically use state-of-the-art models directly.

## Learning resources

- [Hugging Face — Audio Course](https://huggingface.co/learn/audio-course) — a free, structured course covering audio representations, ASR, TTS, and audio classification with runnable code.
- [OpenAI Whisper](https://github.com/openai/whisper) — an open-source, state-of-the-art speech recognition model; the repo includes usage examples and pretrained weights.
- [NVIDIA NeMo documentation](https://docs.nvidia.com/nemo-framework/) — a production-grade framework for speech and audio models (ASR, TTS, speaker recognition).
- [Mozilla Common Voice](https://commonvoice.mozilla.org/) — a large, crowdsourced, multilingual voice dataset, useful both for training and for understanding what real-world speech data looks like.

## Recommended practice

- Convert a raw audio clip into a spectrogram and a mel-spectrogram, and visualize both to build intuition for what these representations capture that a raw waveform plot doesn't.
- Run Whisper on a set of audio clips in different accents/languages and evaluate transcription quality, noting where it fails.
- Fine-tune a small pretrained audio model (via Hugging Face) on a narrow classification task (e.g. a specific sound-event dataset) rather than training from scratch.

## Projects

- **Beginner:** Build a simple audio classifier (e.g. spoken digit recognition) using a CNN over mel-spectrograms.
- **Intermediate:** Build a transcription tool using Whisper, and evaluate its word-error-rate against ground-truth transcripts on a public dataset.
- **Advanced:** Fine-tune a speech model on a specific accent, dialect, or low-resource language using Common Voice data, and report the improvement over the base model.
