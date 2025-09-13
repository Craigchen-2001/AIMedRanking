import requests
from bs4 import BeautifulSoup
import json
import time
import os
from tqdm import tqdm

BASE_URL = "https://proceedings.neurips.cc/paper_files/paper/2020"
OUTPUT_JSON = "../../../data/NeurIPS/metadata/neurips_metadata_2020.json"

def get_paper_links():
    res = requests.get(BASE_URL)
    soup = BeautifulSoup(res.text, "html.parser")
    paper_links = []
    for li in soup.select("ul.paper-list li a"):
        href = li.get("href")
        if href and href.startswith("/paper_files/paper/2020/hash"):
            paper_links.append("https://proceedings.neurips.cc" + href)
    return paper_links

def scrape_paper(url):
    res = requests.get(url)
    soup = BeautifulSoup(res.text, "html.parser")

    title_tag = soup.find("h4")
    title = title_tag.text.strip() if title_tag else "N/A"

    authors_tag = soup.find("h4", string="Authors")
    authors = authors_tag.find_next_sibling("p").text.strip().split(", ") if authors_tag else ["N/A"]

    abstract_tag = soup.find("h4", string="Abstract")
    abstract = abstract_tag.find_next_sibling("p").text.strip() if abstract_tag else "N/A"

    pdf_btn = soup.find("a", string="Paper")
    pdf_url = "https://proceedings.neurips.cc" + pdf_btn["href"] if pdf_btn else "N/A"

    return {
        "id": title.lower().replace(" ", "_")[:50],
        "year": 2020,
        "conference": "NeurIPS (Neural Information Processing Systems)",
        "title": title,
        "authors": authors,
        "institutes": "N/A",
        "authors/institutes": "N/A",
        "abstract": abstract,
        "keywords": "",
        "pdf_url": pdf_url,
    }

def main():
    links = get_paper_links()
    print(f"Found {len(links)} paper links on NeurIPS 2020 proceedings page.")
    confirm = input("Do you want to continue scraping metadata for these papers? (y/n): ")
    if confirm.lower() != "y":
        print("Exiting without scraping.")
        return

    all_data = []
    for link in tqdm(links, desc="Scraping papers"):
        try:
            paper_data = scrape_paper(link)
            all_data.append(paper_data)
            time.sleep(0.5)
        except Exception as e:
            print(f"Failed to process {link}: {e}")

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"Saved metadata to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
