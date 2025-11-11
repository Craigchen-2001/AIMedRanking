"use client";
import React from "react";
import DropdownMulti from "../layout/DropdownMulti";

type Props = {
  selectedApps: string[];
  setSelectedApps: (val: string[]) => void;
};

const APPLICATION_OPTIONS = [
  "Sparse Modeling in Bioinformatics",
  "Survival Outcome Prediction",
  "Biological Sequence Optimization",
  "Digital Pathology Image Classification",
  "Retrosynthetic Pathway Design",
  "Drug Interaction Prediction",
  "fMRI Brain Activity Analysis",
  "Treatment Policy Optimization",
  "Medical Image Reconstruction (MRI/CT)",
  "Protein Design and Generation",
  "Radiology Disease Classification",
  "Multi-Task Learning in Medical Vision",
  "Cancer Genomics Clustering",
  "Medical Image Segmentation",
  "EEG Sleep Staging",
  "Treatment Effect Estimation",
  "Treatment Optimization (ICU/Sepsis)",
  "Protein Structure Prediction",
  "Molecule Generation (General)",
  "COVID-19 Trend Forecasting",
  "Tabular Clinical Modeling (EHR)",
  "Clinical Risk Prediction (EHR)",
  "Gene Function and Expression Prediction",
  "Molecular Property Prediction",
  "Alzheimer’s Disease Diagnosis",
  "Biomolecular Dynamics Simulation",
  "Single-Cell Trajectory Inference",
  "Molecule Generation – Drug Discovery",
  "ICU Mortality Prediction",
  "Cryo-EM Structure Reconstruction",
  "Molecular Graph Generation",
  "Human Motion Analysis (Rehabilitation)",
  "Clinical Outcome Forecasting (Longitudinal)",
  "ECG Signal Analysis",
  "Time-Series Analysis (General)",
  "Molecular Property Optimization",
  "General Clinical Prediction Modeling",
  "Neural Dynamics Modeling",
  "Causal Inference and Trajectory Analysis",
  "Antibody Design and Optimization",
  "Medical Visual Question Answering",
  "De Novo Peptide Design",
  "Robust Medical Image Analysis",
  "Neural Activity Decoding",
  "Protein-Ligand Docking Prediction",
  "Others / Unclear Category"
];

export default function ApplicationFilter({ selectedApps, setSelectedApps }: Props) {
  const toggle = (val: string) =>
    selectedApps.includes(val)
      ? setSelectedApps(selectedApps.filter((v) => v !== val))
      : setSelectedApps([...selectedApps, val]);
  return <DropdownMulti placeholder="Select Applications" options={APPLICATION_OPTIONS} selected={selectedApps} onToggle={toggle} />;
}
