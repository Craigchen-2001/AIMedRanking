import os
import re
import json
import time
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# === Configuration ===
BASE_URL = "https://openaccess.thecvf.com"
CVPR_2025_LISTING = f"{BASE_URL}/CVPR2025?day=all"
OUTPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/CVPR/metadata"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "cvpr_metadata_2025.json")

# === Helper Functions ===
def clean_text(text):
    return re.sub(r"[\u2010-\u2015\u2212\u00ad]+", "-", text).replace("\xa0", " ").strip()

def extract_info_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("div", id="papertitle")
    authors_tag = soup.find("div", id="authors")
    abstract_tag = soup.find("div", id="abstract")
    pdf_link_tag = soup.find("a", href=re.compile(r".*_paper.pdf"))

    title = clean_text(title_tag.text if title_tag else "N/A")
    authors = [a.strip() for a in re.sub(r'<.*?>', '', authors_tag.text).split(',')] if authors_tag else ["N/A"]
    abstract = clean_text(abstract_tag.text if abstract_tag else "N/A")
    pdf_url = f"{BASE_URL}{pdf_link_tag['href']}" if pdf_link_tag else "N/A"

    return title, authors, abstract, pdf_url

def get_all_html_links():
    print(" Fetching all paper links from CVPR 2025...")
    resp = requests.get(CVPR_2025_LISTING)
    soup = BeautifulSoup(resp.text, "html.parser")
    all_links = soup.find_all("a", href=True)
    paper_links = [f"{BASE_URL}{a['href']}" for a in all_links if a['href'].endswith("_paper.html")]
    return paper_links

# === Main Script ===
def main():
    paper_links = get_all_html_links()
    print(f" Found {len(paper_links)} paper links. Starting download...")
    results = []

    for link in tqdm(paper_links):
        try:
            html_resp = requests.get(link)
            if html_resp.status_code != 200:
                print(f" Failed to fetch {link}")
                continue

            title, authors, abstract, pdf_url = extract_info_from_html(html_resp.text)
            paper_id = "cvpr2025_" + os.path.basename(link).replace(".html", "").lower()

            results.append({
                "id": paper_id,
                "title": title,
                "abstract": abstract,
                "authors": authors,
                "keywords": "N/A",
                "institutes": "N/A",
                "venue": "CVPR 2025",
                "pdf_url": pdf_url,
                "source_url": link,
                "final_decision": "Accept"
            })
            time.sleep(0.2)  # Avoid hammering the server
        except Exception as e:
            print(f" Error parsing {link}: {e}")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f" Metadata for {len(results)} papers saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
