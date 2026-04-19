import re
from urllib.parse import urljoin, urlparse

import dateparser
from playwright.sync_api import BrowserContext, Page

from base_scraper import GenericScraper
from filters import is_chennai
from models import HackathonItem
from utils import extract_reg_end_date_from_text, search_date_on_web

EVENT_KEYWORDS = [
    "hackathon",
    "buildathon",
    "innovation challenge",
]

ONLINE_KEYWORDS = ["online", "virtual", "remote", "hybrid"]
OFFLINE_KEYWORDS = ["offline", "on-site", "onsite", "in-person", "in person"]
CHENNAI_HINTS = [
    "chennai",
    "guindy",
    "omr",
    "siruseri",
    "tambaram",
    "velachery",
    "sholinganallur",
    "thandalam",
    "kattankulathur",
    "sriperumbudur",
    "porur",
    "vadapalani",
    "ssn",
    "srm",
    "vit chennai",
]


class KeywordSourceScraper(GenericScraper):
    platform_name = "Source"
    source_platform = "Source"
    target_urls: list[str] = []
    default_location = ""
    limit = 24
    require_chennai_for_offline = True

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items: list[HackathonItem] = []
        seen_links: set[str] = set()

        for target_url in self.target_urls:
            try:
                page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(2500)
            except Exception as exc:
                self.logger.warning(f"{self.platform_name}: failed to load {target_url}: {exc}")
                continue

            candidates = self._collect_candidates(page, target_url)
            for full_url, anchor_text in candidates:
                if full_url in seen_links:
                    continue
                seen_links.add(full_url)

                item = self._build_item(context, full_url, anchor_text, target_url)
                if item:
                    items.append(item)
                    if len(items) >= self.limit:
                        return items

        return items

    def _collect_candidates(self, page: Page, base_url: str) -> list[tuple[str, str]]:
        candidates: list[tuple[str, str]] = []
        anchors = page.query_selector_all("a[href]")

        for anchor in anchors:
            href = anchor.get_attribute("href") or ""
            if not href or href.startswith(("#", "javascript:", "mailto:")):
                continue

            text = " ".join(
                part for part in [
                    (anchor.inner_text() or "").strip(),
                    (anchor.get_attribute("aria-label") or "").strip(),
                    (anchor.get_attribute("title") or "").strip(),
                    href.strip(),
                ]
                if part
            ).lower()
            if not self._matches_keywords(text):
                continue

            full_url = urljoin(base_url, href)
            if not self._is_valid_http_url(full_url):
                continue

            candidates.append((full_url, text))

        return candidates

    def _build_item(self, context: BrowserContext, url: str, anchor_text: str, source_url: str) -> HackathonItem | None:
        detail = None
        try:
            detail = context.new_page()
            detail.goto(url, wait_until="domcontentloaded", timeout=20000)
            detail.wait_for_timeout(1500)
            body_text = detail.inner_text("body") if detail else ""
            page_title = detail.title() if detail else ""
        except Exception:
            body_text = ""
            page_title = ""
        finally:
            if detail:
                try:
                    detail.close()
                except Exception:
                    pass

        combined_text = " ".join(part for part in [anchor_text, page_title, body_text] if part).strip()
        if not self._matches_keywords(combined_text):
            return None

        mode = self._detect_mode(combined_text)
        location = self._extract_location(combined_text)
        if not location:
            location = self.default_location if mode != "Online" else "Online"
        if mode == "Offline" and self.require_chennai_for_offline and not is_chennai(location):
            return None
        if mode == "Hybrid" and not location:
            location = self.default_location or "Chennai"

        date_value = extract_reg_end_date_from_text(combined_text)
        if not date_value:
            date_value = self._extract_date_from_text(combined_text)
        if not date_value:
            date_value = search_date_on_web(self._clean_title(page_title or anchor_text))
        if not date_value:
            return None

        description = self._extract_description(combined_text)
        themes = self._extract_themes(combined_text)
        is_closed = any(word in combined_text.lower() for word in ["registration closed", "event ended", "completed", "closed"])

        return HackathonItem(
            title=self._clean_title(page_title or anchor_text),
            organizer=self._extract_organizer(combined_text),
            date=date_value,
            location=location,
            link=url,
            source_platform=self.source_platform,
            is_offline=mode != "Online",
            description=description,
            themes=themes,
            is_closed=is_closed,
        )

    def _matches_keywords(self, text: str) -> bool:
        lowered = (text or "").lower()
        return any(keyword in lowered for keyword in EVENT_KEYWORDS)

    def _detect_mode(self, text: str) -> str:
        lowered = (text or "").lower()
        has_online = any(keyword in lowered for keyword in ONLINE_KEYWORDS)
        has_offline = any(keyword in lowered for keyword in OFFLINE_KEYWORDS)
        if "hybrid" in lowered or (has_online and has_offline):
            return "Hybrid"
        if has_offline:
            return "Offline"
        return "Online"

    def _extract_location(self, text: str) -> str:
        lowered = (text or "").lower()
        if "online" in lowered or "virtual" in lowered or "remote" in lowered:
            return "Online"
        for hint in CHENNAI_HINTS:
            if hint in lowered:
                return "Chennai"
        return ""

    def _extract_themes(self, text: str) -> list[str]:
        lowered = (text or "").lower()
        themes = []
        for keyword in ["hackathon", "buildathon", "innovation challenge"]:
            if keyword in lowered:
                themes.append(keyword.title())
        return themes

    def _extract_description(self, text: str) -> str | None:
        cleaned = re.sub(r"\s+", " ", text or "").strip()
        return cleaned[:320] if cleaned else None

    def _extract_organizer(self, text: str) -> str:
        lowered = (text or "").lower()
        for label in ["gdg", "google developer group", "meetup", "eventbrite", "srm", "vit", "ssn"]:
            if label in lowered:
                return label.upper() if label != "gdg" else "GDG Chennai"
        return ""

    def _extract_date_from_text(self, text: str) -> str | None:
        if not text:
            return None
        try:
            dt = dateparser.parse(text, settings={"PREFER_DATES_FROM": "future"})
            if dt:
                return dt.strftime("%Y-%m-%d")
        except Exception:
            return None
        return None

    def _clean_title(self, title: str) -> str:
        cleaned = re.sub(r"\s+", " ", (title or "")).strip()
        return cleaned[:140] if cleaned else "Untitled"

    def _is_valid_http_url(self, url: str) -> bool:
        try:
            parsed = urlparse(url)
            return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
        except Exception:
            return False


