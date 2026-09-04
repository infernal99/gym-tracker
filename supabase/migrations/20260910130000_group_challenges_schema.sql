-- "Collective" flag: when true, the group's challenge page combines every
-- participant's current_value into one shared total against target_value,
-- instead of ranking them against each other — this is spec's "objetivo de
-- grupo" (100 workouts between everyone), reusing the same challenge row
-- rather than a second table with its own metric/date/participant model.
alter table public.challenges add column if not exists is_collective boolean not null default false;

-- challenges_insert only checked creator_id = auth.uid(), with no check at
-- all that a group_id, when set, belongs to a group the creator is actually
-- in. Anyone could attribute a challenge row to a private group they don't
-- belong to — invisible to that group's real members (challenges_select
-- still gates on membership) but still an authorization gap: a non-member
-- shouldn't be able to write group-attributed rows at all.
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges
  for insert with check (
    creator_id = (select auth.uid())
    and (group_id is null or public.is_group_member(group_id))
  );
