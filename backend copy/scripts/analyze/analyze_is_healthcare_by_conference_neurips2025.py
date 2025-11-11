import os
import json
from pathlib import Path
from tqdm import tqdm
from helper import extractFromAbstract

PROMPT_PATH = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/base_healthcare_instruction.txt"
INPUT_PATH = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/data/NeurIPS/metadata/neurips_metadata_2025.json"
OUTPUT_PATH = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/NeurIPS/analyze_healthcare/NeurIPS_healthcare_analysis_neurips_metadata_2025.json"

def main():
    print("\nAnalyzing NeurIPS 2025 papers for healthcare relevance...\n")

    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        prompt = f.read()

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        papers = json.load(f)

    print(f"Total papers loaded: {len(papers)}")

    results = []
    total_yes = 0

    for paper in tqdm(papers, desc="Processing NeurIPS 2025"):
        title = paper.get("title", "N/A")
        abstract = paper.get("abstract", "N/A")
        keywords = paper.get("keywords", "N/A")
        if isinstance(keywords, list):
            keywords = ", ".join(keywords)

        gpt_result = extractFromAbstract(title, abstract, keywords, prompt)["gpt_output"]

        is_healthcare = "No"
        reasoning = "N/A"

        for line in gpt_result.splitlines():
            if "Is Healthcare" in line:
                if "Yes" in line:
                    is_healthcare = "Yes"
            if "Reason" in line:
                reasoning = line.split("Reason:")[-1].strip()

        if is_healthcare == "Yes":
            total_yes += 1

        results.append({
            "id": paper.get("id", "N/A"),
            "title": title,
            "authors": paper.get("authors", "N/A"),
            "institutes": paper.get("institutes", "N/A"),
            "authors/institutes": paper.get("authors/institutes", "N/A"),
            "abstract": abstract,
            "keywords": paper.get("keywords", "N/A"),
            "pdf_url": paper.get("pdf_url", "N/A"),
            "is_healthcare": is_healthcare,
            "reasoning": reasoning
        })

    output_dir = Path(OUTPUT_PATH).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n Completed! {total_yes} out of {len(papers)} papers classified as Healthcare.")
    print(f"Results saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
