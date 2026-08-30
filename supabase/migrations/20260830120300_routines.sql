create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  is_archived boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_templates_user_idx on public.workout_templates (user_id);

create trigger set_workout_templates_updated_at
  before update on public.workout_templates
  for each row execute function public.set_updated_at();

create table public.workout_template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  day_order integer not null,
  name text not null,
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now(),
  unique (template_id, day_order)
);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.workout_template_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  order_index integer not null,
  target_sets integer not null default 3,
  target_reps_min integer,
  target_reps_max integer,
  target_weight_kg numeric(6, 2),
  target_rir integer,
  target_rpe numeric(3, 1),
  rest_seconds integer not null default 90,
  notes text,
  unique (template_day_id, order_index)
);

create index workout_template_exercises_day_idx on public.workout_template_exercises (template_day_id);
create index workout_template_exercises_exercise_idx on public.workout_template_exercises (exercise_id);

-- Ownership is resolved by walking up to workout_templates.user_id since
-- days/exercises don't carry user_id themselves.
create or replace function public.owns_template(template_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workout_templates
    where id = template_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_template_day(day_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workout_template_days d
    join public.workout_templates t on t.id = d.template_id
    where d.id = day_id and t.user_id = auth.uid()
  );
$$;

alter table public.workout_templates enable row level security;
alter table public.workout_template_days enable row level security;
alter table public.workout_template_exercises enable row level security;

create policy "workout_templates_select" on public.workout_templates
  for select using (user_id = auth.uid() or is_public);

create policy "workout_templates_insert" on public.workout_templates
  for insert with check (user_id = auth.uid());

create policy "workout_templates_update" on public.workout_templates
  for update using (user_id = auth.uid());

create policy "workout_templates_delete" on public.workout_templates
  for delete using (user_id = auth.uid());

create policy "workout_template_days_select" on public.workout_template_days
  for select using (
    public.owns_template(template_id)
    or exists (select 1 from public.workout_templates t where t.id = template_id and t.is_public)
  );

create policy "workout_template_days_insert" on public.workout_template_days
  for insert with check (public.owns_template(template_id));

create policy "workout_template_days_update" on public.workout_template_days
  for update using (public.owns_template(template_id));

create policy "workout_template_days_delete" on public.workout_template_days
  for delete using (public.owns_template(template_id));

create policy "workout_template_exercises_select" on public.workout_template_exercises
  for select using (
    public.owns_template_day(template_day_id)
    or exists (
      select 1 from public.workout_template_days d
      join public.workout_templates t on t.id = d.template_id
      where d.id = template_day_id and t.is_public
    )
  );

create policy "workout_template_exercises_insert" on public.workout_template_exercises
  for insert with check (public.owns_template_day(template_day_id));

create policy "workout_template_exercises_update" on public.workout_template_exercises
  for update using (public.owns_template_day(template_day_id));

create policy "workout_template_exercises_delete" on public.workout_template_exercises
  for delete using (public.owns_template_day(template_day_id));
