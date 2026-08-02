# Model Evaluation

## Explanation

Evaluation is how you find out whether a model actually works — and it's easy to get subtly, confidently wrong. Core ideas:

- **Train/validation/test split** — train on one set, tune on a second (validation), and get a final, honest performance estimate on a third (test) that the model never influenced in any way, including hyperparameter choices.
- **Cross-validation** — repeating the train/validation split multiple times (e.g. k-fold) to get a more reliable performance estimate, especially with limited data.
- **Classification metrics** — accuracy (misleading on imbalanced data), precision, recall, F1 score, and ROC-AUC — each answers a different question about what "good" means.
- **Regression metrics** — mean squared error (MSE), mean absolute error (MAE), R².
- **Data leakage** — when information from outside the training set (often accidentally from the test set, or from the future) leaks into training, producing performance numbers that don't hold up in reality.
- **Bias and variance** — see [Statistics](../foundations/statistics.md) — the underlying reason models underfit or overfit, and the lens for diagnosing evaluation results.

## Why it matters

A model with 95% accuracy on a dataset where 95% of examples belong to one class has learned nothing — it just predicts the majority class every time. This is why accuracy alone is often the wrong metric, and why understanding precision/recall (and which one matters more for your specific problem — a spam filter cares differently about false positives than a cancer screening tool does) is not optional.

Data leakage is the single most common reason a "great" model fails in production: normalizing using statistics computed on the full dataset (including test data) before splitting, using future information to predict the past, or accidentally including the label (or something that encodes it) as a feature. Every one of these makes offline metrics look better than real-world performance will ever be.

## Learning resources

- [Google's Machine Learning Crash Course — Classification](https://developers.google.com/machine-learning/crash-course/classification) section, which covers precision/recall/ROC clearly.
- [scikit-learn — Model evaluation guide](https://scikit-learn.org/stable/modules/model_evaluation.html) — the practical reference for every metric and how to compute it.
- [StatQuest — ROC and AUC, Precision and Recall, Cross Validation](https://www.youtube.com/@statquest) videos.
- *Hands-On Machine Learning* by Aurélien Géron, chapter on classification, for a code-first walkthrough of the confusion matrix and related metrics.

## Recommended practice

- Take an imbalanced classification dataset (e.g. fraud detection, rare disease), report accuracy, then report precision/recall/F1 and explain why the numbers tell a different story.
- Deliberately introduce a data leak (e.g. normalize before splitting, or include a near-duplicate of the label as a feature) and observe how it inflates your metrics — then fix it and compare.
- Run k-fold cross-validation on a small dataset and compare the variance of your performance estimate against a single train/test split.

## Projects

- **Beginner:** Build a confusion matrix and precision/recall/F1 report for a classifier on an imbalanced dataset, and write a short explanation of which metric matters most for that problem and why.
- **Intermediate:** Build a small "leakage detector" checklist/notebook that audits a modeling pipeline for common leakage patterns (e.g. scaling before splitting, target encoding without cross-validation).
- **Intermediate:** Compare a single train/test split against 5-fold cross-validation on the same model and dataset, and report how much the performance estimate varies.
