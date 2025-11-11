import requests
from bs4 import BeautifulSoup
import json
import os

URL = "https://2025.aclweb.org/program/main_papers/"
OUTPUT_DIR = "./data/ACL/metadata"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "acl_metadata_2025_preliminary.json")

def clean_text(text):
    return text.strip().strip('"').replace("\n", " ").strip()

def extract_all_acl_2025():
    response = requests.get(URL)
    soup = BeautifulSoup(response.text, "html.parser")
    li_tags = soup.select("section.page__content ul > li")

    print(f" Found total {len(li_tags)} papers on ACL 2025 main page.")
    input("⏸ Press [Enter] to start extraction...")

    results = []
    for i, li in enumerate(li_tags):
        title_tag = li.find("strong")
        authors_tag = li.find("em")

        title = clean_text(title_tag.text) if title_tag else "N/A"
        authors_raw = clean_text(authors_tag.text) if authors_tag else "N/A"
        authors = [a.strip() for a in authors_raw.split(",")] if authors_raw != "N/A" else ["N/A"]

        paper_id = f"acl2025_temp_{i+1:04d}"

        results.append({
            "id": paper_id,
            "title": title,
            "authors": authors,
            "abstract": "N/A",
            "keywords": "N/A",
            "institutes": "N/A",
            "venue": "ACL 2025",
            "pdf_url": "N/A",
            "source_url": URL,
            "final_decision": "Accept"
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f" Saved {len(results)} papers to: {OUTPUT_PATH}\n")

if __name__ == "__main__":
    while True:
        extract_all_acl_2025()
        again = input(" Do you want to re-run extraction? (y/N): ").lower()
        if again == 'y':
            print("\n Restarting...\n")
            continue
        else:
            print(" Done.")
            break

