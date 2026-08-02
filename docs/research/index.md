# Research

## Explanation

This section is about moving from consuming AI knowledge to producing it — reading papers critically, understanding how the field communicates results, and eventually contributing your own.

- **How to read a research paper** — a skill in itself. A common and effective approach (the "three-pass method"): first pass for title/abstract/figures to decide relevance, second pass reading the body without dwelling on proofs/derivations, third pass for full technical depth if you need to reproduce or build on the work.
- **Important AI conferences** — NeurIPS, ICML, and ICLR (general ML), CVPR and ICCV (computer vision), ACL and EMNLP (NLP). Papers here are peer-reviewed and represent the current frontier; workshop papers at these venues are often where the newest, less-polished ideas appear first.
- **Research workflow** — forming a hypothesis, running controlled experiments, comparing against baselines fairly, and being honest about negative results — the same rigor from [Model Evaluation](../machine-learning/evaluation.md) applied at a larger scale.
- **Dataset resources** — where to find benchmark and research datasets: [Papers With Code](https://paperswithcode.com/datasets), [Hugging Face Datasets](https://huggingface.co/datasets), [Kaggle Datasets](https://www.kaggle.com/datasets), and domain-specific repositories.
- **Paper discovery tools** — [arXiv](https://arxiv.org/) (where nearly all ML papers are posted, often before formal peer review), [Semantic Scholar](https://www.semanticscholar.org/) and [Google Scholar](https://scholar.google.com/) for citation graphs and search, [Papers With Code](https://paperswithcode.com/) for linking papers to their code and benchmark results.
- **Current AI trends** — tracked through the venues above, but also through preprint servers, major lab blogs (e.g. DeepMind, OpenAI, Meta AI, Google Research), and curated newsletters — treat any single source (including this one) as a starting point, not the full picture.

## Why it matters

Papers are the field's primary communication format, and they're written for other researchers, not students — dense notation, assumed background, and results presented more confidently than they sometimes deserve. Learning to read them critically (what's the actual claim? what's the baseline they're compared against? does the ablation study support the claim they're making? is this reproducible?) is what turns "I read a paper about it" into genuine understanding you can build on. It's also the entry point to actually contributing: reproducing a paper's results, extending an idea, or identifying a gap is how most first research projects start.

## Learning resources

- ["How to Read a Paper" by S. Keshav](https://web.stanford.edu/class/cs224n/readings/how-to-read-a-paper.pdf) — the widely-cited three-pass method referenced above.
- Andrew Ng's talk ["How to Read Research Papers"](https://www.youtube.com/watch?v=733m6qBH-jI) — practical advice on building a paper-reading habit and research workflow.
- [Papers With Code](https://paperswithcode.com/) — browse by task/area to see current state-of-the-art and directly compare papers with their implementations.
- [Yannic Kilcher's YouTube channel](https://www.youtube.com/@YannicKilcher) and [Two Minute Papers](https://www.youtube.com/@TwoMinutePapers) — accessible paper walkthroughs and summaries of recent research.
- [Distill.pub](https://distill.pub/) (archived but still an excellent reference) for exceptionally clear visual explanations of research ideas.

## Recommended practice

- Pick one paper relevant to a topic you've already studied in this hub, and do a full three-pass read, writing a short summary of the claim, method, and evidence in your own words.
- Try to reproduce a small, well-documented result from a paper (many have official or community code — start with something with a working GitHub repo rather than reimplementing from the paper text alone).
- Set up a habit of skimming one conference's accepted-papers list (or a paper newsletter) regularly, rather than only reading papers when assigned — the "current trends" part of research is built through repetition, not one deep dive.

## Projects

- **Beginner:** Write a structured summary (claim, method, key result, limitation) of three papers relevant to a topic you've studied elsewhere in this hub.
- **Intermediate:** Reproduce the core result of a paper with public code, and write up any discrepancies between your results and the paper's reported numbers.
- **Advanced:** Identify a gap or extension of an existing paper's method, run the experiment, and write it up in a short report or workshop-paper format — a natural first step toward an actual submission.
