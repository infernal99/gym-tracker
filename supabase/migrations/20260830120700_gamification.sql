create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now()
);

create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  category text not null,
  criteria jsonb not null,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz,
  progress numeric(5, 2) not null default 0,
  unique (user_id, achievement_id)
);

create index user_achievements_user_idx on public.user_achievements (user_id);

-- Levels are a flat 500 XP/level curve; tune here if the pacing needs to change.
create or replace function public.calculate_level(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor(p_xp / 500.0)::integer + 1);
$$;

create or replace function public.apply_xp_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set xp = xp + new.amount,
      level = public.calculate_level(xp + new.amount)
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_xp_event_insert
  after insert on public.xp_events
  for each row execute function public.apply_xp_event();

alter table public.xp_events enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- XP and achievement unlocks are only ever written by trusted server code
-- (service role), never directly by the client, so there are no client
-- insert/update policies here — only read access for the owning user.
create policy "xp_events_select" on public.xp_events
  for select using (user_id = auth.uid());

create policy "achievements_select_all" on public.achievements
  for select using (auth.role() = 'authenticated');

create policy "user_achievements_select" on public.user_achievements
  for select using (user_id = auth.uid());
