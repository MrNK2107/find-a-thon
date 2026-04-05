# Find-a-thon Context

## 1) Project Snapshot

Find-a-thon is a two-part hackathon discovery system:

- A Python backend scraper pipeline that aggregates upcoming hackathons from multiple platforms, normalizes and deduplicates records, then upserts them to Supabase.
- A Next.js frontend that reads from Supabase and renders a filtered grid of hackathons.

Primary objective: keep a single `hackathons` table populated with fresh, non-expired, deduplicated events ordered by registration deadline.

---

## 2) Repository Layout

```text
find-a-thon/
  README.md
  backend/
    main.py                  # pipeline entrypoint
    base_scraper.py          # shared scraper runtime + Playwright helpers
    models.py                # HackathonItem model + DB row mapping
    dedup.py                 # hash-based deduplication
    filters.py               # Chennai keyword filters
    utils.py                 # logging, env parsing, date parsing, Supabase client
    unstop.py                # Unstop scraper
    devfolio.py              # Devfolio scraper
    devpost.py               # Devpost scraper
    hackerearth.py           # HackerEarth scraper
    knowafest.py             # Knowafest scraper (Chennai-focused)
    campus_karma.py          # CampusKarma scraper (Chennai-focused)
    allcollegeevent.py       # AllCollegeEvent scraper (Chennai-focused)
    requirements.txt
    run_log.txt
  frontend/
    package.json
    README.md
    src/
      app/
        layout.js
        page.js              # server component, Supabase query
      components/
        Navbar.jsx
        FilterBar.jsx
        HackathonList.jsx
        HackathonCard.jsx
      lib/
        supabaseClient.js
```

---

## 3) Backend Architecture

### 3.1 Orchestration (`backend/main.py`)

Main workflow:

1. Instantiate and run all scrapers in `ALL_SCRAPERS`.
2. Merge all raw `HackathonItem` objects.
3. Deduplicate using `DeduplicationEngine` (`title + date` hash).
4. Compute Chennai-area count via `is_chennai` (for logging/analytics).
5. Normalize rows and enforce strict date validity (`normalize_and_filter`).
6. Upsert rows to Supabase in batches (`upload_data`).
7. Delete expired rows from Supabase (`delete_expired`).

Key characteristics:

- Scraper failure isolation: one scraper crashing does not stop the full run.
- Strict date requirement before upload: items without parseable `reg_end_date` are dropped.
- Expired events are dropped before upload and cleaned up in DB.

### 3.2 Shared Scraper Runtime (`backend/base_scraper.py`)

`GenericScraper` provides:

- Headless Chromium Playwright setup.
- Randomized user-agent selection.
- Optional `playwright-stealth` application when installed.
- API/XHR response interception helper (`_intercept_api`).
- Safe selector helpers (`_safe_text`, `_safe_attr`).
- Standard `run()` wrapper with logging, browser lifecycle cleanup, and error handling.

### 3.3 Data Model (`backend/models.py`)

`HackathonItem` fields:

- `title` (required)
- `organizer`
- `date` (registration end date candidate)
- `location`
- `link` (required)
- `source_platform` (required)
- `is_offline`
- `image_url`
- `themes`

Derived behavior:

- `dedup_hash = sha256(lower(title) + "|" + date)`
- `to_supabase_dict()` maps to DB columns:
  - `title`
  - `mode` (`Offline`/`Online`)
  - `reg_end_date`
  - `link`
  - `image_url`
  - `source`

### 3.4 Deduplication (`backend/dedup.py`)

Simple in-memory dedup engine:

- Maintains `set` of seen hashes.
- Retains first seen item per hash.
- Process scope only (state not persisted across runs).

### 3.5 Date Intelligence (`backend/utils.py`)

Date parsing strategy (important for pipeline quality):

- `parse_date_flexible(value)`:
  - Handles `datetime`, `date`, or free-form string.
  - Uses `search_dates` and `dateparser`.
  - Normalizes to `YYYY-MM-DD`.

