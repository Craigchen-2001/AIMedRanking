import os
import json
from openai import AzureOpenAI

# === Azure OpenAI credentials ===
os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2025-01-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

deployment_name = "gpt-4o"

# === V3 prompt: 完整寫死 ===
V3_PROMPT = """You are a research assistant tasked with classifying research papers in the field of machine learning. You will be given the title, abstract, and keywords if available of a scientific paper, and are asked to determine whether the paper belongs to the Healthcare AI or Biomedicine AI domain.

Please return your response in the exact format below:

---
**Is Healthcare AI / Biomedicine AI: [Yes/No]**

**Reasoning**: Provide a brief but clear explanation based on the paper's title, abstract, and keywords if available. You should reference specific phrases or concepts from the abstract whenever possible. It is acceptable to make reasonable inferences if the paper implies relevance to healthcare or biomedicine, even if it does not explicitly state so. For example, terms like "medical imaging," "biomarkers," "disease prediction," "clinical data," or "health outcomes" are indicators of relevance. The "Reasoning" field must always contain text, providing a brief explanation that justifies your Yes/No decision. Do not leave this field blank under any circumstances.

IMPORTANT: The following terms and contexts are strong indicators of relevance to Healthcare AI or Biomedicine AI:

- **Medical applications**: “disease diagnosis,” “treatment planning,” “clinical prediction,” “patient monitoring,” “health outcomes”
- **Biomedical research**: “drug discovery,” “protein design,” “molecular modeling,” “genomics,” “RNA structure,” “biomarkers,” “mutation stability assessment,” “single-cell analysis”
- **Health-related datasets or tasks**: “MIMIC-III,” “ECG,” “EHR,” “cardiogram,” “wearables for health,” “gait metrics,” “fMRI,” “EEG,” “spatial transcriptomics”
- **Neuroscience or neurobiological modeling**: brain decoding, neuron type classification, neural system dynamics (e.g., spatial transcriptomics-derived brain region modeling)
- **Bioengineering or synthetic biology with therapeutic aims**: “protein family design for therapeutics,” “regulatory DNA sequence design,” “RNA folding kinetics for drug design”
- **Causal inference with medical context**: e.g., sequential treatment assignment, heterogeneous treatment effect (HTE) estimation in medicine, personalized medicine frameworks
- **Wearable-based health monitoring**: wearable sensor data (e.g., accelerometry) used for analyzing mobility, physical performance, or gait patterns across individuals

If a paper discusses general machine learning methods (e.g., forecasting, contrastive learning, representation learning, graph construction) without any reference to clinical, biomedical, or health-related applications or data, classify as No.

However, if the abstract contains domain-specific terms or contexts that strongly suggest relevance to medical, biological, or therapeutic research (even if not explicitly framed as such), you may classify as Yes with explanation.

---

### Definitions:

- **Healthcare AI**: AI applied to clinical or healthcare-specific tasks, including patient data analysis, disease diagnosis, prognosis, clinical decision support, healthcare management, patient monitoring, or development of tools used by healthcare professionals or patients.

- **Biomedicine AI**: AI used to analyze biomedical data, from molecular-level (e.g., genes, proteins) to clinical-level (e.g., symptoms, diseases, treatments), with the goal of improving disease understanding, diagnosis, treatment, or healthcare delivery."""

