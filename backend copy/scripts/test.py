import json

method_json = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/scripts/analyze/cluster_embedding_outputs/clusters/method_clusters_named.json"
application_json = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/scripts/analyze/cluster_embedding_outputs/clusters/application_clusters_named.json"

method_prompt_template = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/classify_method_prompt.txt"
application_prompt_template = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/classify_application_prompt.txt"

def expand_prompt(template_path, json_path, output_path):
    with open(template_path) as f:
        base = f.read()
    with open(json_path) as f:
        clusters = json.load(f)
    text_lines = []
    for c in clusters:
        text_lines.append(f"{c['cluster_id']}: {c['label']}")
        for ex in c["examples"]:
            text_lines.append(f"  - {ex}")
        text_lines.append("")  # spacing
    filled = base.replace("{{method_list}}" if "method" in template_path else "{{application_list}}", "\n".join(text_lines))
    with open(output_path, "w") as f:
        f.write(filled)
    print("✅ Wrote", output_path)

expand_prompt(method_prompt_template, method_json, method_prompt_template.replace(".txt", "_full.txt"))
expand_prompt(application_prompt_template, application_json, application_prompt_template.replace(".txt", "_full.txt"))
