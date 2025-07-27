import os
import json
import argparse
from pathlib import Path
from tqdm import tqdm
from helper import extractFromAbstract

# Use o4-mini to classify each conference's metadata using Prompt Version 4.
# Determines whether each paper is related to healthcare and provides reasoning.
# Output is a JSON file with 10 fields.

PROMPT_PATH = "prompts/base_healthcare_instruction.txt"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--conference", required=True, help="Conference name, e.g., ACL, ICLR, CVPR")
    args = parser.parse_args()

    base_dir = Path("data") / args.conference / "metadata"
    all_years = sorted([f for f in os.listdir(base_dir) if f.endswith(".json")])

    print(f"\nAvailable years for {args.conference}:")
    year_paper_counts = []
    for idx, year_file in enumerate(all_years, 1):
        year_path = base_dir / year_file
        with open(year_path, "r", encoding="utf-8") as f:
            papers = json.load(f)
        year_paper_counts.append(len(papers))
        print(f"[{idx}] {year_file} — {len(papers)} papers")

    print("""
Please select the year(s) to process:
- Enter a single number (e.g., 2) to process one year
- Enter multiple numbers separated by space (e.g., 1 3 5) to process multiple years
- Enter 'all' to process all years
""")

    selected = input("Your selection: ").strip()

    if selected.lower() == "all":
        selected_indices = list(range(len(all_years)))
    else:
        try:
            selected_indices = [int(s) - 1 for s in selected.split()]
            if not all(0 <= idx < len(all_years) for idx in selected_indices):
                raise ValueError
        except ValueError:
            print("Invalid input. Exiting.")
            return

    total_papers = sum(year_paper_counts[idx] for idx in selected_indices)
    selected_years = [all_years[idx] for idx in selected_indices]

    print(f"\nYou selected {len(selected_years)} year(s):")
    for year in selected_years:
        print(f"- {year}")
    print(f"Total papers to process: {total_papers}")

    confirm = input("\nProceed with processing? (y/n): ")
    if confirm.lower() != "y":
        print("Operation cancelled.")
        return

    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        prompt = f.read()

    total_yes = 0
    total_processed = 0

    for idx in selected_indices:
        selected_file = all_years[idx]
        year_path = base_dir / selected_file

        print(f"\nLoading {selected_file}...")

        with open(year_path, "r", encoding="utf-8") as f:
            papers = json.load(f)

        print(f"Total papers in {selected_file}: {len(papers)}")

        results = []
        year_yes_count = 0

        for paper in tqdm(papers, desc=f"Processing {selected_file}"):
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
                year_yes_count += 1

            result = {
                "id": paper.get("id", "N/A"),
                "title": title,
                "authors": paper.get("authors", "N/A"),
                "institutes": paper.get("institutes", "N/A"),
                "authors/institutes": paper.get("authors/institutes", "N/A"),
                "abstract": abstract,
                "keywords": keywords,
                "pdf_url": paper.get("pdf_url", "N/A"),
                "is_healthcare": is_healthcare,
                "reasoning": reasoning
            }

            results.append(result)

        total_yes += year_yes_count
        total_processed += len(papers)

        print(f"Completed {selected_file}. {year_yes_count} out of {len(papers)} papers are classified as 'Yes' (healthcare).")

        output_dir = Path("outputs") / args.conference / "analyze_healthcare"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{args.conference}_healthcare_analysis_{selected_file}"

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"Results for {selected_file} saved to: {output_path}")

    print(f"\nTotal 'Yes' papers across selected years: {total_yes} out of {total_processed}")

if __name__ == "__main__":
    main()
