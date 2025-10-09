import os, json, time
from openai import AzureOpenAI
from tqdm import tqdm

os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2025-03-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

deployment_name = "gpt-4o"

base_root = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend"
input_map = {
    "ICLR": f"{base_root}/main/ICLR_metadata.json",
    "ICML": f"{base_root}/main/ICML_metadata.json",
    "NeurIPS": f"{base_root}/main/NeurIPS_metadata.json",
    "KDD": f"{base_root}/main/KDD_metadata.json"
}
out_root = f"{base_root}/scripts/analyze/cluster_embedding_outputs/classified_outputs"
os.makedirs(out_root, exist_ok=True)

prompt_paths = {
    "method": f"{base_root}/prompts/classify_method_prompt_full.txt",
    "application": f"{base_root}/prompts/classify_application_prompt_full.txt",
}

def load_entries(conference):
    if conference == "all":
        all_entries = []
        for p in input_map.values():
            with open(p) as f:
                all_entries.extend(json.load(f))
    else:
        with open(input_map[conference]) as f:
            all_entries = json.load(f)
    print(f"Total papers loaded: {len(all_entries)} from {conference}")
    return all_entries

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
    out = {"id": paper.get("id")}
    labels = parsed.get(key) if isinstance(parsed, dict) else None
    if not labels or not isinstance(labels, list):
        labels = [{"id": 999, "label": "Others"}]
    clean = []
    for item in labels:
        if not isinstance(item, dict):
            continue
        cid = item.get("id")
        name = item.get("label")
        if isinstance(cid, int) and isinstance(name, str) and name:
            clean.append({"id": cid, "label": name})
    if not clean:
        clean = [{"id": 999, "label": "Others"}]
    out[key] = clean
    return out

def classify(paper, prompt_type):
    filled_prompt = build_prompt(paper, prompt_type)
    try:
        resp = client.responses.create(
            model=deployment_name,
            input=filled_prompt,
            temperature=0,
            max_output_tokens=800,
            timeout=120
        )
        txt = resp.output[0].content[0].text.strip()
        if not txt:
            raise ValueError("Empty response")
        print("\n========== RAW OUTPUT ==========")
        print(f"Paper ID (source): {paper.get('id')}")
        print(txt[:2000])
        print("================================\n")
        if '```json' in txt:
            txt = txt.split('```json')[-1].split('```')[0].strip()
        elif '```' in txt:
            txt = txt.split('```')[-1].strip()
        parsed = json.loads(txt)
        result = normalize_result(paper, parsed, prompt_type)
    except Exception as e:
        print(f"\n[ERROR] Paper ID: {paper.get('id')} | Type: {prompt_type}")
        print("Error message:", str(e))
        if 'txt' in locals():
            print("RAW OUTPUT (possibly invalid):", txt[:2000])
        result = {"id": paper.get("id"), f"{prompt_type}_labels": [{"id": 999, "label": "Others"}]}
    return result

conf = input("Enter conference (ICLR / ICML / NeurIPS / KDD / all): ").strip()
entries = load_entries(conf)
n_total = len(entries)

mode = input("Enter 'range', 'single', or 'count': ").strip().lower()
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

for paper in tqdm(selected, desc=f"Classifying {conf} papers"):
    m = classify(paper, "method")
    a = classify(paper, "application")
    method_results.append(m)
    app_results.append(a)
    time.sleep(3)

with open(f"{out_root}/{conf}_classified_method_results.json", "w") as f:
    json.dump(method_results, f, indent=2)
with open(f"{out_root}/{conf}_classified_application_results.json", "w") as f:
    json.dump(app_results, f, indent=2)

print("Done.")
