import os
import time
import logging
from datetime import datetime, timezone
from utils import get_supabase_client, setup_logging, parse_date_flexible
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

logger = setup_logging("main_runner")

ALL_SCRAPERS = [
    UnstopScraper,
    DevfolioScraper,
    DevpostScraper,
    HackerEarthScraper,
    KnowafestScraper,
    CampusKarmaScraper,
    AllCollegeEventScraper,
]


def run_all_scrapers() -> list[HackathonItem]:
    results: list[HackathonItem] = []
    for scraper_cls in ALL_SCRAPERS:
        scraper = scraper_cls()
        try:
            data = scraper.run()
            results.extend(data)
            logger.info(f"{scraper.platform_name}: {len(data)} items")
        except Exception as e:
            logger.error(f"{scraper.platform_name} crashed: {e}")
    return results


def normalize_and_filter(items: list[HackathonItem]) -> list[dict]:
    """Convert items to Supabase rows, dropping any without a valid reg_end_date
    and any whose registration has already expired."""
    today = datetime.now(timezone.utc).date()
    cleaned = []
    dropped_no_date = 0
    dropped_expired = 0

    for item in items:
        row = item.to_supabase_dict()

        # --- Normalise and validate the registration end date ---
        reg_end = row.get("reg_end_date")
        normalized = parse_date_flexible(reg_end)

        if not normalized:
            dropped_no_date += 1
            continue  # HIGH PRIORITY: every row MUST have a date

        row["reg_end_date"] = normalized

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

    logger.info(
        f"Normalize: kept {len(cleaned)}, "
        f"dropped {dropped_no_date} (no date), "
        f"dropped {dropped_expired} (expired)"
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

    logger.info(f"Uploading {len(data)} items to Supabase")
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        try:
            supabase.table("hackathons").upsert(batch, on_conflict="link").execute()
            count += len(batch)
        except Exception as e:
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

    engine = DeduplicationEngine()
    unique_items = engine.deduplicate(raw_items)
    logger.info(f"After dedup: {len(unique_items)} (removed {len(raw_items) - len(unique_items)} dupes)")

    chennai_count = sum(1 for i in unique_items if is_chennai(i.location))
    logger.info(f"Chennai-area events: {chennai_count}")

    supabase_rows = normalize_and_filter(unique_items)
    upload_data(supabase_rows)
    delete_expired()

    duration = time.time() - start
    logger.info(f"All tasks completed in {duration:.2f}s")


if __name__ == "__main__":
    main()
