import json
import time
import re
from datetime import datetime
from tqdm import tqdm
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from utils.selenium_driver import get_selenium_driver


def save_json(data, output_path):
    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved data to {output_path}")

def load_json(input_path):
    if not os.path.exists(input_path):
        print(f"File {input_path} does not exist.")
        return None
    with open(input_path, "r") as f:
        data = json.load(f)
    return data

def get_ijcai_proceedings_from_main_page(url: str, start_year: int = 2020, end_year: int = datetime.now().year):
    driver = get_selenium_driver(headless=True)
    proceedings_by_year = {}

    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.field-items"))
        )

        proceedings_list = driver.find_elements(By.CSS_SELECTOR, "div.field-items a")
        
        for link in tqdm(proceedings_list, desc="Processing Proceedings Links"):
            href = link.get_attribute("href")
            if href:
                # Match exactly 4 digits after "/proceedings/"
                match = re.search(r'/proceedings/(\d{4})/?$', href)
                if match:
                    year = int(match.group(1))
                    if start_year <= year <= end_year:
                        proceedings_by_year[year] = href

    except (TimeoutException, WebDriverException) as e:
        print(f"Error while fetching proceedings: {e}")
    finally:
        driver.quit()

    # Save the proceedings data to a JSON file
    output_path = "data/ijcai/ijcai_proceedings.json"
    save_json(proceedings_by_year, output_path) 

    return proceedings_by_year

def extract_paper_links_from_proceedings(proceedings_by_year):
    paper_links_by_year = {}
    driver = get_selenium_driver(headless=True)

    try:
        for year, url in tqdm(proceedings_by_year.items(), desc=f"Fetching links ..."):
            print(f"\nExtracting paper links for {year}: {url}")
            links = []

            try:
                driver.get(url)
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.proceedings"))
                )

                papers = driver.find_elements(By.CSS_SELECTOR, "div.proceedings div.paper_wrapper")

                for paper in papers:
                    try:
                        # Find all <a> tags inside the details section
                        detail_links = paper.find_elements(By.CSS_SELECTOR, "div.details a")
                        for a in detail_links:
                            href = a.get_attribute("href")
                            if href and ".pdf" not in href:  # This is the "Details" page link
                                links.append(href)
                    except Exception as e:
                        print(f"Error getting paper detail link: {e}")
                        continue

                paper_links_by_year[year] = links

            except TimeoutException:
                print(f"Timeout loading proceedings for year {year}")
                paper_links_by_year[year] = []

            time.sleep(1)  # be polite

    finally:
        driver.quit()

    # Save the paper links data to a JSON file
    output_path = "data/ijcai/ijcai_paper_links.json"
    save_json(paper_links_by_year, output_path)

    return paper_links_by_year

def extract_metadata_from_paper_links(link, year):
    driver = get_selenium_driver(headless=True)
    paper_metadata ={
        "id": link.split("proceedings/")[-1],
        "title": "N/A",
        "authors": [],
        "affiliations": [],
        "abstract": "N/A",
        "keywords": [],
        "venue": f"IJCAI_{year}",
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
            title_element = driver.find_element(By.CSS_SELECTOR, "div.row h1")
            paper_metadata["title"] = title_element.text.strip()
        except:
            pass
 
        # Extract authors
        try:
            paper_metadata["authors"] = [
                a.strip() for a in driver.find_element(By.CSS_SELECTOR, "div.row h2").text.strip().split(",")
            ]
        except:
            pass

        # Extract abstract
        try:
            paper_metadata["abstract"] = driver.find_element(By.CSS_SELECTOR, "div.col-md-12").text.strip()
        except:
            pass

        # Extract keywords
        try:
            keywords_element = driver.find_elements(By.CSS_SELECTOR, "div.keywords div.topic")
            paper_metadata["keywords"] = [keyword.text.strip() for keyword in keywords_element]
        except:
            pass

        # Extract PDF URL
        try:
            pdf_link_element = driver.find_element(By.CSS_SELECTOR, "div.btn-container a")
            pdf_link = pdf_link_element.get_attribute("href")
            if pdf_link and ".pdf" in pdf_link:
                paper_metadata["pdf_url"] = pdf_link
        except:
            pass

        # Extract DOI if available
        try:
            doi_link_element = driver.find_element(By.CSS_SELECTOR, "a.doi")
            if doi_link_element:
                paper_metadata["doi"] = doi_link_element.get_attribute("href")
        except:
            pass


    except Exception as e:
        print(f"Error extracting metadata from {link}: {e}")
    finally:
        driver.quit()   
  
    return paper_metadata

def extract_metadata(paper_links_by_year):
    metadata_by_year = {}

    for year, links in paper_links_by_year.items():
        print(f"\nExtracting metadata for {year} with {len(links)} links...")
        year_metadata = []
        for link in tqdm(links, desc=f"Processing {year} papers"):
            try:    
                metadata = extract_metadata_from_paper_links(link, year)
                year_metadata.append(metadata)
            except Exception as e:
                print(f"Error extracting metadata for {link}: {e}")
                continue
        print(f"Extracted metadata for {len(year_metadata)} papers in {year}")
    
        # Save metadata for the year
        save_json(year_metadata, output_path=f"data/ijcai/ijcai_metadata/ijcai_metadata_{year}.json")
        metadata_by_year[year] = year_metadata
        
    return metadata_by_year


if __name__ == "__main__":
    base_url = "https://www.ijcai.org/all_proceedings"
    # proceedings_by_year = get_ijcai_proceedings_from_main_page(url=base_url)

    # paper_links_by_year = extract_paper_links_from_proceedings(proceedings_by_year)

    # print("Proceedings and paper links extraction completed.")

    paper_links_by_year = load_json("data/ijcai/ijcai_paper_links.json")

    metadata_by_year = extract_metadata(paper_links_by_year)
