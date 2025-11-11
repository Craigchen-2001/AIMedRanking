import requests
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
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

url = "https://dblp.org/db/conf/www/index.html"
resp = requests.get(url, headers=HEADERS)
soup = BeautifulSoup(resp.text, "html.parser")

www_dict = {}
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
        if link and "dblp.org/db/conf/www/www" in link["href"]:
            toc_link = link["href"]
            break
    if year and toc_link:
        www_dict[year] = {"label": label, "url": toc_link}

print("\nAvailable WWW years:\n")
for y in sorted(www_dict.keys(), reverse=True):
    print(f"{y}: {www_dict[y]['url']}")

year_range = input("\nEnter year range to analyze (e.g., 2024-2025): ").strip()
try:
    start_year, end_year = map(int, year_range.split("-"))
except:
    print("Invalid format. Please use: YYYY-YYYY")
    exit(1)

output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/WWW/metadata"
os.makedirs(output_dir, exist_ok=True)

for year in sorted(www_dict.keys()):
    if not year.isdigit():
        continue
    y = int(year)
    if y < start_year or y > end_year:
        continue

    print(f"\nAnalyzing WWW {year} ➜ {www_dict[year]['url']}")
    resp = requests.get(www_dict[year]['url'], headers=HEADERS)
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

    print(f"\nWWW {year} Analysis Result:")
    print(f"Total Papers: {sum(c for _, c in track_info)}")
    print("Tracks:")
    for idx, (name, count) in enumerate(track_info, start=1):
        print(f"  [{idx}] {name} ({count} papers)")

    selected_input = input("\nEnter track numbers to download (e.g., 1 2 5-10 20): ").strip().split()
    selected = set()

    for token in selected_input:
        if "-" in token:
            try:
                start, end = map(int, token.split("-"))
                selected.update(range(start, end + 1))
            except:
                print(f"Invalid range: {token}, skipped.")
        else:
            try:
                selected.add(int(token))
            except:
                print(f"Invalid number: {token}, skipped.")

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
                    time.sleep(2)
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
                "id": f"conf/www/{paper.get('id', 'None')}",
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

    output_path = os.path.join(output_dir, f"www_metadata_{year}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(results)} entries to {output_path}")

browser.quit()