class GDGChennaiScraper(KeywordSourceScraper):
    platform_name = "GDG Chennai"
    source_platform = "GDG Chennai"
    target_urls = ["https://gdg.community.dev/gdg-chennai/"]
    default_location = "Chennai"
    limit = 16


class MeetupScraper(KeywordSourceScraper):
    platform_name = "Meetup"
    source_platform = "Meetup"
    target_urls = [
        "https://www.meetup.com/find/?keywords=hackathon&location=in--chennai",
        "https://www.meetup.com/find/?keywords=buildathon&location=in--chennai",
        "https://www.meetup.com/find/?keywords=innovation%20challenge&location=in--chennai",
    ]
    default_location = "Chennai"
    limit = 18


class EventbriteScraper(KeywordSourceScraper):
    platform_name = "Eventbrite"
    source_platform = "Eventbrite"
    target_urls = [
        "https://www.eventbrite.com/d/india--chennai/events/?q=hackathon",
        "https://www.eventbrite.com/d/india--chennai/events/?q=buildathon",
        "https://www.eventbrite.com/d/india--chennai/events/?q=innovation+challenge",
    ]
    default_location = "Chennai"
    limit = 18


class SRMScraper(KeywordSourceScraper):
    platform_name = "SRM"
    source_platform = "SRM"
    target_urls = [
        "https://www.srmist.edu.in/events/",
        "https://www.srmist.edu.in/",
    ]
    default_location = "Chennai"
    limit = 12


class VitChennaiScraper(KeywordSourceScraper):
    platform_name = "VIT Chennai"
    source_platform = "VIT Chennai"
    target_urls = [
        "https://chennai.vit.ac.in/events/",
        "https://chennai.vit.ac.in/",
    ]
    default_location = "Chennai"
    limit = 12


class SSNScraper(KeywordSourceScraper):
    platform_name = "SSN"
    source_platform = "SSN"
    target_urls = [
        "https://www.ssn.edu.in/events/",
        "https://www.ssn.edu.in/",
    ]
    default_location = "Chennai"
    limit = 12
