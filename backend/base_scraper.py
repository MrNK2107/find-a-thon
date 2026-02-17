import logging
import random
from abc import ABC, abstractmethod
from playwright.sync_api import sync_playwright, Page, BrowserContext

from models import HackathonItem

try:
    from playwright_stealth import Stealth
    _stealth = Stealth()
    HAS_STEALTH = True
except ImportError:
    _stealth = None
    HAS_STEALTH = False

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


class GenericScraper(ABC):
    platform_name: str = "Unknown"

    def __init__(self):
        self.logger = logging.getLogger(self.platform_name)
        self._captured_responses: list[dict] = []

    def _random_ua(self) -> str:
        return random.choice(USER_AGENTS)

    def _create_context(self, playwright_instance) -> tuple:
        browser = playwright_instance.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=self._random_ua(),
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
        )
        page = context.new_page()
        if HAS_STEALTH and _stealth:
            _stealth.apply_stealth_sync(page)
        return browser, context, page

    def _intercept_api(self, page: Page, url_pattern: str, target_url: str):
        def _handle_response(response):
            if url_pattern in response.url:
                try:
                    self._captured_responses.append(response.json())
                except Exception:
                    pass

        page.on("response", _handle_response)
        page.goto(target_url, wait_until="networkidle", timeout=30000)

    def _safe_text(self, page: Page, selector: str, default: str = "") -> str:
        try:
            el = page.query_selector(selector)
            return el.inner_text().strip() if el else default
        except Exception:
            return default

    def _safe_attr(self, page: Page, selector: str, attr: str, default: str = "") -> str:
        try:
            el = page.query_selector(selector)
            return el.get_attribute(attr) or default if el else default
        except Exception:
            return default

    def run(self) -> list[HackathonItem]:
        self.logger.info(f"Starting {self.platform_name} scraper")
        self._captured_responses.clear()
        pw = sync_playwright().start()
        try:
            browser, context, page = self._create_context(pw)
            try:
                results = self.scrape(page, context)
                self.logger.info(f"{self.platform_name}: scraped {len(results)} items")
                return results
            finally:
                context.close()
                browser.close()
        except Exception as e:
            self.logger.error(f"{self.platform_name} failed: {e}")
            return []
        finally:
            pw.stop()

    @abstractmethod
    def scrape(self, page: Page, context: BrowserContext) -> list[HackathonItem]:
        ...
