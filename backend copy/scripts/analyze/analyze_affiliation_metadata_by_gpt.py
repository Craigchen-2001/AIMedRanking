import os
import json
from tqdm import tqdm
from helper import extractAffiliationFromAffiliationOnly


def load_json_safe(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        raw = f.read().strip()
        if raw.startswith('"') and raw.endswith('"'):
            raw = raw[1:-1]
            raw = raw.encode('utf-8').decode('unicode_escape')
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return {}


def main():
    base_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend"
    json_path = f"{base_dir}/main/csranking/author_affiliation.json"
    matched_inst_path = f"{base_dir}/outputs/NeurIPS/matching_reports/matched_institutions_list.json"
    prompt_path = f"{base_dir}/prompts/affiliation_extraction.txt"
    output_path = f"{base_dir}/main/csranking/author_affiliation_updated.json"

    # 讀 prompt
    with open(prompt_path, "r", encoding="utf-8") as f:
        instruction = f.read()

    # 讀 matched 機構清單
    matched_insts = set(load_json_safe(matched_inst_path))
    print(f"Loaded {len(matched_insts)} matched institutions to process.")

    # 讀原始 author-affiliation
    raw_entries = load_json_safe(json_path)
    if not isinstance(raw_entries, dict):
        print("Input JSON must be a dictionary with author names as keys.")
        return

    # 過濾只包含 matched 機構的 entries
    candidates = []
    for author, data in raw_entries.items():
        if isinstance(data, dict):
            aff = data.get("affiliation", "").strip()
            homepage = data.get("homepage", "").strip()
            if aff and homepage and aff in matched_insts:
                data["author"] = author
                candidates.append(data)

    print(f"Total entries after filtering: {len(candidates)}")

    choice = input("How many entries to analyze? (number / all): ").strip().lower()
    if choice == "all":
        to_process = candidates
    else:
        try:
            n = int(choice)
            to_process = candidates[:n]
        except ValueError:
            print("Invalid input. Exiting.")
            return

    updated_entries = {}
    for entry in tqdm(to_process, desc="Analyzing Affiliations"):
        affiliation = entry["affiliation"].strip()
        homepage = entry["homepage"].strip()
        author = entry["author"]

        gpt_result = extractAffiliationFromAffiliationOnly(affiliation, homepage, instruction)

        updated_entries[author] = {
            "affiliation": gpt_result.get("affiliation", affiliation),
            "homepage": homepage,
            "country": gpt_result.get("country", "N/A"),
            "region": gpt_result.get("region", "N/A"),
            "subregion": gpt_result.get("subregion", "N/A"),
            "latitude": gpt_result.get("latitude", None),
            "longitude": gpt_result.get("longitude", None)
        }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(updated_entries, f, indent=2, ensure_ascii=False)

    print(f"Saved enriched data to: {output_path}")
    print(f"Total analyzed: {len(updated_entries)}")


if __name__ == "__main__":
    main()
