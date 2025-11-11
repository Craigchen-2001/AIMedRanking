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
    print(f"Saved data to {output_path}")

def load_json(input_path):
    if not os.path.exists(input_path):
        print(f"File {input_path} does not exist.")
        return None
    with open(input_path, "r") as f:
        data = json.load(f)
    return data

def get_eccv_paper_links_from_main_page(url, start_year=2020, end_year=datetime.now().year):
    """
    Fetches the DOI links of ECCV papers from the main page from 2020 till the current year.
    Args:
        url (str): The URL of the ECCV main page.
        start_year (int): The starting year for fetching papers.
        end_year (int): The ending year for fetching papers.
    Returns:
        dictionary: {year: [list of paper links]}
    """ 
    
    driver = get_selenium_driver()
    try:
        driver.get(url)
        wait = WebDriverWait(driver, 10)
        
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.py-6")))

        paper_links_by_year = {}

        if end_year % 2 != 0:
            end_year -= 1

        for year in range(end_year, start_year -1, -2):
            try:
                print(f"\nProcessing ECCV {year}...")

                button = wait.until(EC.element_to_be_clickable(
                    (By.XPATH, f"//button[contains(text(), 'ECCV {year} Papers')]")
                ))
                # button.click()
                driver.execute_script("arguments[0].click();", button)

               
                # content = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.accordion-content")))
                content_xpath = f"//button[contains(text(), 'ECCV {year} Papers')]/following-sibling::div[contains(@class, 'accordion-content')]"
                content = wait.until(EC.presence_of_element_located((By.XPATH, content_xpath)))
                time.sleep(1)  # Allow some time for the content to load

                links = content.find_elements(By.CSS_SELECTOR, "dt.ptitle a")
                paper_links = [link.get_attribute("href") for link in links if link.get_attribute("href")]

                paper_links_by_year[year] = paper_links
                print(f"Found {len(paper_links)} papers for ECCV {year}.")
            except Exception as e:
                print(f"Error processing ECCV {year}: {e}")

    except WebDriverException as e:
        print(f"Error accessing the URL {url}: {e}")
    finally:
        driver.quit()
            
    save_json(paper_links_by_year, "data/eccv/eccv_paper_links_by_year.json")
    return paper_links_by_year

def extract_affiliations(doi):
    """
    Extracts affiliations from the DOI link.
    Args:
        doi (str): The DOI of the paper.
    Returns:
        list: List of affiliations.
    """
    affiliations = []

    driver = get_selenium_driver(headless=True)
    try:
        driver.get(doi)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ol.c-article-author-affiliation__list"))
        )

        # Extract affiliations
        try:
            affiliation_list= driver.find_elements(
                By.CSS_SELECTOR, "ol.c-article-author-affiliation__list li p.c-article-author-affiliation__address"
            )
            affiliations = [aff.text.strip() for aff in affiliation_list]
        except Exception as e:
            print(f"Error extracting affiliations: {e}")

    except (TimeoutException, WebDriverException) as e:
        print(f"Error accessing DOI {doi}: {e}")
    finally:
        driver.quit()

    return affiliations 


def extract_metadata_from_paper_links(link, year):
    """
    Extracts metadata from a given paper link.
    Args:
        link (str): The URL of the paper.
        year (int): The year of the paper.
    Returns:
        dict: Metadata of the paper.
    """
    # Placeholder for actual metadata extraction logic
    # This should include fetching the page, parsing it, and extracting relevant fields
    driver = get_selenium_driver(headless=True)
    paper_metadata ={
        "id": link.split("/")[-1].removesuffix(".php"),
        "title": "N/A",
        "authors": [],
        "affiliations": [],
        "abstract": "N/A",
        "keywords": "N/A",
        "venue": f"ECCV_{year}",
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
            links = driver.find_elements(By.CSS_SELECTOR, "a")
            for link in links:
                text = link.text.strip().lower()
                href = link.get_attribute("href")
                if text == "pdf":
                    paper_metadata["pdf_url"] = href
                elif text == "doi":
                    paper_metadata["doi"] = href
        except:
            pass 

        # Extract Affiliations
        try:
            if paper_metadata["doi"] != "N/A":
                paper_metadata["affiliations"] = extract_affiliations(paper_metadata["doi"])
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
        
        save_json(year_metadata, output_path=f"data/eccv/eccv_metadata/eccv_metadata_{year}.json")
        metadata_by_year[year] = year_metadata

    return metadata_by_year




if __name__ == "__main__":
    base_url = "https://www.ecva.net/papers.php" 

    # paper_links_by_year = get_eccv_paper_links_from_main_page(base_url)

    # Load the saved paper links
    paper_links_by_year = load_json("data/eccv/eccv_paper_links_by_year.json")

    metadata_by_year = extract_metadata(paper_links_by_year)