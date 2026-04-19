-- Schema for saving user bookmarks in Find-a-thon

CREATE TABLE IF NOT EXISTS public.saved_hackathons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,          -- String because Firebase UIDs are alphanumeric strings
    hackathon_id UUID NOT NULL,     -- Assuming the hackathons table uses UUID for IDs (or change to INT if auto-incrementing)
    remind_me BOOLEAN DEFAULT true, -- For 24h reminders functionality
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a user can only save the same hackathon once
    CONSTRAINT unique_user_hackathon UNIQUE (user_id, hackathon_id)
);

-- Enable RLS (Row Level Security) if not already enabled. Note: Make sure to map Firebase tokens or run queries server-side via Edge Functions/Next.js APIs.
-- If exposing directly, you will need custom JWT mapping.
ALTER TABLE public.saved_hackathons ENABLE ROW LEVEL SECURITY;

-- If interacting via service_role key in Next.js Server Components / App Routes:
-- No explicit SELECT/INSERT policies needed since service_role bypasses RLS.
