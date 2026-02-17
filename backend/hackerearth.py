import time
from datetime import datetime, timedelta
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class HackerEarthScraper(GenericScraper):
    platform_name = "HackerEarth"
    TARGET_URL = "https://www.hackerearth.com/challenges/"

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(5000)

        for _ in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)

        cards = page.query_selector_all(".challenge-card-modern")
        if not cards:
            cards = page.query_selector_all(".challenge-card")
        if not cards:
            cards = page.query_selector_all("[class*='challenge']")

        items = []
        for card in cards:
            try:
                anchor = card.query_selector("a[href]")
                if not anchor:
                    continue
                href = anchor.get_attribute("href") or ""
                link = href if href.startswith("http") else f"https://www.hackerearth.com{href}"

                title_el = card.query_selector("h3, h4, .challenge-name, .event-name")
                title = title_el.inner_text().strip() if title_el else ""
                if not title:
                    continue

                image_url = ""
                img = card.query_selector("img")
                if img:
                    image_url = img.get_attribute("src") or ""

                text_content = card.inner_text()
                end_date = extract_reg_end_date_from_text(text_content)

                items.append(HackathonItem(
                    title=title,
                    date=end_date,
                    link=link,
                    source_platform="HackerEarth",
                    image_url=image_url or None,
                ))
            except Exception:
                continue

        # Enrich items missing dates by visiting their detail pages
        items = self._enrich_missing_dates(items, context)

        return items

    def _enrich_missing_dates(self, items: list[HackathonItem], context: BrowserContext) -> list[HackathonItem]:
        """Visit detail pages for items missing dates."""
        enriched = []
        for item in items:
            if item.date:
                enriched.append(item)
                continue

            try:
                detail = context.new_page()
                detail.goto(item.link, wait_until="domcontentloaded", timeout=15000)
                detail.wait_for_timeout(3000)

                body_text = detail.inner_text("body")
                found_date = extract_reg_end_date_from_text(body_text)

                if not found_date:
                    found_date = search_date_on_web(item.title)

                if found_date:
                    enriched.append(HackathonItem(
                        title=item.title,
                        organizer=item.organizer,
                        date=found_date,
                        location=item.location,
                        link=item.link,
                        source_platform=item.source_platform,
                        is_offline=item.is_offline,
                        image_url=item.image_url,
                    ))
                else:
                    self.logger.warning(f"No date found for: {item.title}")
                    enriched.append(item)

                detail.close()
            except Exception as e:
                self.logger.warning(f"Detail page failed for {item.title}: {e}")
                enriched.append(item)

        return enriched
