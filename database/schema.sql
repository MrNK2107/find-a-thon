-- Find-a-thon unified schema (single source of truth)
-- Assumptions:
-- 1) Existing table public.hackathons exists.
-- 2) public.hackathons.id is BIGINT (or compatible integer type).
-- 3) Firebase UID is the canonical user identity, stored as TEXT.

BEGIN;

-- Safety check: ensure hackathons table exists and has an id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hackathons'
  ) THEN
    RAISE EXCEPTION 'Table public.hackathons does not exist. Create it first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hackathons' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'Column public.hackathons.id does not exist.';
  END IF;
END
$$;

-- Extend hackathons table with enrichment fields used by app
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS themes text[];
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS prize text;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS organizer text;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS last_synced_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS source_quality text NOT NULL DEFAULT 'curated';
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'practice';
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS location_group text NOT NULL DEFAULT 'Other cities';
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS is_free boolean;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS registration_fee numeric;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS tags text[];

-- Optional profile metadata keyed by Firebase UID
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id text PRIMARY KEY,
  name text,
  avatar_url text,
  bio text,
  skills text[],
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.saved_hackathons (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  hackathon_id bigint NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  remind_me boolean NOT NULL DEFAULT true,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, hackathon_id)
);

-- Deadline reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  hackathon_id bigint NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  remind_days_before int NOT NULL DEFAULT 3 CHECK (remind_days_before >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, hackathon_id)
);

-- Enums used by tracker
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_status') THEN
    CREATE TYPE entry_status AS ENUM ('planning', 'applied', 'participating', 'submitted', 'won', 'lost');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_result') THEN
    CREATE TYPE entry_result AS ENUM ('won', 'runner_up', 'top_n', 'did_not_place');
  END IF;
END
$$;

-- Performance tracker entries
CREATE TABLE IF NOT EXISTS public.hackathon_entries (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  hackathon_id bigint REFERENCES public.hackathons(id) ON DELETE SET NULL,
  hackathon_title text,
  status entry_status NOT NULL DEFAULT 'planning',
  result entry_result,
  project_name text NOT NULL,
  project_description text,
  repo_url text,
  demo_url text,
  tech_stack text[],
  team_size int,
  was_solo boolean,
  prize_won text,
  judges_feedback text,
  my_reflection text,
  score_given_by_judges numeric,
  started_at date,
  submitted_at date,
  result_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, hackathon_id)
);

-- Team listings
CREATE TABLE IF NOT EXISTS public.team_listings (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  hackathon_id bigint REFERENCES public.hackathons(id) ON DELETE SET NULL,
  hackathon_title text,
  looking_for_skills text[],
  team_size_current int,
  team_size_max int,
  description text,
  contact_method text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_saved_hackathons_user_id ON public.saved_hackathons(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_hackathons_hackathon_id ON public.saved_hackathons(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_hackathon_id ON public.reminders(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.hackathon_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_hackathon_id ON public.hackathon_entries(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_team_listings_user_id ON public.team_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_team_listings_hackathon_id ON public.team_listings(hackathon_id);

COMMIT;
