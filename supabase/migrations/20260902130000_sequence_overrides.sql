-- Lets a session be logged (history, stats) without moving the routine's
-- "next suggested day" pointer, and lets the user manually realign that
-- pointer without having to train right now.
alter table public.workout_sessions
  add column counts_toward_sequence boolean not null default true;

alter table public.profiles
  add column sequence_anchor_day_id uuid references public.workout_template_days (id) on delete set null;
