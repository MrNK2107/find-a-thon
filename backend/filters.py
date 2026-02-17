import re


CHENNAI_KEYWORDS = [
    "chennai", "thandalam", "kattankulathur", "omr", "guindy",
    "vadapalani", "tambaram", "chromepet", "avadi", "porur",
    "sholinganallur", "velachery", "adyar", "nungambakkam",
    "thiruvanmiyur", "sriperumbudur", "chengalpattu", "kelambakkam",
]

_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in CHENNAI_KEYWORDS) + r")\b",
    re.IGNORECASE,
)


def is_chennai(location: str) -> bool:
    if not location:
        return False
    return bool(_PATTERN.search(location))


def filter_chennai(items: list) -> list:
    return [i for i in items if is_chennai(getattr(i, "location", "") or "")]
