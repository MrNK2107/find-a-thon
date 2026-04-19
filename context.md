# Find-a-thon: Current Project Status (as of 2026-04-18)

## 1) Scope and Architecture

Find-a-thon is currently a dual-stack project:

1. Python backend scraper pipeline in `backend/`
2. Next.js + Firebase + Supabase frontend in `frontend/`

Current intended flow:

1. Scrapers collect hackathon rows from multiple sources
2. Data is deduplicated and date-normalized
3. Rows are upserted to Supabase `hackathons`
4. Frontend reads from Supabase and renders discovery/workspace pages

---

## 2) What Is Present and Working Well

### 2.1 Backend code structure is solid and complete

The backend has complete modular coverage:

- Shared scraper base and lifecycle: `backend/base_scraper.py`
- Source scrapers: `backend/unstop.py`, `backend/devfolio.py`, `backend/devpost.py`, `backend/hackerearth.py`, `backend/knowafest.py`, `backend/campus_karma.py`, `backend/allcollegeevent.py`
- Data model: `backend/models.py`
- Dedup logic: `backend/dedup.py`
- Date extraction and env helpers: `backend/utils.py`
- End-to-end orchestration: `backend/main.py`

`backend/main.py` includes:

- Shared Playwright session reuse across scrapers
- Per-scraper crash isolation (a failing scraper does not stop the run)
- Date normalization and expired-item filtering before upload
- Batched Supabase upsert
- Expired-record cleanup

### 2.2 Data model is richer than before

`backend/models.py` includes more metadata fields in `HackathonItem` and maps them to Supabase row shape:

- `description`, `themes`, `prize`, `organizer`, `location`, `is_closed`, `status`, `last_synced_at`

This aligns better with the frontend cards and detail pages than minimal title/date/link-only models.

### 2.3 Frontend compiles successfully right now

Verified in this workspace today:

- `npm run lint`: passes with no ESLint errors
- `npm run build`: passes and generates all app routes

This means the codebase is currently buildable, even though some runtime behavior is still incorrect.

### 2.4 Frontend app shell and auth scaffolding are in place

Working structural pieces:

- Root provider wiring via `frontend/src/app/providers.jsx` and `frontend/src/context/AuthContext.js`
- Protected route shell via `frontend/src/components/ProtectedPage.jsx`
- Navigation/workspace shell via `frontend/src/components/Sidebar.jsx`
- Email/password auth flow UI in `frontend/src/app/auth/page.jsx`

### 2.5 Main feature pages exist with non-trivial implementations

Implemented pages/components include:

- Explore: `frontend/src/app/explore/page.jsx`
- Saved: `frontend/src/app/saved/page.jsx`
- Deadlines: `frontend/src/app/deadlines/page.jsx`
- Tracker: `frontend/src/app/tracker/page.jsx`, `frontend/src/app/tracker/new/page.jsx`, `frontend/src/app/tracker/[id]/page.jsx`
- Dashboard: `frontend/src/app/dashboard/page.jsx`
- Team Finder: `frontend/src/app/team/page.jsx`

UI component depth is substantial (cards, forms, charts, badges, list filtering, bookmark button), so this is not a stub project.

---

## 3) What Is Currently Broken (Confirmed)

### 3.1 Core listing pages pass wrong prop name into `HackathonList`

`HackathonList` expects prop `hackathons`, but these pages pass `initialHackathons`:

- `frontend/src/app/explore/page.jsx`
- `frontend/src/app/saved/page.jsx`

`HackathonList` signature is:

- `frontend/src/components/HackathonList.jsx`
  - `const HackathonList = ({ hackathons, searchQuery = '', ... })`

Because the wrong prop key is passed, `hackathons` is `undefined` in these paths. The component then returns an empty list path and surfaces "No hackathons found" even if page state has data.

This is a confirmed runtime bug.

### 3.2 Explore page has incomplete filter wiring

`frontend/src/app/explore/page.jsx` imports `FilterBar` but does not render it. The list receives no `filters` prop from this page.

Result: filtering controls are not available on the active explore route despite filter-capable components existing.

