import hashlib
from typing import Optional
from pydantic import BaseModel, Field, computed_field


class HackathonItem(BaseModel):
    title: str
    organizer: str = ""
    date: Optional[str] = None
    location: str = ""
    link: str
    source_platform: str
    is_offline: bool = False
    image_url: Optional[str] = None
    themes: str = ""

    @computed_field
    @property
    def dedup_hash(self) -> str:
        raw = f"{self.title.strip().lower()}|{self.date or ''}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def to_supabase_dict(self) -> dict:
        return {
            "title": self.title,
            "mode": "Offline" if self.is_offline else "Online",
            "reg_end_date": self.date,
            "link": self.link,
            "image_url": self.image_url,
            "source": self.source_platform,
        }
