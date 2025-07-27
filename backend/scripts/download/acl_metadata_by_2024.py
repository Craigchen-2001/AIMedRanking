import requests
from bs4 import BeautifulSoup
import json
import time
import os
from tqdm import tqdm  

ACL_URL = "https://aclanthology.org/events/acl-2024/"
BASE_URL = "https://aclanthology.org"
OUTPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/ACL/metadata"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "acl_metadata_2024.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def get_acl2024_volumes():
    response = requests.get(ACL_URL, headers=HEADERS)
    soup = BeautifulSoup(response.text, "html.parser")

    volumes = {}
    for volume_div in soup.find_all("div", id=lambda x: x and x.startswith("2024acl")):
        volume_id = volume_div.get("id").replace("2024", "2024.")
        paper_blocks = volume_div.find_all("p", class_="d-sm-flex align-items-stretch")
        volumes[volume_id] = len(paper_blocks)
    return volumes

def parse_paper_block(p_block, volume_id):
        # 1. title & paper_id
        title_tag = p_block.find("strong").find("a", class_="align-middle")
        href = title_tag["href"].strip("/")
        title = title_tag.text.strip()
        paper_id = href.replace("/", "").strip(".")
        source_url = BASE_URL + "/" + paper_id
        pdf_url = BASE_URL + "/" + paper_id + ".pdf"

        # 2. authors
        author_tags = p_block.find_all("a", href=lambda x: x and x.startswith("/people/"))
        authors = [tag.text.strip() for tag in author_tags] if author_tags else []

        # 3. abstract div is just after p_block
        abstract_div = p_block.find_next_sibling("div", class_="card bg-light mb-2 mb-lg-3 collapse abstract-collapse")
        abstract = "n/a"
        if abstract_div:
            inner = abstract_div.find("div", class_="card-body")
            if inner:
                abstract = inner.text.strip()

        return {
            "id": paper_id,
            "title": title,
            "authors": authors,
            "abstract": abstract if abstract else "N/A",
            "keywords": "N/A",
            "institutes": "N/A",
            "venue": "ACL 2024",
            "pdf_url": pdf_url,
            "source_url": source_url,
            "final_decision": "Accept"
        }


def extract_volume_metadata(volume_id):
    url = ACL_URL + f"#{volume_id.replace('.', '')}"
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")

    target_div = soup.find("div", id=volume_id.replace(".", ""))
    paper_blocks = target_div.find_all("p", class_="d-sm-flex align-items-stretch")
    volume_metadata = []

    for p in tqdm(paper_blocks, desc=f" {volume_id}"):
        metadata = parse_paper_block(p, volume_id)
        volume_metadata.append(metadata)
        time.sleep(0.1)  # polite delay

    return volume_metadata

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(" Fetching ACL 2024 volumes...")
    volumes = get_acl2024_volumes()

    print("\n Found volumes:")
    for vol, count in volumes.items():
        print(f"- {vol} ({count} papers)")
    print(f"\nTotal: {len(volumes)} volumes.")

    input("\n Press Enter to start extracting metadata for all volumes...")

    all_metadata = []
    for vol in volumes:
        print(f"\n Processing volume: {vol}")
        volume_data = extract_volume_metadata(vol)
        all_metadata.extend(volume_data)
        print(f" Done: {len(volume_data)} papers from {vol}")

    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_metadata, f, indent=2)
    print(f"\n All metadata saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

