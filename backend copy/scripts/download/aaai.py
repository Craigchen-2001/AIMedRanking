from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from tqdm import tqdm
import json
import os
import requests
import time
from datetime import datetime
from utils.selenium_driver import get_selenium_driver as get_driver # type: ignore

def get_year_links(driver):
    base_url = "https://aaai.org/aaai-publications/aaai-conference-proceedings/#archive"
    driver.get(base_url)
    time.sleep(3)
    year_links = {}
    for a in driver.find_elements(By.CSS_SELECTOR, "a"):
        href = a.get_attribute("href")
        if href and "proceeding/aaai-" in href:
            year = href.split("-")[-1].strip("/")
            if year.isdigit() and 2020 <= int(year) <= datetime.now().year:
                year_links[year] = href
    return year_links

def process_year(driver, year, link):
    print(f"\nProcessing year {year}")
    driver.get(link)
    time.sleep(2)
    volume_links = []
    try:
        if year in ["2023", "2024", "2025"]:
            container = driver.find_element(By.CSS_SELECTOR, "div.archive-description")
            volume_links = [a.get_attribute("href") for a in container.find_elements(By.TAG_NAME, "a")]
        else:
            ul = driver.find_element(By.CSS_SELECTOR, "main#genesis-content ul")
            volume_links = [a.get_attribute("href") for a in ul.find_elements(By.TAG_NAME, "a")]
    except Exception as e:
        print(f"Error getting volumes for {year}: {e}")
    return volume_links

def get_paper_links_from_volume(driver, vol_url):
    paper_links = []
    try:
        driver.get(vol_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul.cmp_article_list.articles > li"))
        )
        soup = BeautifulSoup(driver.page_source, "html.parser")
        lis = soup.select("ul.cmp_article_list.articles > li")
        for li in lis:
            a = li.select_one("h3.title a")
            if a and a.get("href"):
                paper_links.append(a["href"])
    except Exception as e:
        print(f"Failed to extract paper links from volume {vol_url}: {e}")
    return paper_links

def get_paper_links_from_volume_old_structure(driver, vol_url):
    paper_links = []
    try:
        driver.get(vol_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.track-wrap"))
        )
        tracks = driver.find_elements(By.CSS_SELECTOR, "div.track-wrap")
        print(f"Found {len(tracks)} track sections")

        for track in tracks:
            lis = track.find_elements(By.CSS_SELECTOR, "li.paper-wrap")
            for li in lis:
                try:
                    a = li.find_element(By.TAG_NAME, "a")
                    href = a.get_attribute("href")
                    if href and href.startswith("https://aaai.org/papers/"):
                        paper_links.append(href)
                except Exception as e:
                    print("Failed to extract paper <a>: ", e)
                    continue
    except Exception as e:
        print(f"Failed to parse old-style volume {vol_url}: {e}")
    return paper_links

def scrape_aaai():
    driver = get_driver()
    year_links = get_year_links(driver)
    print("Found conference years:", list(year_links.keys()))

    all_volume_links = {}

    for year, link in tqdm(year_links.items(), desc="Processing years"):
        volume_links = process_year(driver, year, link)
        year_data = []
        for vol in tqdm(volume_links, desc=f"Year {year} volumes", leave=False):
            if "ojs.aaai.org" in vol:
                paper_links = get_paper_links_from_volume(driver, vol)
            else:
                paper_links = get_paper_links_from_volume_old_structure(driver, vol)

            year_data.append({
                "volume_url": vol,
                "paper_links": paper_links
            })
        all_volume_links[year] = year_data

        os.makedirs("data/aaai/aaai_links_data", exist_ok=True)
        with open(f"data/aaai/aaai_links_data/aaai_{year}_volume_links.json", "w") as f:
            json.dump(year_data, f, indent=2)

    # driver.quit()
    driver.quit_and_cleanup()

def extract_metadata():
    json_dir = "data/aaai/aaai_links_data"
    years = [f.split("_")[1] for f in os.listdir(json_dir) if f.endswith("_volume_links.json")]
    print("Found saved paper link data for years:", years)

    for year in tqdm(years, desc="Processing metadata"):
        with open(f"{json_dir}/aaai_{year}_volume_links.json", "r") as f:
            volume_data = json.load(f)

        if int(year) >= 2023:
            extract_metadata_new(year, volume_data)
        else:
            extract_metadata_old(year, volume_data)

