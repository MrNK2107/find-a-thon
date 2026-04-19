import hashlib
from typing import Optional
from pydantic import BaseModel, Field, computed_field


from datetime import datetime, timezone


def classify_source_quality(source_platform: str) -> str:
    source = (source_platform or "").strip().lower()
    if source == "devfolio":
        return "premium"
    if source in {"unstop", "devpost", "hackerearth"}:
        return "curated"
    if source in {"meetup", "eventbrite"}:
        return "curated"
    if any(token in source for token in {"knowafest", "campuskarma", "allcollegeevent", "gdg", "srm", "vit chennai", "ssn"}):
        return "local"
    return "curated"

class HackathonItem(BaseModel):
    title: str
    organizer: str = ""
    date: Optional[str] = None
    location: str = ""
    link: str
    source_platform: str
    is_offline: bool = False
    image_url: Optional[str] = None
    themes: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    category: Optional[str] = None
    location_group: Optional[str] = None
    description: Optional[str] = None
    is_closed: bool = False
    prize: Optional[str] = None
    status: str = "active"
    last_synced_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @computed_field
    @property
    def dedup_hash(self) -> str:
        raw = f"{self.title.strip().lower()}|{self.date or ''}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def to_supabase_dict(self) -> dict:
        return {
            "title": self.title,
            "mode": "Offline" if self.is_offline else "Online",
            "source_quality": classify_source_quality(self.source_platform),
            "reg_end_date": self.date,
            "link": self.link,
            "image_url": self.image_url,
            "source": self.source_platform,
            "organizer": self.organizer,
            "themes": self.themes,
            "tags": self.tags,
            "category": self.category,
            "location_group": self.location_group,
            "description": self.description,
            "is_closed": self.is_closed,
            "prize": self.prize,
            "location": self.location,
            "status": self.status,
            "last_synced_at": self.last_synced_at
        }
