export const papers = [
    {
      id: "3b9SKkRAKw",
      year: 2025,
      conference: "ICLR (International Conference on Learning Representations)",
      title: "LeFusion: Controllable Pathology Synthesis via Lesion-Focused Diffusion Models",
      authors: [
        "Hantao Zhang",
        "Yuhe Liu",
        "Jiancheng Yang",
        "Shouhong Wan",
        "Xinyuan Wang",
        "Wei Peng",
        "Pascal Fua"
      ],
      institutes: "N/A",
      "authors/institutes": "N/A",
      abstract: "Patient data from real-world clinical practice often suffers from data scarcity and long-tail imbalances, leading to biased outcomes or algorithmic unfairness. This study addresses these challenges by generating lesion-containing image-segmentation pairs from lesion-free images. Previous efforts in medical imaging synthesis have struggled with separating lesion information from background, resulting in low-quality backgrounds and limited control over the synthetic output. Inspired by diffusion-based image inpainting, we propose LeFusion, a lesion-focused diffusion model. By redesigning the diffusion learning objectives to focus on lesion areas, we simplify the learning process and improve control over the output while preserving high-fidelity backgrounds by integrating forward-diffused background contexts into the reverse diffusion process. Additionally, we tackle two major challenges in lesion texture synthesis: 1) multi-peak and 2) multi-class lesions. We introduce two effective strategies: histogram-based texture control and multi-channel decomposition, enabling the controlled generation of high-quality lesions in difficult scenarios. Furthermore, we incorporate lesion mask diffusion, allowing control over lesion size, location, and boundary, thus increasing lesion diversity. Validated on 3D cardiac lesion MRI and lung nodule CT datasets, LeFusion-generated data significantly improves the performance of state-of-the-art segmentation models, including nnUNet and SwinUNETR.",
      keywords: "data synthesis, diffusion models, cardiac MRI, lung nodule CT, segmentation",
      pdf_url: "https://openreview.net/pdf?id=3b9SKkRAKw",
      is_healthcare: "Yes",
      reasoning: "**Reasoning**: The paper focuses on generating and segmenting lesion-containing images in 3D cardiac MRI and lung nodule CT, which are clinical imaging modalities. It explicitly addresses “cardiac lesion MRI” and “lung nodule CT” and aims to improve segmentation models (nnUNet, SwinUNETR) for medical diagnosis. These are strong indicators of a healthcare AI application in medical imaging.",
      "Topic Axis I": {
        MainTopic: "Medical Imaging Analysis",
        SubTopic: "Radiology"
      },
      "Topic Axis II": {
        MainTopic: "Generative & Foundation Models",
        SubTopic: "Diffusion Models"
      },
      "Topic Axis III": {
        MainTopic: "Trustworthy AI: Fairness, Robustness & Safety",
        SubTopic: "Model Robustness & Uncertainty Quantification"
      },
      method: "Lesion-focused diffusion models; Histogram-based texture control; DiffMask",
      application: "Lesion synthesis and segmentation – Radiology",
      code_link: "https://github.com/M3DV/LeFusion",
      dataset_name: ["LIDC", "Emidec"]
    },
    {
      id: "ozZG5FXuTV",
      year: 2025,
      conference: "ICLR (International Conference on Learning Representations)",
      title: "Learning Causal Alignment for Reliable Disease Diagnosis",
      authors: [
        "Mingzhou Liu",
        "Ching-Wen Lee",
        "Xinwei Sun",
        "Xueqing Yu",
        "Yu QIAO",
        "Yizhou Wang"
      ],
      institutes: "N/A",
      "authors/institutes": "N/A",
      abstract: "Aligning the decision-making process of machine learning algorithms with that of experienced radiologists is crucial for reliable diagnosis. While existing methods have attempted to align their prediction behaviors to those of radiologists reflected in the training data, this alignment is primarily associational rather than causal, resulting in pseudo-correlations that may not transfer well. In this paper, we propose a causality-based alignment framework towards aligning the model's decision process with that of experts. Specifically, we first employ counterfactual generation to identify the causal chain of model decisions. To align this causal chain with that of experts, we propose a causal alignment loss that enforces the model to focus on causal factors underlying each decision step in the whole causal chain. To optimize this loss that involves the counterfactual generator as an implicit function of the model's parameters, we employ the implicit function theorem equipped with the conjugate gradient method for efficient estimation. We demonstrate the effectiveness of our method on two medical diagnosis applications, showcasing faithful alignment to radiologists.",
      keywords: "alignment, causal learning, counterfactual, disease diagnosis",
      pdf_url: "https://openreview.net/pdf?id=ozZG5FXuTV",
      is_healthcare: "Yes",
      reasoning: "**Reasoning**: The paper focuses on aligning machine learning decision processes with those of radiologists for “reliable disease diagnosis,” explicitly referencing medical imaging and clinical decision‐making. It targets a healthcare application—improving radiologist‐model alignment in disease diagnosis—which places it squarely in the Healthcare AI domain.",
      "Topic Axis I": {
        MainTopic: "Medical Imaging Analysis",
        SubTopic: "Radiology"
      },
      "Topic Axis II": {
        MainTopic: "Causal Inference & Reasoning",
        SubTopic: "Causal Alignment"
      },
      "Topic Axis III": {
        MainTopic: "Explainability & Interpretability (XAI)",
        SubTopic: "Post-hoc Explanation Methods"
      },
      method: "Counterfactual generation; causal alignment loss; implicit function theorem",
      application: "Benign/malignant classification – Lung nodules and breast masses",
      code_link: "https://github.com/lmz123321/Causal_alignment",
      dataset_name: ["LIDC-IDRI", "CBIS-DDSM"]
    },
    {
      id: "NJxCpMt0sf",
      year: 2025,
      conference: "ICLR (International Conference on Learning Representations)",
      title: "Dynamic Modeling of Patients, Modalities and Tasks via Multi-modal Multi-task Mixture of Experts",
      authors: [
        "Chenwei Wu",
        "Zitao Shuai",
        "Zhengxu Tang",
        "Luning Wang",
        "Liyue Shen"
      ],
      institutes: "N/A",
      "authors/institutes": "N/A",
      abstract: "Multi-modal multi-task learning holds significant promise in tackling complex diagnostic tasks and many significant medical imaging problems. It fulfills the needs in real-world diagnosis protocol to leverage information from different data sources and simultaneously perform mutually informative tasks. However, medical imaging domains introduce two key challenges: dynamic modality fusion and modality-task dependence. The quality and amount of task-related information from different modalities could vary significantly across patient samples, due to biological and demographic factors. Traditional fusion methods apply fixed combination strategies that fail to capture this dynamic relationship, potentially underutilizing modalities that carry stronger diagnostic signals for specific patients. Additionally, different clinical tasks may require dynamic feature selection and combination from various modalities, a phenomenon we term “modality-task dependence.” To address these issues, we propose M4oE, a novel Multi-modal Multi-task Mixture of Experts framework for precise Medical diagnosis...",
      keywords: "Multimodal Learning, Medical Imaging",
      pdf_url: "https://openreview.net/pdf?id=NJxCpMt0sf",
      is_healthcare: "Yes",
      reasoning: "**Reasoning**: The paper focuses squarely on medical imaging for diagnosis, referencing “breast cancer screening” and “retinal disease diagnosis,” as well as evaluations on “public multi-modal medical benchmark datasets.”",
      "Topic Axis I": {
        MainTopic: "Medical Imaging Analysis",
        SubTopic: "Radiology"
      },
      "Topic Axis II": {
        MainTopic: "Advanced Supervised & Representation Learning",
        SubTopic: "Novel Architectures for Time Series"
      },
      "Topic Axis III": {
        MainTopic: "Human-AI Interaction & Collaboration",
        SubTopic: "AI for Clinical Decision Support (CDS)"
      },
      method: "Multi-modal multi-task mixture of experts (M4oE); Dynamic fusion model",
      application: "Breast cancer screening; Retinal disease diagnosis",
      code_link: "https://github.com/tangzhengxu2001/m4oe",
      dataset_name: ["EMBED", "RSNA", "VinDr-Mammo", "GAMMA"]
    },
    {
      id: "zcTLpIfj9u",
      year: 2025,
      conference: "ICLR (International Conference on Learning Representations)",
      title: "Time-to-Event Pretraining for 3D Medical Imaging",
      authors: [
        "Zepeng Frazier Huo",
        "Jason Alan Fries",
        "Alejandro Lozano",
        "Jeya Maria Jose Valanarasu",
        "Ethan Steinberg",
        "Louis Blankemeier",
        "Akshay S Chaudhari",
        "Curtis Langlotz",
        "Nigam Shah"
      ],
      institutes: "N/A",
      "authors/institutes": "N/A",
      abstract: "With the rise of medical foundation models and the growing availability of imaging data, scalable pretraining techniques offer a promising way to identify imaging biomarkers predictive of future disease risk...",
      keywords: "Multimodal learning, medical imaging, Electronic Health Records",
      pdf_url: "https://openreview.net/pdf?id=zcTLpIfj9u",
      is_healthcare: "Yes",
      reasoning: "**Reasoning**: The paper focuses on 3D medical imaging (CT scans) combined with longitudinal EHR data to predict clinical outcomes...",
      "Topic Axis I": {
        MainTopic: "Medical Imaging Analysis",
        SubTopic: "Radiology"
      },
      "Topic Axis II": {
        MainTopic: "Data-Centric & Privacy-Enhancing AI",
        SubTopic: "Self-Supervised & Unsupervised Learning"
      },
      "Topic Axis III": {
        MainTopic: "Trustworthy AI: Fairness, Robustness & Safety",
        SubTopic: "Model Robustness & Uncertainty Quantification"
      },
      method: "Time-to-event (TTE) pretraining",
      application: "Risk prediction – 3D medical imaging",
      code_link: "https://anonymous.4open.science/r/future_guided_pretraining-DA6C",
      dataset_name: ["INSPECT", "RSPECT"]
    },
    {
      id: "BHFs80Jf5V",
      year: 2025,
      conference: "ICLR (International Conference on Learning Representations)",
      title: "Constructing Confidence Intervals for Average Treatment Effects from Multiple Datasets",
      authors: [
        "Yuxin Wang",
        "Maresa Schröder",
        "Dennis Frauen",
        "Jonas Schweisthal",
        "Konstantin Hess",
        "Stefan Feuerriegel"
      ],
      institutes: "N/A",
      "authors/institutes": "N/A",
      abstract: "Constructing confidence intervals (CIs) for the average treatment effect (ATE) from patient records is crucial to assess the effectiveness and safety of drugs...",
      keywords: "Causality machine learning, Average treatment effects, Confidence intervals, Prediction-powered inference",
      pdf_url: "https://openreview.net/pdf?id=BHFs80Jf5V",
      is_healthcare: "Yes",
      reasoning: "**Reasoning**: The paper explicitly addresses estimating and constructing confidence intervals for average treatment effects (ATE) from patient records across multiple hospitals...",
      "Topic Axis I": {
        MainTopic: "Clinical Data Science & Informatics",
        SubTopic: "EHR/EMR Predictive Modeling"
      },
      "Topic Axis II": {
        MainTopic: "Causal Inference & Reasoning",
        SubTopic: "Causal Representation Learning"
      },
      "Topic Axis III": {
        MainTopic: "Trustworthy AI: Fairness, Robustness & Safety",
        SubTopic: "Model Robustness & Uncertainty Quantification"
      },
      method: "Prediction-powered inference; AIPW-based estimation",
      application: "Average treatment effect estimation and confidence intervals",
      code_link: "https://github.com/Yuxin217/causalppi",
      dataset_name: ["N/A"]
    },
    {
      "id": "yb4QE6b22f",
      "year": 2025,
      "conference": "ICLR (International Conference on Learning Representations)",
      "title": "Scaling Wearable Foundation Models",
      "authors": [
        "Girish Narayanswamy",
        "Xin Liu",
        "Kumar Ayush",
        "Yuzhe Yang",
        "Xuhai Xu",
        "shun liao",
        "Jake Garrison",
        "Shyam A. Tailor",
        "Jacob Sunshine",
        "Yun Liu",
        "Tim Althoff",
        "Shrikanth Narayanan",
        "Pushmeet Kohli",
        "Jiening Zhan",
        "Mark Malhotra",
        "Shwetak Patel",
        "Samy Abdel-Ghaffar",
        "Daniel McDuff"
      ],
      "institutes": "N/A",
      "authors/institutes": "N/A",
      "abstract": "Wearable sensors have become ubiquitous thanks to a variety of health tracking features. The resulting continuous and longitudinal measurements from everyday life generate large volumes of data. However, making sense of these observations for scientific and actionable insights is non-trivial. Inspired by the empirical success of generative modeling, where large neural networks learn powerful representations from vast amounts of text, image, video, or audio data, we investigate the scaling properties of wearable sensor foundation models across compute, data, and model size. Using a dataset of up to 40 million hours of in-situ heart rate, heart rate variability, accelerometer, electrodermal activity, skin temperature, and altimeter per-minute data from over 165,000 people, we create LSM, a multimodal foundation model built on the largest wearable-signals dataset with the most extensive range of sensor modalities to date. Our results establish the scaling laws of LSM for tasks such as imputation, interpolation and extrapolation across both time and sensor modalities. Moreover, we highlight how LSM enables sample-efficient downstream learning for tasks including exercise and activity recognition.",
      "keywords": "Health, Foundation Model, Scaling, Wearables, Sensors",
      "pdf_url": "https://openreview.net/pdf?id=yb4QE6b22f",
      "is_healthcare": "Yes",
      "reasoning": "**Reasoning**: The paper centers on large-scale modeling of wearable sensor data—heart rate, heart rate variability, electrodermal activity, skin temperature, accelerometry—which are quintessential biomedical signals used in patient and wellness monitoring. It explicitly targets health-related tasks like exercise and activity recognition and imputation of missing physiological measurements. These aspects firmly place it in the Healthcare AI domain.",
      "prompt_tokens": 21716,
      "completion_tokens": 238,
      "total_tokens": 21954,
      "Topic Axis I": {
        "MainTopic": "Clinical Data Science & Informatics",
        "SubTopic": "Physiological Time Series Analysis"
      },
      "Topic Axis II": {
        "MainTopic": "Advanced Supervised & Representation Learning",
        "SubTopic": "Self-Supervised & Unsupervised Learning"
      },
      "Topic Axis III": {
        "MainTopic": "Trustworthy AI: Fairness, Robustness & Safety",
        "SubTopic": "Model Robustness & Uncertainty Quantification"
      },
      "method": "Masked autoencoder; SimCLR; Masked Siamese Network; DINO",
      "application": "Physiological state modeling; Mood recognition",
      "code_link": "https://github.com/google-research/scenic",
      "dataset_name": [
        "MIMIC-CXR",
        "Meta-MolNet",
        "RxRx1"
      ]
    },
    {
      "id": "hwnObmOTrV",
      "year": 2025,
      "conference": "ICLR (International Conference on Learning Representations)",
      "title": "Modeling Complex System Dynamics with Flow Matching Across Time and Conditions",
      "authors": [
        "Martin Rohbeck",
        "Edward De Brouwer",
        "Charlotte Bunne",
        "Jan-Christian Huetter",
        "Anne Biton",
        "Kelvin Y. Chen",
        "Aviv Regev",
        "Romain Lopez"
      ],
      "institutes": "N/A",
      "authors/institutes": "N/A",
      "abstract": "Modeling the dynamics of complex real-world systems from temporal snapshot data is crucial for understanding phenomena such as gene regulation, climate change, and financial market fluctuations. Researchers have recently proposed a few methods based either on the Schroedinger Bridge or Flow Matching to tackle this problem, but these approaches remain limited in their ability to effectively combine data from multiple time points and different experimental settings. This integration is essential in real-world scenarios where observations from certain combinations of time points and experimental conditions are missing, either because of experimental costs or sensory failure. To address this challenge, we propose a novel method named Multi-Marginal Flow Matching (MMFM). MMFM first constructs a flow using smooth spline-based interpolation across time points and conditions and regresses it with a neural network using the classifier-free guided Flow Matching framework. This framework allows for the sharing of contextual information about the dynamics across multiple trajectories. We demonstrate the effectiveness of our method on both synthetic and real-world datasets, including a recent single-cell genomics data set with around a hundred chemical perturbations across time points. Our results show that MMFM significantly outperforms existing methods at imputing data at missing time points.",
      "keywords": "Flow Matching, dynamical systems",
      "pdf_url": "https://openreview.net/pdf?id=hwnObmOTrV",
      "is_healthcare": "Yes",
      "reasoning": "**Reasoning**: The method is demonstrated on real-world single-cell genomics data with chemical perturbations to model gene regulation dynamics. References to “gene regulation,” “single-cell genomics,” and “chemical perturbations” indicate a clear biomedical application.",
      "prompt_tokens": 22630,
      "completion_tokens": 241,
      "total_tokens": 22871,
      "Topic Axis I": {
        "MainTopic": "Computational Genomics & Multi-Omics",
        "SubTopic": "Transcriptomics: Single-cell/spatial RNA-seq analysis, gene expression quantification, cell typing"
      },
      "Topic Axis II": {
        "MainTopic": "Generative & Foundation Models",
        "SubTopic": "Diffusion Models"
      },
      "Topic Axis III": {
        "MainTopic": "Explainability & Interpretability (XAI)",
        "SubTopic": "Post-hoc Explanation Methods"
      },
      "method": "Multi-marginal flow matching; diffusion model; guided flows",
      "application": "Single-cell perturbation screening; gene regulatory network inference",
      "code_link": "https://github.com/Genentech/MMFM",
      "dataset_name": [
        "Single-cell RNA-seq Perturbation Screening",
        "Beijing Air Quality Data"
      ]
    }
  ];
  