- `extract_reg_end_date_from_text(text)`:
  - Handles countdown-like strings (`Xd Yh Zm`), deadline patterns, keyword window scanning, and global fallback extraction.

- `search_date_on_web(query_title)`:
  - DuckDuckGo snippet fallback using `duckduckgo-search`.
  - Attempts date extraction from snippet/title text.

### 3.6 Geographic Filter (`backend/filters.py`)

- Regex keyword matching for Chennai and nearby localities.
- Used in pipeline for count logging (`chennai_count`) but not for hard filtering before upload.

---

## 4) Scrapers and Source Behavior

### 4.1 Unstop (`backend/unstop.py`)

- Target: `https://unstop.com/hackathons?oppstatus=open`
- Primary strategy: intercept API payload (`unstop.com/api/public/opportunity/search-new`)
- Fallback: DOM links (`/hackathon/`)
- Missing date enrichment: opens detail page, extracts date from body; then web-search fallback.

### 4.2 Devfolio (`backend/devfolio.py`)

- Target: `https://devfolio.co/hackathons/open`
- Primary strategy: intercept `api.devfolio.co`
- Fallback: DOM links (`/hackathons/`)
- Supports multiple API field names for end date.
- Missing date enrichment: detail page + web-search fallback.

### 4.3 Devpost (`backend/devpost.py`)

- Target: online upcoming hackathons listing.
- Strategy: DOM tile scraping (`.hackathon-tile`), scroll-until-stable.
- Date extraction from submission range text + detail-page enrichment.
- Captures image and themes when available.

### 4.4 HackerEarth (`backend/hackerearth.py`)

- Target: challenges listing.
- Strategy: flexible selector fallback for cards.
- Initial date extraction from card text; enriches missing dates from detail pages.

### 4.5 Knowafest (`backend/knowafest.py`)

- Target: Chennai city listing.
- Strategy: collect event links, then inspect detail pages.
- Filters detail pages to tech/hackathon-related content via keyword list.
- Extracts organizer/location hints and dates via regex + fallback extractors.
- Marks events as offline by default.

### 4.6 CampusKarma (`backend/campus_karma.py`)

- Target: main site.
- Strategy: broad event link discovery, title/href keyword filtering.
- Focused on hackathon-like candidates; Chennai/offline defaults.
- Date extraction via regex, generic extractor, web-search fallback.

### 4.7 AllCollegeEvent (`backend/allcollegeevent.py`)

- Target: main site (with optional click-through to Chennai links).
- Strategy: event card selectors + fallback anchor matching.
- Initial date extraction from card text + detail-page enrichment.
- Chennai/offline defaults.

---

## 5) Data Contract with Supabase

### 5.1 Expected table

Backend writes to table: `hackathons`

Observed upsert conflict key:

- `link` (must be unique or conflict-targeted in Supabase table constraints)

### 5.2 Columns used by backend

Write path expects these columns to exist:

- `title` (text)
- `mode` (text)
- `reg_end_date` (date/text parseable as date)
- `link` (text, unique suggested)
- `image_url` (text, nullable)
- `source` (text)

### 5.3 Columns used by frontend

Frontend reads `select('*')` and references:

- `id` (for list key in UI)
- `title`
- `link`
- `reg_end_date`
- `image_url`
- `source`
- `mode`
- `themes` (optional in UI)
- `description` (optional in UI, fallback text if absent)
- `is_closed` (optional; controls Closed/Live badge)

Implication:

- Some UI fields are optional and not populated by current backend (`description`, `is_closed`, typically `themes`).

---

## 6) Environment Variables

### 6.1 Backend

Required:

- `SUPABASE_URL`
- `SUPABASE_KEY`

Optional:

- `SUPABASE_UPSERT_BATCH_SIZE` (default `200`)

Backend loads `.env` via `python-dotenv`.

### 6.2 Frontend (`frontend/.env.local`)

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`frontend/src/lib/supabaseClient.js` throws immediately if either value is missing.

---

## 7) Dependencies

### 7.1 Backend (`backend/requirements.txt`)

- playwright
- playwright-stealth
- pydantic
- supabase
- python-dotenv
- dateparser
- beautifulsoup4
- duckduckgo-search

