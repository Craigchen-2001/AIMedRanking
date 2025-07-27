import json

# 你的 JSON 檔案路徑
json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICML/analyze_healthcare/ICML_healthcare_analysis_icml_metadata_2025.json"

# 你要查找的 70 個 title
titles_to_check = [
    "Identifying biological perturbation targets through causal differential networks",
    "Modalities Contribute Unequally: Enhancing Medical Multi-modal Learning through Adaptive Modality Token Re-balancing",
    "InfoSEM: A Deep Generative Model with Informative Priors for Gene Regulatory Network Inference",
    "AutoElicit: Using Large Language Models for Expert Prior Elicitation in Predictive Modelling",
    "Distribution-aware Fairness Learning in Medical Image Segmentation From A Control-Theoretic Perspective",
    "MMedPO: Aligning Medical Vision-Language Models with Clinical-Aware Multimodal Preference Optimization",
    "Staged and Physics-Grounded Learning Framework with Hyperintensity Prior for Pre-Contrast MRI Synthesis",
    "SPACE: Your Genomic Profile Predictor is a Powerful DNA Foundation Model",
    "Gradient-based Explanations for Deep Learning Survival Models",
    "EARTH: Epidemiology-Aware Neural ODE with Continuous Disease Transmission Graph",
    "sciLaMA: A Single-Cell Representation Learning Framework to Leverage Prior Knowledge from Large Language Models",
    "All-atom inverse protein folding through discrete flow matching",
    "TinyMIG: Transferring Generalization from Vision Foundation Models to Single-Domain Medical Imaging",
    "ViTally Consistent: Scaling Biological Representation Learning for Cell Microscopy",
    "Scalable Generation of Spatial Transcriptomics from Histology Images via Whole-Slide Flow Matching",
    "Cross-Modal Alignment via Variational Copula Modelling",
    "NeuralCohort: Cohort-aware Neural Representation Learning for Healthcare Analytics",
    "Beyond Sensor Data: Foundation Models of Behavioral Data from Wearables Improve Health Predictions",
    "PertEval-scFM: Benchmarking Single-Cell Foundation Models for Perturbation Effect Prediction",
    "ADIOS: Antibody Development via Opponent Shaping",
    "From Token to Rhythm: A Multi-Scale Approach for ECG-Language Pretraining",
    "Designing Cyclic Peptides via Harmonic SDE with Atom-Bond Modeling",
    "Reconstructing Cell Lineage Trees from Phenotypic Features with Metric Learning",
    "Confounder-Free Continual Learning via Recursive Feature Normalization",
    "PyTDC: A multimodal machine learning training, evaluation, and inference platform for biomedical foundation models",
    "SAFER: A Calibrated Risk-Aware Multimodal Recommendation Model for Dynamic Treatment Regimes",
    "AffinityFlow: Guided Flows for Antibody Affinity Maturation",
    "Multimodal Medical Code Tokenizer",
    "BounDr.E: Predicting Drug-likeness via Biomedical Knowledge Alignment and EM-like One-Class Boundary Optimization",
    "A Cross Modal Knowledge Distillation & Data Augmentation Recipe for Improving Transcriptomics Representations through Morphological Features",
    "MedRAX: Medical Reasoning Agent for Chest X-ray",
    "Active Learning for Efficient Discovery of Optimal Combinatorial Perturbations",
    "Unified Screening for Multiple Diseases",
    "H-Tuning: Toward Low-Cost and Efficient ECG-based Cardiovascular Disease Detection with Pre-Trained Models",
    "\"Why Is There a Tumor?\": Tell Me the Reason, Show Me the Evidence",
    "Distributed Parallel Gradient Stacking(DPGS): Solving Whole Slide Image Stacking Challenge in Multi-Instance Learning",
    "LangDAug: Langevin Data Augmentation for Multi-Source Domain Generalization in Medical Image Segmentation",
    "CLIMB: Data Foundations for Large Scale Multimodal Clinical Foundation Models",
    "UniMoMo: Unified Generative Modeling of 3D Molecules for De Novo Binder Design",
    "Reliable Algorithm Selection for Machine Learning-Guided Design",
    "Drug-TTA: Test-Time Adaptation for Drug Virtual Screening via Multi-task Meta-Auxiliary Learning",
    "Predicting mutational effects on protein binding from folding energy",
    "CellFlux: Simulating Cellular Morphology Changes via Flow Matching",
    "PepTune: De Novo Generation of Therapeutic Peptides with Multi-Objective-Guided Discrete Diffusion",
    "SToFM: a Multi-scale Foundation Model for Spatial Transcriptomics",
    "Raptor: Scalable Train-Free Embeddings for 3D Medical Volumes Leveraging Pretrained 2D Foundation Models",
    "Global Context-aware Representation Learning for Spatially Resolved Transcriptomics",
    "Enforcing Latent Euclidean Geometry in Single-Cell VAEs for Manifold Interpolation",
    "Protein Structure Tokenization: Benchmarking and New Recipe",
    "Boosting Masked ECG-Text Auto-Encoders as Discriminative Learners",
    "CombiMOTS: Combinatorial Multi-Objective Tree Search for Dual-Target Molecule Generation",
    "From Mechanistic Interpretability to Mechanistic Biology: Training, Evaluating, and Interpreting Sparse Autoencoders on Protein Language Models",
    "Bootstrapping Self-Improvement of Language Model Programs for Zero-Shot Schema Matching",
    "scSSL-Bench: Benchmarking Self-Supervised Learning for Single-Cell Data",
    "A Variational Perspective on Generative Protein Fitness Optimization",
    "Do Multiple Instance Learning Models Transfer?",
    "Context Matters: Query-aware Dynamic Long Sequence Modeling of Gigapixel Images",
    "HealthGPT: A Medical Large Vision-Language Model for Unifying Comprehension and Generation via Heterogeneous Knowledge Adaptation",
    "P(all-atom) Is Unlocking New Path For Protein Design",
    "Domain-Adapted Diffusion Model for PROTAC Linker Design Through the Lens of Density Ratio in Chemical Space",
    "Protriever: End-to-End Differentiable Protein Homology Search for Fitness Prediction",
    "SUICA: Learning Super-high Dimensional Sparse Implicit Neural Representations for Spatial Transcriptomics",
    "EmoGrowth: Incremental Multi-label Emotion Decoding with Augmented Emotional Relation Graph",
    "Causal Invariance-aware Augmentation for Brain Graph Contrastive Learning",
    "Multi-Marginal Stochastic Flow Matching for High-Dimensional Snapshot Data at Irregular Time Points",
    "MedXpertQA: Benchmarking Expert-Level Medical Reasoning and Understanding",
    "Breaking the Barrier of Hard Samples: A Data-Centric Approach to Synthetic Data for Medical Tasks",
    "Aligning Protein Conformation Ensemble Generation with Physical Feedback",
    "Visual and Domain Knowledge for Professional-level Graph-of-Thought Medical Reasoning",
    "BoxLM: Unifying Structures and Semantics of Medical Concepts for Diagnosis Prediction in Healthcare"
]

# 開始處理
with open(json_path, "r") as f:
    data = json.load(f)

yes_count = 0
no_count = 0

for title in titles_to_check:
    match = next((paper for paper in data if paper["title"].strip() == title.strip()), None)
    if match:
        is_healthcare = match.get("is_healthcare", "N/A")
        if is_healthcare == "Yes":
            yes_count += 1
        else:
            no_count += 1
            print(f"[NOT YES] Title: {title} | is_healthcare: {is_healthcare}")
    else:
        print(f"[NOT FOUND] Title not in dataset: {title}")

print(f"\n✅ Total Yes: {yes_count}")
print(f"❌ Total Not Yes or Not Found: {no_count}")