# === Test papers ===
papers = [
    {
        "id": "zvaiz3FjA9",
        "year": 2025,
        "conference": "ICLR (International Conference on Learning Representations)",
        "title": "Designing Concise ConvNets with Columnar Stages",
        "authors": ["Ashish Kumar", "Jaesik Park"],
        "institutes": "N/A",
        "authors/institutes": "N/A",
        "abstract": """In the era of vision Transformers, the recent success of VanillaNet shows the huge potential of simple and concise convolutional neural networks (ConvNets). Where such models mainly focus on runtime, it is also crucial to simultaneously focus on other aspects, e.g., FLOPs, parameters, etc, to strengthen their utility further. To this end, we introduce a refreshing ConvNet macro design called Columnar Stage Network (CoSNet). CoSNet has a systematically developed simple and concise structure, smaller depth, low parameter count, low FLOPs, and attention-less operations, well suited for resource-constrained deployment. The key novelty of CoSNet is deploying parallel convolutions with fewer kernels fed by input replication, using columnar stacking of these convolutions, and minimizing the use of 1×1 convolution layers. Our comprehensive evaluations show that CoSNet rivals many renowned ConvNets and Transformer designs under resource-constrained scenarios. Pretrained models shall be open-sourced.""",
        "keywords": "Convolutional Neural Networks, Columnar Stages, Input Replication, Image Classification, Detection",
        "pdf_url": "https://openreview.net/pdf?id=zvaiz3FjA9"
    },
    {
        "id": "zu7cBTPsDb",
        "year": 2025,
        "conference": "ICLR (International Conference on Learning Representations)",
        "title": "MVTokenFlow: High-quality 4D Content Generation using Multiview Token Flow",
        "authors": ["Hanzhuo Huang", "Yuan Liu", "Ge Zheng", "Jiepeng Wang", "Zhiyang Dou", "Sibei Yang"],
        "institutes": "N/A",
        "authors/institutes": "N/A",
        "abstract": """In this paper, we present MVTokenFlow for high-quality 4D content creation from monocular videos. Recent advancements in generative models such as video diffusion models and multiview diffusion models enable us to create videos or 3D models. However, extending these generative models for dynamic 4D content creation is still a challenging task that requires the generated content to be consistent spatially and temporally. To address this challenge, MVTokenFlow utilizes the multiview diffusion model to generate multiview images on different timesteps, which attains spatial consistency across different viewpoints and allows us to reconstruct a reasonable coarse 4D field. Then, MVTokenFlow further regenerates all the multiview images using the rendered 2D flows as guidance. The 2D flows effectively associate pixels from different timesteps and improve the temporal consistency by reusing tokens in the regeneration process. Finally, the regenerated images are spatiotemporally consistent and utilized to refine the coarse 4D field to get a high-quality 4D field. Experiments demonstrate the effectiveness of our design and show significantly improved quality than baseline methods. Project page: https://soolab.github.io/MVTokenFlow.""",
        "keywords": "4D Generation, Dynamic 3D Gaussian Splatting, Dynamic Reconstruction, Diffusion Models",
        "pdf_url": "https://openreview.net/pdf?id=zu7cBTPsDb"
    }
]

results = []

# === GPT Call Loop ===
for i, paper in enumerate(papers, 1):
    full_prompt = f"{V3_PROMPT}\n\nTitle: {paper['title']}\n\nAbstract: {paper['abstract']}\n\nKeywords: {paper['keywords']}"

    response = client.chat.completions.create(
        model=deployment_name,
        messages=[{"role": "user", "content": full_prompt}],
        temperature=0
    )

    reply = response.choices[0].message.content
    usage = response.usage

    # Parse GPT result
    is_healthcare = "N/A"
    reasoning = "N/A"
    for line in reply.splitlines():
        if "**Is Healthcare AI" in line:
            is_healthcare = line.split(":")[-1].strip().replace("**", "")
        if "**Reasoning**" in line or "Reasoning:" in line:
            reasoning = line.split(":", 1)[-1].strip()

    paper_result = dict(paper)
    paper_result["is_healthcare"] = is_healthcare
    paper_result["reasoning"] = reasoning
    paper_result["gpt_reply_raw"] = reply
    paper_result["input_prompt"] = full_prompt
    paper_result["tokens"] = {
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens
    }

    results.append(paper_result)

    print(f"\n Paper {i} - {paper['id']}")
    print(f"Prompt tokens   : {usage.prompt_tokens}")
    print(f"Completion tokens: {usage.completion_tokens}")
    print(f"Total tokens    : {usage.total_tokens}")
    print(f"Is Healthcare AI: {is_healthcare}")
    print(f"Reasoning       : {reasoning}")
    print("-" * 80)

# === Save to JSON
with open("gpt_healthcare_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("\n JSON 已寫入：gpt_healthcare_results.json")
