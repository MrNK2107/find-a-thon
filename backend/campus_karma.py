import re
import dateparser
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class CampusKarmaScraper(GenericScraper):
    platform_name = "CampusKarma"
    TARGET_URL = "https://www.campuskarma.in"
    HACKATHON_KEYWORDS = ["hackathon", "hack", "code", "coding", "tech", "programming", "software"]

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items = []

        try:
            page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(5000)
        except Exception:
            self.logger.warning("CampusKarma page load failed or timed out")
            return items

        event_links = page.query_selector_all("a[href*='event'], a[href*='fest'], a[href*='hackathon']")
        if not event_links:
            event_links = page.query_selector_all("a[href]")

        seen = set()
        candidates = []

        for anchor in event_links:
            href = anchor.get_attribute("href") or ""
            if not href or href in seen or len(href) < 10:
                continue
            if href.startswith("#") or "login" in href or "signup" in href:
                continue
            seen.add(href)

            title = anchor.inner_text().strip()
            if not title or len(title) < 3:
                continue

            lower_title = title.lower()
            if not any(kw in lower_title or kw in href.lower() for kw in self.HACKATHON_KEYWORDS):
                continue

            link = href if href.startswith("http") else f"https://www.campuskarma.in{href}"
            candidates.append(HackathonItem(
                title=title,
                link=link,
                source_platform="CampusKarma",
                location="Chennai",
                is_offline=True,
            ))

        for item in candidates[:20]:
            try:
                detail = context.new_page()
                detail.goto(item.link, wait_until="domcontentloaded", timeout=10000)
                detail.wait_for_timeout(2000)
                body = detail.inner_text("body")

                # Try regex-based date extraction
                date_val = None
                date_match = re.findall(
                    r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})",
                    body, re.IGNORECASE
                )
                if date_match:
                    dt = dateparser.parse(date_match[-1], settings={"PREFER_DATES_FROM": "future"})
                    if dt:
                        date_val = dt.strftime("%Y-%m-%d")

                # Fallback: use generic extractor
                if not date_val:
                    date_val = extract_reg_end_date_from_text(body)

                # Fallback: web search
                if not date_val:
                    date_val = search_date_on_web(item.title)

                items.append(HackathonItem(
                    title=item.title,
                    date=date_val,
                    link=item.link,
                    source_platform="CampusKarma",
                    location="Chennai",
                    is_offline=True,
                ))
                detail.close()
            except Exception:
                continue

        if not items:
            items = candidates

        return items
