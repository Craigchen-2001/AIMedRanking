import os
import json
import argparse
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

PMLR_VOLUMES = {
    2023: "202",
    2022: "162",
    2021: "139",
    2020: "119",
}

BASE_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project"
META_DIR = os.path.join(BASE_DIR, "data", "ICML", "metadata")
os.makedirs(META_DIR, exist_ok=True)

def fetch_icml_pmlr(year: int):
    volume = PMLR_VOLUMES.get(year)
    if not volume:
        raise ValueError(f"Unsupported year: {year}")

    url = f"https://proceedings.mlr.press/v{volume}/"
    res = requests.get(url)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    papers = soup.find_all("div", class_="paper")

    print(f"\nFetching ICML {year} from PMLR v{volume}")
    print(f"Found {len(papers)} papers")

    metadata = []

    for div in tqdm(papers, desc=f"Processing ICML {year} papers"):
        title = div.find("p", class_="title").text.strip()
        authors_raw = div.find("span", class_="authors").text.strip()
        authors = [a.strip() for a in authors_raw.split(",")]

        links = div.find("p", class_="links").find_all("a")
        abs_url = links[0]["href"]
        pdf_url = links[1]["href"]

        if not abs_url.startswith("http"):
            abs_url = f"https://proceedings.mlr.press{abs_url}"
        if not pdf_url.startswith("http"):
            pdf_url = f"https://proceedings.mlr.press{pdf_url}"

        abstract = ""
        try:
            abs_page = requests.get(abs_url)
            abs_soup = BeautifulSoup(abs_page.text, "html.parser")
            abstract_div = abs_soup.find("div", id="abstract")
            if abstract_div:
                abstract = abstract_div.text.strip()
        except:
            abstract = ""

        paper_id = abs_url.split("/")[-1].replace(".html", "")

        metadata.append({
            "id": paper_id,
            "title": title,
            "abstract": abstract,
            "keywords": [],
            "authors": authors,
            "institutes": "",
            "venue": f"ICML {year}",
            "pdf_url": pdf_url,
            "final_decision": f"ICML {year}"
        })

    output_path = os.path.join(META_DIR, f"icml_metadata_{year}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\nMetadata saved: {output_path}")
    print(f"Total entries: {len(metadata)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True, help="ICML year (2020–2023)")
    args = parser.parse_args()
    fetch_icml_pmlr(args.year)
