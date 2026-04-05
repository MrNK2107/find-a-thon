import time
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class DevfolioScraper(GenericScraper):
    platform_name = "Devfolio"
    TARGET_URL = "https://devfolio.co/hackathons/open"
    API_PATTERN = "api.devfolio.co"

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items: list[HackathonItem] = []

        self._intercept_api(page, self.API_PATTERN, self.TARGET_URL)

        for _ in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)

        if self._captured_responses:
            items = self._parse_api_responses()
        else:
            self.logger.warning("XHR interception returned no data, falling back to DOM")
            items = self._fallback_dom(page)

        # Enrich items missing dates
        items = self._enrich_missing_dates(items, context)

        return items

    def _parse_api_responses(self) -> list[HackathonItem]:
        items = []
        for payload in self._captured_responses:
            hackathons = []
            if isinstance(payload, dict):
                hackathons = payload.get("results", payload.get("hackathons", []))
                if not hackathons and "data" in payload:
                    hackathons = payload["data"] if isinstance(payload["data"], list) else []

            for h in hackathons:
                if not isinstance(h, dict):
                    continue
                name = h.get("name", "") or h.get("title", "")
                if not name:
                    continue

                slug = h.get("slug", "")
                link = f"https://devfolio.co/hackathons/{slug}" if slug else ""
                if not link:
                    continue

                # Try multiple API fields for end date
                end_date = (
                    h.get("application_end_at")
                    or h.get("applications_end_at")
                    or h.get("reg_end_at")
                    or h.get("ends_at")
                    or h.get("hackathon_end")
                    or ""
                )
                if end_date and "T" in str(end_date):
                    end_date = str(end_date).split("T")[0]
                elif not end_date:
                    end_date = None

                location = h.get("location", "") or ""
                is_offline = h.get("is_offline", False)
                logo = h.get("logo", "") or h.get("cover_img", "") or ""
                organizer = h.get("organisation_name", "") or ""
                themes = h.get("themes", []) if isinstance(h.get("themes"), list) else []
                description = h.get("description") or h.get("subtitle") or h.get("tagline") or None
                status_value = str(h.get("status") or h.get("state") or "").lower()
                is_closed = status_value in {"closed", "ended", "completed"}

                items.append(HackathonItem(
                    title=name,
                    organizer=organizer,
                    date=end_date if end_date else None,
                    location=location,
                    link=link,
                    source_platform="Devfolio",
                    is_offline=bool(is_offline),
                    image_url=logo,
                    themes=themes,
                    description=description,
                    is_closed=is_closed,
                ))
        return items

    def _enrich_missing_dates(self, items: list[HackathonItem], context: BrowserContext) -> list[HackathonItem]:
        """Visit detail pages for items missing dates to extract registration end date."""
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
                        themes=item.themes,
                        description=item.description,
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

    def _fallback_dom(self, page: Page) -> list[HackathonItem]:
        items = []
        cards = page.query_selector_all("a[href*='/hackathons/']")
        seen = set()
        for card in cards:
            href = card.get_attribute("href") or ""
            if not href or href in seen or "/open" in href:
                continue
            seen.add(href)
            link = href if href.startswith("http") else f"https://devfolio.co{href}"
            title = card.inner_text().strip().split("\n")[0]
            if not title or len(title) < 3:
                continue
            items.append(HackathonItem(
                title=title,
                link=link,
                source_platform="Devfolio",
                description=title,
                is_closed=False,
            ))
        return items
