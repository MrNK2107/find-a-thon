import os
import time
import logging
import re
from datetime import datetime, timezone
from utils import get_supabase_client, setup_logging, parse_date_flexible, normalize_hackathon_url
from models import HackathonItem
from dedup import DeduplicationEngine
from filters import is_chennai
from unstop import UnstopScraper
from devfolio import DevfolioScraper
from devpost import DevpostScraper
from hackerearth import HackerEarthScraper
from knowafest import KnowafestScraper
from campus_karma import CampusKarmaScraper
from allcollegeevent import AllCollegeEventScraper
from eventbrite import EventbriteScraper
from community_scrapers import (
    GDGChennaiScraper,
    MeetupScraper,
    SRMScraper,
    VitChennaiScraper,
    SSNScraper,
)

logger = setup_logging("main_runner")

ALL_SCRAPERS = [
    UnstopScraper,
    DevfolioScraper,
    DevpostScraper,
    HackerEarthScraper,
    KnowafestScraper,
    CampusKarmaScraper,
    AllCollegeEventScraper,
    GDGChennaiScraper,
    MeetupScraper,
    EventbriteScraper,
    SRMScraper,
    VitChennaiScraper,
    SSNScraper,
]

# Keep upload payload limited to columns that exist in the base hackathons table.
# This prevents runtime insert errors when optional enrichment columns are not
# present in a deployed Supabase schema.
CORE_UPLOAD_FIELDS = {
    "title",
    "mode",
    "source_quality",
    "category",
    "location_group",
    "reg_end_date",
    "link",
    "image_url",
    "source",
    "description",
    "is_closed",
    "themes",
    "prize",
    "organizer",
    "location",
    "is_free",
    "registration_fee",
    "tags",
    "status",
    "last_synced_at",
}

RELEVANT_KEYWORDS = {
    "hackathon",
    "hackfest",
    "ideathon",
    "datathon",
    "codeathon",
    "coding challenge",
    "innovation challenge",
    "capture the flag",
    "ctf",
}

IRRELEVANT_KEYWORDS = {
    "webinar",
    "workshop",
    "masterclass",
    "seminar",
    "orientation",
    "bootcamp",
}

ONLINE_KEYWORDS = {"online", "virtual", "remote"}
OFFLINE_KEYWORDS = {"offline", "on-site", "onsite", "in-person", "in person"}
HYBRID_KEYWORDS = {"hybrid"}
BIG_BRAND_KEYWORDS = {
    "microsoft",
    "google",
    "amazon",
    "adobe",
    "ibm",
    "salesforce",
    "oracle",
    "intel",
    "walmart",
    "tcs",
    "infosys",
    "accenture",
    "mlh",
    "national",
    "global",
    "international",
}

BEGINNER_KEYWORDS = {
    "beginner",
    "beginners",
    "student",
    "students",
    "freshers",
    "entry level",
    "first timer",
    "first-time",
}

PREMIUM_SOURCES = {"devfolio"}
LOCAL_SOURCES = {"campuskarma", "allcollegeevent", "gdg chennai", "gdg", "srm", "vit chennai", "ssn"}
PRACTICE_SOURCES = {"knowafest", "meetup", "eventbrite"}


def _combined_text(row: dict) -> str:
    fields = [
        str(row.get("title") or ""),
        str(row.get("description") or ""),
        str(row.get("location") or ""),
        str(row.get("organizer") or ""),
        str(row.get("prize") or ""),
        " ".join(str(t) for t in (row.get("themes") or [])),
    ]
    return " ".join(fields).lower()


def normalize_location(location: str | None) -> str:
    value = re.sub(r"\s+", " ", str(location or "")).strip()
    value = value.strip(" ,;-/")
    return value


def classify_location_group(mode: str, location: str) -> str:
    if (mode or "").strip().lower() == "online":
        return "Online"
    if is_chennai(location):
        return "Chennai / Nearby"
    return "Other cities"


def detect_mode(item: HackathonItem, row: dict) -> str:
    text = _combined_text(row)
    has_hybrid = any(keyword in text for keyword in HYBRID_KEYWORDS)
    has_online = any(keyword in text for keyword in ONLINE_KEYWORDS)
    has_offline = item.is_offline or any(keyword in text for keyword in OFFLINE_KEYWORDS)

    if has_hybrid or (has_online and has_offline):
        return "Hybrid"
    if has_offline:
        return "Offline"
    return "Online"


def detect_fee(row: dict) -> tuple[bool, float | None]:
    text = _combined_text(row)
    free_signals = [
        "free",
        "no fee",
        "no registration fee",
        "zero fee",
        "free registration",
    ]
    paid_signals = ["paid", "entry fee", "registration fee"]

    amount_match = re.search(
        r"(?:inr|rs\.?|₹|usd|\$)\s*([0-9]+(?:[.,][0-9]{1,2})?)",
        text,
        flags=re.IGNORECASE,
    )

    registration_fee = None
    if amount_match:
        amount_raw = amount_match.group(1).replace(",", "")
        try:
            registration_fee = float(amount_raw)
        except ValueError:
            registration_fee = None

    has_free_signal = any(signal in text for signal in free_signals)
    has_paid_signal = any(signal in text for signal in paid_signals) or (registration_fee is not None and registration_fee > 0)

    if has_free_signal and not has_paid_signal:
        return True, 0.0 if registration_fee is None else registration_fee
    if has_paid_signal:
        return False, registration_fee
    return True, registration_fee


