import requests
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tqdm import tqdm
import time
import json
import os

HEADERS = {"User-Agent": "Mozilla/5.0"}

def init_browser():
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    return uc.Chrome(options=options)

browser = init_browser()

url = "https://dblp.org/db/conf/kdd/index.html"
resp = requests.get(url, headers=HEADERS)
soup = BeautifulSoup(resp.text, "html.parser")

kdd_dict = {}
entries = soup.find_all("header", class_="h2")
for entry in entries:
    h2 = entry.find("h2")
    if not h2:
        continue
    year = h2.get("id", "").strip()
    label = h2.get_text(strip=True)

    toc_link = None
    for sib in entry.find_next_siblings():
        link = sib.find("a", href=True)
        if link and "dblp.org/db/conf/kdd/kdd" in link["href"]:
            toc_link = link["href"]
            break
    if year and toc_link:
        kdd_dict[year] = {"label": label, "url": toc_link}

print("\nAvailable KDD years:\n")
for y in sorted(kdd_dict.keys(), reverse=True):
    print(f"{y}: {kdd_dict[y]['url']}")

year_range = input("\nEnter year range to analyze (e.g., 2024-2025): ").strip()
try:
    start_year, end_year = map(int, year_range.split("-"))
except:
    print("Invalid format. Please use: YYYY-YYYY")
    exit(1)

output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/KDD/metadata"
os.makedirs(output_dir, exist_ok=True)

for year in sorted(kdd_dict.keys()):
    if not year.isdigit():
        continue
    y = int(year)
    if y < start_year or y > end_year:
        continue

    print(f"\nAnalyzing KDD {year} ➜ {kdd_dict[year]['url']}")
    resp = requests.get(kdd_dict[year]['url'], headers=HEADERS)
    soup = BeautifulSoup(resp.text, "html.parser")

    track_info = []
    headers_list = []

    for header in soup.find_all("header", class_="h2"):
        track_name = header.get_text(strip=True)
        ul = header.find_next_sibling("ul", class_="publ-list")
        if not ul:
            continue
        papers = ul.find_all("li", class_="entry")
        track_info.append((track_name, len(papers)))
        headers_list.append((track_name, header))

    print(f"\nKDD {year} Summary:")
    print(f"Total number of papers: {sum(c for _, c in track_info)}")
    print("Tracks available:")
    for idx, (name, count) in enumerate(track_info, start=1):
        print(f"  [{idx}] {name} ({count} papers)")

    selected = input("\nEnter track numbers to download (e.g., 1 2 5): ").strip().split()
    selected = set(int(i) for i in selected)

    results = []

    for idx, (track_name, header) in enumerate(headers_list, start=1):
        if idx not in selected:
            continue

        ul = header.find_next_sibling("ul", class_="publ-list")
        papers = ul.find_all("li", class_="entry")

        print(f"\nProcessing Track: {track_name}")

        for paper in tqdm(papers, desc="Papers", unit="paper"):
            title_tag = paper.find("span", class_="title")
            title = title_tag.get_text(strip=True) if title_tag else "N/A"
            author_tags = paper.find_all("span", itemprop="author")
            authors = [a.get_text(strip=True) for a in author_tags]

            doi_link = None
            for a in paper.find_all("a", href=True):
                if "doi.org" in a["href"]:
                    doi_link = a["href"]
                    break

            abstract = "N/A"
            keywords = "N/A"
            pdf_url = "N/A"
            authors_institutes = []

            if doi_link:
                doi = doi_link.split("doi.org/")[-1]
                try:
                    abs_link = f"https://dl.acm.org/doi/abs/{doi}"
                    browser.get(abs_link)
                    time.sleep(2)  # Wait for the page to render

                    try:
                        WebDriverWait(browser, 15).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "pill--open"))
                        )
                    except:
                        print(f"⚠️ Warning: {abs_link} - affiliation details may be incomplete.")

                    page_soup = BeautifulSoup(browser.page_source, "html.parser")

                    abs_div = page_soup.find("div", id="abstracts")
                    if abs_div:
                        paragraphs = abs_div.find_all("div", role="paragraph")
                        abstract = " ".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))

                    index_terms_section = page_soup.find("section", id="sec-terms")
                    if index_terms_section:
                        leaves = index_terms_section.find_all("div", attrs={"data-background": True})
                        keywords = ", ".join(leaf.get_text(strip=True) for leaf in leaves if leaf.get_text(strip=True))

                    pdf_url = f"https://dl.acm.org/doi/pdf/{doi}"

                    contributors_div = page_soup.find("div", class_="contributors")
                    if contributors_div:
                        author_spans = contributors_div.find_all("span", property="author", typeof="Person")
                        authors = []
                        for author_span in author_spans:
                            given = author_span.find("span", property="givenName")
                            family = author_span.find("span", property="familyName")
                            name = f"{given.get_text(strip=True)} {family.get_text(strip=True)}" if given and family else "N/A"
                            authors.append(name)

                            institute = "N/A"
                            hidden_div = author_span.find("div", class_="dropBlock__holder")
                            if hidden_div:
                                affil_div = hidden_div.find("div", property="affiliation")
                                if affil_div:
                                    name_span = affil_div.find("span", property="name")
                                    if name_span:
                                        institute = name_span.get_text(strip=True)

                            authors_institutes.append({"name": name, "institute": institute})

                except Exception as e:
                    print(f"Error processing {abs_link}: {e}")

            unique_institutes = list(set(aff["institute"] for aff in authors_institutes if aff["institute"] != "N/A"))
            institutes = "; ".join(unique_institutes) if unique_institutes else "N/A"

            results.append({
                "id": f"conf/kdd/{paper.get('id', 'None')}",
                "title": title,
                "authors": authors,
                "authors/institutes": authors_institutes,
                "doi": doi_link if doi_link else "N/A",
                "abstract": abstract,
                "keywords": keywords,
                "institutes": institutes,
                "venue": track_name,
                "pdf_url": pdf_url
            })

    output_path = os.path.join(output_dir, f"kdd_metadata_{year}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(results)} records to {output_path}")

browser.quit()

