import os
import re
import logging
from datetime import datetime, date, timedelta
import dateparser
from dateparser.search import search_dates
from duckduckgo_search import DDGS
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")


def get_env_bool(key, default=False):
    value = os.environ.get(key)
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def get_env_int(key, default=None, min_value=None):
    value = os.environ.get(key)
    if value is None:
        return default
    try:
        parsed = int(value)
        if min_value is not None and parsed < min_value:
            return min_value
        return parsed
    except ValueError:
        return default


def setup_logging(name):
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler()],
    )
    return logging.getLogger(name)


def coerce_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "y"}
    return False


def parse_date_flexible(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date().strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        try:
            results = search_dates(
                text,
                settings={"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
            )
            if results:
                return results[-1][1].strftime("%Y-%m-%d")
        except Exception:
            pass
        try:
            dt = dateparser.parse(
                text,
                settings={"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
            )
            if dt:
                return dt.strftime("%Y-%m-%d")
        except Exception:
            pass
    return None


def extract_reg_end_date_from_text(text):
    if not text:
        return None

    normalized = " ".join(str(text).split())
    lowered = normalized.lower()

    countdown_match = re.search(
        r"(\d+)\s*d(?:ays?)?[^0-9]*(\d+)?\s*h(?:ours?)?[^0-9]*(\d+)?\s*m",
        lowered,
    )
    if countdown_match:
        days = int(countdown_match.group(1) or 0)
        hours = int(countdown_match.group(2) or 0)
        minutes = int(countdown_match.group(3) or 0)
        future_date = datetime.now() + timedelta(days=days, hours=hours, minutes=minutes)
        return future_date.strftime("%Y-%m-%d")

    strong_patterns = [
        r"(?:registration|application|submission)s?\s*(?:ends?|closes?|deadline)\s*(?:on|is|at)?\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})",
        r"(?:registration|application|submission)s?\s*(?:ends?|closes?|deadline)\s*(?:on|is|at)?\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
        r"deadline\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})",
    ]

    for pattern in strong_patterns:
        match = re.search(pattern, lowered)
        if match:
            try:
                dt = dateparser.parse(match.group(1), settings={"PREFER_DATES_FROM": "future"})
                if dt:
                    return dt.strftime("%Y-%m-%d")
            except Exception:
                pass

    keywords = [
        "registration ends", "registration end", "registration closes",
        "closes on", "closes in", "deadline", "submission deadline",
        "last date", "apply by", "applications close", "ends on",
    ]

    for key in keywords:
        if key in lowered:
            start = lowered.index(key)
            snippet = normalized[start : start + 150]
            try:
                results = search_dates(
                    snippet,
                    settings={"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
                )
                if results:
                    return results[-1][1].strftime("%Y-%m-%d")
            except Exception:
                pass

    if len(normalized) < 1000:
        try:
            results = search_dates(
                normalized,
                settings={"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
            )
            if results:
                return results[-1][1].strftime("%Y-%m-%d")
        except Exception:
            pass

    return None


def search_date_on_web(query_title):
    if not query_title:
        return None
    query = f"{query_title} hackathon registration deadline 2026"
    _logger = logging.getLogger("utils")
    _logger.info(f"Web search fallback: {query}")
    try:
        results = DDGS().text(query, max_results=3)
        for res in results:
            snippet = res.get("body", "") + " " + res.get("title", "")
            date_found = extract_reg_end_date_from_text(snippet)
            if date_found:
                return date_found
    except Exception as e:
        _logger.warning(f"Web search failed: {e}")
    return None


def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing Supabase environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)
