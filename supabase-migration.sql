-- Run this in your Supabase SQL Editor

-- Make the old status column nullable (no longer written to)
ALTER TABLE jobs ALTER COLUMN status DROP NOT NULL;

-- Add timeline column if not yet added
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS timeline JSONB NOT NULL DEFAULT '{}';

-- Add stages column: array of {name, state} objects per job
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stages JSONB NOT NULL DEFAULT
  '[{"name":"הגשתי מועמדות","state":"not_reached"},{"name":"שיחת טלפון","state":"not_reached"},{"name":"ראיון HR","state":"not_reached"},{"name":"ראיון טכני","state":"not_reached"},{"name":"ראיון סופי","state":"not_reached"},{"name":"הצעה","state":"not_reached"}]'::jsonb;

-- Add field/industry column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS field TEXT;

-- Add CV file URL column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- ── Auth: add user_id and enable per-user RLS ──────────────────────────────

-- Add user_id column (DEFAULT auth.uid() so inserts auto-populate it)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Enable Row Level Security (if not already enabled)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop any old permissive policies
DROP POLICY IF EXISTS "Enable all for everyone" ON jobs;
DROP POLICY IF EXISTS "Allow all" ON jobs;

-- Each user sees and manages only their own jobs.
-- The "OR user_id IS NULL" clause keeps any existing rows (pre-auth) visible
-- to all users until you assign them. To assign existing rows to yourself,
-- run: UPDATE jobs SET user_id = auth.uid() WHERE user_id IS NULL;
CREATE POLICY "users_select_own" ON jobs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_insert_own" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own" ON jobs
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_delete_own" ON jobs
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
