# Machine Learning Projects

Projects are where the [Introduction](introduction.md), [Algorithms](algorithms.md), and [Evaluation](evaluation.md) pages actually connect. Each project below is meant to be built end-to-end: load real data, clean it, choose and justify an algorithm, evaluate honestly, and write up what you found. For a broader, cross-topic project catalog (including deep learning, CV, NLP, and beyond), see [Project Ideas](../projects/index.md).

## Beginner

- **House price prediction (regression)** — clean a housing dataset, engineer a few features, compare linear regression against a random forest, and report MAE/R².
- **Titanic survival prediction (classification)** — practice the full supervised workflow, including a confusion matrix and precision/recall, not just accuracy.
- **Customer churn prediction** — a classic imbalanced-classification problem; a good place to practice precision/recall tradeoffs from [Model Evaluation](evaluation.md).

## Intermediate

- **Credit card fraud detection** — a heavily imbalanced dataset where accuracy is meaningless; requires precision/recall/F1, and ideally techniques like class weighting or resampling.
- **Customer segmentation** — unsupervised clustering (k-means) plus PCA/UMAP visualization, with a written interpretation of what each segment represents.
- **Time-aware prediction (e.g. sales forecasting)** — requires a time-based train/test split (not random!) to avoid leaking future information into training — a good forcing function for understanding leakage.
- **End-to-end Kaggle competition (tabular)** — pick a live or past Kaggle tabular competition, and go through the full pipeline: EDA, feature engineering, model selection, cross-validation, and leaderboard submission.

## Advanced

- **Gradient boosting from scratch** — implement a minimal gradient boosting algorithm (regression trees + residual fitting) to understand what XGBoost/LightGBM are actually doing under the hood.
- **AutoML-style pipeline** — build a small system that automatically tries several algorithms and hyperparameter combinations (via cross-validation) and reports the best, complete with a leakage-safe pipeline (`sklearn.pipeline.Pipeline`).
- **Explainability project** — apply SHAP or LIME to a trained model on a real dataset, and produce a report explaining *why* the model makes specific predictions, not just how accurate it is.

## What "done" looks like

For every project here, the bar is not "the model runs" — it's:

1. A clear problem statement and choice of metric that matches it.
2. A leakage-free train/validation/test setup.
3. At least one baseline model and one improved model, compared honestly.
4. A short write-up of what worked, what didn't, and why.

That last step is what turns a tutorial-following exercise into something you actually understand — and something you can talk about in an interview or a paper.
