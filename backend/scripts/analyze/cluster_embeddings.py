import os
import json
import time
import numpy as np
import matplotlib.pyplot as plt
import umap
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from collections import Counter
from openai import AzureOpenAI
from tqdm import tqdm

# Azure OpenAI credentials
os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2023-05-15",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

DEPLOYMENT_NAME = "text-embedding-ada-002"

IMAGE_FOLDER = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/outputs/ICML/clustering_png"
RESULT_FOLDER = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/outputs/ICML/results_clustering"
os.makedirs(IMAGE_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

def generate_embeddings(text_list):
    embeddings = []
    batch_size = 5
    for i in tqdm(range(0, len(text_list), batch_size), desc="Embedding"):
        batch = text_list[i:i+batch_size]
        retry = 0
        success = False
        while retry < 3 and not success:
            try:
                response = client.embeddings.create(input=batch, model=DEPLOYMENT_NAME)
                batch_embeddings = [d.embedding for d in response.data]
                embeddings.extend(batch_embeddings)
                success = True
            except Exception as e:
                print(f"Error in batch {i}, retry {retry + 1}/3: {e}")
                retry += 1
                time.sleep(3)
        if not success:
            print(f"Failed batch {i} after 3 retries, inserting dummy vectors")
            embeddings.extend([[0.0] * 1536] * len(batch))
    return np.array(embeddings)

def summarize_clusters(texts, labels, top_k=5, max_examples=10):
    summary = {}
    details = {}
    for i in range(max(labels) + 1):
        cluster_texts = [texts[j] for j in range(len(texts)) if labels[j] == i]
        words = [word for text in cluster_texts for word in text.lower().split()]
        most_common = [w for w, _ in Counter(words).most_common(top_k)]
        summary[i] = most_common
        details[i] = cluster_texts[:max_examples]
    return summary, details

def visualize_embeddings(embeddings, labels, field_name):
    for method in ["tsne", "umap"]:
        reducer = TSNE(n_components=2, random_state=42) if method == "tsne" else umap.UMAP(n_components=2, random_state=42)
        reduced = reducer.fit_transform(embeddings)
        plt.figure(figsize=(10, 8))
        scatter = plt.scatter(reduced[:, 0], reduced[:, 1], c=labels, cmap="tab20", s=20)
        plt.title(f"{field_name.capitalize()} Clusters - {method.upper()}")
        plt.colorbar(scatter, label="Cluster")
        filename = os.path.join(IMAGE_FOLDER, f"{field_name}_clusters_{method}.png")
        plt.tight_layout()
        plt.savefig(filename)
        print(f"Saved plot: {filename}")
        plt.close()

def evaluate_clustering(embeddings, labels):
    return {
        "silhouette": silhouette_score(embeddings, labels),
        "davies_bouldin": davies_bouldin_score(embeddings, labels),
        "calinski_harabasz": calinski_harabasz_score(embeddings, labels)
    }

def cluster_and_save(texts_all, field_name):
    print(f"\nProcessing field: {field_name}")
    
    embeddings = generate_embeddings(texts_all)  # 不再去重

    best_k = None
    best_score = -1
    best_labels = None
    score_log_path = os.path.join(RESULT_FOLDER, f"silhouette_scores_{field_name}.txt")
    with open(score_log_path, "w") as score_log:
        score_log.write("Clusters\tSilhouette\n")
        for n_clusters in range(10, 31):
            try:
                kmeans = KMeans(n_clusters=n_clusters, random_state=42)
                labels = kmeans.fit_predict(embeddings)
                score = silhouette_score(embeddings, labels)
                score_log.write(f"{n_clusters}\t{score:.4f}\n")
                if score > best_score:
                    best_k = n_clusters
                    best_score = score
                    best_labels = labels
            except Exception as e:
                print(f"KMeans failed for {n_clusters} clusters: {e}")

    print(f"Best cluster count for {field_name}: {best_k} (Silhouette={best_score:.4f})")
    visualize_embeddings(embeddings, best_labels, field_name)
    eval_scores = evaluate_clustering(embeddings, best_labels)
    print("Evaluation:", eval_scores)

    summary, details = summarize_clusters(texts_all, best_labels)
    out_json = {
        "field": field_name,
        "best_k": best_k,
        "silhouette_best": best_score,
        "evaluation": eval_scores,
        "clusters_summary": summary,
        "clusters_details": details
    }
    out_path = os.path.join(RESULT_FOLDER, f"{field_name}_clustering_result.json")
    with open(out_path, "w") as f:
        json.dump(out_json, f, indent=2)
    print(f"Saved clustering result: {out_path}")

    return list(best_labels)


def main():
    input_path = input("Enter JSON file path: ").strip()
    if not os.path.exists(input_path):
        print("File not found.")
        return

    with open(input_path, "r") as f:
        data = json.load(f)

    cluster_labels_all = {}
    for field in ["topic", "method", "application"]:
        texts = [p.get(field, "") for p in data]
        labels = cluster_and_save(texts, field)
        cluster_labels_all[field] = labels

    for i, paper in enumerate(data):
        for field in ["topic", "method", "application"]:
            cluster_id = cluster_labels_all[field][i]
            paper[f"{field}_cluster"] = int(cluster_id)

    out_path = os.path.join(RESULT_FOLDER, "ICML_2025_with_cluster_labels.json")
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n Final JSON with cluster labels saved to: {out_path}")

if __name__ == "__main__":
    main()
