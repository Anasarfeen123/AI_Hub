# Computer Vision

## Explanation

Computer vision is the field of getting machines to extract meaning from images and video. Building on [CNNs](../deep-learning/cnn.md), the field covers a progression of tasks:

- **Image processing** — classical operations (filtering, edge detection, color transforms) that often precede or complement learned models, typically via **OpenCV**.
- **Classification** — assigning a label to a whole image ("this is a cat").
- **Object Detection** — locating *and* classifying multiple objects in an image, usually as bounding boxes. **YOLO** ("You Only Look Once") is the best-known family of fast, real-time detectors.
- **Segmentation** — classifying every pixel in an image, either by object instance (instance segmentation) or region (semantic segmentation) — used heavily in medical imaging and autonomous driving.
- **Vision Transformers (ViT)** — applying the transformer architecture from [Transformers](../deep-learning/transformers.md) directly to image patches instead of convolutions, now competitive with or exceeding CNNs on many benchmarks at scale.

## Why it matters

Vision is one of the clearest illustrations of deep learning's core promise: instead of hand-engineering features (edges, corners, textures) the way classical computer vision did for decades, CNNs and ViTs learn useful features directly from data. This section is also where you first see the tradeoff between task complexity and label cost: classification needs only one label per image, detection needs bounding boxes, and segmentation needs pixel-level labels — which is why detection and segmentation datasets are more expensive to build and models for them are correspondingly more complex.

## Learning resources

- [CS231n: Convolutional Neural Networks for Visual Recognition (Stanford)](http://cs231n.stanford.edu/) — the canonical CV course, covering classification through detection and segmentation.
- [PyImageSearch](https://pyimagesearch.com/) and the [OpenCV documentation](https://docs.opencv.org/) for practical, classical image processing.
- [Ultralytics YOLO documentation](https://docs.ultralytics.com/) — the most widely used practical entry point for real-time object detection.
- [Hugging Face — Computer Vision Course](https://huggingface.co/learn/computer-vision-course) — covers CNNs through Vision Transformers with runnable code.
- [Papers With Code — Computer Vision](https://paperswithcode.com/area/computer-vision) to see current state-of-the-art models and benchmarks by task.

## Recommended practice

- Do basic image processing in OpenCV (grayscale conversion, blurring, edge detection) before jumping to learned models, so you understand what a "classical" pipeline looks like.
- Train an image classifier, then a detector (e.g. fine-tune a pretrained YOLO model), on the same or related dataset, and compare what each task requires in terms of labels and evaluation.
- Visualize a segmentation model's pixel-level predictions against ground truth masks to build intuition for how segmentation differs from classification.

## Projects

- **Beginner:** Build an image classifier (e.g. cats vs. dogs, or a Kaggle dataset of your choice) using a fine-tuned pretrained CNN.
- **Intermediate:** Fine-tune a YOLO model on a custom object detection dataset (e.g. detecting a specific object class relevant to your interests) and evaluate with mAP.
- **Advanced:** Train or fine-tune a semantic segmentation model (e.g. U-Net or a pretrained segmentation model) on a domain-specific dataset (medical imaging, satellite imagery, or similar) and report IoU per class.
