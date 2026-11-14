-- ==============================================================================
-- LEETING CLOUD: SUPABASE POSTGRESQL SCHEMA (WITH CLERK AUTHENTICATION)
-- ==============================================================================
-- This script configures Supabase for data storage using Clerk User IDs (text).
-- It is completely IDEMPOTENT (safe to run multiple times in Supabase SQL Editor).
-- ==============================================================================

-- 1. PROFILES TABLE (Keyed by Clerk User ID, e.g. 'user_2xyz...')
create table if not exists public.profiles (
  id text primary key,
  email text,
  display_name text,
  avatar_url text,
  leetcode_username text default 'The-Boss',
  current_streak integer default 0,
  longest_streak integer default 0,
  leetcoins integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER PREFERENCES TABLE
create table if not exists public.user_preferences (
  user_id text references public.profiles(id) on delete cascade primary key,
  solve_before_scroll boolean default true,
  blocked_sites jsonb default '["youtube_shorts", "youtube_playables", "instagram", "facebook", "linkedin_video"]'::jsonb,
  quiet_hours_enabled boolean default true,
  quiet_hours_start time default '22:30:00',
  quiet_hours_end time default '07:00:00',
  notify_daily_challenge boolean default true,
  notify_contest_minutes_before integer default 45,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ACTIVITY LOGS (Dated Daily Snapshots from Extension Uplink)
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  log_date date not null,
  problems_solved_count integer default 0,
  daily_challenge_solved boolean default false,
  daily_challenge_title text,
  daily_challenge_difficulty text,
  streak_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, log_date)
);

-- 4. FOCUS SESSIONS TABLE
create table if not exists public.focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  duration_minutes integer not null,
  completed boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. DEVICE REGISTRY TABLE (Paired Extension Agents)
create table if not exists public.device_registry (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  device_id text not null,
  device_name text not null,
  browser_type text not null, -- 'Chrome', 'Edge', 'Firefox'
  extension_version text not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, device_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR CLERK + SUPABASE
-- ==============================================================================
-- Because Clerk manages authentication tokens, tables allow authenticated/anon 
-- client operations keyed by the user's Clerk ID.

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.activity_logs enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.device_registry enable row level security;

-- Profiles Policies
drop policy if exists "Enable read access for all profiles" on public.profiles;
create policy "Enable read access for all profiles" on public.profiles for select using (true);

drop policy if exists "Enable insert/upsert for profiles" on public.profiles;
create policy "Enable insert/upsert for profiles" on public.profiles for insert with check (true);

drop policy if exists "Enable update for profiles" on public.profiles;
create policy "Enable update for profiles" on public.profiles for update using (true);

-- Preferences Policies
drop policy if exists "Enable read access for preferences" on public.user_preferences;
create policy "Enable read access for preferences" on public.user_preferences for select using (true);

drop policy if exists "Enable insert/upsert for preferences" on public.user_preferences;
create policy "Enable insert/upsert for preferences" on public.user_preferences for insert with check (true);

drop policy if exists "Enable update for preferences" on public.user_preferences;
create policy "Enable update for preferences" on public.user_preferences for update using (true);

-- Activity Logs Policies
drop policy if exists "Enable all for activity logs" on public.activity_logs;
create policy "Enable all for activity logs" on public.activity_logs for all using (true) with check (true);

-- Focus Sessions Policies
drop policy if exists "Enable all for focus sessions" on public.focus_sessions;
create policy "Enable all for focus sessions" on public.focus_sessions for all using (true) with check (true);

-- Device Registry Policies
drop policy if exists "Enable all for device registry" on public.device_registry;
create policy "Enable all for device registry" on public.device_registry for all using (true) with check (true);
