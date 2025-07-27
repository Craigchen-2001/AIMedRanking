import os
import json
import requests
from tqdm import tqdm

def download_pdf(paper_id, url, save_dir):
    filename = paper_id + ".pdf"
    filepath = os.path.join(save_dir, filename)
    
    if os.path.exists(filepath):
        print(f"Already exists: {filename}")
        return

    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200 and response.headers.get("Content-Type", "").lower() in ["application/pdf", "application/octet-stream"]:
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"Downloaded: {filename}")
        else:
            print(f"Unexpected response for: {paper_id} (status {response.status_code})")
    except Exception as e:
        print(f"Failed: {paper_id} | {e}")

def main():
    input_paths = input("Enter paths to JSON files (comma-separated): ").strip().split(",")
    input_paths = [p.strip() for p in input_paths if p.strip()]
    output_dir = input("Enter the directory to save downloaded PDFs: ").strip()

    print("\nSummary of input files:")
    all_yes_papers = []
    for path in input_paths:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
        with open(path, "r") as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"Failed to parse JSON: {path} | {e}")
                continue

        yes_papers = [p for p in data if str(p.get("is_healthcare", "")).strip().lower() == "yes"]
        all_yes_papers.extend(yes_papers)
        print(f"{os.path.basename(path)}: {len(yes_papers)} healthcare-related papers")

    print(f"\nTotal papers to download: {len(all_yes_papers)}")
    confirm = input("Proceed to download? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Cancelled.")
        return

    os.makedirs(output_dir, exist_ok=True)

    for paper in tqdm(all_yes_papers, desc="Downloading PDFs"):
        paper_id = paper.get("id", "")
        url = paper.get("pdf_url", "")
        if paper_id and url.startswith("http"):
            download_pdf(paper_id, url, output_dir)
        else:
            print(f"Skipping invalid entry: {paper_id}")

    print(f"\nDone. PDFs saved to: {output_dir}")

if __name__ == "__main__":
    main()
