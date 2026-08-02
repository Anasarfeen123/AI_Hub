# AI Deployment

## Explanation

Deployment is how a trained model becomes something other people or systems can actually use. The path varies by scale and latency needs:

- **Serving a model behind an API** — wrapping a trained model in a lightweight web service (e.g. FastAPI or Flask) that accepts input and returns predictions.
- **Containerization** — packaging a model and its dependencies with Docker so it runs identically on any machine, avoiding "it works on my laptop" problems.
- **Batch vs. real-time inference** — some use cases only need predictions computed periodically on a batch of data (e.g. nightly), while others need sub-second responses per request (e.g. a live recommendation).
- **Edge and on-device deployment** — running models directly on phones or embedded devices (via tools like TensorFlow Lite, ONNX Runtime, or Core ML) when latency, connectivity, or privacy rules out calling a server.
- **Model optimization for deployment** — quantization (reducing numeric precision), pruning, and distillation to make large models fast and cheap enough to actually serve.
- **Scaling and infrastructure** — load balancing, autoscaling, and GPU/CPU inference tradeoffs once a service has real traffic.

This connects directly to [MLOps](mlops.md) — deployment is the "get it running" half of a lifecycle where MLOps is the "keep it running well" half.

## Why it matters

Most ML coursework stops at "the model achieves 94% accuracy on the test set," but that number is worthless to a user until the model is reachable from wherever they need a prediction. Deployment introduces an entirely different set of constraints than training does — latency budgets, uptime requirements, cost per prediction, and the reality that inputs in production are messier than any curated dataset. Understanding deployment is often what separates a class project from something that could plausibly ship.

## Learning resources

- [FastAPI documentation](https://fastapi.tiangolo.com/) — the most common modern choice for wrapping a Python model in a production-quality API.
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/) — a free course specifically focused on the "everything around the model" that deployment requires.
- [Docker — Get Started guide](https://docs.docker.com/get-started/) if you're new to containerization.
- [ONNX Runtime documentation](https://onnxruntime.ai/) and [TensorFlow Lite documentation](https://ai.google.dev/edge/litert) for optimized/edge deployment.
- [Hugging Face — Inference Endpoints documentation](https://huggingface.co/docs/inference-endpoints) for a managed path to deploying transformer models without building your own infrastructure first.

## Recommended practice

- Wrap a model you've already trained in a FastAPI service with a single prediction endpoint, and test it with real HTTP requests.
- Containerize that service with Docker so it runs identically outside your development environment.
- Quantize a model (e.g. with ONNX Runtime or `torch.quantization`) and measure the tradeoff between inference speed/size and accuracy.

## Projects

- **Beginner:** Deploy a model from an earlier project (e.g. from [Machine Learning Projects](../machine-learning/projects.md)) behind a FastAPI endpoint, containerized with Docker.
- **Intermediate:** Deploy a model to a free-tier cloud service (e.g. a small VM, Hugging Face Spaces, or a serverless function) and load-test it to see how it behaves under concurrent requests.
- **Advanced:** Optimize a deep learning model (quantization/pruning) for on-device deployment, and benchmark the size/speed/accuracy tradeoff against the original.
