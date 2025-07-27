import os
import re
import json
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

BASE_URL = "https://openaccess.thecvf.com"
DAY_URLS = [
    f"{BASE_URL}/CVPR2020?day=2020-06-16",
    f"{BASE_URL}/CVPR2020?day=2020-06-17",
    f"{BASE_URL}/CVPR2020?day=2020-06-18",
]
YEAR = 2020
OUTPUT_DIR = "./data/CVPR/metadata"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, f"cvpr_metadata_{YEAR}.json")

def clean_text(text):
    return re.sub(r"[\u2010-\u2015\u2212\u00ad]+", "-", text).replace("\xa0", " ").strip()

def extract_detail_info(detail_url):
    try:
        resp = requests.get(detail_url)
        if resp.status_code != 200:
            return "N/A", [], "N/A", "N/A"
        soup = BeautifulSoup(resp.text, "html.parser")

        title = clean_text(soup.find("div", id="papertitle").text) if soup.find("div", id="papertitle") else "N/A"

        author_block = soup.find("div", id="authors")
        if author_block and author_block.find("i"):
            raw_authors = author_block.find("i").text.split(";")[0]
            authors = [a.strip() for a in re.split(r",| and ", raw_authors) if a.strip()]
        else:
            authors = []

        abstract_tag = soup.find("div", id="abstract")
        abstract = clean_text(abstract_tag.text) if abstract_tag else "N/A"

        pdf_tag = soup.find("a", href=re.compile(r"papers/.*_paper\.pdf"))
        pdf_url = f"{BASE_URL}/{pdf_tag['href'].lstrip('/')}" if pdf_tag else "N/A"

        return title, authors, abstract, pdf_url
    except Exception as e:
        print(f"Error at {detail_url}: {e}")
        return "N/A", [], "N/A", "N/A"

def collect_detail_urls():
    detail_urls = []
    for url in DAY_URLS:
        print(f"Scanning list: {url}")
        resp = requests.get(url)
        soup = BeautifulSoup(resp.text, "html.parser")
        dts = soup.find_all("dt", class_="ptitle")
        for dt in dts:
            try:
                a_tag = dt.find("a")
                href = a_tag["href"]
                if href.endswith("_paper.html"):
                    full_url = f"{BASE_URL}/{href.lstrip('/')}"
                    detail_urls.append(full_url)
            except:
                continue
    return detail_urls

def main():
    detail_urls = collect_detail_urls()
    print(f"Total papers found: {len(detail_urls)}")

    input("Press Enter to process first all papers...\n")

    results = []
    for i, url in enumerate(tqdm(detail_urls, desc="Parsing all CVPR 2020 papers")):
        title, authors, abstract, pdf_url = extract_detail_info(url)
        paper_id = f"cvpr{YEAR}_" + re.sub(r"[^a-zA-Z0-9]+", "_", title.lower()).strip("_") + "_paper"

        results.append({
            "id": paper_id,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "keywords": "N/A",
            "institutes": "N/A",
            "venue": f"CVPR {YEAR}",
            "pdf_url": pdf_url,
            "source_url": url,
            "final_decision": "Accept"
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved {len(results)} papers to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
