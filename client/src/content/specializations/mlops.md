# MLOps

## Explanation

MLOps (Machine Learning Operations) is the set of practices for taking a model from a notebook to a reliable, monitored system running in production. It borrows heavily from DevOps but adds ML-specific concerns:

- **Experiment tracking** — logging every training run's parameters, code version, and metrics (e.g. with MLflow or Weights & Biases) so results are reproducible and comparable.
- **Model versioning and registries** — treating trained models as versioned artifacts, not files someone emails around, so you always know which model is deployed and how it was produced.
- **Data and pipeline versioning** — tracking which data a model was trained on, since "same code, different data" is one of the most common causes of unreproducible results.
- **CI/CD for ML** — automated testing (data validation, model performance thresholds) and deployment pipelines, extending standard CI/CD with ML-specific checks.
- **Model monitoring** — tracking a deployed model's performance over time and watching for **drift**: when the live data distribution shifts away from what the model was trained on, silently degrading accuracy.
- **Retraining pipelines** — automating when and how a model gets retrained as new data arrives.

## Why it matters

A model that works in a notebook is not a model that works in production — this is one of the most common gaps between coursework and industry ML roles. Without experiment tracking, "which run produced this model" becomes unanswerable within weeks. Without monitoring, a model silently degrading due to data drift can run for months before anyone notices the business impact. MLOps is what makes [Model Evaluation](../machine-learning/evaluation.md)'s discipline (honest metrics, no leakage) hold up over time, not just at the moment of training.

## Learning resources

- [Made With ML — MLOps course](https://madewithml.com/) — a free, thorough, code-first course covering the full MLOps lifecycle.
- [Google Cloud — MLOps: Continuous delivery and automation pipelines in machine learning](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning) — a widely-cited conceptual overview of MLOps maturity levels.
- [MLflow documentation](https://mlflow.org/docs/latest/index.html) — the most widely used open-source experiment tracking and model registry tool.
- [DataTalksClub — MLOps Zoomcamp](https://github.com/DataTalksClub/mlops-zoomcamp) — a free, hands-on course building a complete MLOps pipeline end-to-end.

## Recommended practice

- Take a model you've already trained (from any earlier project in this hub) and add experiment tracking to it with MLflow or Weights & Biases, logging parameters, metrics, and the trained artifact.
- Package a trained model behind a simple API (see [AI Deployment](ai-deployment.md)) and write a basic monitoring script that logs prediction distributions over time.
- Simulate data drift by feeding a deployed model data that's deliberately shifted from its training distribution, and observe how its performance degrades.

## Projects

- **Beginner:** Add MLflow experiment tracking to an existing project from [Machine Learning Projects](../machine-learning/projects.md), comparing at least 3 tracked runs.
- **Intermediate:** Build a simple CI pipeline (e.g. GitHub Actions) that retrains and evaluates a model on every push, failing the build if performance drops below a threshold.
- **Advanced:** Build an end-to-end pipeline: data ingestion → training → versioned model registry → deployment → monitoring dashboard, for one of your existing project models.
