# Introduction to Machine Learning

## Explanation

Machine learning is split along two main axes:

- **Supervised learning** — you have labeled data (inputs paired with correct outputs) and train a model to predict the label from the input. This splits further into:
    - **Regression** — predicting a continuous number (house price, temperature).
    - **Classification** — predicting a category (spam vs. not spam, which digit is in an image).
- **Unsupervised learning** — you have unlabeled data and want to find structure in it: grouping similar points (**clustering**), or reducing the number of variables while keeping the important information (**dimensionality reduction**).

The standard ML workflow, regardless of algorithm:

1. **Define the problem** — what are you predicting, and what does "good" look like?
2. **Get and understand the data** — collect, clean, explore.
3. **Split the data** — train/validation/test sets, so you can measure generalization honestly.
4. **Choose and train a model** — start simple; a strong baseline beats a complex model you don't understand.
5. **Evaluate** — using metrics that match the real objective (see [Model Evaluation](evaluation.md)).
6. **Iterate** — better features, more data, different algorithm, or tuned hyperparameters.

## Why it matters

This workflow — not any specific algorithm — is the actual skill. Students who memorize how random forests work but skip data splitting and evaluation build models that look great in a notebook and fail in the real world (usually due to data leakage or metrics that don't match the actual goal). Understanding *why* you split data, and what each split protects you from, is what separates ML practice from ML trivia.

The supervised/unsupervised distinction also determines which tools apply: you can't evaluate a clustering algorithm the way you evaluate a classifier, because there's no ground-truth label to check against.

## Learning resources

- [Andrew Ng — Machine Learning Specialization (Coursera/DeepLearning.AI)](https://www.coursera.org/specializations/machine-learning-introduction) — the standard starting course, rebuilt for Python/NumPy.
- [Google's Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) — free, practical, and framework-agnostic in its concepts.
- *Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow* by Aurélien Géron — the standard practical reference, code-first.
- [scikit-learn's own tutorial](https://scikit-learn.org/stable/tutorial/index.html) — a good way to see the ML workflow expressed directly in code.
- [StatQuest with Josh Starmer](https://www.youtube.com/@statquest) for intuition on any specific algorithm or concept you get stuck on, or the channel's dedicated [machine learning playlist](https://youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF) for a structured run-through.
- [scikit-learn — Getting Started](https://scikit-learn.org/stable/getting_started.html) — a shorter quickstart than the full tutorial above, useful as a quick refresher.
- Andrew Ng — [Supervised Machine Learning](https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU) video playlist, covering both supervised and unsupervised foundations.

## Recommended practice

- Take any classic dataset (Titanic, Iris, housing prices) and run the full workflow end-to-end yourself: split, train a baseline model, evaluate, then try to improve it.
- Deliberately evaluate a model *without* a proper train/test split, then redo it correctly — the difference in reported vs. real performance is the lesson.
- Try both a regression and a classification problem so the difference in framing (and evaluation metrics) becomes concrete rather than abstract.

## Projects

- **Beginner:** Predict house prices (regression) using scikit-learn's Linear Regression, then repeat with a Random Forest and compare.
- **Beginner:** Classify Iris flowers or handwritten digits (classification) and report accuracy, precision, and recall.
- **Intermediate:** Cluster an unlabeled dataset (e.g. customer purchase data) with k-means, then inspect the clusters to see if they correspond to anything meaningful.
