import os
import re
import logging
from datetime import datetime, date, timedelta
from urllib.parse import urlparse
import dateparser
from dateparser.search import search_dates
try:
    from duckduckgo_search import DDGS
except Exception:
    DDGS = None
from supabase import create_client
from dotenv import load_dotenv
import requests

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


ENABLE_WEB_SEARCH_FALLBACK = get_env_bool("ENABLE_WEB_SEARCH_FALLBACK", default=False)
ENABLE_OLLAMA_FALLBACK = get_env_bool("ENABLE_OLLAMA_FALLBACK", default=False)
_UTILS_LOGGER = logging.getLogger("utils")

HACKATHON_URL_CONFIG = {
    "devfolio": {
        "domain": "devfolio.co",
        "base_url": "https://devfolio.co",
        "slug_path": "/hackathons/",
    },
    "unstop": {
        "domain": "unstop.com",
        "base_url": "https://unstop.com",
        "slug_path": "/hackathons/",
    },
}


def normalize_hackathon_url(raw_url: str | None, source_platform: str = "", slug: str | None = None) -> str:
    """Normalize a hackathon URL to a validated https URL for the given platform."""
    platform = (source_platform or "").strip().lower()
    config = HACKATHON_URL_CONFIG.get(platform)

    raw = str(raw_url).strip() if raw_url else ""
    slug_value = str(slug).strip() if slug else ""

    candidate = ""
    if raw:
        if raw.startswith("http://"):
            candidate = "https://" + raw[len("http://"):]
        elif raw.startswith("https://"):
            candidate = raw
        elif re.match(r"^[a-z0-9.-]+\.[a-z]{2,}(/|$)", raw, flags=re.IGNORECASE):
            candidate = f"https://{raw.lstrip('/')}"
        elif raw.startswith("/"):
            candidate = f"{config['base_url']}{raw}" if config else f"https://{raw.lstrip('/')}"
        elif "/" in raw:
            candidate = f"{config['base_url']}/{raw.lstrip('/')}" if config else f"https://{raw.lstrip('/')}"
        elif config:
            candidate = f"{config['base_url']}{config['slug_path']}{raw}"
        else:
            candidate = raw
    elif slug_value and config:
        candidate = f"{config['base_url']}{config['slug_path']}{slug_value}"

    if not candidate:
        return ""

    if platform == "unstop":
        candidate = candidate.replace("/hackathon/", "/hackathons/")
        if candidate.endswith("/hackathon"):
          candidate = candidate[:-len("/hackathon")] + "/hackathons"

    candidate = candidate.rstrip("/")
    parsed = urlparse(candidate)
    if parsed.scheme != "https" or not parsed.netloc:
        return ""

    if config and parsed.netloc.lower() != config["domain"]:
        return ""

    return candidate


def _format_datetime_as_date(dt: datetime) -> str:
    return dt.date().strftime("%Y-%m-%d")


def _choose_best_date(candidates: list[datetime]) -> str | None:
    if not candidates:
        return None
    today = datetime.now().date()
    future = [d for d in candidates if d.date() >= today]
    if future:
        return _format_datetime_as_date(min(future, key=lambda d: d.date()))
    return _format_datetime_as_date(max(candidates, key=lambda d: d.date()))


