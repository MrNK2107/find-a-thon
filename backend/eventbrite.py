import asyncio

from playwright.sync_api import BrowserContext, Page

from base_scraper import GenericScraper
from filters import is_chennai
from models import HackathonItem
from utils import extract_reg_end_date_from_text


class EventbriteScraper(GenericScraper):
    platform_name = "Eventbrite"
    TARGET_URL = "https://www.eventbrite.com/d/india--chennai/hackathon/"

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items: list[HackathonItem] = []

        try:
            page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2500)
        except Exception as exc:
            self.logger.warning(f"Eventbrite load failed: {exc}")
            return items

        cards = page.query_selector_all("a[href*='/e/'], a[href*='eventbrite.com/e/']")
        seen_links: set[str] = set()

        for card in cards:
            href = (card.get_attribute("href") or "").strip()
            if not href:
                continue
            if href.startswith("/"):
                href = f"https://www.eventbrite.com{href}"
            if not href.startswith("http") or href in seen_links:
                continue
            seen_links.add(href)

            title = (card.inner_text() or "").strip().split("\n")[0]
            if not title or "hackathon" not in title.lower():
                continue

            text_blob = (card.inner_text() or "").strip()
            date_value = extract_reg_end_date_from_text(text_blob)
            if not date_value:
                continue

            location = self._extract_location(text_blob)
            is_online = "online" in text_blob.lower() or "virtual" in text_blob.lower()
            if not is_online and location and not is_chennai(location):
                continue

            items.append(HackathonItem(
                title=title,
                date=date_value,
                location="Online" if is_online else (location or "Chennai"),
                link=href,
                source_platform="Eventbrite",
                is_offline=not is_online,
                description=text_blob[:320] if text_blob else None,
                themes=["Hackathon"],
            ))

        return items

    def _extract_location(self, text: str) -> str:
        lowered = (text or "").lower()
        if "chennai" in lowered:
            return "Chennai"
        if "tamil nadu" in lowered:
            return "Tamil Nadu"
        return ""


async def test_scraper():
    scraper = EventbriteScraper()
    items = await asyncio.to_thread(scraper.run)
    print(f"[Eventbrite] scraped {len(items)} items")
    for idx, item in enumerate(items[:3], start=1):
        print(f"{idx}. {item.title} | {item.date} | {item.location} | {item.link}")


if __name__ == "__main__":
    asyncio.run(test_scraper())
