import re
import dateparser
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class AllCollegeEventScraper(GenericScraper):
    platform_name = "AllCollegeEvent"
    TARGET_URL = "https://www.allcollegeevent.com"
    HACKATHON_KEYWORDS = ["hackathon", "hack", "code", "coding", "tech", "programming"]

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items = []

        try:
            page.goto(self.TARGET_URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(5000)
        except Exception:
            self.logger.warning("AllCollegeEvent page load timed out, proceeding with partial content")

        chennai_link = page.query_selector("a[href*='chennai'], a[href*='Chennai']")
        if chennai_link:
            try:
                chennai_link.click()
                page.wait_for_timeout(5000)
            except Exception:
                pass

        event_cards = page.query_selector_all(".event-card, .card, [class*='event']")
        if not event_cards:
            event_cards = page.query_selector_all("a[href*='event']")

        seen = set()
        for card in event_cards:
            try:
                link_el = card if card.evaluate("el => el.tagName") == "A" else card.query_selector("a[href]")
                if not link_el:
                    continue

                href = link_el.get_attribute("href") or ""
                if not href or href in seen or href == "#":
                    continue
                seen.add(href)
                link = href if href.startswith("http") else f"https://www.allcollegeevent.com{href}"

                title = ""
                for tag in ["h3", "h4", "h2", ".event-title", ".title"]:
                    el = card.query_selector(tag)
                    if el:
                        title = el.inner_text().strip()
                        break
                if not title:
                    title = card.inner_text().strip().split("\n")[0]
                if not title or len(title) < 3:
                    continue

                image_url = ""
                img = card.query_selector("img")
                if img:
                    image_url = img.get_attribute("src") or ""

                # Try extracting date from the card text
                date_text = card.inner_text()
                date_val = None
                date_match = re.findall(
                    r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*\d{4})",
                    date_text, re.IGNORECASE
                )
                if date_match:
                    dt = dateparser.parse(date_match[-1], settings={"PREFER_DATES_FROM": "future"})
                    if dt:
                        date_val = dt.strftime("%Y-%m-%d")

                items.append(HackathonItem(
                    title=title,
                    date=date_val,
                    link=link,
                    source_platform="AllCollegeEvent",
                    location="Chennai",
                    is_offline=True,
                    image_url=image_url or None,
                ))
            except Exception:
                continue

        # Enrich items missing dates by visiting detail pages
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
                detail.wait_for_timeout(2000)

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
