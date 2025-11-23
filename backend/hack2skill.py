import json
import os
import re
import time
import dateparser # New library to fix dates
from datetime import datetime
from bs4 import BeautifulSoup
from supabase import create_client, Client # New library for DB
from dotenv import load_dotenv

# --- SELENIUM IMPORTS ---
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
# 🚨 REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
load_dotenv()
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

TARGET_URL = "https://hack2skill.com/"
SLIDER_TRACK_SELECTOR = ".slick-track"

# Initialize DB Connection
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 1. PARSER & UPLOAD LOGIC
# ==========================================

def parse_and_upload(scraped_data: list):
    """
    Parses raw data and uploads directly to Supabase.
    It now SKIPS all hackathons that have their registration closed.
    """
    # ... (Regex and count setup remain the same) ...
    regex = re.compile(
        r"^(.+?)\s+FREE\s+\|\s+(VIRTUAL|HYBRID|IN_PERSON)\s+Registration\s+Ends\s+on\s+(\w{3}\s+\w{3}\s+\d{2}\s+\d{4})(?:\s+Registration\s+closed|\s+Register\s+Now)?$",
        re.IGNORECASE | re.MULTILINE
    )
    
    count = 0

    for event in scraped_data:
        if 'raw_text_snippet' not in event: 
            continue

        snippet = event['raw_text_snippet'].strip()
        match = regex.search(snippet)
        
        if match:
            name = match.group(1).strip()
            mode = match.group(2).strip()
            raw_date = match.group(3).strip()
            
            # This logic correctly determines if registration is closed
            is_closed = 'registration closed' in snippet.lower() 

            # The CORE UPDATE: Skip closed events to prevent unnecessary updates/inserts
            if is_closed:
                # print(f"⏩ Skipped closed event: {name}")
                continue # <-- This is the key change!

            # The dateparser call
            dt = dateparser.parse(raw_date, settings={'PREFER_DATES_FROM': 'future'}) 
            formatted_date = dt.strftime('%Y-%m-%d') if dt else None
            
            if not formatted_date:
                 print(f"⚠️ Date Parsing STILL Failed for: '{raw_date}' in event: {name}")

            # Prepare the object for Supabase
            db_row = {
                "title": name,
                "mode": mode.title(),
                "reg_end_date": formatted_date,
                "is_closed": is_closed, 
                "link": event.get('link'),
                "image_url": event.get('image'),
                "source": "Hack2Skill"
            }

            try:
                # Upsert: If the link exists, update it. If not, insert it.
                # If an event closes *after* it's in the DB, it will eventually stop
                # being scraped by the slider and will be automatically skipped here.
                data = supabase.table("hackathons").upsert(db_row, on_conflict="link").execute()
                # print(f"✅ Saved/Updated OPEN event: {name}")
                count += 1
            except Exception as e:
                print(f"❌ Database Error: {e}")
        else:
            print(f"⚠️ Failed to parse snippet: '{snippet[:75]}...'")
            
    print(f"\n🎉 Process finished. {count} open hackathons were saved/updated.")




# ==========================================
# 2. SELENIUM SETUP
# ==========================================
def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--log-level=3")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

def get_raw_slides(driver):
    print(f"🕷️  Fetching {TARGET_URL}...")
    try:
        driver.get(TARGET_URL)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, SLIDER_TRACK_SELECTOR))
        )
        tracks = driver.find_elements(By.CSS_SELECTOR, SLIDER_TRACK_SELECTOR)
        
        html_snippets = []
        for track in tracks:
            if track.size['height'] > 0:
                html_snippets.append(track.get_attribute('innerHTML'))
        return html_snippets
    except Exception as e:
        print(f"❌ Error fetching page: {e}")
        return []

# ==========================================
# 3. EXTRACT RAW HTML
# ==========================================
def extract_raw_data(html_snippets):
    raw_data_list = []
    seen_urls = set()

    for html in html_snippets:
        soup = BeautifulSoup(html, 'html.parser')
        slides = soup.find_all("div", class_="slick-slide")

        for slide in slides:
            if "slick-cloned" in slide.get("class", []): continue

            link_tag = slide.find("a")
            if not link_tag or not link_tag.get("href"): continue
            
            href = link_tag.get("href")
            full_url = href if href.startswith("http") else f"https://hack2skill.com{href}"
            
            if full_url in seen_urls: continue
            seen_urls.add(full_url)

            img_tag = slide.find("img")
            img_src = img_tag.get("src") if img_tag else None
            raw_text = slide.get_text(separator=" ", strip=True)

            raw_data_list.append({
                "raw_text_snippet": raw_text,
                "link": full_url,
                "image": img_src
            })
            
    return raw_data_list

# ==========================================
# 4. MAIN EXECUTION
# ==========================================
def main():
    driver = setup_driver()
    try:
        html_data = get_raw_slides(driver)
        if html_data:
            raw_list = extract_raw_data(html_data)
            parse_and_upload(raw_list) # This calls the new DB function
        else:
            print("⚠️ No data found.")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
