-- Tracks that a template is a personal copy of a public ("De serie") one,
-- so it can be reset back to match its source later.
alter table public.workout_templates
  add column forked_from_id uuid references public.workout_templates(id) on delete set null;
