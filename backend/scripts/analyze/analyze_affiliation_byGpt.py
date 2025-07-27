import os
import json
from tqdm import tqdm
from pathlib import Path
from helper import extractAffiliation

def load_instruction(prompt_path):
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()

def prompt_user_inputs():
    input_json = input("Enter input JSON path (e.g., data/iclr_metadata_2025.json): ").strip()
    while not os.path.exists(input_json):
        print("File not found. Please enter a valid path.")
        input_json = input("Enter input JSON path: ").strip()

    with open(input_json, "r", encoding="utf-8") as f:
        papers = json.load(f)

    total = len(papers)
    print(f"Loaded {total} papers.")

    max_count = input(f"Enter number of papers to process (max {total}): ").strip()
    while not max_count.isdigit() or not (1 <= int(max_count) <= total):
        max_count = input("Please enter a valid number (e.g., 5 or 50): ").strip()
    max_count = int(max_count)

    output_json = input("Enter output JSON path (e.g., output/updated_metadata.json): ").strip()
    prompt_path = input("Enter prompt file path (e.g., prompts/get_affiliation_prompt.txt): ").strip()

    return input_json, output_json, prompt_path, max_count, papers[:max_count]  # Only return N papers

def main():
    input_json, output_json, prompt_path, max_count, papers = prompt_user_inputs()
    instruction = load_instruction(prompt_path)

    updated_entries = []

    for entry in tqdm(papers, desc="Processing papers"):
        # Rename legacy fields
        if "institutes" in entry:
            entry["affiliation"] = entry.pop("institutes")
        if "authors/institutes" in entry:
            entry["authors/affiliations"] = entry.pop("authors/institutes")

        title = entry.get("title", "")
        authors = entry.get("authors", [])
        conference = entry.get("venue", "Unknown")
        year = entry.get("year", "Unknown")
        pdf_url = entry.get("pdf_url", "")

        metadata_input = {
            "title": title,
            "authors": authors,
            "conference": conference,
            "year": year,
            "pdf_url": pdf_url
        }

        gpt_result = extractAffiliation(metadata_input, instruction)

        if not gpt_result:
            print(f"[WARNING] No GPT result returned for paper ID: {entry.get('id', 'N/A')}")
        else:
            print(f"[DEBUG] GPT result for {entry.get('id', 'N/A')}:\n{json.dumps(gpt_result, indent=2)}")

        entry["affiliation"] = gpt_result.get("affiliation", [])
        entry["authors/affiliations"] = gpt_result.get("authors/affiliations", {})

        updated_entries.append(entry)

    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(updated_entries, f, indent=2, ensure_ascii=False)

    print(f"Finished. Output written to {output_json}.")

if __name__ == "__main__":
    main()

