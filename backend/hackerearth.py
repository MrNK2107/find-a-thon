import os
import re
import time
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
# 🚨 REPLACE WITH YOUR ACTUAL SUPABASE KEYS
load_dotenv()
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

TARGET_URL = "https://www.hackerearth.com/challenges/hackathon/"

# Initialize DB
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 1. SELENIUM SETUP (HEADLESS)
# ==========================================
def setup_driver():
    chrome_options = Options()
    # 🛑 Run in Headless mode (Browser won't open)
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # Spoof User-Agent to prevent blocking
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    chrome_options.add_argument("--log-level=3") 
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

# ==========================================
# 2. HELPER: CALCULATE DATE FROM COUNTDOWN
# ==========================================
def calculate_end_date(raw_text):
    """
    Takes raw text from the countdown timer (e.g., "00\nDAYS\n12\nHOURS...")
    Extracts numbers and adds them to current time.
    """
    try:
        # Find all numbers in the text string
        # This handles "00 DAYS 12 HOURS 30 MINUTES" or "00 : 12 : 30"
        numbers = re.findall(r'\d+', raw_text)
        
        if len(numbers) >= 3:
            days = int(numbers[0])
            hours = int(numbers[1])
            minutes = int(numbers[2])
            
            # Calculate future date
            future_date = datetime.now() + timedelta(days=days, hours=hours, minutes=minutes)
            return future_date.strftime('%Y-%m-%d')
            
        return None
    except Exception:
        return None

# ==========================================
# 3. MAIN SCRAPER LOGIC
# ==========================================
def scrape_hackerearth(driver):
    print(f"🕷️  Fetching {TARGET_URL}...")
    try:
        driver.get(TARGET_URL)
        
        # Wait for cards to load
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "challenge-card-modern"))
        )
        
        # Scroll down to trigger lazy loading of images
        driver.execute_script("window.scrollTo(0, 800);")
        time.sleep(3) 

        cards = driver.find_elements(By.CLASS_NAME, "challenge-card-modern")
        print(f"🔍 Found {len(cards)} events on page.")
        
        scraped_data = []
        
        for card in cards:
            try:
                # --- 1. EXTRACT TITLE ---
                try:
                    title_elem = card.find_element(By.CLASS_NAME, "challenge-name")
                    title = title_elem.text.strip()
                except:
                    continue # Skip if no title (might be an ad)

                # --- 2. EXTRACT LINK ---
                link_elem = card.find_element(By.CSS_SELECTOR, "a.challenge-card-wrapper")
                link = link_elem.get_attribute("href")

                # --- 3. EXTRACT IMAGE URL (FROM STYLE) ---
                image_url = None
                try:
                    # Target the specific class seen in screenshot
                    img_div = card.find_element(By.CLASS_NAME, "event-image")
                    style_attr = img_div.get_attribute("style")
                    
                    # Regex to capture url('HTTPS://...')
                    # Handles single quotes, double quotes, or no quotes
                    img_match = re.search(r'url\(["\']?(.*?)["\']?\)', style_attr)
                    if img_match:
                        image_url = img_match.group(1)
                except:
                    pass

                # --- 4. EXTRACT & CALCULATE DATE ---
                formatted_date = None
                is_closed = False # Default to Open

                try:
                    # Target the countdown container seen in screenshot
                    countdown_elem = card.find_element(By.CLASS_NAME, "date-countdown")
                    raw_countdown_text = countdown_elem.text 
                    
                    # Calculate the date
                    formatted_date = calculate_end_date(raw_countdown_text)
                except:
                    # If no countdown, leave date as None (still Open)
                    pass

                # --- 5. BUILD DATA ROW ---
                db_row = {
                    "title": title,
                    "mode": "Online", 
                    "reg_end_date": formatted_date,
                    "is_closed": is_closed, 
                    "link": link,
                    "image_url": image_url,
                    "source": "HackerEarth"
                }
                
                scraped_data.append(db_row)

            except Exception as e:
                # print(f"⚠️ specific card error: {e}")
                continue

        return scraped_data

    except Exception as e:
        print(f"❌ Critical Scraping Error: {e}")
        return []

# ==========================================
# 4. UPLOAD TO SUPABASE
# ==========================================
def upload_to_supabase(data):
    if not data:
        print("⚠️ No data extracted to upload.")
        return

    print(f"💾 Processing {len(data)} events...")
    count = 0
    for row in data:
        try:
            # UPSERT: Updates if link exists, Inserts if new
            supabase.table("hackathons").upsert(row, on_conflict="link").execute()
            count += 1
        except Exception as e:
            print(f"❌ DB Error for {row['title']}: {e}")
    
    print(f"🎉 Finished! {count} events synced to database.")

# ==========================================
# 5. EXECUTION
# ==========================================
if __name__ == "__main__":
    driver = setup_driver()
    try:
        data = scrape_hackerearth(driver)
        
        # Debug print for the first item to ensure Image/Date is correct
        if data:
            print(f"\n✅ DEBUG (First Item):")
            print(f"   Title: {data[0]['title']}")
            print(f"   Date:  {data[0]['reg_end_date']}")
            print(f"   Image: {data[0]['image_url']}")
            print("-" * 30)
        
        upload_to_supabase(data)
    finally:
        driver.quit()