def extract_metadata_new(year, volume_data):
    driver = get_driver(headless=True)
    metadata_list = []

    for volume in tqdm(volume_data, desc=f"Extracting metadata for {year}"):
        for paper_url in volume["paper_links"]:
            metadata = {
                "id": paper_url.split("/")[-1],
                "title": "N/A",
                "authors": [],
                "abstract": "N/A",
                "keywords": "N/A",
                "affiliations": [],
                "venue": f"AAAI_{year}",
                "pdf_url": "N/A",
                "doi": "N/A",
                "final_decision": "Accepted"
            }
            try:
                driver.get(paper_url)
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "page_title")))
                metadata["title"] = driver.find_element(By.CLASS_NAME, "page_title").text.strip()

                try:
                    section = driver.find_element(By.CSS_SELECTOR, "section.item.abstract")
                    metadata["abstract"] = section.text.replace("Abstract", "").strip()
                except:
                    pass
                try:
                    metadata["keywords"] = driver.find_element(By.CSS_SELECTOR, "section.item.keywords span.value").text.strip()
                except:
                    pass
                try:
                    metadata["doi"] = driver.find_element(By.CSS_SELECTOR, "section.item.doi span.value a").get_attribute("href")
                except:
                    pass
                try:
                    metadata["pdf_url"] = driver.find_element(By.CSS_SELECTOR, "a.obj_galley_link.pdf").get_attribute("href")
                except:
                    pass

                authors_data = driver.find_elements(By.CSS_SELECTOR, "ul.authors > li")
                for li in authors_data:
                    name = li.find_element(By.CLASS_NAME, "name").text.strip() if li.find_elements(By.CLASS_NAME, "name") else "N/A"
                    affiliation = li.find_element(By.CLASS_NAME, "affiliation").text.strip() if li.find_elements(By.CLASS_NAME, "affiliation") else "N/A"
                    metadata["authors"].append(name)
                    metadata["affiliations"].append(affiliation)
            except Exception as e:
                print(f"Failed to extract metadata from {paper_url}: {e}")

            metadata_list.append(metadata)

    os.makedirs("data/aaai/aaai_metadata", exist_ok=True)
    with open(f"data/aaai/aaai_metadata/aaai_metadata_{year}.json", "w") as f:
        json.dump(metadata_list, f, indent=2)
    # driver.quit()
    driver.quit_and_cleanup()

def extract_metadata_old(year, volume_data):
    driver = get_driver(headless=True)
    metadata_list = []

    for volume in tqdm(volume_data, desc=f"Extracting metadata for {year}"):
        for paper_url in volume["paper_links"]:
            metadata = {
                "id": paper_url.split("/")[-1],
                "title": "N/A",
                "authors": [],
                "abstract": "N/A",
                "keywords": "N/A",
                "affiliations": [],
                "venue": f"AAAI_{year}",
                "pdf_url": "N/A",
                "doi": "N/A",
                "final_decision": "Accepted"
            }
            try:
                driver.get(paper_url)
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "entry-title")))
                metadata["title"] = driver.find_element(By.CLASS_NAME, "entry-title").text.strip()

                try:
                    abstract = driver.find_element(By.XPATH, "//h4[contains(text(),'Abstract:')]/following-sibling::div[@class='attribute-output']/p").text.strip()
                    metadata["abstract"] = abstract
                except:
                    pass
                try:
                    doi = driver.find_element(By.XPATH, "//h4[contains(text(),'DOI:')]/following-sibling::div[@class='attribute-output']/p").text.strip()
                    metadata["doi"] = doi
                except:
                    pass
                try:
                    metadata["pdf_url"] = driver.find_element(By.CSS_SELECTOR, "div.pdf-button a").get_attribute("href")
                except:
                    pass

                authors_section = driver.find_elements(By.CSS_SELECTOR, "div.author-output p")
                for i in range(0, len(authors_section), 2):
                    metadata["authors"].append(authors_section[i].text.strip())
                    if i + 1 < len(authors_section):
                        metadata["affiliations"].append(authors_section[i + 1].text.strip())
            except Exception as e:
                print(f"Failed to extract metadata from {paper_url}: {e}")

            metadata_list.append(metadata)

    os.makedirs("data/aaai/aaai_metadata", exist_ok=True)
    with open(f"data/aaai/aaai_metadata/aaai_metadata_{year}.json", "w") as f:
        json.dump(metadata_list, f, indent=2)
    # driver.quit()
    driver.quit_and_cleanup()

if __name__ == "__main__":
    scrape_aaai()
    extract_metadata()
