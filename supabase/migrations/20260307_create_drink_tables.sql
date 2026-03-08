-- drink_goals
create table public.drink_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  weekly_unit_limit numeric default 14,
  daily_unit_limit numeric default 2,
  dry_days_per_week_target int default 2,
  created_at timestamptz default now()
);

-- drink_favorites
create table public.drink_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  drink_name text not null,
  category text not null,
  volume_ml numeric not null,
  abv_percent numeric not null,
  created_at timestamptz default now()
);

-- drink_logs
create table public.drink_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  drink_name text not null,
  category text not null,
  volume_ml numeric not null,
  abv_percent numeric not null,
  standard_units numeric generated always as ((volume_ml * abv_percent) / 1000.0) stored,
  notes text,
  created_at timestamptz default now()
);

-- RLS
alter table public.drink_goals enable row level security;
alter table public.drink_favorites enable row level security;
alter table public.drink_logs enable row level security;

create policy "Users manage own drink_goals" on public.drink_goals for all using (auth.uid() = user_id);
create policy "Users manage own drink_favorites" on public.drink_favorites for all using (auth.uid() = user_id);
create policy "Users manage own drink_logs" on public.drink_logs for all using (auth.uid() = user_id);
