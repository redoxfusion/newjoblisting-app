import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Launch Safari WebDriver
driver = webdriver.Safari()

# Your Flask API endpoint
API_URL = "http://127.0.0.1:5000/jobs"

def extract_jobs():
    """Scrape all job cards from the current page"""
    jobs = driver.find_elements(By.CSS_SELECTOR, "article")
    print(f"🔍 Found {len(jobs)} jobs on this page")

    for job in jobs:
        try:
            # Extract job fields
            title = job.find_element(By.CLASS_NAME, "Job_job-card__position__ic1rc").text.strip()
            company = job.find_element(By.CLASS_NAME, "Job_job-card__company__7T9qY").text.strip()

            # Combine country + location (remote/city)
            location_tags = job.find_elements(By.CLASS_NAME, "Job_job-card__location__bq7jX")
            country_tags = job.find_elements(By.CLASS_NAME, "Job_job-card__country__GRVhK")
            location = ", ".join([x.text.strip() for x in (country_tags + location_tags)])

            # Optional: posted date (not stored in DB unless you modify model)
            posting_date = job.find_element(By.CLASS_NAME, "Job_job-card__posted-on__NCZaJ").text.strip()

            # Tags / keywords
            tag_links = job.find_elements(By.CSS_SELECTOR, ".Job_job-card__tags__zfriA a")
            tags = [t.text.strip() for t in tag_links if t.text.strip()]

            # Guess job type
            if "intern" in title.lower():
                job_type = "Internship"
            elif any("part-time" in t.lower() for t in tags):
                job_type = "Part-time"
            else:
                job_type = "Full-time"

            # Prepare job payload
            payload = {
                "title": title,
                "company": company,
                "location": location,
                "job_type": job_type,
                "tags": ", ".join(tags),
            }

            # Skip duplicates (based on title + company)
            existing = requests.get(API_URL).json()
            if any(j["title"] == title and j["company"] == company for j in existing):
                print(f"⚠️ Skipping duplicate: {title} @ {company}")
                continue

            # Send to backend
            response = requests.post(API_URL, json=payload)
            print(f"✅ Posted: {title} — Status: {response.status_code}")

        except Exception as e:
            print("❌ Error scraping a job:", e)

def go_to_next_page():
    """Clicks the Next button to go to the next page"""
    try:
        next_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Next']"))
        )
        driver.execute_script("arguments[0].scrollIntoView(true);", next_button)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", next_button)
        print("➡️ Clicked 'Next' button")
        time.sleep(3)
        return True
    except Exception as e:
        print("❌ Could not go to next page:", e)
        return False

# Start scraping
print("🌐 Opening ActuaryList...")
driver.get("https://www.actuarylist.com")
WebDriverWait(driver, 10).until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "article"))
)
time.sleep(2)

# Loop through multiple pages
page = 1
max_pages = 5  # Change this to scrape more pages

while True:
    print(f"\n📄 Scraping page {page}")
    extract_jobs()
    if page >= max_pages or not go_to_next_page():
        break
    page += 1

driver.quit()
print("✅ Scraping complete.")