def classify_category(row: dict) -> str:
    text = _combined_text(row)
    source = str(row.get("source") or "").strip().lower()
    location_group = str(row.get("location_group") or "").strip().lower()

    if source in PREMIUM_SOURCES or any(keyword in text for keyword in BIG_BRAND_KEYWORDS):
        return "premium"

    if source in PRACTICE_SOURCES:
        return "practice"

    if location_group == "chennai / nearby" and (source in LOCAL_SOURCES or "college" in text or "institute" in text):
        return "local"

    if location_group == "online":
        return "practice"

    if source in LOCAL_SOURCES:
        return "local"

    return "practice"


def is_clearly_irrelevant(row: dict) -> bool:
    text = _combined_text(row)
    has_irrelevant_signal = any(keyword in text for keyword in IRRELEVANT_KEYWORDS)
    has_relevant_signal = any(keyword in text for keyword in RELEVANT_KEYWORDS)
    return has_irrelevant_signal and not has_relevant_signal


def build_tags(row: dict) -> list[str]:
    text = _combined_text(row)
    category = str(row.get("category") or "").strip().lower()
    location_group = str(row.get("location_group") or "").strip().lower()
    is_free = bool(row.get("is_free"))

    tags: list[str] = []

    if location_group == "chennai / nearby":
        tags.append("Chennai")

    if category == "premium" or location_group == "other cities":
        tags.append("Travel Worthy")

    if is_free or any(keyword in text for keyword in BEGINNER_KEYWORDS) or category in {"local", "practice"}:
        tags.append("Beginner Friendly")

    if category == "premium" or any(keyword in text for keyword in ["competition", "global", "national", "major"]):
        tags.append("High Competition")

    # Preserve order while de-duplicating.
    seen = set()
    unique_tags = []
    for tag in tags:
        if tag not in seen:
            seen.add(tag)
            unique_tags.append(tag)
    return unique_tags


def _source_quality_rank(value: str | None) -> int:
    ranking = {"premium": 0, "curated": 1, "local": 2}
    return ranking.get((value or "").strip().lower(), 1)


from playwright.sync_api import sync_playwright

def run_all_scrapers() -> list[HackathonItem]:
    results: list[HackathonItem] = []
    
    with sync_playwright() as pw:
        # Create singleton browser
        browser = pw.chromium.launch(headless=True)
        # Using a default context for scrapers that can share it
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
        )
        page = context.new_page()
        
        try:
            from playwright_stealth import Stealth
            Stealth().apply_stealth_sync(page)
        except ImportError:
            pass
            
        for scraper_cls in ALL_SCRAPERS:
            scraper = scraper_cls()
            scraper_start = time.time()
            try:
                data = scraper.run(shared_pw=pw, shared_browser=browser, shared_context=context, shared_page=page)
                results.extend(data)
                duration = time.time() - scraper_start
                logger.info(f"[TELEMETRY] {scraper.platform_name}: {len(data)} items in {duration:.2f}s")
                if not data:
                    logger.warning(
                        f"[TELEMETRY] {scraper.platform_name}: returned 0 items "
                        "(possible selector/API drift or source-side empty listing)"
                    )
            except Exception as e:
                logger.exception(f"{scraper.platform_name} crashed: {e}")
                
        # Clean up global context
        context.close()
        browser.close()
        
    return results


