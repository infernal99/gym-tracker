create type public.goal_type as enum ('weight', 'strength', 'reps', 'frequency', 'volume', 'custom');
create type public.goal_status as enum ('active', 'completed', 'paused', 'cancelled');
create type public.pr_type as enum ('max_weight', 'max_reps_at_weight', 'max_volume', 'best_1rm');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.goal_type not null,
  title text not null,
  exercise_id uuid references public.exercises (id),
  initial_value numeric(10, 2),
  current_value numeric(10, 2),
  target_value numeric(10, 2) not null,
  unit text not null,
  start_date date not null default current_date,
  target_date date,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index goals_user_idx on public.goals (user_id, status);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  record_type public.pr_type not null,
  value numeric(10, 2) not null,
  weight_kg numeric(6, 2),
  reps integer,
  achieved_at timestamptz not null default now(),
  session_set_id uuid references public.sets (id) on delete set null,
  created_at timestamptz not null default now()
);

create index personal_records_user_exercise_idx on public.personal_records (user_id, exercise_id, record_type);

alter table public.goals enable row level security;
alter table public.personal_records enable row level security;

create policy "goals_select" on public.goals
  for select using (user_id = auth.uid());

create policy "goals_insert" on public.goals
  for insert with check (user_id = auth.uid());

create policy "goals_update" on public.goals
  for update using (user_id = auth.uid());

create policy "goals_delete" on public.goals
  for delete using (user_id = auth.uid());

create policy "personal_records_select" on public.personal_records
  for select using (
    user_id = auth.uid() or (
      public.are_friends(auth.uid(), user_id)
      and exists (select 1 from public.profiles where id = user_id and prs_visibility = 'friends')
    )
  );

create policy "personal_records_insert" on public.personal_records
  for insert with check (user_id = auth.uid());

create policy "personal_records_delete" on public.personal_records
  for delete using (user_id = auth.uid());
