import re
import time
import dateparser
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class DevpostScraper(GenericScraper):
    platform_name = "Devpost"
    TARGET_URL = "https://devpost.com/hackathons?challenge_type[]=online&status[]=upcoming"

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector(".hackathon-tile", timeout=15000)

        last_height = page.evaluate("document.body.scrollHeight")
        while True:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(3000)
            new_height = page.evaluate("document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        tiles = page.query_selector_all(".hackathon-tile")
        items = []

        for tile in tiles:
            try:
                anchor = tile.query_selector("a.tile-anchor")
                link = anchor.get_attribute("href") if anchor else ""
                if not link:
                    continue

                h3 = tile.query_selector("h3")
                title = h3.inner_text().strip() if h3 else ""
                if not title:
                    continue

                image_url = ""
                img = tile.query_selector(".hackathon-thumbnail")
                if img:
                    raw_src = img.get_attribute("src") or ""
                    if raw_src.startswith("//"):
                        image_url = "https:" + raw_src
                    elif raw_src.startswith("http"):
                        image_url = raw_src

                end_date = None
                date_el = tile.query_selector(".submission-period")
                if date_el:
                    end_date = self._parse_date_range(date_el.inner_text().strip())

                themes = ""
                theme_els = tile.query_selector_all(".theme-label")
                if theme_els:
                    themes = ", ".join(t.inner_text().strip() for t in theme_els)

                items.append(HackathonItem(
                    title=title,
                    date=end_date,
                    link=link,
                    source_platform="Devpost",
                    image_url=image_url or None,
                    themes=themes,
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
                detail.wait_for_timeout(3000)

                body_text = detail.inner_text("body")
                found_date = extract_reg_end_date_from_text(body_text)

                # Also check for specific Devpost deadline selectors
                if not found_date:
                    deadline_el = detail.query_selector("#submission-period, .deadline, [data-deadline]")
                    if deadline_el:
                        found_date = extract_reg_end_date_from_text(deadline_el.inner_text().strip())

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
                        themes=item.themes,
                    ))
                else:
                    self.logger.warning(f"No date found for: {item.title}")
                    enriched.append(item)

                detail.close()
            except Exception as e:
                self.logger.warning(f"Detail page failed for {item.title}: {e}")
                enriched.append(item)

        return enriched

    @staticmethod
    def _parse_date_range(text: str):
        if not text or "-" not in text:
            return None
        try:
            parts = text.split("-")
            end_part = parts[-1].strip()
            if not re.search(r"[a-zA-Z]", end_part):
                month_match = re.search(r"([a-zA-Z]+)", parts[0].strip())
                if month_match:
                    end_part = f"{month_match.group(1)} {end_part}"
            dt = dateparser.parse(end_part)
            return dt.strftime("%Y-%m-%d") if dt else None
        except Exception:
            return None
