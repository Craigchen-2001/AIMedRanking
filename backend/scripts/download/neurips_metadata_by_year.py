import requests
from bs4 import BeautifulSoup
import json
import time
import os
from tqdm import tqdm

OUTPUT_BASE_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/data/NeurIPS/metadata"

def get_paper_links(year: int):
    base_url = f"https://proceedings.neurips.cc/paper_files/paper/{year}"
    res = requests.get(base_url)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    paper_links = [
        "https://proceedings.neurips.cc" + li.get("href")
        for li in soup.select("ul.paper-list li a")
        if li.get("href") and li.get("href").startswith(f"/paper_files/paper/{year}/hash")
    ]
    return paper_links

def scrape_paper(url: str, year: int):
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
        "year": year,
        "conference": "NeurIPS (Neural Information Processing Systems)",
        "title": title,
        "authors": authors,
        "institutes": "N/A",
        "authors/institutes": "N/A",
        "abstract": abstract,
        "keywords": "",
        "pdf_url": pdf_url,
    }

def scrape_neurips_year(year: int, links: list):
    print(f"\nScraping NeurIPS {year} ({len(links)} papers)...")

    all_data = []
    for link in tqdm(links, desc=f"Scraping {year} papers"):
        try:
            data = scrape_paper(link, year)
            all_data.append(data)
            time.sleep(0.5)
        except Exception as e:
            print(f"    Failed to process {link}: {e}")

    os.makedirs(OUTPUT_BASE_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_BASE_DIR, f"neurips_metadata_{year}.json")
    with open(output_path, "w") as f:
        json.dump(all_data, f, indent=2)

    print(f"  Completed {year}. Total: {len(all_data)} papers.")
    print(f"  Saved to: {output_path}")

def main():
    all_links = {}
    for year in range(2020, 2025):
        print(f"\nChecking NeurIPS {year}...")
        try:
            links = get_paper_links(year)
            all_links[year] = links
            print(f"  Found {len(links)} papers.")
        except Exception as e:
            print(f"  Failed to fetch links for {year}: {e}")

    confirm = input("\nProceed to scrape all listed years? (y/n): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    for year, links in all_links.items():
        scrape_neurips_year(year, links)

    print("\n All NeurIPS metadata scraping complete.")

if __name__ == "__main__":
    main()
