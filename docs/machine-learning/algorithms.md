# ML Algorithms

## Explanation

A working map of the classical algorithm toolbox:

**Regression / Classification (supervised)**

- **Linear / Logistic Regression** — the simplest useful baseline; fits a straight line (or a linear decision boundary for classification). Fast, interpretable, and a good sanity check before anything fancier.
- **Decision Trees** — split the data on feature thresholds to make predictions; easy to interpret, prone to overfitting on their own.
- **Random Forest** — an ensemble of many decision trees trained on random subsets of data/features, averaged together; usually a strong default for tabular data.
- **Gradient Boosted Trees** (e.g. XGBoost, LightGBM) — trees built sequentially, each correcting the previous ones' errors; typically the strongest tabular-data performer before deep learning.
- **Support Vector Machines (SVM)** — find the boundary that maximizes the margin between classes; effective in high-dimensional spaces with clear margins.
- **k-Nearest Neighbors (kNN)** — predicts based on the most similar training examples; simple, no real "training," but slow at prediction time on large datasets.

**Unsupervised**

- **Clustering** (k-means, hierarchical, DBSCAN) — group similar data points without labels.
- **Dimensionality Reduction** (PCA, t-SNE, UMAP) — reduce many correlated features into fewer, more informative ones, often for visualization or as a preprocessing step.

**Feature Engineering**

- Transforming raw data into inputs a model can use well: encoding categories, scaling numeric features, creating interaction terms, handling missing values. Often matters more than which algorithm you pick.

## Why it matters

There's no universally "best" algorithm — the right choice depends on data size, interpretability needs, and the nature of the problem (linear vs. nonlinear relationships, tabular vs. unstructured data). Knowing the tradeoffs (a decision tree is interpretable but overfits; an SVM handles high dimensions well but doesn't scale to huge datasets; gradient boosting usually wins tabular competitions but is harder to interpret) is what lets you pick well instead of defaulting to whatever you learned first.

Feature engineering deserves special attention because it's consistently underrated: a well-engineered feature set with a simple model regularly beats a poorly-prepared dataset with a sophisticated one.

## Learning resources

- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html) — comprehensive, and doubles as a reference for every classical algorithm's assumptions and parameters.
- *Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow* by Aurélien Géron — clear coverage of each algorithm with working code.
- [StatQuest — Decision Trees, Random Forests, SVMs, PCA, clustering playlists](https://www.youtube.com/@statquest) — the best intuition-building video series for each individual algorithm.
- [XGBoost documentation](https://xgboost.readthedocs.io/) and [LightGBM documentation](https://lightgbm.readthedocs.io/) for gradient boosting specifics.
- [Kaggle Learn: Feature Engineering](https://www.kaggle.com/learn/feature-engineering) — short, practical course.

## Recommended practice

- Run the same classification dataset through logistic regression, a random forest, and gradient boosting, and compare accuracy, training time, and interpretability.
- Deliberately overfit a decision tree (no depth limit) and observe the train/test performance gap, then fix it with a random forest or depth limiting.
- Apply PCA to a high-dimensional dataset, visualize the first two components, and see whether classes/clusters separate visually.

## Projects

- **Beginner:** Predict Titanic survival using logistic regression and a random forest; compare feature importances between the two.
- **Intermediate:** Build a customer segmentation pipeline: clean data → feature engineering → k-means clustering → visualize with PCA/UMAP → describe each segment.
- **Advanced:** Enter a tabular Kaggle competition using gradient boosting (XGBoost/LightGBM) and careful feature engineering; track what actually moves your leaderboard score.
