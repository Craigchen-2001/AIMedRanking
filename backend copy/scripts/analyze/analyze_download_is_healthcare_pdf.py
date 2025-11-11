import os
import json
import requests
from tqdm import tqdm

def download_pdf(paper_id, url, save_dir):
    filename = paper_id + ".pdf"
    filepath = os.path.join(save_dir, filename)

    if os.path.exists(filepath):
        print(f"Already exists: {filename}")
        return True

    try:
        headers = {
            "User-Agent": "Mozilla/5.0"
        }
        response = requests.get(url, headers=headers, timeout=10)
        content_type = response.headers.get("Content-Type", "").lower()
        if response.status_code == 200 and ("pdf" in content_type or "octet-stream" in content_type):
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"Downloaded: {filename}")
            return True
        else:
            print(f"Unexpected response for: {paper_id} (status {response.status_code})")
            return False
    except Exception as e:
        print(f"Failed: {paper_id} | {e}")
        return False

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

    success_count = 0
    fail_list = []

    for paper in tqdm(all_yes_papers, desc="Downloading PDFs"):
        paper_id = paper.get("id", "")
        url = paper.get("pdf_url", "")
        title = paper.get("title", "Untitled")
        if paper_id and url.startswith("http"):
            success = download_pdf(paper_id, url, output_dir)
            if success:
                success_count += 1
            else:
                fail_list.append((paper_id, title))
        else:
            print(f"Skipping invalid entry: {paper_id}")
            fail_list.append((paper_id, title))

    print("\n========== Download Summary ==========")
    print(f"Success: {success_count}")
    print(f"Failed: {len(fail_list)}")
    if fail_list:
        print("\nFailed papers:")
        for pid, title in fail_list:
            print(f"- {pid}: {title}")

    print(f"\nDone. PDFs saved to: {output_dir}")

if __name__ == "__main__":
    main()