def _safe_parse_date(text: str) -> datetime | None:
    if not text:
        return None
    cleaned = text.strip().replace("st", "").replace("nd", "").replace("rd", "").replace("th", "")

    parse_attempts = [
        {"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
        {
            "PREFER_DATES_FROM": "future",
            "RETURN_AS_TIMEZONE_AWARE": False,
            "DATE_ORDER": "DMY",
        },
        {
            "PREFER_DATES_FROM": "future",
            "RETURN_AS_TIMEZONE_AWARE": False,
            "DATE_ORDER": "MDY",
        },
    ]

    for settings in parse_attempts:
        try:
            dt = dateparser.parse(cleaned, settings=settings)
            if dt:
                return dt
        except Exception:
            continue
    return None


def _extract_regex_date_candidates(text: str) -> list[str]:
    """Return likely date/date-range fragments using deterministic regexes."""
    if not text:
        return []

    candidates: list[str] = []
    patterns = [
        r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b",
        r"\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\b",
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
        r"\b\d{1,2}-\d{1,2}-\d{2,4}\b",
    ]

    lowered = text.lower()

    # Handle ranges like "Apr 20 - May 5, 2026" and "20 Apr - 5 May 2026".
    range_patterns = [
        r"\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2})\s*(?:-|to|–|—)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b",
        r"\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*)\s*(?:-|to|–|—)\s*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4})\b",
    ]
    for rp in range_patterns:
        for match in re.finditer(rp, lowered, flags=re.IGNORECASE):
            left = match.group(1)
            right = match.group(2)
            candidates.append(right)
            # If left misses year, borrow year from right.
            year_match = re.search(r"\b(\d{4})\b", right)
            if year_match:
                candidates.append(f"{left} {year_match.group(1)}")

    for pattern in patterns:
        for m in re.finditer(pattern, text, flags=re.IGNORECASE):
            candidates.append(m.group(0))

    # De-duplicate while preserving order.
    seen = set()
    unique = []
    for candidate in candidates:
        key = candidate.strip().lower()
        if key and key not in seen:
            seen.add(key)
            unique.append(candidate.strip())
    return unique


def _parse_best_regex_date(text: str) -> str | None:
    candidates = _extract_regex_date_candidates(text)
    parsed: list[datetime] = []
    for candidate in candidates:
        dt = _safe_parse_date(candidate)
        if dt:
            parsed.append(dt)
    return _choose_best_date(parsed)


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

        regex_pick = _parse_best_regex_date(text)
        if regex_pick:
            return regex_pick

        # Unix epoch support (seconds or milliseconds)
        if text.isdigit() and len(text) in {10, 13}:
            try:
                ts = int(text)
                if len(text) == 13:
                    ts = ts // 1000
                return datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
            except Exception:
                pass

        try:
            results = search_dates(
                text,
                settings={"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
            )
            if results:
                candidates = [dt for _, dt in results if isinstance(dt, datetime)]
                best = _choose_best_date(candidates)
                if best:
                    return best
        except Exception:
            pass

        dt = _safe_parse_date(text)
        if dt:
            return dt.strftime("%Y-%m-%d")
    return None

def extract_date_with_ollama(text):
    if not ENABLE_OLLAMA_FALLBACK:
        return None

    if not text:
        return None
        
    # Truncate text to avoid massive contexts
    truncated = text[:2000]
    
    prompt = f"""
    Extract ONLY the registration deadline date from this text. 
    Format your answer as YYYY-MM-DD.
    If the date is missing, return exactly "None".
    Do not output any reasoning or other words.
    
    Text: {truncated}
    """
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5",
                "prompt": prompt,
                "stream": False
            },
            timeout=5
        )
        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            if result and result.lower() != "none":
                # Validate it's a date string
                match = re.match(r"^\d{4}-\d{2}-\d{2}$", result)
                if match:
                    return result
        else:
            _UTILS_LOGGER.warning(f"Ollama fallback unavailable (status={response.status_code})")
    except Exception as e:
        _UTILS_LOGGER.warning(f"Ollama extraction unavailable: {e}")
        
    return None


def _extract_relative_deadline(lowered: str) -> str | None:
    # Patterns like: "closes in 5 days", "3 days left", "2d 4h 30m"
    now = datetime.now()

    compact = re.search(
        r"(\d+)\s*d(?:ays?)?[^0-9]*(\d+)?\s*h(?:ours?)?[^0-9]*(\d+)?\s*m",
        lowered,
    )
    if compact:
        days = int(compact.group(1) or 0)
        hours = int(compact.group(2) or 0)
        minutes = int(compact.group(3) or 0)
        return (now + timedelta(days=days, hours=hours, minutes=minutes)).strftime("%Y-%m-%d")

    days_only = re.search(
        r"(?:closes?\s*in|deadline\s*in|ends?\s*in)?\s*(\d+)\s*(?:days?|d)\s*(?:left|remaining|to\s*go|until)?",
        lowered,
    )
    if days_only:
        days = int(days_only.group(1))
        return (now + timedelta(days=days)).strftime("%Y-%m-%d")

    hours_only = re.search(r"(\d+)\s*(?:hours?|hrs?|h)\s*(?:left|remaining|to\s*go)", lowered)
    if hours_only:
        hours = int(hours_only.group(1))
        return (now + timedelta(hours=hours)).strftime("%Y-%m-%d")

    return None


