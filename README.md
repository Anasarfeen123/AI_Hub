# AI/ML Resource Hub

A community-maintained knowledge base for the university AI/ML department — a single place to learn Artificial Intelligence from beginner foundations through to advanced research, and to find curated, vetted resources instead of scattered links.

Built with [MkDocs](https://www.mkdocs.org/) and the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme, published automatically to GitHub Pages on every merge to `main`.

**Live site:** `https://your-org.github.io/AI-ML-Resource-Hub/` *(update this once the repo is on GitHub under your org/user)*

## What's inside

| Section | Covers |
|---|---|
| [Roadmap](docs/roadmap.md) | A guided beginner → intermediate → advanced learning path |
| [Foundations](docs/foundations) | Python, mathematics, statistics, optimization |
| [Machine Learning](docs/machine-learning) | Core algorithms, evaluation, projects |
| [Deep Learning](docs/deep-learning) | Neural networks, CNNs, transformers, frameworks |
| [Computer Vision](docs/computer-vision) | Image processing, detection, segmentation, ViT |
| [NLP](docs/natural-language-processing) | Tokenization, embeddings, BERT, applications |
| [Generative AI](docs/generative-ai) | LLMs, RAG, fine-tuning, agents |
| [Reinforcement Learning](docs/reinforcement-learning) | MDPs, Q-learning, policy gradients, robotics |
| [Research](docs/research) | Reading papers, conferences, datasets, trends |
| [Resource Library](docs/resources) | Courses, books, papers, tools, competitions |
| [Project Ideas](docs/projects) | Beginner to advanced project briefs |

## Running the site locally

Requirements: Python 3.10+

```bash
git clone https://github.com/Anasarfeen123/AI-ML-Resource-Hub.git
cd AI-ML-Resource-Hub
pip install -r requirements.txt
mkdocs serve
```

The site will be available at `http://127.0.0.1:8000` with live reload on save.

To produce a static build (same as what CI deploys):

```bash
mkdocs build --strict
```

The rendered site is written to `site/` (git-ignored).

## Deployment

Deployment is automatic. The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the site with MkDocs and publishes it via GitHub Pages on every push to `main`. No manual `gh-pages` branch management is required.

One-time repository setup for a new fork/copy:

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` — the site builds and deploys automatically.

## Contributing

This hub is built by and for students — pull requests adding resources, fixing errors, or writing new topic pages are welcome. See [`docs/contribution.md`](docs/contribution.md) for the full guide, including page templates and style conventions. In short:

1. Fork the repo and create a branch.
2. Add or edit a Markdown page under `docs/`.
3. Run `mkdocs serve` locally to preview your change.
4. Open a pull request describing what you added and why.

## License

Content is shared for educational use by the department community. Add a license file here if your department requires a specific one (e.g. CC-BY-4.0 for content, MIT for any code snippets).
