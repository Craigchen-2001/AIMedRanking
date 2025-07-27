import os
import argparse
import json
from scripts.analyze.helper import extractFromAbstract as extract_from_abstract
from scripts.analyze.helper import extractData as extract_from_pdf

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", required=True, choices=["pdf", "abstract"], help="Select extraction mode")
    parser.add_argument("--limit", type=int, default=None, help="Optional limit on number of papers")
    args = parser.parse_args()

    METADATA_PATH = "data/oral_papers/metadata/oral_metadata_2025-06-02.json"
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata_list = json.load(f)

    if args.limit:
        metadata_list = metadata_list[:args.limit]

    output_dir = "outputs/from_abstract" if args.mode == "abstract" else "outputs/from_pdf_healthcare_prompt"
    os.makedirs(output_dir, exist_ok=True)

    prompt_path = "prompts/abstract_healthcare_instruction.txt" if args.mode == "abstract" else "prompts/base_healthcare_instruction.txt"
    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt = f.read()

    for i, paper in enumerate(metadata_list, 1):
        filename = os.path.basename(paper["file_path"]).replace(".pdf", ".json")
        output_path = os.path.join(output_dir, filename)

        print(f"[{i}/{len(metadata_list)}] Processing: {filename}")

        if os.path.exists(output_path):
            print(f"Already exists: {filename} — skipping.")
            continue

        try:
            if args.mode == "abstract":
                result = extract_from_abstract(
                    paper["title"],
                    paper["abstract"],
                    prompt
                )
            else:
                result = extract_from_pdf(
                    paper["file_path"],
                    prompt
                )

            result["paper_id"] = paper["id"]
            result["title"] = paper["title"]
            result["abstract"] = paper["abstract"]
            result["keywords"] = paper.get("keywords", [])
            result["tldr"] = paper.get("tldr", "N/A")

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            print(f"Processed: {filename}")
        except Exception as e:
            print(f"Failed: {filename} | {e}")

if __name__ == "__main__":
    main()
    
    