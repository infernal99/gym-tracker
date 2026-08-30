create type public.challenge_metric as enum (
  'workouts', 'consistency', 'volume', 'prs', 'exercise', 'distance', 'custom'
);
create type public.challenge_status as enum ('upcoming', 'active', 'completed', 'cancelled');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  metric public.challenge_metric not null,
  is_duel boolean not null default false,
  target_value numeric(10, 2),
  exercise_id uuid references public.exercises (id),
  start_date date not null,
  end_date date not null,
  status public.challenge_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  constraint challenges_date_order check (end_date > start_date)
);

create index challenges_creator_idx on public.challenges (creator_id);

create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  current_value numeric(10, 2) not null default 0,
  rank integer,
  unique (challenge_id, user_id)
);

create index challenge_participants_challenge_idx on public.challenge_participants (challenge_id);
create index challenge_participants_user_idx on public.challenge_participants (user_id);

create table public.challenge_results (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  final_value numeric(10, 2) not null,
  final_rank integer not null,
  completed_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create or replace function public.is_challenge_participant(p_challenge_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.challenge_participants
    where challenge_id = p_challenge_id and user_id = auth.uid()
  ) or exists (
    select 1 from public.challenges
    where id = p_challenge_id and creator_id = auth.uid()
  );
$$;

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_results enable row level security;

create policy "challenges_select" on public.challenges
  for select using (public.is_challenge_participant(id));

create policy "challenges_insert" on public.challenges
  for insert with check (creator_id = auth.uid());

create policy "challenges_update" on public.challenges
  for update using (creator_id = auth.uid());

create policy "challenges_delete" on public.challenges
  for delete using (creator_id = auth.uid());

-- A participant row can be created either by the challenge's creator, or by
-- a friend of the creator joining themselves.
create policy "challenge_participants_select" on public.challenge_participants
  for select using (public.is_challenge_participant(challenge_id));

create policy "challenge_participants_insert" on public.challenge_participants
  for insert with check (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id
        and (c.creator_id = auth.uid() or (user_id = auth.uid() and public.are_friends(auth.uid(), c.creator_id)))
    )
  );

create policy "challenge_participants_update" on public.challenge_participants
  for update using (user_id = auth.uid());

create policy "challenge_participants_delete" on public.challenge_participants
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.challenges c where c.id = challenge_id and c.creator_id = auth.uid())
  );

-- Final standings are only ever written by trusted server code once a
-- challenge closes, never by participants themselves.
create policy "challenge_results_select" on public.challenge_results
  for select using (public.is_challenge_participant(challenge_id));
