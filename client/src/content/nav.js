// Seed data only: scripts/seedStructure.js reads this to populate the initial
// navigation in MongoDB. The live nav is served from /api/nav — editing this
// file does not change the running site.
export const nav = [
  { title: "Roadmap", path: "roadmap" },
  {
    title: "Foundations",
    path: "foundations",
    children: [
      { title: "Python for AI", path: "foundations/python" },
      { title: "Mathematics", path: "foundations/mathematics" },
      { title: "Statistics", path: "foundations/statistics" },
      { title: "Optimization", path: "foundations/optimization" },
    ],
  },
  {
    title: "Machine Learning",
    path: "machine-learning",
    children: [
      { title: "Introduction", path: "machine-learning/introduction" },
      { title: "Algorithms", path: "machine-learning/algorithms" },
      { title: "Model Evaluation", path: "machine-learning/evaluation" },
      { title: "Projects", path: "machine-learning/projects" },
    ],
  },
  {
    title: "Deep Learning",
    path: "deep-learning",
    children: [
      { title: "Fundamentals", path: "deep-learning/fundamentals" },
      { title: "CNNs", path: "deep-learning/cnn" },
      { title: "Transformers", path: "deep-learning/transformers" },
      { title: "Frameworks", path: "deep-learning/frameworks" },
    ],
  },
  { title: "Computer Vision", path: "computer-vision" },
  { title: "NLP", path: "natural-language-processing" },
  { title: "Generative AI", path: "generative-ai" },
  { title: "Reinforcement Learning", path: "reinforcement-learning" },
  {
    title: "Specializations",
    path: "specializations",
    children: [
      { title: "Time Series Forecasting", path: "specializations/time-series-forecasting" },
      { title: "Speech & Audio AI", path: "specializations/speech-audio-ai" },
      { title: "MLOps", path: "specializations/mlops" },
      { title: "AI Deployment", path: "specializations/ai-deployment" },
    ],
  },
  { title: "Research", path: "research" },
  { title: "Resource Library", path: "resources" },
  { title: "Project Ideas", path: "projects" },
  { title: "Careers & Internships", path: "careers" },
  { title: "Contributing", path: "contribution" },
];
