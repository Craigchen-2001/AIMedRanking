import requests
from bs4 import BeautifulSoup
import json
import time
import os
import argparse
from tqdm import tqdm

BASE_URL = "https://aclanthology.org"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def get_acl_volumes(year):
    url = f"{BASE_URL}/events/acl-{year}/"
    response = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(response.text, "html.parser")

    volumes = {}
    for div in soup.find_all("div", id=lambda x: x and x.startswith(str(year))):
        volume_id = div.get("id")
        paper_blocks = div.find_all("p", class_="d-sm-flex align-items-stretch")
        volumes[volume_id] = len(paper_blocks)
    return volumes


def parse_paper_block(p_block, volume_id):
        # Title & ID
        title_tag = p_block.find("strong").find("a", class_="align-middle")
        href = title_tag["href"].strip("/")
        title = title_tag.text.strip()
        paper_id = href.replace("/", "").strip(".")
        source_url = f"{BASE_URL}/{paper_id}"
        pdf_url = f"{BASE_URL}/{paper_id}.pdf"

        # Authors
        author_tags = p_block.find_all("a", href=lambda x: x and x.startswith("/people/"))
        authors = [tag.text.strip() for tag in author_tags]

        # Abstract
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
            "abstract": abstract if abstract else "n/a",
            "keywords": "N/A",
            "institutes": "N/A",
            "venue": f"ACL {volume_id.split('.')[0]}",
            "pdf_url": pdf_url,
            "source_url": source_url,
            "final_decision": "Accept"
        }


def extract_volume_metadata(year, volume_id):
    url = f"{BASE_URL}/events/acl-{year}/#{volume_id.replace('.', '')}"
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")

    target_div = soup.find("div", id=volume_id)
    if not target_div:
        return []

    paper_blocks = target_div.find_all("p", class_="d-sm-flex align-items-stretch")
    volume_metadata = []

    for p in tqdm(paper_blocks, desc=f"▶ {volume_id}", leave=False):
        metadata = parse_paper_block(p, volume_id)
        volume_metadata.append(metadata)
        time.sleep(0.05)
    return volume_metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True, help="ACL year (e.g. 2023)")
    args = parser.parse_args()

    year = args.year
    output_dir = f"./data/ACL/metadata"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"acl_metadata_{year}.json")

    print(f" Fetching ACL {year} volumes...\n")
    volumes = get_acl_volumes(year)

    print(" Found volumes:")
    sorted_volumes = sorted(volumes.items())
    for i, (vol, count) in enumerate(sorted_volumes):
        print(f"{i+1:>3}. {vol} ({count} papers)")
    print(f"\nTotal: {len(sorted_volumes)} volumes.\n")

    selected_range = input(" Enter volume index range to process (e.g., 1-5): ").strip()
    start_idx, end_idx = map(int, selected_range.split("-"))
    selected = [v[0] for v in sorted_volumes[start_idx-1:end_idx]]

    all_metadata = []
    for vol_id in selected:
        print(f"\n Processing volume: {vol_id}")
        volume_data = extract_volume_metadata(year, vol_id)
        print(f" Done: {len(volume_data)} papers")
        all_metadata.extend(volume_data)

    with open(output_file, "w") as f:
        json.dump(all_metadata, f, indent=2)
    print(f"\n All metadata saved to: {output_file}")


if __name__ == "__main__":
    main()

