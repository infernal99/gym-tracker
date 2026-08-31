-- Splits registration into two steps: account creation, then an onboarding
-- wizard (goal, body stats, sex) shown on first login.
create type public.biological_sex as enum ('male', 'female', 'other');

alter table public.profiles
  add column sex public.biological_sex,
  add column onboarding_completed boolean not null default false;
