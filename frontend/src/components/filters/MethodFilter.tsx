"use client";
import React from "react";
import DropdownMulti from "../layout/DropdownMulti";

type Props = {
  selectedMethods: string[];
  setSelectedMethods: (val: string[]) => void;
};

const METHOD_OPTIONS = [
  "Tokenization and Encoding Techniques",
  "Recurrent Neural Networks (LSTM)",
  "Self-Supervised Learning",
  "Reinforcement Learning",
  "Dimensionality Reduction and Matrix Factorization",
  "Optimization Methods (Convex, Gradient, Bi-Level)",
  "Contrastive Learning",
  "Data Augmentation",
  "Transformer Models",
  "Autoencoders and Variational Inference",
  "Graph Neural Networks (GNN, MPNN, Equivariant)",
  "Representation Learning",
  "Statistical Inference and Estimation",
  "Feature Fusion and Multimodal Integration",
  "Convolutional Neural Networks (CNN, U-Net)",
  "Positional and Geometric Encoding",
  "Generative Modeling (GAN, Flow, Diffusion)",
  "Vision-Language Models and Pretraining",
  "Conformal Prediction",
  "Adversarial Learning and Domain Adaptation",
  "Attention Mechanisms",
  "Transfer Learning",
  "Meta Learning",
  "Graph Representation and Embedding",
  "Generative Flow Networks (GFlowNets)",
  "Causal Inference and Counterfactual Learning",
  "Diffusion and Flow-Based Models",
  "Mutual Information Maximization",
  "Conditional Normalizing Flows",
  "Regularization and Constraint Learning",
  "Bayesian Optimization and Gaussian Processes",
  "Neural Differential Equations",
  "Proximal Policy Optimization (PPO)",
  "Active Learning and Sampling",
  "Energy-Based Modeling",
  "Riemannian Manifold Learning",
  "Optimal Transport and Alignment",
  "Knowledge Distillation",
  "Evolutionary and Genetic Algorithms",
  "Clustering Algorithms",
  "Ensemble Learning (Decision Trees)",
  "Deep Neural Networks",
  "Ridge Regression and Linear Models",
  "Markov Chain and Monte Carlo Methods",
  "Expectation Maximization",
  "Active Sampling and Projection Methods",
  "Semi-Supervised Learning",
  "Retrieval-Augmented Generation (RAG)",
  "Classifier-Free and Training-Free Guidance",
  "Multi-Task Learning",
  "Fine-Tuning and Adaptation",
  "Mutual and Contrastive Representation Learning",
  "Benchmarking and Evaluation Frameworks",
  "Bandit Algorithms",
  "Equivariant Neural Networks",
  "Others / Unclear Category"
];

export default function MethodFilter({ selectedMethods, setSelectedMethods }: Props) {
  const toggle = (val: string) =>
    selectedMethods.includes(val)
      ? setSelectedMethods(selectedMethods.filter((v) => v !== val))
      : setSelectedMethods([...selectedMethods, val]);
  return <DropdownMulti placeholder="Select Methods" options={METHOD_OPTIONS} selected={selectedMethods} onToggle={toggle} />;
}
