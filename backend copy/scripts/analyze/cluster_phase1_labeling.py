# /Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/scripts/analyze/cluster_phase1_labeling.py
import os, json, numpy as np
from sklearn.metrics.pairwise import cosine_distances
from openai import AzureOpenAI

os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(api_key=os.getenv("AZURE_OPENAI_API_KEY"), api_version="2023-05-15", azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"))
CHAT_MODEL = "gpt-4o"

base_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/scripts/analyze/cluster_embedding_outputs"
embed_dir = f"{base_dir}/embeddings"
cluster_dir = f"{base_dir}/clusters"

def ask_label(examples, mode):
    ex = "\n".join([f"- {t}" for t in examples])
    if mode == "method":
        prompt = (
            "You standardize AI-in-Medicine method phrases into one precise technical cluster label.\n"
            "Goal:\n"
            "Return a single canonical method label that best summarizes the shared technique across the phrases.\n"
            "Rules:\n"
            "1) 2–5 words, Title Case, ASCII only, no punctuation, no quotes, no trailing dot.\n"
            "2) Use full names, avoid abbreviations. Prefer 'Graph Neural Networks' over 'GNN', 'Causal Inference' over 'CI'.\n"
            "3) Be specific to the technique, not the dataset or domain. Do not include application words like 'ICU', 'radiology', 'clinical'.\n"
            "4) Avoid vague or meta labels: General Methods, Machine Learning, Deep Learning, Neural Networks, Representation Learning, Optimization, Others, Misc, Various.\n"
            "5) Prefer the most central shared method when multiple appear. If the phrases mix variants of the same family, choose the umbrella family name (e.g., Contrastive Learning, Knowledge Graph Embeddings, Counterfactual Inference, Score Based Diffusion, Federated Learning, Meta Learning, Time Series Forecasting).\n"
            "6) If phrases are too narrow or implementation-specific (e.g., loss names, optimizer names), lift to the nearest well-known method family.\n"
            "Phrases:\n"
            f"{ex}\n"
            "Answer with the label only."
        )
    else:
        prompt = (
            "You standardize biomedical application phrases into one precise task/domain cluster label.\n"
            "Goal:\n"
            "Return a single canonical application label that best summarizes the shared medical task or problem.\n"
            "Rules:\n"
            "1) 2–5 words, Title Case, ASCII only, no punctuation, no quotes, no trailing dot.\n"
            "2) Use full names, avoid abbreviations. Prefer 'Electroencephalography Sleep Staging' over 'EEG Sleep Staging', 'Electronic Health Record Phenotyping' over 'EHR Phenotyping'.\n"
            "3) Use 'task + domain' when relevant. Examples: Medical Image Segmentation, Protein Structure Prediction, Drug Response Prediction, Clinical Outcome Prediction, Molecular Docking, Electronic Health Record Phenotyping, Electrocardiogram Arrhythmia Detection.\n"
            "4) Avoid vague or meta labels: Healthcare AI, Biomedical NLP, Clinical AI, Diagnosis, Prognosis, Others, Misc.\n"
            "5) Do not include specific dataset names, hospitals, countries, or modality-only labels (e.g., X Ray) unless intrinsic to the task. Prefer the concrete task.\n"
            "6) If phrases span close variants of one task, choose the umbrella task name.\n"
            "Phrases:\n"
            f"{ex}\n"
            "Answer with the label only."
        )
    r = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        top_p=0.1,
        max_tokens=16
    )
    return r.choices[0].message.content.strip()

def name_clusters(emb, labels, texts, topn, mode, outpath):
    if emb.size == 0 or labels.size == 0 or len(texts) == 0:
        with open(outpath,"w") as f: json.dump([],f,ensure_ascii=False)
        return
    uniq = sorted(list(set(labels)))
    results = []
    for cid in uniq:
        idxs = np.where(labels==cid)[0]
        cluster_emb = emb[idxs]
        centroid = np.mean(cluster_emb, axis=0, keepdims=True)
        d = cosine_distances(cluster_emb, centroid).flatten()
        order = np.argsort(d)[:min(topn,len(idxs))]
        examples = [texts[idxs[i]] for i in order]
        label = ask_label(examples, mode)
        results.append({"cluster_id":int(cid),"label":label,"examples":examples})
    with open(outpath,"w") as f:
        json.dump(results,f,ensure_ascii=False,indent=2)

method_emb = np.load(f"{embed_dir}/method_embeddings.npy")
app_emb = np.load(f"{embed_dir}/application_embeddings.npy")
method_labels = np.load(f"{cluster_dir}/method_labels.npy")
app_labels = np.load(f"{cluster_dir}/application_labels.npy")

with open(f"{base_dir}/outputs/method_silhouette.png","rb"): pass

entries = []
for p in [
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICLR_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICML_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NeurIPS_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/KDD_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ACL_metadata.json"
]:
    with open(p,"r") as f: entries.extend(json.load(f))

method_texts, application_texts = [], []
for e in entries:
    from re import split
    for p in split(r"[;\n]+", e.get("method","")):
        if p.strip() and len(p.strip())>=3: method_texts.append(p.strip())
    if e.get("application","").strip():
        application_texts.append(e.get("application","").strip())

name_clusters(method_emb, method_labels, method_texts, topn=8, mode="method", outpath=f"{cluster_dir}/method_clusters_named.json")
name_clusters(app_emb, app_labels, application_texts, topn=8, mode="application", outpath=f"{cluster_dir}/application_clusters_named.json")