def normalize_and_filter(items: list[HackathonItem]) -> list[dict]:
    """Convert items to Supabase rows, dropping any without a valid reg_end_date
    and any whose registration has already expired."""
    today = datetime.now(timezone.utc).date()
    cleaned = []
    dropped_no_date = 0
    dropped_expired = 0
    dropped_offline_non_chennai = 0
    dropped_irrelevant = 0
    dropped_invalid_link = 0

    for item in items:
        row = item.to_supabase_dict()

        link = normalize_hackathon_url(row.get("link"), row.get("source", ""))
        if not link:
            logger.warning(f"Dropping row with invalid link: {row.get('title', '')} -> {row.get('link', '')}")
            dropped_invalid_link += 1
            continue
        row["link"] = link

        row["mode"] = detect_mode(item, row)
        row["source_quality"] = row.get("source_quality") or "curated"
        row["location"] = normalize_location(row.get("location"))
        row["location_group"] = classify_location_group(row["mode"], row["location"])
        row["is_free"], row["registration_fee"] = detect_fee(row)
        row["category"] = classify_category(row)
        row["tags"] = build_tags(row)

        # Preserve topical themes from the scrapers while keeping curation tags separate.
        row["themes"] = [str(theme).strip() for theme in (row.get("themes") or []) if str(theme).strip()]

        if is_clearly_irrelevant(row):
            dropped_irrelevant += 1
            continue

        if row["mode"] == "Offline" and row["category"] != "premium" and row["location_group"] != "Chennai / Nearby":
            dropped_offline_non_chennai += 1
            continue

        # --- Normalise and validate the registration end date ---
        reg_end = row.get("reg_end_date")
        normalized = parse_date_flexible(reg_end)

        if not normalized:
            dropped_no_date += 1
            continue  # HIGH PRIORITY: every row MUST have a date

        row["reg_end_date"] = normalized

        # Drop enrichment keys that may not exist in all Supabase schemas.
        row = {k: v for k, v in row.items() if k in CORE_UPLOAD_FIELDS}

        # Drop already-expired hackathons
        try:
            end_date = datetime.strptime(normalized, "%Y-%m-%d").date()
            if end_date < today:
                dropped_expired += 1
                continue
        except ValueError:
            dropped_no_date += 1
            continue

        cleaned.append(row)

    cleaned.sort(
        key=lambda row: (
            _source_quality_rank(row.get("source_quality")),
            row.get("reg_end_date") or "9999-12-31",
            (row.get("title") or "").lower(),
        )
    )

    logger.info(
        f"Normalize: kept {len(cleaned)}, "
        f"dropped {dropped_invalid_link} (invalid link), "
        f"dropped {dropped_no_date} (no date), "
        f"dropped {dropped_expired} (expired), "
        f"dropped {dropped_irrelevant} (irrelevant), "
        f"dropped {dropped_offline_non_chennai} (offline non-Chennai)"
    )
    return cleaned


def upload_data(data: list[dict]):
    if not data:
        logger.warning("No data to upload")
        return

    supabase = get_supabase_client()
    batch_size = int(os.getenv("SUPABASE_UPSERT_BATCH_SIZE", "200"))
    count = 0
    errors = 0
    disabled_fields: set[str] = set()

    logger.info(f"Uploading {len(data)} items to Supabase")
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        payload_batch = [
            {k: v for k, v in row.items() if k not in disabled_fields}
            for row in batch
        ]
        try:
            supabase.table("hackathons").upsert(payload_batch, on_conflict="link").execute()
            count += len(payload_batch)
        except Exception as e:
            message = str(e)
            missing_col_match = re.search(r'column "([a-zA-Z0-9_]+)" of relation "hackathons" does not exist', message)
            if missing_col_match:
                missing_col = missing_col_match.group(1)
                disabled_fields.add(missing_col)
                logger.warning(
                    f"Upload retry: disabling missing column '{missing_col}' and retrying current batch"
                )
                retry_batch = [
                    {k: v for k, v in row.items() if k not in disabled_fields}
                    for row in batch
                ]
                try:
                    supabase.table("hackathons").upsert(retry_batch, on_conflict="link").execute()
                    count += len(retry_batch)
                    continue
                except Exception as retry_error:
                    errors += len(batch)
                    logger.error(f"Upload batch retry failed: {retry_error}")
                    continue

            errors += len(batch)
            logger.error(f"Upload batch error: {e}")

    logger.info(f"Upload done. Synced: {count}, Errors: {errors}")


def delete_expired():
    """Delete hackathons whose reg_end_date has passed."""
    supabase = get_supabase_client()
    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        result = supabase.table("hackathons").delete().lt("reg_end_date", today_str).execute()
        deleted = len(result.data) if result.data else 0
        logger.info(f"Deleted {deleted} expired hackathons (reg_end_date < {today_str})")
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")


def main():
    start = time.time()

    raw_items = run_all_scrapers()
    logger.info(f"Total raw items: {len(raw_items)}")

    source_counts = {}
    for item in raw_items:
        src = item.source_platform or "Unknown"
        source_counts[src] = source_counts.get(src, 0) + 1
    if source_counts:
        logger.info(f"Raw items by source: {source_counts}")

    engine = DeduplicationEngine()
    unique_items = engine.deduplicate(raw_items)
    logger.info(f"After dedup: {len(unique_items)} (removed {len(raw_items) - len(unique_items)} dupes)")

    normalized_items = []
    invalid_link_count = 0
    for item in unique_items:
        normalized_link = normalize_hackathon_url(item.link, item.source_platform)
        if not normalized_link:
            invalid_link_count += 1
            logger.warning(f"Skipping invalid link for {item.source_platform}: {item.title} -> {item.link}")
            continue
        item.link = normalized_link
        normalized_items.append(item)

    if invalid_link_count:
        logger.info(f"Link normalization skipped {invalid_link_count} items with invalid URLs")

    chennai_count = sum(1 for i in normalized_items if is_chennai(i.location))
    logger.info(f"Chennai-area events: {chennai_count}")

    supabase_rows = normalize_and_filter(normalized_items)
    upload_data(supabase_rows)
    delete_expired()

    duration = time.time() - start
    logger.info(f"All tasks completed in {duration:.2f}s")


if __name__ == "__main__":
    main()
