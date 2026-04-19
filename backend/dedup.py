from models import HackathonItem
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
import logging

try:
    from thefuzz import fuzz
except ImportError:
    # fallback if not installed somehow
    fuzz = None

logger = logging.getLogger(__name__)

class DeduplicationEngine:
    def __init__(self):
        self._accepted: list[HackathonItem] = []
        self._seen_urls: set[str] = set()

    def _normalize_url(self, url: str) -> str:
        """Removes tracking params from URL to prevent duplicate entries based on query strings."""
        if not url:
            return ""
        try:
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            # Remove common tracking parameters
            for param in ['utm_source', 'utm_medium', 'utm_campaign', 'ref']:
                qs.pop(param, None)
            
            # Reconstruct URL
            new_query = urlencode(qs, doseq=True)
            normalized = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
            # Removes trailing slash for consistency
            return normalized.rstrip('/')
        except Exception:
            return url.rstrip('/')

    def _is_fuzzy_duplicate(self, title: str) -> bool:
        """Checks if there is a highly similar title in the accepted list."""
        if not fuzz:
            return False
            
        for item in self._accepted:
            # Token sort ratio ignores word order (e.g., "Hackathon 2024" vs "2024 Hackathon")
            similarity = fuzz.token_sort_ratio(title.lower(), item.title.lower())
            if similarity > 85:
                return True
        return False

    def deduplicate(self, items: list[HackathonItem]) -> list[HackathonItem]:
        unique = []
        for item in items:
            normalized_url = self._normalize_url(item.link)
            
            if normalized_url and normalized_url in self._seen_urls:
                continue
                
            if self._is_fuzzy_duplicate(item.title):
                continue
                
            self._seen_urls.add(normalized_url)
            self._accepted.append(item)
            unique.append(item)
            
        return unique

    def reset(self):
        self._accepted.clear()
        self._seen_urls.clear()
