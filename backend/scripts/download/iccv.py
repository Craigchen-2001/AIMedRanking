import json
import time
from datetime import datetime
from tqdm import tqdm
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.selenium_driver import get_selenium_driver # type: ignore

def save_json(data, output_path):
    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved data to {output_path}")

def load_json(input_path):
    if not os.path.exists(input_path):
        print(f"File {input_path} does not exist.")
        return None
    with open(input_path, "r") as f:
        data = json.load(f)
    return data


def get_iccv_main_conf_links(url, start_year=2020, end_year=datetime.now().year):
    driver = get_selenium_driver()
    driver.get(url)

    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div#content")))

    dd_elements = driver.find_elements(By.CSS_SELECTOR, "div#content dd")

    main_conf_links ={}

    for year in tqdm(range(end_year, start_year - 1, -2), desc="Processing ICCV Main Conference Links"):
        try: 
            for dd in dd_elements:
                if f"ICCV {year}" in dd.text:
                    href =  dd.find_element(By.TAG_NAME, "a").get_attribute("href")
                    main_conf_links[year] = href
                    break
        except (TimeoutException, WebDriverException) as e:
            print(f"\nError processing year {year}: {e}")
    
    driver.quit()

    output_path = "data/iccv/iccv_main_conf_links.json"
    save_json(main_conf_links, output_path)

    return main_conf_links

def get_iccv_proceedings_links(main_conference):

    driver = get_selenium_driver()
    wait = WebDriverWait(driver, 10)

    proceedings_links ={}
    
    for year, main_conf_links in tqdm(main_conference.items(), desc="Processing ICCV Proceedings Links"):
        try:
            driver.get(main_conf_links)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div#content")))
            dd_elements = driver.find_elements(By.CSS_SELECTOR, "div#content dd a")
            for dd in dd_elements:
                if f"All Papers" in dd.text:
                    href = dd.get_attribute("href")
                    proceedings_links[year] = href
        except (TimeoutException, WebDriverException) as e:
            print(f"\nError accessing main conference link for year {year}: {e}")   

    driver.quit()

    output_path = "data/iccv/iccv_proceedings_links.json"
    save_json(proceedings_links, output_path)

    return proceedings_links

def get_iccv_paper_links(proceedings):
    driver = get_selenium_driver()
    wait = WebDriverWait(driver, 10)

    paper_links = {}

    for year, proceedings_link in tqdm(proceedings.items(), desc="Processing ICCV Paper Links", leave=False):
        try:
            driver.get(proceedings_link)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div#content")))
            paper_elements = driver.find_elements(By.CSS_SELECTOR, "div#content dt.ptitle")

            year_links = []
            for paper in tqdm(paper_elements, desc=f"Processing Papers for ICCV {year}", leave=False):
                try:
                    href = paper.find_element(By.TAG_NAME, "a").get_attribute("href")
                    year_links.append(href)
                except:
                    pass
            paper_links[year]=year_links
            print(f"\nCollected {len(year_links)} paper links from {year}")

        except (TimeoutException, WebDriverException) as e:
            print(f"\nError accessing proceedings link for year {year}: {e}")

        

    driver.quit()

    output_path = "data/iccv/iccv_paper_links.json"
    save_json(paper_links, output_path)

    return paper_links

def extract_metadata_from_paper_links(link, year):
    driver =  get_selenium_driver()

    paper_metadata ={
        "id": link.split("/")[-1].removesuffix(".html"),
        "title": "N/A",
        "authors": [],
        "affiliations": [],
        "abstract": "N/A",
        "keywords": "N/A",
        "venue": f"ICCV_{year}",
        "pdf_url": "N/A",
        "doi": "N/A",
        "final_decision": "Accepted"        
    }

    try:
        driver.get(link)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div#content"))
        )

        # Extract title
        try:
            title_element = driver.find_element(By.CSS_SELECTOR, "div#papertitle")
            paper_metadata["title"] = title_element.text.strip()
        except:
            pass    

        # Extract authors
        try:
            authors_text = driver.find_element(By.CSS_SELECTOR, "div#authors i").text
            authors = [a.strip() for a in authors_text.strip().strip('"').split(",")]
            paper_metadata["authors"] = authors
        except:
            pass

        # Extract abstract
        try:
            abstract_element = driver.find_element(By.CSS_SELECTOR, "div#abstract")
            paper_metadata["abstract"] = abstract_element.text.strip()
        except:
            pass

        # Extract pdf URL + DOI
        try:
            links = driver.find_elements(By.CSS_SELECTOR, "dd a")
            for link in links:
                text = link.text.strip()
                href = link.get_attribute("href")
                if text == "pdf":
                    paper_metadata["pdf_url"] = href
                elif text == "arXiv":
                    paper_metadata["doi"] = href
        except:
            pass 

    except (TimeoutException, WebDriverException) as e:
        print(f"Error accessing {link}: {e}")
    finally:
        driver.quit()   

    return paper_metadata



def extract_metadata(paper_links_by_year, max_workers=4):
    metadata_by_year = {}

    for year, links in tqdm(paper_links_by_year.items(), desc="Years", position=0):
        year_metadata = []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_link = {executor.submit(extract_metadata_from_paper_links, link, year): link for link in links}

            for future in tqdm(as_completed(future_to_link), total=len(links), desc=f"{year} papers", position=1, leave=False):
                try:
                    metadata = future.result()
                    year_metadata.append(metadata)
                except Exception as e:
                    print(f"Error extracting metadata: {e}")
        
        save_json(year_metadata, output_path=f"data/iccv/iccv_metadata/iccv_metadata_{year}.json")
        metadata_by_year[year] = year_metadata

    return metadata_by_year





if __name__ == "__main__":
    base_url = "https://openaccess.thecvf.com/"
    # main_confernce = get_iccv_main_conf_links(url = base_url)

    # proceedings = get_iccv_proceedings_links(main_confernce)


    # paper_links = get_iccv_paper_links(proceedings)
    paper_links_by_year = load_json("data/iccv/iccv_paper_links.json")

    metadata_by_year = extract_metadata(paper_links_by_year)


