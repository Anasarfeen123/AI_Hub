# Statistics

## Explanation

Statistics is how you go from data to justified conclusions — and in ML, from a model's performance on a test set to a claim about how well it will actually work. Core topics:

- **Descriptive statistics** — mean, median, variance, standard deviation, correlation.
- **Probability distributions** — normal, binomial, Poisson, and how real-world data tends to approximate them.
- **Inference** — sampling, confidence intervals, hypothesis testing, p-values, and their limitations.
- **Bias vs. variance** — the central framework for understanding why models underfit or overfit.
- **Correlation vs. causation** — why a model finding a pattern doesn't mean it found the *reason* for that pattern.

## Why it matters

Every claim in ML — "this model is 94% accurate," "this feature is predictive," "this A/B test variant performed better" — is a statistical claim, and statistical claims can be wrong in specific, well-understood ways: too small a sample, a metric that doesn't match the real objective, a correlation mistaken for a causal effect, or a train/test split that leaked information.

The bias-variance tradeoff specifically is the single most useful mental model in applied ML: it's the lens for diagnosing *why* a model performs poorly (too simple → high bias/underfitting, too complex → high variance/overfitting) and *what to do about it* (more data, regularization, more capacity, feature engineering).

## Learning resources

- [StatQuest with Josh Starmer](https://www.youtube.com/@statquest) — the best free resource for building intuition on statistics and ML concepts, video by video (bias/variance, p-values, distributions, and more).
- [Khan Academy: Statistics and Probability](https://www.khanacademy.org/math/statistics-probability) — structured course with practice problems.
- *Practical Statistics for Data Scientists* by Bruce, Bruce, and Gedeck — statistics specifically framed for data science work rather than pure theory.
- [Seeing Theory](https://seeing-theory.brown.edu/) — an interactive visual introduction to probability and statistics from Brown University.
- Google's [Machine Learning Crash Course — Bias/Variance and Generalization](https://developers.google.com/machine-learning/crash-course) sections.

## Recommended practice

- Take a public dataset and compute descriptive statistics, then plot distributions — deliberately try to spot skew, outliers, and multi-modal distributions by eye before checking with code.
- Run a basic hypothesis test (e.g. a t-test comparing two groups) and interpret the p-value carefully — explain in plain language what it does and does not tell you.
- Deliberately train an underfit model (too simple) and an overfit model (too complex, e.g. a very deep decision tree with no regularization) on the same dataset, and compare train vs. test performance to see bias and variance in action.

## Projects

- **Beginner:** Analyze a public dataset (e.g. housing prices, exam scores) and write up a short statistical report: distributions, correlations, and at least one hypothesis test with a plain-language interpretation.
- **Intermediate:** Build a small "model diagnosis" notebook that trains models of increasing complexity on the same dataset and plots the classic bias-variance / train-vs-test-error curve.
- **Intermediate:** Design and simulate an A/B test (synthetic data is fine) including sample-size calculation, and show how the conclusion changes with an underpowered vs. adequately powered sample.
