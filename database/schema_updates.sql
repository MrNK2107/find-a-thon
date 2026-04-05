-- Find-a-thon schema updates

-- 1) Extend hackathons table with nullable enrichment fields
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS is_closed boolean DEFAULT false;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS themes text[];
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS prize text;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS organizer text;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS location text;

-- 2) Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  bio text,
  skills text[],
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  joined_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Saved hackathons
CREATE TABLE IF NOT EXISTS saved_hackathons (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hackathon_id bigint NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, hackathon_id)
);

-- 4) Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hackathon_id bigint NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  remind_days_before int NOT NULL DEFAULT 3 CHECK (remind_days_before >= 0),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, hackathon_id)
);

-- 5) Entry status and result enums
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

-- 6) Performance tracking entries
CREATE TABLE IF NOT EXISTS hackathon_entries (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hackathon_id bigint REFERENCES hackathons(id) ON DELETE SET NULL,
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

-- 7) Team listings
CREATE TABLE IF NOT EXISTS team_listings (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hackathon_id bigint REFERENCES hackathons(id) ON DELETE SET NULL,
  hackathon_title text,
  looking_for_skills text[],
  team_size_current int,
  team_size_max int,
  description text,
  contact_method text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8) Enable row level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_listings ENABLE ROW LEVEL SECURITY;

-- 9) RLS policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "saved_select_own" ON saved_hackathons;
CREATE POLICY "saved_select_own" ON saved_hackathons
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_insert_own" ON saved_hackathons;
CREATE POLICY "saved_insert_own" ON saved_hackathons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_delete_own" ON saved_hackathons;
CREATE POLICY "saved_delete_own" ON saved_hackathons
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_select_own" ON reminders;
CREATE POLICY "reminders_select_own" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_insert_own" ON reminders;
CREATE POLICY "reminders_insert_own" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_update_own" ON reminders;
CREATE POLICY "reminders_update_own" ON reminders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_delete_own" ON reminders;
CREATE POLICY "reminders_delete_own" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_select_own" ON hackathon_entries;
CREATE POLICY "entries_select_own" ON hackathon_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_insert_own" ON hackathon_entries;
CREATE POLICY "entries_insert_own" ON hackathon_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_update_own" ON hackathon_entries;
CREATE POLICY "entries_update_own" ON hackathon_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_delete_own" ON hackathon_entries;
CREATE POLICY "entries_delete_own" ON hackathon_entries
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "team_listings_select_open_or_own" ON team_listings;
CREATE POLICY "team_listings_select_open_or_own" ON team_listings
  FOR SELECT USING (is_open = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "team_listings_insert_own" ON team_listings;
CREATE POLICY "team_listings_insert_own" ON team_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "team_listings_update_own" ON team_listings;
CREATE POLICY "team_listings_update_own" ON team_listings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "team_listings_delete_own" ON team_listings;
CREATE POLICY "team_listings_delete_own" ON team_listings
  FOR DELETE USING (auth.uid() = user_id);
