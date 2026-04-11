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
