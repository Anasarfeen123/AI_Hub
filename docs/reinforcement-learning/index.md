# Reinforcement Learning

## Explanation

Reinforcement learning (RL) is a different paradigm from the supervised/unsupervised learning covered in [Machine Learning](../machine-learning/index.md): instead of learning from a fixed labeled dataset, an **agent** learns by taking actions in an **environment** and receiving **rewards**, aiming to maximize cumulative reward over time.

- **Markov Decision Process (MDP)** — the formal framework for RL problems: states, actions, transition probabilities, and rewards, with the Markov property that the future depends only on the current state (not the full history).
- **Q-Learning** — a foundational algorithm that learns the expected future reward ("Q-value") of taking a given action in a given state, without needing a model of the environment.
- **Deep Q-Networks (DQN)** — combining Q-learning with a neural network to approximate Q-values, enabling RL on large or continuous state spaces (e.g. raw pixels from an Atari game) — the algorithm behind DeepMind's landmark Atari-playing results.
- **Policy Gradient methods** — instead of learning value estimates and deriving a policy from them, directly learn a policy (a mapping from states to action probabilities) by gradient ascent on expected reward.
- **PPO (Proximal Policy Optimization)** — a widely used, more stable policy gradient method, and the algorithm behind much of modern RL from human feedback (RLHF) used to align LLMs (see [Generative AI](../generative-ai/index.md)).
- **Robotics and simulation environments** — RL's most concrete real-world testbed: environments like OpenAI Gym/Gymnasium, MuJoCo, and Isaac Gym let you train and evaluate agents in physics simulations before (or instead of) real hardware.

## Why it matters

RL is the right framework whenever a problem is about *sequential decision-making under uncertainty* rather than one-shot prediction — games, robotics, resource allocation, and (increasingly) fine-tuning LLM behavior via human feedback. It's also conceptually different enough from supervised learning that it rewards separate study: there's no fixed "correct answer" per input, only a reward signal that may be delayed (a good early move in chess doesn't get rewarded until much later), which introduces the credit assignment problem and the explore-vs-exploit tradeoff — ideas that don't show up in the rest of this hub.

## Learning resources

- *Reinforcement Learning: An Introduction* by Sutton and Barto — the field's standard textbook, [freely available online](http://incompleteideas.net/book/the-book-2nd.html) from the authors.
- [David Silver's Reinforcement Learning course (DeepMind/UCL)](https://www.davidsilver.uk/teaching/) — lecture videos that closely follow Sutton & Barto and are widely considered the best free video course on the subject.
- [OpenAI Spinning Up in Deep RL](https://spinningup.openai.com/) — a practical, code-first introduction to modern deep RL algorithms including DQN and PPO.
- [Gymnasium documentation](https://gymnasium.farama.org/) (the maintained successor to OpenAI Gym) for standard RL environments to train and benchmark agents in.
- [DeepMind x UCL — Reinforcement Learning course](https://www.youtube.com/playlist?list=PLqYmG7hTraZBKeNJ-JE_eyJHZ7XgBoAyb) — the video playlist version of David Silver's course above.
- [Hugging Face — Deep RL Course](https://huggingface.co/learn/deep-rl-course) — a free, interactive course pairing theory with hands-on implementation.

## Recommended practice

- Implement tabular Q-learning from scratch on a small environment (e.g. FrozenLake or a simple gridworld) before moving to deep RL — the tabular case makes the core update rule concrete.
- Train a DQN agent on a simple Gymnasium environment (e.g. CartPole) and plot reward over training episodes to see learning happen.
- Implement or use an existing PPO implementation on a slightly harder environment (e.g. LunarLander) and compare stability/sample efficiency against DQN where applicable.

## Projects

- **Beginner:** Implement tabular Q-learning on FrozenLake or a custom gridworld, and visualize the learned policy.
- **Intermediate:** Train a DQN agent to play CartPole or a simple Atari game using Gymnasium and a deep learning framework.
- **Advanced:** Implement PPO from scratch (or adapt an existing implementation) and train an agent on a continuous-control environment (e.g. a MuJoCo or Gymnasium locomotion task), reporting learning curves and hyperparameter sensitivity.
