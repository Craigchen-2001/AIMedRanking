import requests
from bs4 import BeautifulSoup
import json
import time
import os
from tqdm import tqdm

BASE_URL = "https://aclanthology.org"
ACL2020_LONG_URL = "https://acl2020.org/program/accepted/"
OUTPUT_DIR = "./data/ACL/metadata"
LONG_TITLE_PATH = os.path.join(OUTPUT_DIR, "acl_long_titles_2020.json")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "acl_metadata_2020.json")
MATCHED_TITLES_PATH = os.path.join(OUTPUT_DIR, "acl_matched_titles_2020.json")
MISSING_TITLES_PATH = os.path.join(OUTPUT_DIR, "acl_missing_titles_2020.json")
HEADERS = {"User-Agent": "Mozilla/5.0"}


def fetch_long_titles():
    """Fetch ACL 2020 long paper titles from official website"""
    print("Fetching Long Paper Titles from acl2020.org...")
    resp = requests.get(ACL2020_LONG_URL, headers=HEADERS)
    soup = BeautifulSoup(resp.text, "html.parser")

    long_titles = []
    h3 = soup.find("h3", id="long-papers")
    for sib in h3.find_next_siblings():
        if sib.name == "h3":
            break
        if sib.name == "p":
            b_tag = sib.find("b")
            if b_tag:
                long_titles.append(b_tag.text.strip())

    print(f"Total Long Paper Titles Found: {len(long_titles)}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(LONG_TITLE_PATH, "w", encoding="utf-8") as f:
        json.dump(long_titles, f, ensure_ascii=False, indent=2)
    return long_titles


def parse_paper_block(p_block):
    """Parse metadata from ACL Anthology paper block"""
    title_tag = p_block.find("strong").find("a", class_="align-middle")
    href = title_tag["href"].strip("/")
    title = title_tag.text.strip()
    paper_id = href.replace("/", "").strip(".")
    source_url = f"{BASE_URL}/{paper_id}"
    pdf_url = f"{BASE_URL}/{paper_id}.pdf"

    author_tags = p_block.find_all("a", href=lambda x: x and x.startswith("/people/"))
    authors = [tag.text.strip() for tag in author_tags]

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
        "venue": "ACL 2020 Long",
        "pdf_url": pdf_url,
        "source_url": source_url,
        "final_decision": "Accept"
    }


def extract_metadata(volume_id, long_titles_set):
    """Extract paper metadata for the given volume and filter by long titles"""
    url = f"{BASE_URL}/events/acl-2020/#{volume_id.replace('.', '')}"
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")

    target_div = soup.find("div", id=volume_id)
    if not target_div:
        return []

    paper_blocks = target_div.find_all("p", class_="d-sm-flex align-items-stretch")
    metadata_list = []

    for p in tqdm(paper_blocks, desc=f"▶ {volume_id}", leave=False):
        meta = parse_paper_block(p)
        if meta["title"] in long_titles_set:
            metadata_list.append(meta)
        time.sleep(0.05)
    return metadata_list


def save_title_comparison(all_metadata, long_titles):
    """Compare found titles with official list and save results"""
    found_titles = [entry["title"] for entry in all_metadata]
    found_titles_set = set(found_titles)
    long_titles_set = set(long_titles)

    matched_titles = list(found_titles_set & long_titles_set)
    missing_titles = list(long_titles_set - found_titles_set)
    missing_titles.sort()

    # Save matched titles
    with open(MATCHED_TITLES_PATH, "w", encoding="utf-8") as f:
        json.dump(matched_titles, f, indent=2, ensure_ascii=False)
    print(f"✅ Matched {len(matched_titles)} titles saved to: {MATCHED_TITLES_PATH}")

    # Save pure missing title list
    with open(MISSING_TITLES_PATH, "w", encoding="utf-8") as f:
        json.dump(missing_titles, f, indent=2, ensure_ascii=False)
    print(f"⚠️ Missing {len(missing_titles)} titles saved to: {MISSING_TITLES_PATH}")


def main():
    long_titles = fetch_long_titles()
    if len(long_titles) != 570:
        print("⚠️ Long paper count mismatch. Please check manually.")
        return
    print("\n[OK] Long paper count matches. Proceed to metadata extraction.\n")

    url = f"{BASE_URL}/events/acl-2020/"
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")

    volumes = {}
    for div in soup.find_all("div", id=lambda x: x and x.startswith("2020")):
        vol_id = div.get("id")
        count = len(div.find_all("p", class_="d-sm-flex align-items-stretch"))
        volumes[vol_id] = count

    print("Found Volumes:")
    for idx, (vol, count) in enumerate(sorted(volumes.items()), 1):
        print(f"{idx}. {vol} ({count} papers)")

    selected_range = input("\nEnter volume index range to process (e.g., 1-3): ").strip()
    start_idx, end_idx = map(int, selected_range.split("-"))
    selected_volumes = [v for i, (v, _) in enumerate(sorted(volumes.items()), 1) if start_idx <= i <= end_idx]

    all_metadata = []
    long_titles_set = set(long_titles)

    for vol_id in selected_volumes:
        print(f"\nProcessing volume: {vol_id}")
        data = extract_metadata(vol_id, long_titles_set)
        print(f"Done: {len(data)} long papers found")
        all_metadata.extend(data)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, indent=2, ensure_ascii=False)
    print(f"\nAll long paper metadata saved to: {OUTPUT_FILE}")

    save_title_comparison(all_metadata, long_titles)


if __name__ == "__main__":
    main()
