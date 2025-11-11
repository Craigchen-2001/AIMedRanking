import os, json, time
from openai import AzureOpenAI
from tqdm import tqdm

os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version="2025-01-01-preview"
)

deployment_name = "gpt-4o"

base_root = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend"
input_path = f"{base_root}/main/NeurIPS_metadata2025_merged.json"
out_root = f"{base_root}/scripts/analyze/cluster_embedding_outputs/classified_outputs"
os.makedirs(out_root, exist_ok=True)

prompt_paths = {
    "method": f"{base_root}/prompts/classify_method_prompt_full.txt",
    "application": f"{base_root}/prompts/classify_application_prompt_full.txt"
}

def build_prompt(paper, prompt_type):
    with open(prompt_paths[prompt_type]) as f:
        base_prompt = f.read()
    filled = base_prompt.replace("{{title}}", paper.get("title", "N/A")).replace("{{abstract}}", paper.get("abstract", "N/A"))
    if prompt_type == "method":
        methods = paper.get("method", "")
        if isinstance(methods, list):
            methods = "; ".join(methods)
        filled = filled.replace("{{method}}", methods or "N/A")
    elif prompt_type == "application":
        app = paper.get("application", "")
        if isinstance(app, list):
            app = "; ".join(app)
        filled = filled.replace("{{application}}", app or "N/A")
    return filled

def normalize_result(paper, parsed, prompt_type):
    key = f"{prompt_type}_labels"
    labels = parsed.get(key) if isinstance(parsed, dict) else None
    if not labels or not isinstance(labels, list):
        labels = [{"id": 999, "label": "Others"}]
    clean = []
    for item in labels:
        if isinstance(item, dict):
            cid = item.get("id")
            name = item.get("label")
            if isinstance(cid, int) and isinstance(name, str) and name:
                clean.append({"id": cid, "label": name})
    if not clean:
        clean = [{"id": 999, "label": "Others"}]
    return clean

def classify(paper, prompt_type):
    filled_prompt = build_prompt(paper, prompt_type)
    try:
        resp = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a careful JSON-only classifier. Reply with valid JSON only."},
                {"role": "user", "content": filled_prompt}
            ],
            temperature=0,
            max_tokens=800,
            timeout=120
        )
        txt = resp.choices[0].message.content.strip()
        if not txt:
            raise ValueError("Empty response")
        if '```json' in txt:
            txt = txt.split('```json')[-1].split('```')[0].strip()
        elif '```' in txt:
            txt = txt.split('```')[-1].strip()
        parsed = json.loads(txt)
        return normalize_result(paper, parsed, prompt_type)
    except Exception as e:
        print(f"\n[ERROR] Paper ID: {paper.get('id')} | Type: {prompt_type}")
        print("Error:", e)
        return [{"id": 999, "label": "Others"}]

with open(input_path) as f:
    entries = json.load(f)
print(f"Loaded {len(entries)} NeurIPS 2025 entries")

mode = input("Enter 'range', 'single', or 'count': ").strip().lower()
n_total = len(entries)
if mode == "range":
    start = int(input(f"Start index (0–{n_total-1}): "))
    end = int(input(f"End index (exclusive, ≤{n_total}): "))
    selected = entries[start:end]
elif mode == "single":
    idx = int(input(f"Paper index (0–{n_total-1}): "))
    selected = [entries[idx]]
else:
    count = int(input(f"Run how many papers (max {n_total}): "))
    selected = entries[:count]

method_results, app_results = [], []

for paper in tqdm(selected, desc="Classifying NeurIPS 2025 papers"):
    paper["method_labels"] = classify(paper, "method")
    paper["application_labels"] = classify(paper, "application")
    method_results.append({"id": paper["id"], "method_labels": paper["method_labels"]})
    app_results.append({"id": paper["id"], "application_labels": paper["application_labels"]})
    time.sleep(3)

with open(f"{out_root}/NeurIPS2025_classified_method_results.json", "w") as f:
    json.dump(method_results, f, indent=2)
with open(f"{out_root}/NeurIPS2025_classified_application_results.json", "w") as f:
    json.dump(app_results, f, indent=2)

with open(input_path, "w", encoding="utf-8") as f:
    json.dump(entries, f, indent=2, ensure_ascii=False)

print(f"\nMerged labels directly into {input_path}")
print("Backup results saved in classified_outputs/")
print("Done.")
