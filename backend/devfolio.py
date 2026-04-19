import time
from datetime import datetime
from playwright.sync_api import Page, BrowserContext
from base_scraper import GenericScraper
from models import HackathonItem
from utils import extract_reg_end_date_from_text, normalize_hackathon_url, search_date_on_web


class DevfolioScraper(GenericScraper):
    platform_name = "Devfolio"
    TARGET_URL = "https://devfolio.co/hackathons/open"
    API_URL = "https://api.devfolio.co/api/search/hackathons"

    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        items: list[HackathonItem] = []

        self.logger.info(f"Devfolio stage: calling API {self.API_URL}")
        items = self._fetch_from_api(page)
        self.logger.info(f"Devfolio stage: parsed API items={len(items)}")
        if not items:
            self.logger.warning("Devfolio API returned 0 items, falling back to DOM")
            page.goto(self.TARGET_URL, wait_until="domcontentloaded", timeout=30000)
            for _ in range(4):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1500)
            items = self._fallback_dom(page)

        self.logger.info(f"Devfolio stage: items before enrichment={len(items)}")

        # Enrich items missing dates
        items = self._enrich_missing_dates(items, context)

        with_date = sum(1 for i in items if i.date)
        self.logger.info(f"Devfolio stage: items after enrichment={len(items)}, with_date={with_date}")
        self._log_sample_links(items)

        return items

    def _fetch_from_api(self, page: Page) -> list[HackathonItem]:
        try:
            response = page.request.get(self.API_URL, timeout=30000)
            if not response.ok:
                self.logger.warning(f"Devfolio API request failed with status {response.status}")
                return []
            payload = response.json()
            return self._parse_api_payload(payload)
        except Exception as exc:
            self.logger.warning(f"Devfolio API fetch failed: {exc}")
            return []

    def _parse_api_payload(self, payload) -> list[HackathonItem]:
        items: list[HackathonItem] = []
        seen_links: set[str] = set()

        hackathons = self._extract_hackathon_candidates(payload)
        for h in hackathons:
            if not isinstance(h, dict):
                continue

            title = (h.get("title") or h.get("name") or "").strip()
            slug = (h.get("slug") or h.get("seo_url") or "").strip()
            if not title or not slug:
                continue

            link = normalize_hackathon_url(None, self.platform_name, slug=slug)
            if not link or link in seen_links:
                continue
            seen_links.add(link)

            raw_location = h.get("location") or h.get("city") or ""
            location = str(raw_location).strip()
            raw_end = (
                h.get("application_end_date")
                or h.get("registration_end")
                or h.get("application_end_at")
                or h.get("applications_end_at")
                or h.get("end_date")
                or h.get("starts_at")
                or h.get("start_date")
            )
            end_date = self._normalize_date(raw_end)

            description = h.get("description") or h.get("tagline") or h.get("subtitle") or None
            organizer = h.get("organisation_name") or h.get("organization_name") or h.get("hosted_by") or ""
            logo = h.get("logo") or h.get("cover_img") or ""
            themes = self._extract_themes(h.get("themes"))
            status_value = str(h.get("status") or h.get("state") or "").lower()

            items.append(HackathonItem(
                title=title,
                organizer=organizer,
                date=end_date if end_date else None,
                location=location,
                link=link,
                source_platform="Devfolio",
                is_offline=bool(location and "online" not in location.lower()),
                image_url=logo or None,
                themes=themes,
                description=description,
                is_closed=status_value in {"closed", "ended", "completed"},
            ))

        return items

    def _parse_api_responses(self) -> list[HackathonItem]:
        # Backward compatibility helper for older call paths.
        items = []
        for payload in self._captured_responses:
            items.extend(self._parse_api_payload(payload))
        return items

    def _extract_hackathon_candidates(self, payload) -> list[dict]:
        """Extracts candidate hackathon dicts from multiple known API response shapes."""
        if not isinstance(payload, dict):
            return []

        # Current Devfolio API shape (Algolia-like):
        # {"hits": {"total": <int>, "hits": [{"_source": {...}}, ...]}}
        hits_root = payload.get("hits")
        if isinstance(hits_root, dict):
            nested_hits = hits_root.get("hits")
            if isinstance(nested_hits, list):
                extracted = []
                for hit in nested_hits:
                    if not isinstance(hit, dict):
                        continue
                    src = hit.get("_source")
                    if isinstance(src, dict):
                        extracted.append(src)
                    elif isinstance(hit.get("source"), dict):
                        extracted.append(hit.get("source"))
                    else:
                        extracted.append(hit)
                if extracted:
                    return extracted

        # Common list containers seen in REST/GraphQL-like payloads.
        candidate_lists = []

        direct_keys = ["results", "hackathons", "items", "nodes"]
        for key in direct_keys:
            value = payload.get(key)
            if isinstance(value, list):
                candidate_lists.append(value)

        data = payload.get("data")
        if isinstance(data, list):
            candidate_lists.append(data)
        elif isinstance(data, dict):
            for key in direct_keys:
                value = data.get(key)
                if isinstance(value, list):
                    candidate_lists.append(value)

            for value in data.values():
                if isinstance(value, dict):
                    for key in direct_keys:
                        nested = value.get(key)
                        if isinstance(nested, list):
                            candidate_lists.append(nested)
                    edges = value.get("edges")
                    if isinstance(edges, list):
                        candidate_lists.append([e.get("node") for e in edges if isinstance(e, dict) and isinstance(e.get("node"), dict)])

        for lst in candidate_lists:
            if not lst:
                continue
            dict_items = [x for x in lst if isinstance(x, dict)]
            if dict_items:
                return dict_items

        return []

    def _extract_link(self, h: dict) -> str:
        candidates = [
            h.get("url"),
            h.get("seo_url"),
            h.get("applied_url"),
            h.get("redirect_url"),
        ]
        slug = (h.get("slug") or "").strip()
        for raw in candidates:
            link = normalize_hackathon_url(raw, self.platform_name, slug=slug)
            if link:
                return link

        if slug:
            return normalize_hackathon_url(None, self.platform_name, slug=slug)
        return ""

    def _normalize_date(self, raw_date) -> str | None:
        if not raw_date:
            return None
        text = str(raw_date).strip()
        if not text:
            return None
        if "T" in text:
            text = text.split("T")[0]
        if len(text) >= 10:
            text = text[:10]
        try:
            datetime.strptime(text, "%Y-%m-%d")
            return text
        except ValueError:
            return None

    def _extract_themes(self, raw_themes) -> list[str]:
        if not isinstance(raw_themes, list):
            return []
        themes: list[str] = []
        for t in raw_themes:
            if isinstance(t, str) and t.strip():
                themes.append(t.strip())
            elif isinstance(t, dict):
                name = t.get("name") or t.get("title") or t.get("label")
                if isinstance(name, str) and name.strip():
                    themes.append(name.strip())
        return themes

    def _extract_prize(self, h: dict) -> str | None:
        direct_fields = ["prize", "prize_amount", "total_prize", "cash_prize"]
        for field in direct_fields:
            value = h.get(field)
            if value in (None, "", [], {}):
                continue
            return str(value)

        prizes = h.get("prizes")
        if isinstance(prizes, list):
            prize_parts: list[str] = []
            for p in prizes:
                if isinstance(p, str) and p.strip():
                    prize_parts.append(p.strip())
                    continue
                if isinstance(p, dict):
                    amount = p.get("amount") or p.get("value") or p.get("prize")
                    label = p.get("title") or p.get("name") or p.get("position")
                    if amount and label:
                        prize_parts.append(f"{label}: {amount}")
                    elif amount:
                        prize_parts.append(str(amount))
                    elif label:
                        prize_parts.append(str(label))
            if prize_parts:
                return "; ".join(prize_parts[:3])

        return None

    def _enrich_missing_dates(self, items: list[HackathonItem], context: BrowserContext) -> list[HackathonItem]:
        """Visit detail pages for items missing dates to extract registration end date."""
        enriched = []
        resolved_dates = 0
        failed_detail = 0
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
                    resolved_dates += 1
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
                failed_detail += 1
                enriched.append(item)

        self.logger.info(
            f"Devfolio enrichment summary: resolved_missing_dates={resolved_dates}, "
            f"detail_page_failures={failed_detail}"
        )

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
            link = normalize_hackathon_url(href, self.platform_name)
            if not link:
                continue
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
        self.logger.info(f"Devfolio fallback DOM items={len(items)}")
        return items

    def _log_sample_links(self, items: list[HackathonItem]) -> None:
        sample_links = [item.link for item in items[:3] if item.link]
        if sample_links:
            self.logger.info(f"Devfolio sample links: {sample_links}")
