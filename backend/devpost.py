import os
import time
import re
import dateparser
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

TARGET_URL = "https://devpost.com/hackathons?challenge_type[]=online&status[]=upcoming"

# Initialize DB
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
# 2. ROBUST SCROLLING (HEIGHT CHECK)
# ==========================================
def scroll_to_bottom(driver):
    """
    Scrolls until the page height stops increasing.
    This is the most reliable way to handle infinite scroll on Devpost.
    """
    print("🔄 Starting Infinite Scroll (Height Check)...")
    
    # Get initial scroll height
    last_height = driver.execute_script("return document.body.scrollHeight")
    
    while True:
        # Scroll down to bottom
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        # Wait for content to load (Devpost can be slow)
        time.sleep(3)
        
        # Calculate new scroll height
        new_height = driver.execute_script("return document.body.scrollHeight")
        
        # Compare heights
        if new_height == last_height:
            print("✅ Page height stopped increasing. Reached bottom.")
            break
            
        last_height = new_height
        print("   ...loaded more content")

# ==========================================
# 3. ADVANCED DATE PARSER
# ==========================================
def parse_devpost_date_range(date_text):
    """
    Handles complex ranges like:
    1. "Dec 01, 2025 - Jan 07, 2026" -> Returns 2026-01-07
    2. "Apr 11 - 18, 2026"           -> Returns 2026-04-18 (Infers Month from start)
    """
    if not date_text or "-" not in date_text:
        return None

    try:
        parts = date_text.split("-")
        start_part = parts[0].strip() # e.g. "Apr 11"
        end_part = parts[1].strip()   # e.g. "18, 2026"

        # Check if end_part contains letters (meaning it has a Month name)
        has_month_in_end = re.search(r'[a-zA-Z]', end_part)

        final_date_str = end_part

        # If end part is just "18, 2026" (no month), steal month from start_part
        if not has_month_in_end:
            # Extract month from start (first sequence of letters)
            month_match = re.search(r'([a-zA-Z]+)', start_part)
            if month_match:
                month = month_match.group(1)
                # Combine: "Apr" + " " + "18, 2026"
                final_date_str = f"{month} {end_part}"

        # Parse the constructed string
        dt = dateparser.parse(final_date_str)
        if dt:
            return dt.strftime('%Y-%m-%d')
        return None
    except:
        return None

# ==========================================
# 4. MAIN SCRAPER
# ==========================================
def scrape_devpost(driver):
    print(f"🕷️  Fetching {TARGET_URL}...")
    try:
        driver.get(TARGET_URL)
        
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CLASS_NAME, "hackathon-tile"))
        )
        
        # Execute the robust height-check scroll
        scroll_to_bottom(driver)

        tiles = driver.find_elements(By.CLASS_NAME, "hackathon-tile")
        print(f"🔍 Found {len(tiles)} hackathons.")
        
        scraped_data = []
        
        for tile in tiles:
            try:
                # 1. Link
                link_elem = tile.find_element(By.CSS_SELECTOR, "a.tile-anchor")
                link = link_elem.get_attribute("href")

                # 2. Title
                title_elem = tile.find_element(By.TAG_NAME, "h3")
                title = title_elem.text.strip()

                # 3. Image
                image_url = None
                try:
                    img_elem = tile.find_element(By.CLASS_NAME, "hackathon-thumbnail")
                    raw_src = img_elem.get_attribute("src")
                    if raw_src:
                        if raw_src.startswith("//"):
                            image_url = "https:" + raw_src
                        elif raw_src.startswith("http"):
                            image_url = raw_src
                except:
                    pass

                # 4. Date (Using advanced logic)
                formatted_date = None
                try:
                    date_elem = tile.find_element(By.CLASS_NAME, "submission-period")
                    raw_date = date_elem.text.strip()
                    formatted_date = parse_devpost_date_range(raw_date)
                except:
                    pass

                # 5. Build Row
                db_row = {
                    "title": title,
                    "mode": "Online", 
                    "reg_end_date": formatted_date,
                    "is_closed": False,
                    "link": link,
                    "image_url": image_url,
                    "source": "Devpost"
                }
                
                scraped_data.append(db_row)

            except Exception as e:
                # print(f"⚠️ specific tile error: {e}")
                continue

        return scraped_data

    except Exception as e:
        print(f"❌ Critical Error: {e}")
        return []

# ==========================================
# 5. UPLOAD
# ==========================================
def upload_to_supabase(data):
    if not data:
        print("⚠️ No data to upload.")
        return

    print(f"💾 Processing {len(data)} events...")
    count = 0
    for row in data:
        try:
            supabase.table("hackathons").upsert(row, on_conflict="link").execute()
            count += 1
        except Exception as e:
            print(f"❌ DB Error: {e}")
    
    print(f"🎉 Finished! {count} events synced.")

# ==========================================
# 6. EXECUTION
# ==========================================
if __name__ == "__main__":
    driver = setup_driver()
    try:
        data = scrape_devpost(driver)
        
        # Debug: Print the first 3 to see if dates look right
        if data:
            print("\n--- DEBUG CHECK (First 3 Items) ---")
            for item in data[:3]:
                print(f"Title: {item['title']}")
                print(f"Date : {item['reg_end_date']}")
                print("---")
            
        upload_to_supabase(data)
    finally:
        driver.quit()