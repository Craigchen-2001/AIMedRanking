import os
import re
import json
import time
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

BASE_URL = "https://openaccess.thecvf.com"
YEARS = list(range(2021, 2025))  # 2020~2024
OUTPUT_DIR = "./data/CVPR/metadata"
os.makedirs(OUTPUT_DIR, exist_ok=True)

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

def get_paper_links(year):
    url = f"{BASE_URL}/CVPR{year}?day=all"
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    all_links = soup.find_all("a", href=True)
    paper_links = [f"{BASE_URL}{a['href']}" for a in all_links if a['href'].endswith("_paper.html")]
    return paper_links

def process_year(year, paper_links):
    print(f" Starting download for CVPR {year}...")
    output_path = os.path.join(OUTPUT_DIR, f"cvpr_metadata_{year}.json")
    results = []

    for link in tqdm(paper_links):
        try:
            html_resp = requests.get(link)
            if html_resp.status_code != 200:
                print(f"⚠️ Failed to fetch {link}")
                continue

            title, authors, abstract, pdf_url = extract_info_from_html(html_resp.text)
            paper_id = f"cvpr{year}_" + os.path.basename(link).replace(".html", "").lower()

            results.append({
                "id": paper_id,
                "title": title,
                "abstract": abstract,
                "authors": authors,
                "keywords": "N/A",
                "institutes": "N/A",
                "venue": f"CVPR {year}",
                "pdf_url": pdf_url,
                "source_url": link,
                "final_decision": "Accept"
            })
            time.sleep(0.2)
        except Exception as e:
            print(f" Error parsing {link}: {e}")

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f" Saved {len(results)} papers to {output_path}\n")

def main():
    year_links = {}

    print(" Pre-check: counting paper links for each CVPR year (2020–2024)...\n")
    for year in YEARS:
        try:
            links = get_paper_links(year)
            year_links[year] = links
            print(f" CVPR {year}: {len(links)} papers")
        except Exception as e:
            print(f" CVPR {year} error: {e}")
            year_links[year] = []

    proceed = input("\n Press Enter to start crawling papers, or Ctrl+C to cancel...\n")

    for year in YEARS:
        if year_links[year]:
            process_year(year, year_links[year])

if __name__ == "__main__":
    main()
