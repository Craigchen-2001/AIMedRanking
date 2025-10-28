import json, os

base_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend"
main_dir = f"{base_dir}/main"
classified_dir = f"{base_dir}/scripts/analyze/cluster_embedding_outputs/classified_outputs"

application_path = f"{classified_dir}/all_classified_application_results.json"
method_path = f"{classified_dir}/all_classified_method_results.json"

with open(application_path) as f:
    app_data = {d["id"]: d for d in json.load(f)}
with open(method_path) as f:
    meth_data = {d["id"]: d for d in json.load(f)}

for conf in ["ACL", "ICLR", "ICML", "KDD", "NeurIPS"]:
    path = f"{main_dir}/{conf}_metadata.json"
    with open(path) as f:
        data = json.load(f)

    success = 0
    for paper in data:
        pid = paper["id"]
        app_labels = app_data.get(pid, {}).get("application_labels", [])
        meth_labels = meth_data.get(pid, {}).get("method_labels", [])
        paper["application_labels"] = app_labels
        paper["method_labels"] = meth_labels
        if app_labels or meth_labels:
            success += 1

    out_path = f"{main_dir}/{conf}_metadata_merged.json"
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"{conf}: {success}/{len(data)} papers successfully merged.")
