# Time Series Forecasting

## Explanation

Time series forecasting predicts future values from data ordered in time — sales next month, tomorrow's temperature, next hour's server load. It differs from the standard supervised learning setup covered in [Machine Learning](../machine-learning/index.md) in one crucial way: order matters, and the future is not allowed to leak into the past.

Core ideas:

- **Trend, seasonality, and noise** — most real time series decompose into a long-term trend, a repeating seasonal pattern (daily, weekly, yearly), and residual noise.
- **Stationarity** — many classical models assume a series' statistical properties (mean, variance) don't change over time; real series often need transforming (differencing, log transforms) to become stationary first.
- **Classical models** — ARIMA/SARIMA (autoregressive models over past values and past errors) and exponential smoothing remain strong, interpretable baselines.
- **Modern approaches** — gradient boosting with engineered time-based features (lags, rolling averages), and deep learning models (LSTMs, temporal convolutional networks, and transformer variants) for longer or more complex sequences.
- **Evaluation** — always uses a **time-based split** (train on the past, validate on a later window), never a random shuffle — a random split would let the model "see the future" during training.

## Why it matters

Time-based data leakage is one of the most common and easy-to-miss mistakes in applied ML: a random train/test split on time series data silently lets future information leak into training, producing a model that looks accurate offline and fails the moment it has to predict genuinely unseen future data. Forecasting is also one of the most common real-world applications of ML — demand planning, capacity planning, and financial forecasting all reduce to this problem — so the discipline of respecting time order pays off far beyond this one topic.

## Learning resources

- [Kaggle Learn — Time Series](https://www.kaggle.com/learn/time-series) — a short, practical course covering trend/seasonality decomposition and forecasting with both classical and ML approaches.
- *Forecasting: Principles and Practice* by Hyndman and Athanasopoulos — the standard, freely available textbook on the subject, [online for free](https://otexts.com/fpp3/).
- [statsmodels — Time Series Analysis documentation](https://www.statsmodels.org/stable/tsa.html) for classical models (ARIMA, exponential smoothing) in Python.
- [Meta's Prophet documentation](https://facebook.github.io/prophet/) — a widely used, approachable forecasting library designed for business time series with strong seasonality.

## Recommended practice

- Decompose a real time series (e.g. retail sales, energy usage) into trend, seasonality, and residual components, and plot each separately.
- Deliberately evaluate a forecasting model with a random train/test split, then redo it with a proper time-based split, and compare the reported performance — the gap is the lesson.
- Compare a classical model (ARIMA or Prophet) against a gradient boosting model with lag/rolling-window features on the same dataset.

## Projects

- **Beginner:** Forecast a public dataset (e.g. daily temperature or retail sales) using Prophet or a simple ARIMA model, with a correct time-based train/test split.
- **Intermediate:** Build a gradient boosting forecaster using engineered lag and rolling-window features, and compare it against a classical baseline.
- **Advanced:** Enter a Kaggle time-series competition (e.g. a sales or demand forecasting competition) and compare classical, ML, and deep learning approaches on the same leaderboard.
