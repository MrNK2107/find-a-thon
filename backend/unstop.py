import time
import asyncio
import re
from urllib.parse import urlparse, urlunparse
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web


def normalize_url(raw_url: str | None, slug: str | None = None) -> str:
    """Normalize Unstop hackathon URLs and guard against duplicate path segments."""
    base_url = "https://unstop.com"

    raw = (raw_url or "").strip()
    slug_value = (slug or "").strip()
    candidate = raw or slug_value
    if not candidate:
        return ""

    candidate = candidate.replace("\\", "/")

    if candidate.startswith("http://"):
        candidate = "https://" + candidate[len("http://"):]
    elif candidate.startswith("//"):
        candidate = f"https:{candidate}"
    elif candidate.startswith("/"):
        candidate = f"{base_url}{candidate}"
    elif re.match(r"^[a-z0-9.-]+\.[a-z]{2,}(/|$)", candidate, flags=re.IGNORECASE):
        candidate = f"https://{candidate.lstrip('/')}"
    elif not candidate.startswith("https://"):
        normalized = candidate.lstrip("/")
        if normalized.startswith("hackathon/"):
            normalized = "hackathons/" + normalized[len("hackathon/"):]
        elif not normalized.startswith("hackathons/"):
            normalized = f"hackathons/{normalized}"
        candidate = f"{base_url}/{normalized}"

    parsed = urlparse(candidate)
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    if parsed.scheme not in {"http", "https"} or host != "unstop.com":
        return ""

    path = parsed.path or ""
    path = re.sub(r"/{2,}", "/", path)
    path = path.replace("/hackathon/", "/hackathons/")
    path = re.sub(r"/hackathons(?:/hackathons)+", "/hackathons", path)

    if path.endswith("/hackathon"):
        path = path[: -len("/hackathon")] + "/hackathons"

    path = path.rstrip("/")
    if not path:
        return ""

    return urlunparse(("https", "unstop.com", path, "", parsed.query, ""))


class UnstopScraper(GenericScraper):
    platform_name = "Unstop"
    TARGET_URL = "https://unstop.com/hackathons?oppstatus=open"
    API_URL = "https://unstop.com/api/public/opportunity/search-result"
    API_PATTERNS = [
        "unstop.com/api/public/opportunity/search-new",
        "unstop.com/api/public/opportunity/search",
        "unstop.com/api/public/opportunity",
        "/opportunity/search",
    ]

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items = self._fetch_from_api(page)
        if not items:
            self.logger.warning("Unstop API returned 0 items, falling back to DOM listing")
            page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
            try:
                page.wait_for_selector(
                    "a[href*='/hackathon/'], [class*='opportunity'], [data-testid*='opportunity']",
                    timeout=20000,
                )
            except Exception:
                self.logger.warning("Unstop listing selector wait timed out; continuing with fallback parsing")

            for _ in range(5):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(2000)

            items = self._fallback_dom(page)

        if not items:
            self._log_selector_drift(page, "Unstop returned 0 items after API+DOM fallback")

        # Enrich items missing dates by visiting their detail pages
        items = self._enrich_missing_dates(items, context)

        self._log_sample_links(items)

        return items

    def _fetch_from_api(self, page: Page) -> list[HackathonItem]:
        # Try a couple of common query param shapes; keep robust since API schema can drift.
        candidates = [
            self.API_URL,
            f"{self.API_URL}?oppstatus=open&opportunity=hackathons",
            f"{self.API_URL}?oppstatus=open",
        ]
        for url in candidates:
            try:
                response = page.request.get(url, timeout=30000)
                if not response.ok:
                    continue
                payload = response.json()
                parsed = self._parse_api_payload(payload)
                if parsed:
                    return parsed
            except Exception:
                continue
        return []

    def _build_unstop_link(self, opp: dict) -> str:
        seo_url = (opp.get("seoUrl") or opp.get("seo_url") or "").strip()
        public_url = (opp.get("public_url") or "").strip()

        if seo_url:
            return normalize_url(f"https://unstop.com/hackathons/{seo_url}")
        return normalize_url(public_url, slug=public_url)

    def _parse_api_payload(self, payload) -> list[HackathonItem]:
        items: list[HackathonItem] = []
        opportunities = payload.get("data", {}).get("data", []) if isinstance(payload, dict) else []
        if not opportunities and isinstance(payload, dict) and isinstance(payload.get("data"), list):
            opportunities = payload.get("data")

        for opp in opportunities:
            if not isinstance(opp, dict):
                continue

            title = (opp.get("title") or "").strip()
            if not title:
                continue

            link = self._build_unstop_link(opp)
            if not link:
                continue

            end_date = None
            regn_req = opp.get("regnRequirements")
            if isinstance(regn_req, dict):
                end_date = regn_req.get("end_regn_dt")
            if not end_date:
                end_date = opp.get("end_date") or opp.get("deadline")
            if end_date and "T" in str(end_date):
                end_date = str(end_date).split("T")[0]

            location = str(opp.get("location") or opp.get("city") or "").strip()

            is_paid = opp.get("isPaid")
            paid_hint = "paid registration" if bool(is_paid) else "free registration"
            description = opp.get("seo_description") or opp.get("description") or opp.get("short_desc") or paid_hint

            eligible = opp.get("oppstatus_eligible_for")
            is_offline = False
            if isinstance(eligible, dict):
                is_offline = bool(eligible.get("is_offline", False))

            items.append(HackathonItem(
                title=title,
                organizer=(opp.get("organisation") or {}).get("name", "") if isinstance(opp.get("organisation"), dict) else "",
                date=str(end_date) if end_date else None,
                location=location,
                link=link,
                source_platform="Unstop",
                is_offline=is_offline,
                image_url=opp.get("logoUrl2") or opp.get("logoUrl") or None,
                description=description,
                themes=["Hackathon"],
                is_closed=str(opp.get("status") or opp.get("oppstatus") or "").lower() in {"closed", "completed", "ended"},
            ))

        return items

    def _parse_api_responses(self) -> list[HackathonItem]:
        items: list[HackathonItem] = []
        for payload in self._captured_responses:
            items.extend(self._parse_api_payload(payload))
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

    def _fallback_dom(self, page: Page) -> list[HackathonItem]:
        items = []
        cards = page.query_selector_all(
            "a[href*='/hackathon/'], a[href*='/hackathons/'], [data-testid*='opportunity'] a[href*='/hackathon/']"
        )
        seen = set()
        for card in cards:
            href = card.get_attribute("href") or ""
            if not href or href in seen:
                continue
            seen.add(href)
            link = normalize_url(href)
            if not link:
                continue
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
                description=title,
                is_closed=False,
            ))
        return items

    def _log_sample_links(self, items: list[HackathonItem]) -> None:
        sample_links = [item.link for item in items[:3] if item.link]
        for index, link in enumerate(sample_links[:3], start=1):
            self.logger.info(f"Unstop sample final URL {index}: {link}")
            print(f"[Unstop] sample final URL {index}: {link}")


async def test_scraper():
    scraper = UnstopScraper()
    items = await asyncio.to_thread(scraper.run)
    print(f"[Unstop] scraped {len(items)} items")
    for idx, item in enumerate(items[:3], start=1):
        print(f"{idx}. {item.title} | {item.date} | {item.link}")


if __name__ == "__main__":
    asyncio.run(test_scraper())
