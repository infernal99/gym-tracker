-- Snapshots the routine's planned target onto each session exercise at the
-- moment a workout is started, so a live/past session always shows what was
-- actually planned even if the routine is edited afterwards.
alter table public.workout_session_exercises
  add column target_sets integer,
  add column target_reps_min integer,
  add column target_reps_max integer,
  add column target_weight_kg numeric(6, 2),
  add column target_rir integer,
  add column rest_seconds integer;

-- Used by "next pending workout" sequencing (last completed session for a
-- given template) and by the history list.
create index workout_sessions_template_completed_idx
  on public.workout_sessions (user_id, template_id, completed_at desc)
  where completed_at is not null;
