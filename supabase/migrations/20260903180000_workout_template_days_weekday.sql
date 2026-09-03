-- Optional weekly-calendar assignment for a routine's days (0=Monday..6=
-- Sunday, matching the Monday-start convention already used in
-- src/lib/services/dashboard.ts's startOfWeek()). Null means "no fixed day
-- yet" — those days stay in the sequence-based rotation.
alter table public.workout_template_days
  add column if not exists weekday smallint check (weekday between 0 and 6);

create unique index if not exists workout_template_days_template_weekday_idx
  on public.workout_template_days (template_id, weekday)
  where weekday is not null;
