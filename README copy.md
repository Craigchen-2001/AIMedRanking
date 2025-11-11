
###  AIMed Ranking

This project focuses on identifying and extracting structured metadata from research papers that are potentially related to the Healthcare or Biomedicine domain. The core objective is to automate this process across major AI conferences such as ICLR, ACL, CVPR, etc.

- **Objective**: The goal is to build a semi-automated pipeline that detects whether a research paper belongs to the healthcare/biomedical domain and, if so, extracts relevant metadata such as the research topic, methods used, application areas, code availability, and dataset usage.
- **Workflow**: The process is divided into two main stages:
    1. Classification Based on Abstract:
    The system first analyzes the title, abstract, and keywords of each paper to determine whether it is related to healthcare or biomedicine. This decision is made using a large language model prompt. For positively classified papers, a reasoning is also recorded to support the decision.
    2. Full-Text Metadata Extraction:
    Papers classified as healthcare-related are further analyzed using their full-text PDFs. A detailed instruction prompt is used to guide the language model in extracting structured metadata such as the research topic, methods and techniques, application area, and links to code or datasets when available. The model's response is saved in a structured format for easy downstream analysis.
- **Workflow**: The workflow requires access to a language model API and appropriate credentials. It is designed to run in standard Python environments and supports reproducible, scalable experimentation.