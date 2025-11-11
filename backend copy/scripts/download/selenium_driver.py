from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import tempfile
import psutil # type: ignore
import time
import shutil

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

def get_selenium_driver(headless=True):
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-infobars")
    options.add_argument(f"user-agent={headers['User-Agent']}")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    temp_profile = tempfile.mkdtemp(prefix="selenium-profile-")
    # options.add_argument(f"--user-data-dir={temp_profile}")
    
    driver = webdriver.Chrome(options=options)
    
    # Hide "webdriver" flag
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        """
    })

    def quit_and_cleanup():
        try:
            driver.quit()
        finally:
            import shutil
            shutil.rmtree(temp_profile, ignore_errors=True)


    driver.quit_and_cleanup = quit_and_cleanup
    
    return driver

