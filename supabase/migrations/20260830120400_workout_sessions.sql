create type public.set_type as enum ('warmup', 'working', 'drop_set', 'rest_pause', 'amrap');

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid references public.workout_templates (id) on delete set null,
  template_day_id uuid references public.workout_template_days (id) on delete set null,
  name text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  notes text,
  total_volume_kg numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index workout_sessions_user_idx on public.workout_sessions (user_id, started_at desc);

create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  order_index integer not null,
  notes text,
  unique (session_id, order_index)
);

create index workout_session_exercises_session_idx on public.workout_session_exercises (session_id);
create index workout_session_exercises_exercise_idx on public.workout_session_exercises (exercise_id);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.workout_session_exercises (id) on delete cascade,
  set_number integer not null,
  set_type public.set_type not null default 'working',
  weight_kg numeric(6, 2),
  reps integer,
  rir integer,
  rpe numeric(3, 1),
  rest_seconds integer,
  completed_at timestamptz not null default now(),
  notes text,
  unique (session_exercise_id, set_number)
);

create index sets_session_exercise_idx on public.sets (session_exercise_id);

create or replace function public.owns_session(p_session_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workout_sessions
    where id = p_session_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_session_exercise(p_session_exercise_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workout_session_exercises se
    join public.workout_sessions s on s.id = se.session_id
    where se.id = p_session_exercise_id and s.user_id = auth.uid()
  );
$$;

create or replace function public.can_view_session(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_user_id = auth.uid() or (
    public.are_friends(auth.uid(), p_user_id)
    and exists (
      select 1 from public.profiles
      where id = p_user_id and workouts_visibility = 'friends'
    )
  );
$$;

-- Working sets (everything but warm-ups) drive the session's total volume,
-- kept denormalized on workout_sessions so dashboards/stats avoid re-summing every read.
create or replace function public.recalc_session_volume()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session_id uuid;
begin
  select s.id into target_session_id
  from public.workout_session_exercises se
  join public.workout_sessions s on s.id = se.session_id
  where se.id = coalesce(new.session_exercise_id, old.session_exercise_id);

  update public.workout_sessions
  set total_volume_kg = coalesce((
    select sum(st.weight_kg * st.reps)
    from public.sets st
    join public.workout_session_exercises se on se.id = st.session_exercise_id
    where se.session_id = target_session_id
      and st.set_type <> 'warmup'
      and st.weight_kg is not null
      and st.reps is not null
  ), 0)
  where id = target_session_id;

  return coalesce(new, old);
end;
$$;

create trigger recalc_session_volume_on_set_change
  after insert or update or delete on public.sets
  for each row execute function public.recalc_session_volume();

alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.sets enable row level security;

create policy "workout_sessions_select" on public.workout_sessions
  for select using (public.can_view_session(user_id));

create policy "workout_sessions_insert" on public.workout_sessions
  for insert with check (user_id = auth.uid());

create policy "workout_sessions_update" on public.workout_sessions
  for update using (user_id = auth.uid());

create policy "workout_sessions_delete" on public.workout_sessions
  for delete using (user_id = auth.uid());

create policy "workout_session_exercises_select" on public.workout_session_exercises
  for select using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and public.can_view_session(s.user_id)
    )
  );

create policy "workout_session_exercises_insert" on public.workout_session_exercises
  for insert with check (public.owns_session(session_id));

create policy "workout_session_exercises_update" on public.workout_session_exercises
  for update using (public.owns_session(session_id));

create policy "workout_session_exercises_delete" on public.workout_session_exercises
  for delete using (public.owns_session(session_id));

create policy "sets_select" on public.sets
  for select using (
    exists (
      select 1 from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and public.can_view_session(s.user_id)
    )
  );

create policy "sets_insert" on public.sets
  for insert with check (public.owns_session_exercise(session_exercise_id));

create policy "sets_update" on public.sets
  for update using (public.owns_session_exercise(session_exercise_id));

create policy "sets_delete" on public.sets
  for delete using (public.owns_session_exercise(session_exercise_id));
