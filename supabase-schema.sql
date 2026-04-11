-- Run this in your Supabase SQL Editor

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role text not null,
  date_applied date not null,
  status text not null check (status in ('applied', 'interview_scheduled', 'had_interview', 'offer', 'rejected')),
  job_link text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (optional but recommended)
alter table jobs enable row level security;

-- Allow all operations for anonymous users (for now — no auth)
create policy "Allow all" on jobs for all using (true) with check (true);
