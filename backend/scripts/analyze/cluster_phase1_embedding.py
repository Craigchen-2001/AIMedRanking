# /Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/scripts/analyze/cluster_phase1_embedding.py
import os, json, re, numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
from openai import AzureOpenAI

os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(api_key=os.getenv("AZURE_OPENAI_API_KEY"), api_version="2023-05-15", azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"))
EMBED_MODEL = "text-embedding-ada-002"

base_root = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend"
input_files = [
    f"{base_root}/main/ICLR_metadata.json",
    f"{base_root}/main/ICML_metadata.json",
    f"{base_root}/main/NeurIPS_metadata.json",
    f"{base_root}/main/KDD_metadata.json",
]
out_root = f"{base_root}/scripts/analyze/cluster_embedding_outputs"
embed_dir = f"{out_root}/embeddings"
cluster_dir = f"{out_root}/clusters"
outputs_dir = f"{out_root}/outputs"
os.makedirs(embed_dir, exist_ok=True)
os.makedirs(cluster_dir, exist_ok=True)
os.makedirs(outputs_dir, exist_ok=True)

def load_entries():
    all_entries = []
    for p in input_files:
        with open(p, "r") as f:
            all_entries.extend(json.load(f))
    return all_entries

def split_methods(s):
    if not s: return []
    parts = re.split(r"[;\n]+", s)
    return [x.strip() for x in parts if x and len(x.strip()) >= 3]

def batch_embed(texts, batch=50):
    vecs = []
    for i in range(0, len(texts), batch):
        chunk = texts[i:i+batch]
        resp = client.embeddings.create(model=EMBED_MODEL, input=chunk)
        vecs.extend([r.embedding for r in resp.data])
    return np.array(vecs, dtype=np.float32)

def pick_k_and_labels(emb, k_min, k_max, title_png_path, sample_size=5000):
    n = emb.shape[0]
    if n < 3: return None, None
    scores, best_k, best_score, best_labels = [], -1, -1, None
    for k in range(max(2, k_min), min(k_max, n - 1) + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(emb)
        s = silhouette_score(emb, labels, sample_size=min(sample_size, n))
        scores.append((k, s))
        if s > best_score:
            best_k, best_score, best_labels = k, s, labels
    if scores:
        xs, ys = zip(*scores)
        plt.figure()
        plt.plot(xs, ys)
        plt.xlabel("k")
        plt.ylabel("silhouette")
        plt.title(os.path.basename(title_png_path).replace(".png",""))
        plt.savefig(title_png_path, dpi=150, bbox_inches="tight")
        plt.close()
    return best_k, best_labels

entries = load_entries()
method_texts, application_texts = [], []
for e in entries:
    for p in split_methods(e.get("method","")):
        method_texts.append(p)
    if e.get("application","").strip():
        application_texts.append(e.get("application","").strip())

method_emb = batch_embed(method_texts) if method_texts else np.zeros((0,0))
app_emb = batch_embed(application_texts) if application_texts else np.zeros((0,0))

np.save(f"{embed_dir}/method_embeddings.npy", method_emb)
np.save(f"{embed_dir}/application_embeddings.npy", app_emb)

mk, mlabels = pick_k_and_labels(method_emb, 10, 80, f"{outputs_dir}/method_silhouette.png")
ak, alabels = pick_k_and_labels(app_emb, 5, 50, f"{outputs_dir}/application_silhouette.png")

np.save(f"{cluster_dir}/method_labels.npy", np.array([] if mlabels is None else mlabels, dtype=int))
np.save(f"{cluster_dir}/application_labels.npy", np.array([] if alabels is None else alabels, dtype=int))
