import time
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


class UnstopScraper(GenericScraper):
    platform_name = "Unstop"
    TARGET_URL = "https://unstop.com/hackathons?oppstatus=open"
    API_PATTERN = "unstop.com/api/public/opportunity/search-new"

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

        # Enrich items missing dates by visiting their detail pages
        items = self._enrich_missing_dates(items, context)

        return items

    def _parse_api_responses(self) -> list[HackathonItem]:
        items = []
        for payload in self._captured_responses:
            opportunities = payload.get("data", {}).get("data", [])
            if not opportunities and isinstance(payload.get("data"), list):
                opportunities = payload["data"]

            for opp in opportunities:
                title = opp.get("title", "").strip()
                if not title:
                    continue

                link = f"https://unstop.com/hackathon/{opp.get('public_url', '')}" if opp.get("public_url") else ""
                if not link or link == "https://unstop.com/hackathon/":
                    continue

                # Try multiple API fields for registration end date
                end_date = None
                regn_req = opp.get("regnRequirements")
                if isinstance(regn_req, dict):
                    end_date = regn_req.get("end_regn_dt")
                if not end_date:
                    end_date = opp.get("end_date")
                if not end_date:
                    end_date = opp.get("deadline")
                if not end_date:
                    # Check nested dates
                    dates = opp.get("dates", {})
                    if isinstance(dates, dict):
                        end_date = dates.get("end_date") or dates.get("registration_end")

                if end_date and "T" in str(end_date):
                    end_date = str(end_date).split("T")[0]

                org = ""
                org_data = opp.get("organisation")
                if isinstance(org_data, dict):
                    org = org_data.get("name", "")

                location = opp.get("city", "") or ""
                is_offline = False
                eligible = opp.get("oppstatus_eligible_for")
                if isinstance(eligible, dict):
                    is_offline = eligible.get("is_offline", False)

                logo = opp.get("logoUrl2") or opp.get("logoUrl") or ""

                items.append(HackathonItem(
                    title=title,
                    organizer=org,
                    date=str(end_date) if end_date else None,
                    location=location,
                    link=link,
                    source_platform="Unstop",
                    is_offline=bool(is_offline),
                    image_url=logo,
                ))
        return items

    def _enrich_missing_dates(self, items: list[HackathonItem], context: BrowserContext) -> list[HackathonItem]:
        """Visit detail pages for items missing dates to extract registration end date."""
        enriched = []
        for item in items:
            if item.date:
                enriched.append(item)
                continue

            # Try visiting the detail page
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

    def _fallback_dom(self, page: Page) -> list[HackathonItem]:
        items = []
        cards = page.query_selector_all("a[href*='/hackathon/']")
        seen = set()
        for card in cards:
            href = card.get_attribute("href") or ""
            if not href or href in seen:
                continue
            seen.add(href)
            link = href if href.startswith("http") else f"https://unstop.com{href}"
            title = ""
            for tag in ["h2", "h3", "h4"]:
                el = card.query_selector(tag)
                if el:
                    title = el.inner_text().strip()
                    break
            if not title:
                title = card.inner_text().strip()[:100]
            if not title:
                continue
            items.append(HackathonItem(
                title=title,
                link=link,
                source_platform="Unstop",
            ))
        return items
