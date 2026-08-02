# Python for AI

## Explanation

Python is the working language of AI and ML — almost every framework (PyTorch, TensorFlow, scikit-learn, Hugging Face Transformers) exposes a Python API first, and most research code is published as Python. For AI work specifically, you need more than general-purpose Python: you need fluency in the array- and table-based way of thinking that NumPy and Pandas use.

The core stack:

- **Python basics** — variables, control flow, functions, classes, list/dict comprehensions, virtual environments.
- **NumPy** — n-dimensional arrays and vectorized operations. Almost everything in ML is secretly "do this operation to every element of a big array," and NumPy is how you do that without writing slow `for` loops.
- **Pandas** — DataFrames for loading, cleaning, filtering, and transforming tabular data.
- **Matplotlib** (and often Seaborn) — plotting, so you can actually look at your data and your model's behavior instead of guessing.
- **Data handling** — reading CSVs/JSON/Parquet, handling missing values, splitting data into train/validation/test sets.

## Why it matters

Frameworks like PyTorch build directly on NumPy's mental model — tensors are NumPy arrays with gradients and GPU support bolted on. If you're fluent in NumPy's broadcasting and indexing rules, PyTorch code reads naturally. If you're not, every deep learning tutorial will feel like magic syntax instead of a small extension of what you already know.

Similarly, real datasets are messy. Most of the actual work in a machine learning project — often 60–80% of it — is loading, cleaning, and understanding data, not tuning models. Pandas fluency is what makes that fast instead of painful.

## Learning resources

- [Official Python Tutorial](https://docs.python.org/3/tutorial/) — if you need to build basic Python fluency first.
- [NumPy Quickstart](https://numpy.org/doc/stable/user/quickstart.html) and the [NumPy fundamentals guide](https://numpy.org/doc/stable/user/basics.html).
- [Pandas "10 minutes to pandas"](https://pandas.pydata.org/docs/user_guide/10min.html) plus the official [User Guide](https://pandas.pydata.org/docs/user_guide/index.html).
- [Matplotlib Quick Start Guide](https://matplotlib.org/stable/users/explain/quick_start.html).
- *Python for Data Analysis* by Wes McKinney (creator of Pandas) — the standard reference for the Pandas/NumPy workflow.
- [Kaggle's free "Python" and "Pandas" micro-courses](https://www.kaggle.com/learn) — short, hands-on, and directly aimed at data work.

## Recommended practice

- Rewrite at least one `for`-loop-heavy script using NumPy vectorized operations, and time both versions — feeling the speedup makes broadcasting click.
- Load a real, messy CSV dataset (e.g. from Kaggle) into Pandas and produce cleaned, summarized output: handle missing values, compute group-by aggregations, and plot a couple of distributions.
- Practice reading NumPy shape errors — deliberately break broadcasting (mismatched shapes) and read the error messages until they stop being scary.

## Projects

- **Beginner:** Build a command-line tool that loads a CSV of student grades and reports summary statistics (mean, median, pass rate) per subject.
- **Beginner:** Recreate a basic spreadsheet workflow (filter, sort, pivot) entirely in Pandas on a public dataset (e.g. a Kaggle dataset of your choice).
- **Intermediate:** Write a small "data profiling" script that, given any CSV, automatically reports column types, missing-value rates, and basic distribution plots — this is a genuinely useful tool you'll reuse throughout the rest of the roadmap.
