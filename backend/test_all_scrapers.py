import asyncio
import time
from typing import Any

from unstop import UnstopScraper
from devfolio import DevfolioScraper
from devpost import DevpostScraper
from hackerearth import HackerEarthScraper
from knowafest import KnowafestScraper
from campus_karma import CampusKarmaScraper
from allcollegeevent import AllCollegeEventScraper


SCRAPERS = [
    UnstopScraper,
    DevfolioScraper,
    DevpostScraper,
    HackerEarthScraper,
    KnowafestScraper,
    CampusKarmaScraper,
    AllCollegeEventScraper,
]


def _fmt_seconds(value: float) -> str:
    return f"{value:.2f}s"


def _print_summary(rows: list[dict[str, Any]]):
    headers = ["scraper name", "items returned", "time taken", "errors"]
    widths = [
        max(len(headers[0]), *(len(str(r["name"])) for r in rows)),
        max(len(headers[1]), *(len(str(r["count"])) for r in rows)),
        max(len(headers[2]), *(len(str(r["duration"])) for r in rows)),
        max(len(headers[3]), *(len(str(r["error"])) for r in rows)),
    ]

    def fmt_row(values):
        return " | ".join(str(v).ljust(widths[i]) for i, v in enumerate(values))

    divider = "-+-".join("-" * w for w in widths)

    print("\nSummary")
    print(fmt_row(headers))
    print(divider)
    for r in rows:
        print(fmt_row([r["name"], r["count"], r["duration"], r["error"]]))


async def run_scraper(scraper_cls):
    scraper = scraper_cls()
    started = time.perf_counter()
    error = ""
    count = 0

    try:
        items = await asyncio.to_thread(scraper.run)
        count = len(items)
    except Exception as exc:
        error = str(exc)

    elapsed = time.perf_counter() - started
    return {
        "name": scraper.platform_name,
        "count": count,
        "duration": _fmt_seconds(elapsed),
        "error": error,
    }


async def main():
    rows = []

    for scraper_cls in SCRAPERS:
        row = await run_scraper(scraper_cls)
        rows.append(row)
        print(f"[{row['name']}] items={row['count']} time={row['duration']} error={row['error'] or 'None'}")

    _print_summary(rows)


if __name__ == "__main__":
    asyncio.run(main())
