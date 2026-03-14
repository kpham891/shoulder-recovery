-- Drink Tracking Module — run in Supabase SQL Editor
-- Three tables: drink_logs, drink_favorites, drink_goals

-- ─── drink_logs ─────────────────────────────────────────────────────

create table if not exists public.drink_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  drink_name text not null,
  category text not null check (category in ('beer','cider-seltzer','wine','sake-soju','spirits','cocktails')),
  volume_ml numeric not null,
  abv_percent numeric not null,
  quantity integer not null default 1,
  standard_units numeric generated always as ((volume_ml * abv_percent) / 1000.0) stored,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_drink_logs_user_id on public.drink_logs(user_id);
create index if not exists idx_drink_logs_logged_at on public.drink_logs(logged_at);

alter table public.drink_logs enable row level security;

create policy "Users can view own drink logs"
  on public.drink_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own drink logs"
  on public.drink_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drink logs"
  on public.drink_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own drink logs"
  on public.drink_logs for delete
  using (auth.uid() = user_id);

-- ─── drink_favorites ────────────────────────────────────────────────

create table if not exists public.drink_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  drink_name text not null,
  category text not null check (category in ('beer','cider-seltzer','wine','sake-soju','spirits','cocktails')),
  volume_ml numeric not null,
  abv_percent numeric not null
);

create index if not exists idx_drink_favorites_user_id on public.drink_favorites(user_id);

alter table public.drink_favorites enable row level security;

create policy "Users can view own drink favorites"
  on public.drink_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own drink favorites"
  on public.drink_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drink favorites"
  on public.drink_favorites for update
  using (auth.uid() = user_id);

create policy "Users can delete own drink favorites"
  on public.drink_favorites for delete
  using (auth.uid() = user_id);

-- ─── drink_goals ────────────────────────────────────────────────────

create table if not exists public.drink_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  weekly_unit_limit numeric not null default 14,
  dry_days_per_week_target integer not null default 2,
  daily_unit_limit numeric not null default 2,
  yearly_drink_target numeric,
  sex text not null default 'unspecified' check (sex in ('male','female','unspecified'))
);

create index if not exists idx_drink_goals_user_id on public.drink_goals(user_id);

alter table public.drink_goals enable row level security;

create policy "Users can view own drink goals"
  on public.drink_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own drink goals"
  on public.drink_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drink goals"
  on public.drink_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own drink goals"
  on public.drink_goals for delete
  using (auth.uid() = user_id);
