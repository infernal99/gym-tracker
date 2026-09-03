-- Solo challenges need a per-participant baseline to measure progress
-- direction-aware (e.g. losing weight: target < initial), same idea as
-- goals.initial_value.
alter table public.challenge_participants add column if not exists initial_value numeric(10,2) not null default 0;
