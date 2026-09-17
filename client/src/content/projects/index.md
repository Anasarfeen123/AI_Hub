# Project Ideas

A cross-topic catalog of project briefs, organized by difficulty rather than subject — use it when you know your level but not what to build next. Each topic page in this hub also has its own project section scoped to that subject (e.g. [Machine Learning Projects](../machine-learning/projects.md)); this page is the department-wide index across all of them.

Every project here should end with the same three things: a working implementation, an honest evaluation (see [Model Evaluation](../machine-learning/evaluation.md)), and a short write-up of what you learned — that last part is what makes a project worth putting on a resume or in a portfolio.

## Beginner

**Data analysis projects**

- Exploratory data analysis and a written report on a public dataset of your choice (distributions, correlations, at least one hypothesis test).
- A "data profiling" tool that automatically summarizes any CSV's columns, types, and missing values.

**Basic ML models**

- House price prediction (regression) comparing linear regression against a random forest.
- Titanic survival or similar classic classification dataset, with a full confusion matrix / precision / recall report.
- A from-scratch MNIST digit classifier, first as a feedforward network in NumPy, then in PyTorch.

## Intermediate

**CNN projects**

- Fine-tune a pretrained CNN (transfer learning) on a custom image classification dataset.
- Fine-tune a YOLO model for object detection on a domain-specific dataset.

**NLP applications**

- Sentiment classifier comparing a classical baseline (TF-IDF + logistic regression) against a fine-tuned BERT model.
- Named entity recognition system built by fine-tuning a pretrained transformer.
- A RAG-based Q&A system over a specific document set (e.g. course materials or department documentation).

**Prediction systems**

- Customer churn or fraud detection system, handling class imbalance correctly (see [Model Evaluation](../machine-learning/evaluation.md)).
- Time-aware forecasting (e.g. sales or demand prediction) using a proper time-based train/test split.

## Advanced

**LLM applications**

- Fine-tune an open-weight LLM with LoRA on a custom dataset or writing style.
- Build a tool-using agent (search, calculation, database queries) on top of an open or API-based LLM.

**Research projects**

- Reproduce the core result of a published paper using its public code, and document any discrepancies from the reported numbers.
- Identify a gap or small extension to an existing paper's method, run the experiment, and write it up — see [Research](../research/index.md).

**RL environments**

- Implement PPO (from scratch or adapted) and train an agent on a continuous-control Gymnasium/MuJoCo task.
- Train a DQN agent on a visually complex environment (e.g. an Atari game) directly from pixel input.

**Autonomous systems**

- A simulated self-driving perception pipeline: object detection + segmentation on a driving dataset (e.g. via CARLA or a public driving dataset).
- A robotics simulation project combining RL with a simulated physical environment (e.g. Isaac Gym or MuJoCo) for a locomotion or manipulation task.

## Picking a project

Match the project to what you actually want to get better at, not what sounds impressive — a well-executed beginner project with a clear write-up demonstrates more than a half-finished advanced one. If you build something you think belongs in this catalog, or want to propose a new project brief, open a pull request — see [Contributing](../contribution.md).
