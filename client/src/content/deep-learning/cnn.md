# Convolutional Neural Networks

## Explanation

A CNN (convolutional neural network) is a neural network built around the **convolution** operation: instead of connecting every input pixel to every neuron (as a plain feedforward layer would), a convolutional layer slides a small learned filter across the image, looking for the same local pattern (an edge, a texture, a shape) everywhere in the image.

Key ideas:

- **Convolutional layers** — learn small, reusable filters (e.g. 3×3) applied across the whole image, drastically reducing the number of parameters compared to a fully-connected layer.
- **Pooling layers** (e.g. max pooling) — downsample the feature maps, making the network more robust to small translations and reducing computation.
- **Feature hierarchy** — early layers learn simple features (edges, colors), deeper layers combine them into complex features (textures, parts, objects) — this hierarchy is why CNNs generalize well on images without needing hand-engineered features.
- **Classic architectures** — LeNet, AlexNet, VGG, ResNet (introduced skip connections, enabling very deep networks), EfficientNet.

This connects directly to [Computer Vision](../computer-vision/index.md), which covers the applied tasks (classification, detection, segmentation) that CNNs (and increasingly, vision transformers) are used for.

## Why it matters

Before CNNs, computer vision relied on hand-engineered features (edge detectors, SIFT, HOG) that took experts years to design and still underperformed on real-world variation. CNNs' key insight — that the same filter should detect a pattern anywhere in an image (translation invariance) — cut both the parameter count and the need for manual feature engineering dramatically, and produced the first models to beat humans on some vision benchmarks (ImageNet). Understanding *why* convolution and pooling work (parameter sharing, local connectivity, spatial hierarchy) explains why CNNs are still the default choice for many vision problems, even as vision transformers gain ground.

## Learning resources

- [CS231n: Convolutional Neural Networks for Visual Recognition (Stanford)](http://cs231n.stanford.edu/) — the standard, thorough course on CNNs and computer vision, lecture notes and assignments are free online.
- [3Blue1Brown — But what is a convolution?](https://www.3blue1brown.com/lessons/convolutions) for visual intuition on the core operation.
- [PyTorch — Training a Classifier tutorial](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) — a hands-on CNN training walkthrough on CIFAR-10.
- *Deep Learning* by Goodfellow, Bengio, and Courville, the CNN chapter, for the theoretical grounding.
- The original papers are worth reading once you have the basics: [AlexNet (2012)](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks), [ResNet (2015)](https://arxiv.org/abs/1512.03385).

## Recommended practice

- Implement a basic convolution operation from scratch in NumPy (sliding a filter over a 2D array) before using a framework's built-in layer, so the operation itself is transparent.
- Train a small CNN on CIFAR-10 or MNIST in PyTorch/TensorFlow, and visualize the learned filters from the first convolutional layer.
- Fine-tune a pretrained CNN (e.g. ResNet from `torchvision.models`) on a small custom dataset via transfer learning — this is how CNNs are used in most real applications today, rather than training from scratch.

## Projects

- **Beginner:** Train a CNN from scratch on MNIST or CIFAR-10 and compare accuracy against the feedforward network from [Fundamentals](fundamentals.md).
- **Intermediate:** Fine-tune a pretrained ResNet or EfficientNet on a custom image classification dataset (e.g. a Kaggle dataset of your choice) via transfer learning.
- **Advanced:** Implement a ResNet-style skip connection from scratch and empirically show it enables training a deeper network than an equivalent plain CNN.