def _extract_deadline_from_patterns(normalized: str, lowered: str) -> str | None:
    # Date ranges: pick end date (common in "start - deadline" snippets)
    range_match = re.search(
        r"([A-Za-z]{3,9}\s+\d{1,2}(?:,?\s*\d{4})?)\s*(?:-|to|–|—)\s*([A-Za-z]{3,9}\s+\d{1,2}(?:,?\s*\d{4})?)",
        normalized,
        re.IGNORECASE,
    )
    if range_match:
        dt = _safe_parse_date(range_match.group(2))
        if dt:
            return _format_datetime_as_date(dt)

    strong_patterns = [
        r"(?:registration|application|submission)s?\s*(?:ends?|closes?|deadline|last\s*date)\s*(?:on|is|at|by)?\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{2,4})",
        r"(?:registration|application|submission)s?\s*(?:ends?|closes?|deadline|last\s*date)\s*(?:on|is|at|by)?\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"deadline\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{2,4})",
        r"apply\s*by\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{2,4})",
    ]

    for pattern in strong_patterns:
        match = re.search(pattern, lowered, re.IGNORECASE)
        if match:
            dt = _safe_parse_date(match.group(1))
            if dt:
                return _format_datetime_as_date(dt)

    # Generic explicit-date finder fallback
    explicit_dates = re.findall(
        r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s*\d{2,4})\b",
        normalized,
        re.IGNORECASE,
    )
    parsed = []
    for candidate in explicit_dates:
        dt = _safe_parse_date(candidate)
        if dt:
            parsed.append(dt)
    chosen = _choose_best_date(parsed)
    if chosen:
        return chosen

    return None


def extract_reg_end_date_from_text(text):
    if not text:
        return None

    normalized = " ".join(str(text).split())
    lowered = normalized.lower()

    # 0) Regex-first extraction (deterministic, no external dependencies)
    regex_pick = _parse_best_regex_date(normalized)
    if regex_pick:
        return regex_pick

    # 1) Relative countdown phrases
    relative = _extract_relative_deadline(lowered)
    if relative:
        return relative

    # 2) Strong deterministic regex patterns
    from_patterns = _extract_deadline_from_patterns(normalized, lowered)
    if from_patterns:
        return from_patterns

    # 3) Keyword-window based extraction
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
                    candidates = [dt for _, dt in results if isinstance(dt, datetime)]
                    best = _choose_best_date(candidates)
                    if best:
                        return best
            except Exception:
                pass

    # 4) Global text parse fallback (local parser only)
    if len(normalized) < 1000:
        try:
            results = search_dates(
                normalized,
                settings={"PREFER_DATES_FROM": "future", "RETURN_AS_TIMEZONE_AWARE": False},
            )
            if results:
                candidates = [dt for _, dt in results if isinstance(dt, datetime)]
                best = _choose_best_date(candidates)
                if best:
                    return best
        except Exception:
            pass

    # 5) Optional LLM fallback for very noisy content
    llm_date = extract_date_with_ollama(normalized)
    if llm_date:
        return llm_date

    return None

def search_date_on_web(query_title):
    if not query_title:
        return None

    if not ENABLE_WEB_SEARCH_FALLBACK:
        return None

    if DDGS is None:
        _UTILS_LOGGER.warning("Web search fallback unavailable: duckduckgo-search not installed")
        return None

    query = f"{query_title} hackathon registration deadline 2026"
    _logger = _UTILS_LOGGER
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
