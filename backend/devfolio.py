import os
import time
import re
from datetime import datetime, timedelta
from supabase import create_client, Client
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
load_dotenv()
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

TARGET_URL = "https://devfolio.co/hackathons/open"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 1. SETUP
# ==========================================
def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    chrome_options.add_argument("--log-level=3")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

# ==========================================
# 2. DATE PARSER (Countdown Logic)
# ==========================================
def calculate_date_from_countdown(countdown_text):
    """
    Parses text like "0d:9h:56m" or "2d : 10h : 30m"
    Adds it to current time to get the exact End Date.
    """
    try:
        # Regex to capture digits before d, h, m (allowing for spaces)
        match = re.search(r'(\d+)\s*d\s*:\s*(\d+)\s*h\s*:\s*(\d+)\s*m', countdown_text)
        
        if match:
            days = int(match.group(1))
            hours = int(match.group(2))
            minutes = int(match.group(3))
            
            # Add time to now
            future_date = datetime.now() + timedelta(days=days, hours=hours, minutes=minutes)
            return future_date.strftime('%Y-%m-%d')
            
    except Exception:
        return None
    return None

# ==========================================
# 3. SCROLLING
# ==========================================
def scroll_to_bottom(driver):
    print("🔄 Scrolling list to load all cards...")
    last_height = driver.execute_script("return document.body.scrollHeight")
    
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2.5)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height
        print("   ...loaded more content")

# ==========================================
# 4. MAIN SCRAPER
# ==========================================
def scrape_devfolio(driver):
    # --- PHASE 1: GET LINKS ---
    print(f"🕷️  Fetching List from {TARGET_URL}...")
    driver.get(TARGET_URL)
    
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div[class*='CompactHackathonCard']"))
    )
    
    scroll_to_bottom(driver)

    card_elements = driver.find_elements(By.CSS_SELECTOR, "div[class*='CompactHackathonCard']")
    print(f"🔍 Found {len(card_elements)} hackathons. Collecting links...")

    hackathon_links = []
    
    # Extract basic info (Title + Link) first to minimize stale element errors
    for card in card_elements:
        try:
            link_elem = card.find_element(By.TAG_NAME, "a")
            href = link_elem.get_attribute("href")
            
            # Try getting title from H2 or H3
            try:
                title = card.find_element(By.TAG_NAME, "h3").text.strip()
            except:
                try:
                    title = card.find_element(By.TAG_NAME, "h2").text.strip()
                except:
                    title = "Unknown Devfolio Hackathon"

            hackathon_links.append({"title": title, "link": href})
        except:
            continue

    # --- PHASE 2: VISIT EACH PAGE ---
    print(f"🚀 Visiting {len(hackathon_links)} pages to extract Date & Image...")
    final_data = []

    for i, item in enumerate(hackathon_links):
        try:
            driver.get(item['link'])
            time.sleep(2) # Wait for page load
            
            # --- A. IMAGE EXTRACTION ---
            # Use Open Graph meta tag (Most reliable for Devfolio)
            image_url = None
            try:
                img_meta = driver.find_element(By.XPATH, '//meta[@property="og:image"]')
                image_url = img_meta.get_attribute("content")
            except:
                # Fallback: Try finding the banner image manually
                try:
                    # Look for the largest image in the header/main section
                    img_elem = driver.find_element(By.CSS_SELECTOR, "main img")
                    image_url = img_elem.get_attribute("src")
                except:
                    pass

            # --- B. DATE EXTRACTION (From "Closes in") ---
            formatted_date = None
            try:
                # STRATEGY: Find element containing "Closes in", then get the NEXT sibling element
                # XPath: //*[contains(text(), "Closes in")]/following-sibling::*[1]
                
                countdown_val_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Closes in')]/following-sibling::*[1]")
                raw_countdown = countdown_val_elem.text # e.g., "0d:9h:53m"
                
                formatted_date = calculate_date_from_countdown(raw_countdown)
            except:
                # If "Closes in" not found, it might be "Starts in" or "Ended"
                pass

            # --- BUILD ROW ---
            db_row = {
                "title": item['title'],
                "mode": "Online", # Default
                "reg_end_date": formatted_date,
                "is_closed": False,
                "link": item['link'],
                "image_url": image_url,
                "source": "Devfolio"
            }
            
            final_data.append(db_row)
            # print(f"   ✅ Scraped: {item['title']}")

        except Exception as e:
            # print(f"   ❌ Error visiting {item['link']}: {e}")
            continue

    return final_data

# ==========================================
# 5. UPLOAD
# ==========================================
def upload_to_supabase(data):
    if not data:
        print("⚠️ No data to upload.")
        return

    print(f"💾 Uploading {len(data)} events...")
    count = 0
    for row in data:
        try:
            supabase.table("hackathons").upsert(row, on_conflict="link").execute()
            count += 1
        except Exception as e:
            print(f"❌ DB Error: {e}")
    
    print(f"🎉 Finished! {count} events synced.")

# ==========================================
# 6. RUNNER
# ==========================================
if __name__ == "__main__":
    driver = setup_driver()
    try:
        data = scrape_devfolio(driver)
        
        if data:
            print("\n--- DEBUG CHECK (First Item) ---")
            print(f"Title: {data[0]['title']}")
            print(f"Date:  {data[0]['reg_end_date']}")
            print(f"Img:   {data[0]['image_url']}")
            print("--------------------------------")

        upload_to_supabase(data)
    finally:
        driver.quit()