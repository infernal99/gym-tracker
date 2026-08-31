-- Tracks which of the user's own routines is the one they're currently
-- following, so "Mi rutina" in the nav can jump straight to it.
alter table public.profiles
  add column active_template_id uuid references public.workout_templates (id) on delete set null;