### 3.3 Auth identity model is internally inconsistent across frontend modules

The app mostly uses Firebase auth state (`user.uid`) through `AuthContext`, but `frontend/src/app/hackathon/[id]/page.jsx` calls `supabase.auth.getUser()` for the user object.

That route then uses `user.id` when upserting `hackathon_entries`, while most other pages write/read using Firebase UID (`user.uid`).

This is a concrete mismatch likely to cause applied-entry writes/reads to diverge by page.

### 3.4 Schema files contradict each other for `saved_hackathons`

`database/schema_updates.sql` and `database/supabase_schema.sql` define incompatible types:

- One version uses `user_id uuid`, `hackathon_id bigint`
- Another version uses `user_id text`, `hackathon_id uuid`, plus `remind_me`

Frontend bookmark flow uses Firebase UID string (`user.uid`) and sends `hackathon_id` from `hackathons.id`.

Without a single active schema contract, this area is currently fragile and can fail depending on which SQL was applied.

### 3.5 Backend run evidence shows incomplete/unstable scraper execution

Historical runtime log (`backend/run_log.txt`, UTF-16 encoded) shows:

- Unstop scraped 0
- Devfolio scraped 0
- Devpost scraped 18
- HackerEarth scraped 0
- Log ends during Knowafest start (run appears interrupted)

So current scraper reliability is not proven end-to-end by recent log evidence.

---

## 4) What Is Risky / Uncertain Right Now

### 4.1 Backend has heavy external dependency chain for date extraction

`backend/utils.py` fallback behavior depends on:

- `duckduckgo-search` query success
- Optional Ollama local endpoint (`http://localhost:11434`, model `qwen2.5`)

If these are unavailable or rate-limited, many records can keep missing dates and then be dropped by `normalize_and_filter` in `backend/main.py`.

### 4.2 DB schema source of truth is missing for `hackathons`

Both SQL files mainly alter or reference `hackathons`, but no full table creation for `hackathons` is present in this repo snapshot.

Project assumes an existing external table shape.

### 4.3 Mixed auth model increases RLS and type mismatch risk

The code mixes:

- Firebase client auth and Firebase Admin verification
- Supabase table writes with service role
- SQL policies based on `auth.uid()` semantics in one schema variant

This can work only if DB types/policies and token strategy are aligned in the deployed environment.

### 4.4 Some logged errors in repo are stale and not current blockers

Legacy files such as `frontend/plain.txt` contain old build failures (for `PerformanceEntryCard.jsx`) that are no longer reproducible; current lint/build pass.

These logs should be treated as historical context, not present-state blockers.

---

## 5) Current Functional Snapshot by Area

### Backend pipeline

- Code completeness: High
- Observed successful recent full run: Not confirmed
- Known hard failure from current code read: None obvious
- Operational reliability: Medium to low (based on partial run logs and source fragility)

### Frontend build/deploy readiness

- Build status in this workspace: Passing
- Lint status in this workspace: Passing
- Runtime correctness on key list pages: Not fully correct due to prop mismatch

### Auth + bookmarks

- Auth UI/context implementation: Present and functional for Firebase email/password
- Bookmark API and button implementation: Present
- Cross-schema compatibility confidence: Medium/low due to SQL contradictions

### Workspace features (tracker, dashboard, team)

- UI and CRUD code exists across pages/forms/components
- Depends strongly on user_id type consistency and applied schema

---

## 6) Net Status (Current Reality)

The project is not an empty prototype. It has substantial backend and frontend implementation, compiles successfully, and contains end-to-end feature code for discovery, saving, deadlines, tracking, dashboard, and team listings.

At the same time, it is not fully reliable in current state due to:

1. Confirmed frontend runtime wiring bug (`initialHackathons` vs `hackathons`)
2. Auth identity inconsistency (Firebase UID vs Supabase auth user usage)
3. Contradictory database schema files for core relationship tables
4. Incomplete evidence of stable multi-source scraper runs from recent logs

This is the current state snapshot only (no future implementation plan included).
