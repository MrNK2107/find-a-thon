import re
import dateparser
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class KnowafestScraper(GenericScraper):
    platform_name = "Knowafest"
    TARGET_URL = "https://www.knowafest.com/college-fests/city/chennai"
    HACKATHON_KEYWORDS = ["hackathon", "hack", "code", "coding", "tech", "programming", "software", "ai", "ml", "data"]

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        items = []
        event_links = page.query_selector_all("a[href*='/college-fests/events/']")
        seen = set()

        for anchor in event_links:
            href = anchor.get_attribute("href") or ""
            if not href or href in seen:
                continue
            seen.add(href)

            title = anchor.inner_text().strip()
            if not title or len(title) < 3:
                continue

            link = href if href.startswith("http") else f"https://www.knowafest.com{href}"
            items.append(HackathonItem(
                title=title,
                link=link,
                source_platform="Knowafest",
                location="Chennai",
                is_offline=True,
            ))

        enriched = []
        for item in items[:30]:
            try:
                detail_page = context.new_page()
                detail_page.goto(item.link, wait_until="domcontentloaded", timeout=15000)
                detail_page.wait_for_timeout(2000)

                body_text = detail_page.inner_text("body")
                lower_body = body_text.lower()

                is_tech = any(kw in lower_body for kw in self.HACKATHON_KEYWORDS)
                if not is_tech:
                    detail_page.close()
                    continue

                # Try extracting date from detail page
                date_val = self._extract_date_from_detail(detail_page, body_text)

                # Fallback: use generic date extractor
                if not date_val:
                    date_val = extract_reg_end_date_from_text(body_text)

                # Fallback: web search
                if not date_val:
                    date_val = search_date_on_web(item.title)

                organizer = self._extract_organizer(detail_page)
                location = self._extract_location(body_text) or "Chennai"

                enriched.append(HackathonItem(
                    title=item.title,
                    organizer=organizer,
                    date=date_val,
                    location=location,
                    link=item.link,
                    source_platform="Knowafest",
                    is_offline=True,
                ))
                detail_page.close()
            except Exception:
                continue

        return enriched

    def _extract_date_from_detail(self, page: Page, body_text: str):
        date_patterns = [
            r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})",
            r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, body_text, re.IGNORECASE)
            if matches:
                dt = dateparser.parse(matches[-1], settings={"PREFER_DATES_FROM": "future"})
                if dt:
                    return dt.strftime("%Y-%m-%d")
        return None

    def _extract_organizer(self, page: Page) -> str:
        for sel in ["h2", ".college-name", ".organizer", ".org-name"]:
            el = page.query_selector(sel)
            if el:
                text = el.inner_text().strip()
                if text and len(text) > 3:
                    return text
        return ""

    def _extract_location(self, body_text: str) -> str:
        location_keywords = ["chennai", "thandalam", "kattankulathur", "guindy", "vadapalani", "tambaram"]
        lower = body_text.lower()
        for kw in location_keywords:
            if kw in lower:
                return kw.title()
        return ""
