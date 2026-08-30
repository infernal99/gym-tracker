create type public.exercise_difficulty as enum ('beginner', 'intermediate', 'advanced');
create type public.movement_type as enum ('compound', 'isolation', 'cardio', 'mobility');

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  primary_muscle_group_id uuid not null references public.muscle_groups (id),
  secondary_muscle_group_ids uuid[] not null default '{}',
  equipment_id uuid references public.equipment (id),
  difficulty public.exercise_difficulty not null default 'intermediate',
  movement_type public.movement_type not null default 'compound',
  description text,
  technique_notes text,
  common_mistakes text,
  tips text,
  image_url text,
  video_url text,
  is_custom boolean not null default false,
  created_by uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_exercises_have_owner check (not is_custom or created_by is not null)
);

create index exercises_primary_muscle_idx on public.exercises (primary_muscle_group_id);
create index exercises_equipment_idx on public.exercises (equipment_id);
create index exercises_name_idx on public.exercises using gin (to_tsvector('simple', name));
create index exercises_created_by_idx on public.exercises (created_by) where is_custom;

create trigger set_exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

alter table public.muscle_groups enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;

create policy "muscle_groups_select_all" on public.muscle_groups
  for select using (auth.role() = 'authenticated');

create policy "equipment_select_all" on public.equipment
  for select using (auth.role() = 'authenticated');

create policy "exercises_select" on public.exercises
  for select using (not is_custom or created_by = auth.uid());

create policy "exercises_insert_own_custom" on public.exercises
  for insert with check (is_custom and created_by = auth.uid());

create policy "exercises_update_own_custom" on public.exercises
  for update using (is_custom and created_by = auth.uid());

create policy "exercises_delete_own_custom" on public.exercises
  for delete using (is_custom and created_by = auth.uid());
