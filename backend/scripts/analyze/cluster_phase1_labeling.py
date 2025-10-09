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
            "You standardize AI in Medicine research method phrases into precise technical clusters.\n"
            "Given the following method phrases, output a single short label that best captures the shared technique.\n"
            "Constraints: 2–5 words, Title Case, no quotes, letters/spaces only, avoid vague terms, be specific (e.g., Graph Neural Networks, Counterfactual Inference, Score Based Diffusion, Knowledge Graph Embeddings, Federated Learning, Meta Learning).\n"
            "Phrases:\n"
            f"{ex}\n"
            "Answer with the label only."
        )
    else:
        prompt = (
            "You standardize biomedical application phrases into precise task/domain clusters.\n"
            "Given the following application phrases, output a single short label that best captures the shared medical task/domain.\n"
            "Constraints: 2–5 words, Title Case, no quotes, letters/spaces only, avoid vague terms, be specific (e.g., Molecular Docking, Drug Response Prediction, Medical Image Reconstruction, EEG Sleep Staging, Protein Structure Prediction, Clinical Outcome Prediction).\n"
            "Phrases:\n"
            f"{ex}\n"
            "Answer with the label only."
        )
    r = client.chat.completions.create(model=CHAT_MODEL, messages=[{"role":"user","content":prompt}], temperature=0.2, max_tokens=32)
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
]:
    with open(p,"r") as f: entries.extend(json.load(f))

method_texts, application_texts = [], []
for e in entries:
    from re import split
    for p in split(r"[;\n]+", e.get("method","")):
        if p.strip() and len(p.strip())>=3: method_texts.append(p.strip())
    if e.get("application","").strip():
        application_texts.append(e.get("application","").strip())

name_clusters(method_emb, method_labels, method_texts, topn=5, mode="method", outpath=f"{cluster_dir}/method_clusters_named.json")
name_clusters(app_emb, app_labels, application_texts, topn=5, mode="application", outpath=f"{cluster_dir}/application_clusters_named.json")
