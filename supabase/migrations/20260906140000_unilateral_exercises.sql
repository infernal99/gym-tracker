-- Default rest between sets becomes 3 min for everything (was 90s), applied
-- both going forward and retroactively to existing rows still at the old default.
alter table public.workout_template_exercises
  alter column rest_seconds set default 180;
update public.workout_template_exercises set rest_seconds = 180 where rest_seconds = 90;

-- Unilateral: an exercise can be marked as worked one side at a time, which
-- needs its own (shorter) rest between sides in addition to the normal
-- between-sets rest. Lives on both the template row and the session-copy
-- row (sessions snapshot template config at start time, same as the other
-- target_* columns already do).
alter table public.workout_template_exercises
  add column is_unilateral boolean not null default false,
  add column rest_between_sides_seconds integer not null default 60;

alter table public.workout_session_exercises
  add column is_unilateral boolean not null default false,
  add column rest_between_sides_seconds integer not null default 60;

-- A set can now belong to a side ('left'/'right') for unilateral exercises,
-- or 'both' for the normal bilateral case (kept non-null so the unique
-- constraint below actually enforces one-row-per-set-number for bilateral
-- sets — Postgres treats NULLs as distinct, which would defeat that).
create type public.set_side as enum ('both', 'left', 'right');

alter table public.sets add column side public.set_side not null default 'both';

alter table public.sets drop constraint sets_session_exercise_id_set_number_key;
alter table public.sets add constraint sets_session_exercise_id_set_number_side_key
  unique (session_exercise_id, set_number, side);
