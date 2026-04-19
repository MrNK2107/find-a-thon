import time
import asyncio
from datetime import datetime, timedelta
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class HackerEarthScraper(GenericScraper):
    platform_name = "HackerEarth"
    TARGET_URL = "https://www.hackerearth.com/challenges/hackathon/"

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
        try:
            page.wait_for_selector(
                "a[href*='/challenges/hackathon/'], a[href*='/challenges/competitive/hackathon/'], [data-event-id] a[href*='/challenges/']",
                timeout=20000,
            )
        except Exception:
            self.logger.warning("HackerEarth listing selector wait timed out; attempting fallback selectors")
        page.wait_for_timeout(3000)

        for _ in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)

        anchors = page.query_selector_all(
            "a[href*='/challenges/hackathon/'], a[href*='/challenges/competitive/hackathon/'], a[href*='/challenges/']"
        )
        if not anchors:
            self._log_selector_drift(page, "HackerEarth anchor selectors returned 0 items")

        items = []
        seen_links = set()
        for anchor in anchors:
            try:
                href = anchor.get_attribute("href") or ""
                if not href:
                    continue
                link = href if href.startswith("http") else f"https://www.hackerearth.com{href}"
                if link in seen_links:
                    continue
                seen_links.add(link)

                card = anchor
                for _ in range(3):
                    parent = card.query_selector("xpath=..")
                    if not parent:
                        break
                    card = parent

                title_el = card.query_selector("h3, h4, .challenge-name, .event-name")
                title = title_el.inner_text().strip() if title_el else ""
                if not title:
                    title = (anchor.get_attribute("title") or anchor.inner_text() or "").strip()
                if not title:
                    continue

                text_content = card.inner_text()
                end_date = extract_reg_end_date_from_text(text_content)
                description = text_content.strip()[:280] if text_content else None
                is_closed = any(word in text_content.lower() for word in ["closed", "ended", "finished", "completed"])

                items.append(HackathonItem(
                    title=title,
                    date=end_date,
                    link=link,
                    source_platform="HackerEarth",
                    description=description,
                    themes=["Hackathon"],
                    is_closed=is_closed,
                ))
            except Exception:
                continue

        if not items:
            self._log_selector_drift(page, "HackerEarth returned 0 items after parsing")

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
                        description=item.description,
                        themes=item.themes,
                        is_closed=item.is_closed,
                    ))
                else:
                    self.logger.warning(f"No date found for: {item.title}")
                    enriched.append(item)

                detail.close()
            except Exception as e:
                self.logger.warning(f"Detail page failed for {item.title}: {e}")
                enriched.append(item)

        return enriched


async def test_scraper():
    scraper = HackerEarthScraper()
    items = await asyncio.to_thread(scraper.run)
    print(f"[HackerEarth] scraped {len(items)} items")
    for idx, item in enumerate(items[:3], start=1):
        print(f"{idx}. {item.title} | {item.date} | {item.link}")


if __name__ == "__main__":
    asyncio.run(test_scraper())
