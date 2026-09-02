-- Expands the exercise model to support a real "ficha" (step-by-step
-- instructions, tips/mistakes as lists, media provenance, similar-exercise
-- suggestions) plus per-user favorites and private notes. Everything here
-- is additive: no existing column is dropped, no existing exercise row is
-- touched destructively. tips/common_mistakes move from a single paragraph
-- to a list (existing values are preserved, just wrapped in a one-item
-- array) since the UI renders them as bullet points.
alter table public.exercises
  alter column tips type text[] using case when tips is null then null else array[tips] end,
  alter column common_mistakes type text[] using case when common_mistakes is null then null else array[common_mistakes] end;

alter table public.exercises
  add column instructions text[],
  add column alternate_names text[] not null default '{}',
  add column thumbnail_url text,
  add column image_source text,
  add column image_license text,
  add column alternative_exercise_ids uuid[] not null default '{}';

comment on column public.exercises.instructions is 'Ordered step-by-step how-to, one step per array element.';
comment on column public.exercises.alternate_names is 'Nicknames/aliases to widen search matching (e.g. "press plano" for bench press).';
comment on column public.exercises.image_source is 'Where image_url/thumbnail_url came from, for licensing provenance.';
comment on column public.exercises.image_license is 'License under which image_url/thumbnail_url is used.';

-- Finer-grained leg muscle groups (the seed data only had a catch-all
-- "Piernas"). Kept alongside it rather than replacing, since "Piernas" is
-- still useful for general/cardio leg work (e.g. running).
insert into public.muscle_groups (name, slug) values
  ('Cuádriceps', 'quads'),
  ('Femoral', 'hamstrings'),
  ('Trapecio', 'traps'),
  ('Aductores', 'adductors'),
  ('Abductores', 'abductors'),
  ('Lumbar', 'lower_back')
on conflict (slug) do nothing;

insert into public.equipment (name, slug) values
  ('Smith', 'smith_machine'),
  ('Banco', 'bench')
on conflict (slug) do nothing;

-- Reclassify the existing quad/hamstring exercises out of the catch-all
-- "Piernas" group now that precise ones exist. Not destructive: same rows,
-- same ids, just a more accurate primary_muscle_group_id.
update public.exercises set primary_muscle_group_id = (select id from public.muscle_groups where slug = 'quads')
where slug in ('squat', 'leg-press', 'db-lunge', 'leg-extension');

update public.exercises set primary_muscle_group_id = (select id from public.muscle_groups where slug = 'hamstrings')
where slug = 'leg-curl';

-- Per-user favorites and private notes. Mirror the RLS pattern already used
-- for personal_records/goals: strictly owner-only, no sharing.
create table public.exercise_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create table public.exercise_notes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  note text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create trigger set_exercise_notes_updated_at
  before update on public.exercise_notes
  for each row execute function public.set_updated_at();

alter table public.exercise_favorites enable row level security;
alter table public.exercise_notes enable row level security;

create policy "exercise_favorites_select" on public.exercise_favorites
  for select using (user_id = auth.uid());
create policy "exercise_favorites_insert" on public.exercise_favorites
  for insert with check (user_id = auth.uid());
create policy "exercise_favorites_delete" on public.exercise_favorites
  for delete using (user_id = auth.uid());

create policy "exercise_notes_select" on public.exercise_notes
  for select using (user_id = auth.uid());
create policy "exercise_notes_insert" on public.exercise_notes
  for insert with check (user_id = auth.uid());
create policy "exercise_notes_update" on public.exercise_notes
  for update using (user_id = auth.uid());
create policy "exercise_notes_delete" on public.exercise_notes
  for delete using (user_id = auth.uid());