Notes:

- Playwright browsers must be installed separately after pip install.
- BeautifulSoup is currently listed but not obviously used in scanned files.

### 7.2 Frontend (`frontend/package.json`)

Runtime:

- next 14.x
- react 18
- react-dom 18
- @supabase/supabase-js

Dev:

- tailwindcss
- postcss
- autoprefixer
- eslint + eslint-config-next

---

## 8) Frontend Architecture

### 8.1 Rendering model

- `src/app/page.js` is an async Server Component.
- It queries Supabase directly on request and exports `dynamic = 'force-dynamic'` to avoid static caching.
- Hackathons are ordered by `reg_end_date ASC`.

### 8.2 Components

- `Navbar.jsx`: branding, static search input, static live count badge.
- `FilterBar.jsx`: platform/mode chips and urgency toggle.
- `HackathonList.jsx`: client-side filtering (`useMemo`) + grid/no-results states.
- `HackathonCard.jsx`: event card UI with source badge, status, date formatting, action button.

### 8.3 Filtering logic (`HackathonList`)

Supports:

- Source/mode filter (`all`, source names, mode labels)
- Urgency filter: registration deadline within next 7 days
- Search by `title`, `description`, `themes`

Current wiring note:

- `searchQuery` state exists in `HackathonList`, but there is no prop pipeline from `Navbar` input to update it.
- So search UI appears present but does not currently drive filtering.

---

## 9) End-to-End Data Flow

1. Scrapers gather `HackathonItem` records (API interception and/or DOM extraction).
2. Missing date enrichment attempts detail-page parsing.
3. Optional web search fallback tries to infer deadlines from snippets.
4. Global dedup by `title + date` hash.
5. Final normalization requires parseable, non-expired date.
6. Supabase upsert by `link` conflict key.
7. Frontend reads `hackathons` and applies client-side filters.

---

## 10) Operational Runbook

### 10.1 Backend local run

1. Create and activate Python environment.
2. Install requirements from `backend/requirements.txt`.
3. Install Playwright browser binaries.
4. Configure `.env` with Supabase credentials.
5. Run `python backend/main.py` from repository root (or run from `backend` with adjusted paths).

### 10.2 Frontend local run

1. `cd frontend`
2. `npm install`
3. Create `.env.local` with Supabase public values.
4. `npm run dev`
5. Open `http://localhost:3000`

---

## 11) Known Gaps / Risks

- Search bar is not wired to filter state (UI/behavior mismatch).
- Backend does not consistently populate fields used in UI (`description`, `is_closed`, often `themes`).
- Dedup key uses only `title + date`; similarly named events on same date could collide.
- Web search fallback can add latency and may return noisy date candidates.
- Scraper selectors are source-site fragile and may break as sites change markup.
- Some scraper defaults force `location='Chennai'` and `is_offline=True`, which may over-assume metadata.
- No explicit automated tests observed for scraper parsing, normalization, or frontend filtering behavior.

---

## 12) Suggested Next Improvements

1. Wire navbar search input to `HackathonList` search state.
2. Define and enforce a Supabase schema contract (including nullable/optional fields).
3. Add source-specific parser tests with fixture HTML/API payload snapshots.
4. Introduce run-level metrics (per-source success rate, missing-date rate, dropped reasons).
5. Add retry/backoff and timeout telemetry around detail-page enrichment.
6. Consider stronger dedup key (e.g., canonicalized URL + normalized title + source).

---

## 13) Quick File Index for New Contributors

- Start backend flow: `backend/main.py`
- Start scraper abstraction: `backend/base_scraper.py`
- Understand DB write shape: `backend/models.py`
- Troubleshoot date drops: `backend/utils.py`, `backend/main.py::normalize_and_filter`
- Understand frontend data fetch: `frontend/src/app/page.js`
- Understand filter UX: `frontend/src/components/HackathonList.jsx`, `frontend/src/components/FilterBar.jsx`

This document is intended as a living context file and should be updated whenever scraper logic, schema assumptions, or runtime configuration changes.
