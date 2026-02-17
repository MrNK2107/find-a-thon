from models import HackathonItem


class DeduplicationEngine:
    def __init__(self):
        self._seen: set[str] = set()

    def deduplicate(self, items: list[HackathonItem]) -> list[HackathonItem]:
        unique = []
        for item in items:
            h = item.dedup_hash
            if h not in self._seen:
                self._seen.add(h)
                unique.append(item)
        return unique

    def reset(self):
        self._seen.clear()
